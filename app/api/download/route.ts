import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { material_id } = await req.json()
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: material } = await supabase.from('materials').select('*').eq('id', material_id).single()
  if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 })

  if (material.price > 0) {
    const { data: purchase } = await supabase.from('purchases').select('id').eq('buyer_id', user.id).eq('material_id', material_id).eq('status', 'success').single()
    if (!purchase) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })
  }

  const { data: signedUrl, error } = await supabase.storage.from('materials').createSignedUrl(material.file_path, 3600, {
    download: `${material.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
  })
  if (error) return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })

  await supabase.from('downloads').insert({ buyer_id: user.id, material_id, signed_url_used: true })

  return NextResponse.json({ url: signedUrl.signedUrl })
}
