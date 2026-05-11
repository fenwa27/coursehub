import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { material_id, mode, message, history } = await req.json()
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: material } = await supabase.from('materials').select('*, school:schools(*)').eq('id', material_id).single()
  if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 })

  if (material.price > 0) {
    const { data: purchase } = await supabase.from('purchases').select('id').eq('buyer_id', user.id).eq('material_id', material_id).eq('status', 'success').single()
    if (!purchase) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })
  }

  const systemPrompt = `You are an expert academic tutor helping a Nigerian university student study "${material.title}" — a ${material.type} for ${material.course_code} at ${(material.school as any)?.short_name ?? 'university'}, ${material.level}.

Description: ${material.description ?? 'Nigerian university study material'}

Help the student understand and master this material. Be concise, clear, and encouraging. Use Nigerian university terms where relevant.

${mode === 'quiz' ? `QUIZ MODE: Generate ONE multiple choice question. Respond ONLY with valid JSON:
{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":"A","explanation":"..."}` : ''}
${mode === 'summary' ? `SUMMARY MODE: Give a structured summary with sections: Key Topics, Must Memorise, Likely Exam Questions.` : ''}
${mode === 'exam_tips' ? `EXAM TIPS MODE: Give 5 numbered exam tips, then list top 5 hot topics with frequency % (e.g. "Integration by parts — 90%")` : ''}`

  const userMessage = mode === 'quiz' ? `Generate a practice question for ${material.course_code}`
    : mode === 'summary' ? `Summarise "${material.title}" for a ${material.level} student`
    : mode === 'exam_tips' ? `Give exam tips for "${material.title}" (${material.course_code})`
    : message

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [...(history ?? []), { role: 'user', content: userMessage }],
    }),
  })

  const data = await response.json()
  if (!response.ok) return NextResponse.json({ error: data.error?.message ?? 'AI error' }, { status: 500 })

  return NextResponse.json({ response: data.content?.[0]?.text ?? '' })
}
