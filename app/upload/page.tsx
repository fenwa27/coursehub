'use client'
import { useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const SCHOOLS = [
  { id: '', name: 'Select university' },
  { id: 'unilag', name: 'UNILAG' }, { id: 'oau', name: 'OAU' },
  { id: 'futa', name: 'FUTA' }, { id: 'ui', name: 'UI' },
  { id: 'abu', name: 'ABU' }, { id: 'unn', name: 'UNN' },
  { id: 'lasu', name: 'LASU' }, { id: 'cu', name: 'Covenant' },
]
const LEVELS = ['100L', '200L', '300L', '400L', '500L', 'Postgrad']
const TYPES = ['Past Questions', 'Lecture Notes', 'Assignments', 'Textbooks', 'Study Guides', 'Lab Reports']

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    title: '', description: '', course_code: '',
    school_id: '', level: '', type: '', price: '0',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function validateAndSetFile(f: File) {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(f.type)) { setError('Only PDF, PPTX, or DOCX files allowed'); return }
    if (f.size > 50 * 1024 * 1024) { setError('File must be under 50MB'); return }
    setFile(f); setError('')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) validateAndSetFile(f)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    setUploading(true); setProgress(10); setError('')

    try {
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      setProgress(30)
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError

      setProgress(70)
      const { error: dbError } = await supabase.from('materials').insert({
        seller_id: user.id,
        title: form.title,
        description: form.description,
        course_code: form.course_code.toUpperCase(),
        school_id: form.school_id || null,
        level: form.level,
        type: form.type,
        price: parseFloat(form.price) || 0,
        file_path: filePath,
        file_size_kb: Math.round(file.size / 1024),
        status: 'pending',
      })
      if (dbError) throw dbError
      setProgress(100); setDone(true)
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (done) return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: '1rem' }}>🎉</div>
      <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Upload submitted!</h2>
      <p style={{ color: '#777', fontSize: 14, lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Your material is under review and will be approved within 24 hours. You earn 85% of every sale.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => { setDone(false); setFile(null); setForm({ title:'',description:'',course_code:'',school_id:'',level:'',type:'',price:'0' }) }}
          style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
          Upload another
        </button>
        <button onClick={() => router.push('/dashboard')}
          style={{ padding: '10px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          View dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: '0.5rem' }}>Upload a material</h1>
      <p style={{ color: '#777', fontSize: 14, marginBottom: '2rem' }}>Earn 85% of every sale. Materials reviewed within 24 hours.</p>

      {error && <div style={{ background: '#fff0f0', color: '#c0392b', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#185FA5' : '#ddd'}`,
            borderRadius: 12, padding: '2rem', textAlign: 'center',
            cursor: 'pointer', marginBottom: '1.5rem',
            background: dragging ? '#E6F1FB' : '#fafafa',
          }}>
          <input ref={inputRef} type="file" accept=".pdf,.pptx,.docx" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]) }} />
          {file ? (
            <div>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</p>
              <p style={{ fontSize: 12, color: '#999' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Drop your file here or click to browse</p>
              <p style={{ fontSize: 12, color: '#999' }}>PDF, PPTX, DOCX · Max 50MB</p>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Title *</label>
            <input required placeholder="e.g. MTH101 Past Questions 2019–2023 with Solutions" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea placeholder="What's in this material? What will students gain?" value={form.description}
              onChange={e => set('description', e.target.value)} rows={3}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Course code *</label>
              <input required placeholder="MTH101" value={form.course_code} onChange={e => set('course_code', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Level *</label>
              <select required value={form.level} onChange={e => set('level', e.target.value)}>
                <option value="">Select</option>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>University</label>
              <select value={form.school_id} onChange={e => set('school_id', e.target.value)}>
                {SCHOOLS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Type *</label>
              <select required value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="">Select type</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Price (₦) — set 0 for free</label>
            <input type="number" min="0" step="50" placeholder="500" value={form.price} onChange={e => set('price', e.target.value)} />
            {parseFloat(form.price) > 0 && (
              <p style={{ fontSize: 12, color: '#3B6D11', marginTop: 4 }}>
                You earn ₦{Math.round(parseFloat(form.price) * 0.85).toLocaleString()} per sale (85%)
              </p>
            )}
          </div>
        </div>

        {uploading && (
          <div style={{ margin: '1rem 0', background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', height: 6 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#185FA5', transition: 'width 0.4s' }} />
          </div>
        )}

        <button type="submit" disabled={uploading}
          style={{ width: '100%', marginTop: '1.5rem', padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 15, opacity: uploading ? 0.7 : 1 }}>
          {uploading ? `Uploading... ${progress}%` : 'Publish material'}
        </button>
      </form>
    </div>
  )
}
