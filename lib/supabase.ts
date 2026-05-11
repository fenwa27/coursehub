import { createBrowserClient as createBrowser } from '@supabase/ssr'

export function createBrowserClient() {
  return createBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type School = {
  id: string
  name: string
  short_name: string
  email_domain: string
  state: string
}

export type Profile = {
  id: string
  full_name: string
  email: string
  school_id: string
  level: string
  role: string
  is_verified_seller: boolean
  total_earnings: number
  total_downloads: number
  avg_rating: number
  bank_code?: string
  bank_account_number?: string
  bank_account_name?: string
  created_at: string
}

export type Material = {
  id: string
  seller_id: string
  school_id: string
  title: string
  description: string
  course_code: string
  level: string
  type: string
  price: number
  is_free: boolean
  file_path: string
  preview_path: string
  file_size_kb: number
  page_count: number
  download_count: number
  view_count: number
  purchase_count: number
  avg_rating: number
  review_count: number
  status: string
  tags: string[]
  created_at: string
  seller?: Profile
  school?: School
}

export type Purchase = {
  id: string
  buyer_id: string
  material_id: string
  amount_paid: number
  platform_fee: number
  seller_earnings: number
  paystack_reference: string
  status: string
  created_at: string
  material?: Material
}

export type Withdrawal = {
  id: string
  seller_id: string
  amount: number
  bank_account_number: string
  bank_account_name: string
  paystack_transfer_code: string
  status: string
  created_at: string
}
