'use client'
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient, Material } from '@/lib/supabase'

const TYPES = ['All', 'Past Questions', 'Lecture Notes', 'Assignments', 'Textbooks', 'Study Guides', 'Lab Reports']
const LEVELS = ['All', '100L', '200L', '300L', '400L', '500L', 'Postgrad']

export default function BrowsePage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')
  const [level, setLevel] = useState('All')
  const [freeOnly, setFreeOnly] = useState(false)
  const [selected, setSelected] = useState<Material | null>(null)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    const supabase = createBrowserClient()
    let query = supabase
      .from('materials')
      .select('*, seller:profiles(full_name, avg_rating), school:schools(short_name)')
      .eq('status', 'approved')
      .order('download_count', { ascending: false })
      .limit(40)

    if (type !== 'All') query = query.eq('type', type)
    if (level !== 'All') query = query.eq('level', level)
    if (freeOnly) query = query.eq('is_free', true)
    if (search.length > 2) query = query.ilike('title', `%${search}%`)

    const { data } = await query
    setMaterials((data as Material[]) ?? [])
    setLoading(false)
  }, [type, level, freeOnly, search])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: '1rem' }}>Browse Materials</h1>

      <input
        placeholder="Search by course code, topic... (e.g. MTH101, organic chemistry)"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '1rem', fontSize: 15 }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <select value={type} onChange={e => setType(e.target.value)} style={{ width: 'auto' }}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={level} onChange={e => setLevel(e.target.value)} style={{ width: 'auto' }}>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#555' }}>
          <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} style={{ width: 'auto' }} />
          Free only
        </label>
        <span style={{ fontSize: 13, color: '#999', marginLeft: 'auto' }}>
          {loading ? 'Loading...' : `${materials.length} materials`}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ height: 160, background: '#f0f0f0', borderRadius: 12 }} />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p>No materials found. Try a different search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {materials.map(m => (
            <MaterialCard key={m.id} material={m} onClick={() => setSelected(m)} />
          ))}
        </div>
      )}

      {selected && <MaterialModal material={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function MaterialCard({ material: m, onClick }: { material: Material; onClick: () => void }) {
  const typeColors: Record<string, string> = {
    'Past Questions': '#185FA5',
    'Lecture Notes': '#3B6D11',
    'Textbooks': '#854F0B',
    'Study Guides': '#534AB7',
    'Assignments': '#993556',
    'Lab Reports': '#3C3489',
  }
  const color = typeColors[m.type] ?? '#185FA5'

  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12,
      padding: '1rem', cursor: 'pointer', transition: 'box-shadow 0.15s'
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, background: `${color}18`, color, padding: '3px 8px', borderRadius: 20, fontWeight: 500 }}>
          {m.type}
        </span>
        <span style={{ fontSize: 11, color: '#999' }}>{m.level}</span>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{m.title}</h3>
      <p style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>
        {(m as any).school?.short_name} · {m.course_code}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: m.price === 0 ? '#3B6D11' : '#111' }}>
          {m.price === 0 ? 'Free' : `₦${m.price.toLocaleString()}`}
        </span>
        <span style={{ fontSize: 12, color: '#999' }}>
          ⬇ {m.download_count ?? 0}
          {m.avg_rating > 0 && ` · ★ ${m.avg_rating.toFixed(1)}`}
        </span>
      </div>
    </div>
  )
}

function MaterialModal({ material: m, onClose }: { material: Material; onClose: () => void }) {
  const [buying, setBuying] = useState(false)
  const supabase = createBrowserClient()

  async function handleBuy() {
    setBuying(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    const res = await fetch('/api/paystack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initialize', email: user.email, amount_naira: m.price, material_id: m.id, buyer_id: user.id }),
    })
    const data = await res.json()
    if (data.authorization_url) window.location.href = data.authorization_url
    setBuying(false)
  }

  async function handleDownload() {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: m.id }),
    })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.3, flex: 1, paddingRight: 12 }}>{m.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#999' }}>×</button>
        </div>
        <p style={{ color: '#666', fontSize: 14, marginBottom: '1rem', lineHeight: 1.6 }}>{m.description}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.5rem' }}>
          {[
            ['School', (m as any).school?.short_name],
            ['Course', m.course_code],
            ['Level', m.level],
            ['Type', m.type],
            ['Downloads', m.download_count?.toLocaleString()],
            ['Rating', m.avg_rating > 0 ? `★ ${m.avg_rating.toFixed(1)}` : 'No reviews yet'],
          ].map(([label, value]) => (
            <div key={label} style={{ background: '#f8f8f8', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        {m.price === 0 ? (
          <button onClick={handleDownload}
            style={{ width: '100%', padding: '12px', background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
            Download Free
          </button>
        ) : (
          <button onClick={handleBuy} disabled={buying}
            style={{ width: '100%', padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
            {buying ? 'Redirecting to payment...' : `Buy — ₦${m.price.toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  )
}
