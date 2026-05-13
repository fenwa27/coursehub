import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const PLATFORM_FEE = 0.15

async function createSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (body.action === 'initialize') return initializePayment(body)
  if (body.action === 'verify') return verifyPayment(body)
  if (body.action === 'withdraw') return initiateWithdrawal(body)
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function PUT(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature')
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex')
  if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  const event = JSON.parse(body)
  const supabase = await createSupabase()
  if (event.event === 'charge.success') {
    await supabase.from('purchases').update({ status: 'success', paystack_transaction_id: String(event.data.id) }).eq('paystack_reference', event.data.reference)
  }
  if (event.event === 'transfer.success') {
    await supabase.from('withdrawals').update({ status: 'success' }).eq('paystack_transfer_code', event.data.transfer_code)
  }
  return NextResponse.json({ received: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const account_number = searchParams.get('account_number')
  const bank_code = searchParams.get('bank_code')
  const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
  })
  const data = await res.json()
  return NextResponse.json(data)
}

async function initializePayment(body: any) {
  const { email, amount_naira, material_id, buyer_id } = body
  const reference = `CH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, amount: amount_naira * 100, reference, currency: 'NGN',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback?reference=${reference}`,
    }),
  })
  const data = await res.json()
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })
  const supabase = await createSupabase()
  await supabase.from('purchases').insert({
    buyer_id, material_id, amount_paid: amount_naira,
    platform_fee: amount_naira * PLATFORM_FEE,
    seller_earnings: amount_naira * (1 - PLATFORM_FEE),
    paystack_reference: reference, status: 'pending',
  })
  return NextResponse.json({ authorization_url: data.data.authorization_url, reference })
}

async function verifyPayment(body: any) {
  const { reference } = body
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
  })
  const data = await res.json()
  if (!data.status || data.data.status !== 'success') return NextResponse.json({ success: false })
  const supabase = await createSupabase()
  await supabase.from('purchases').update({ status: 'success', paystack_transaction_id: String(data.data.id) }).eq('paystack_reference', reference)
  return NextResponse.json({ success: true })
}

async function initiateWithdrawal(body: any) {
  const { seller_id, amount, bank_code, account_number, account_name } = body
  if (amount < 1000) return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 })
  const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'nuban', name: account_name, account_number, bank_code, currency: 'NGN' }),
  })
  const recipientData = await recipientRes.json()
  if (!recipientData.status) return NextResponse.json({ error: 'Could not create transfer recipient' }, { status: 400 })
  const transferRes = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'balance', amount: amount * 100, recipient: recipientData.data.recipient_code, reason: 'CourseHub payout' }),
  })
  const transferData = await transferRes.json()
  if (!transferData.status) return NextResponse.json({ error: transferData.message }, { status: 400 })
  const supabase = await createSupabase()
  const { data, error } = await supabase.from('withdrawals').insert({
    seller_id, amount, bank_code, bank_account_number: account_number, bank_account_name: account_name,
    paystack_transfer_code: transferData.data.transfer_code, status: 'processing',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, withdrawal: data })
}