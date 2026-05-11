'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient, Material, Withdrawal } from '@/lib/supabase'

export default function DashboardPage() {
  const [tab, setTab] = useState<'overview' | 'materials' | 'withdraw' | 'history'>('overview')
  const [profile, setProfile] = useState<any>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }
      const [{ data: p }, { data: m }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('materials').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      ])
      setProfile(p); setMaterials(m ?? []); setWithdrawals(w ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: '2rem', color: '#999' }}>Loading dashboard...</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: '0.25rem' }}>Seller Dashboard</h1>
      <p style={{ color: '#999', fontSize: 14, marginBottom: '1.5rem' }}>Welcome back, {profile?.full_name?.split(' ')[0]}</p>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
        {[
          { label: 'Total earned', value: `₦${(profile?.total_earnings ?? 0).toLocaleString()}` },
          { label: 'Total downloads', value: (profile?.total_downloads ?? 0).toLocaleString() },
          { label: 'Materials', value: materials.length },
          { label: 'Avg rating', value: profile?.avg_rating > 0 ? `★ ${profile.avg_rating.toFixed(1)}` : '—' },
        ].map(k => (
          <div key={k.label} style={{ background: '#f8f8f8', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e5', marginBottom: '1.5rem' }}>
        {[['overview','Overview'],['materials','My Materials'],['withdraw','Withdraw'],['history','Payout History']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === id ? '2px solid #185FA5' : '2px solid transparent', cursor: 'pointer', fontSize: 14, fontWeight: tab === id ? 600 : 400, color: tab === id ? '#185FA5' : '#999', marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '1.5rem' }}>
            {[
              { label: 'Approved', count: materials.filter(m => m.status === 'approved').length, color: '#3B6D11' },
              { label: 'Pending', count: materials.filter(m => m.status === 'pending').length, color: '#854F0B' },
              { label: 'Rejected', count: materials.filter(m => m.status === 'rejected').length, color: '#c0392b' },
            ].map(s => (
              <div key={s.label} style={{ background: '#f8f8f8', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {materials.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999', border: '1px dashed #ddd', borderRadius: 12 }}>
              <p style={{ marginBottom: 12 }}>No materials uploaded yet.</p>
              <a href="/upload" style={{ color: '#185FA5', fontSize: 14 }}>Upload your first material →</a>
            </div>
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {materials.length === 0 ? <p style={{ color: '#999' }}>No materials yet.</p> : materials.map(m => (
            <div key={m.id} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1rem', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{m.title}</p>
                <p style={{ fontSize: 12, color: '#999' }}>{m.course_code} · {m.level} · {m.type}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>₦{(m.price * 0.85 * (m.purchase_count ?? 0)).toLocaleString()}</p>
                <p style={{ fontSize: 12, color: '#999' }}>⬇ {m.download_count ?? 0}</p>
              </div>
              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 500,
                background: m.status === 'approved' ? '#EAF3DE' : m.status === 'pending' ? '#FAEEDA' : '#FCEBEB',
                color: m.status === 'approved' ? '#3B6D11' : m.status === 'pending' ? '#854F0B' : '#c0392b',
              }}>{m.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'withdraw' && <WithdrawTab profile={profile} onWithdrawn={() => setTab('history')} />}

      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {withdrawals.length === 0 ? <p style={{ color: '#999' }}>No withdrawals yet.</p> : withdrawals.map(w => (
            <div key={w.id} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '12px 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>₦{w.amount.toLocaleString()}</p>
                <p style={{ fontSize: 12, color: '#999' }}>{new Date(w.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                background: w.status === 'success' ? '#EAF3DE' : w.status === 'processing' ? '#FAEEDA' : '#FCEBEB',
                color: w.status === 'success' ? '#3B6D11' : w.status === 'processing' ? '#854F0B' : '#c0392b',
              }}>{w.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WithdrawTab({ profile, onWithdrawn }: { profile: any; onWithdrawn: () => void }) {
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [resolving, setResolving] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState('')
  const balance = profile?.total_earnings ?? 0

  async function resolveAccount() {
    if (accountNumber.length !== 10 || !bankCode) return
    setResolving(true)
    const res = await fetch(`/api/paystack?account_number=${accountNumber}&bank_code=${bankCode}`)
    const data = await res.json()
    if (data.status) setAccountName(data.data.account_name)
    else setError('Could not resolve account')
    setResolving(false)
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (amt < 1000) { setError('Minimum withdrawal is ₦1,000'); return }
    if (amt > balance) { setError('Amount exceeds your balance'); return }
    if (!accountName) { setError('Verify your account number first'); return }
    setWithdrawing(true); setError('')
    const res = await fetch('/api/paystack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'withdraw', seller_id: profile.id, amount: amt, bank_code: bankCode, account_number: accountNumber, account_name: accountName }),
    })
    const data = await res.json()
    if (data.success) onWithdrawn()
    else setError(data.error ?? 'Withdrawal failed')
    setWithdrawing(false)
  }

  return (
    <form onSubmit={handleWithdraw} style={{ maxWidth: 440 }}>
      <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Available balance</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>₦{balance.toLocaleString()}</div>
      </div>
      {error && <div style={{ background: '#fff0f0', color: '#c0392b', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: '1rem' }}>{error}</div>}
      <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Amount (₦)</label>
      <input type="number" required min="1000" step="100" placeholder="Min ₦1,000" value={amount} onChange={e => setAmount(e.target.value)} style={{ marginBottom: '0.5rem' }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
        {[5000, 10000, 25000].map(v => (
          <button key={v} type="button" onClick={() => setAmount(String(Math.min(v, balance)))}
            style={{ flex: 1, padding: '6px', fontSize: 12, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>
            ₦{v.toLocaleString()}
          </button>
        ))}
        <button type="button" onClick={() => setAmount(String(balance))}
          style={{ flex: 1, padding: '6px', fontSize: 12, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>
          All
        </button>
      </div>
      <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Bank code (e.g. 058 for GTBank)</label>
      <input placeholder="058" value={bankCode} onChange={e => setBankCode(e.target.value)} style={{ marginBottom: '1rem' }} />
      <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Account number</label>
      <input placeholder="10-digit NUBAN" maxLength={10} value={accountNumber} onChange={e => { setAccountNumber(e.target.value); setAccountName('') }} onBlur={resolveAccount} style={{ marginBottom: '0.5rem' }} />
      {resolving && <p style={{ fontSize: 12, color: '#999', marginBottom: '1rem' }}>Verifying...</p>}
      {accountName && <p style={{ fontSize: 13, color: '#3B6D11', fontWeight: 600, marginBottom: '1rem' }}>✓ {accountName}</p>}
      <button type="submit" disabled={withdrawing || !accountName}
        style={{ width: '100%', padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15, opacity: withdrawing ? 0.7 : 1 }}>
        {withdrawing ? 'Processing...' : `Withdraw ₦${parseFloat(amount || '0').toLocaleString()}`}
      </button>
    </form>
  )
}
