'use client'
import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const SCHOOLS = [
  { id: '', name: 'Select your university' },
  { id: 'unilag', name: 'University of Lagos (UNILAG)' },
  { id: 'oau', name: 'Obafemi Awolowo University (OAU)' },
  { id: 'futa', name: 'Federal University of Technology Akure (FUTA)' },
  { id: 'ui', name: 'University of Ibadan (UI)' },
  { id: 'abu', name: 'Ahmadu Bello University (ABU)' },
  { id: 'unn', name: 'University of Nigeria Nsukka (UNN)' },
  { id: 'lasu', name: 'Lagos State University (LASU)' },
  { id: 'cu', name: 'Covenant University (CU)' },
]

const LEVELS = ['100L', '200L', '300L', '400L', '500L', 'Postgrad']

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createBrowserClient()

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', school_id: '', level: ''
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, level: form.level, school_id: form.school_id } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setStep(3); setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#185FA5', borderRadius: 12, padding: '10px 20px' }}>
            <span style={{ fontSize: 20 }}>📚</span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>CourseHub</span>
          </div>
          <p style={{ color: '#777', marginTop: 8, fontSize: 14 }}>Nigeria's #1 study materials platform</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e5e5', padding: '2rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 8, padding: 4, marginBottom: '1.5rem' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m as any); setStep(1); setError('') }}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 6, background: mode === m ? '#fff' : 'transparent', fontWeight: mode === m ? 600 : 400, cursor: 'pointer', fontSize: 14 }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#fff0f0', color: '#c0392b', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" required placeholder="your@email.com" value={form.email}
                onChange={e => set('email', e.target.value)} style={{ marginBottom: '1rem' }} />
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Password</label>
              <input type="password" required placeholder="••••••••" value={form.password}
                onChange={e => set('password', e.target.value)} style={{ marginBottom: '1.5rem' }} />
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}

          {/* SIGNUP STEP 1 */}
          {mode === 'signup' && step === 1 && (
            <form onSubmit={e => { e.preventDefault(); setStep(2) }}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: '1rem' }}>Step 1 of 2 — Personal info</p>
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Full name</label>
              <input required placeholder="Chukwuemeka Obi" value={form.full_name}
                onChange={e => set('full_name', e.target.value)} style={{ marginBottom: '1rem' }} />
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" required placeholder="your@email.com" value={form.email}
                onChange={e => set('email', e.target.value)} style={{ marginBottom: '1rem' }} />
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Password</label>
              <input type="password" required placeholder="At least 8 characters" minLength={8} value={form.password}
                onChange={e => set('password', e.target.value)} style={{ marginBottom: '1.5rem' }} />
              <button type="submit"
                style={{ width: '100%', padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
                Continue →
              </button>
            </form>
          )}

          {/* SIGNUP STEP 2 */}
          {mode === 'signup' && step === 2 && (
            <form onSubmit={handleSignup}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: '1rem' }}>Step 2 of 2 — Your university</p>
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>University</label>
              <select required value={form.school_id} onChange={e => set('school_id', e.target.value)} style={{ marginBottom: '1rem' }}>
                {SCHOOLS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 4 }}>Current level</label>
              <select required value={form.level} onChange={e => set('level', e.target.value)} style={{ marginBottom: '1.5rem' }}>
                <option value="">Select level</option>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '11px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
                  {loading ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {/* SUCCESS */}
          {mode === 'signup' && step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: 48, marginBottom: '1rem' }}>✅</div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Check your email!</h3>
              <p style={{ fontSize: 14, color: '#777', lineHeight: 1.6 }}>
                We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.
              </p>
              <button onClick={() => { setMode('login'); setStep(1) }}
                style={{ marginTop: '1.5rem', padding: '10px 24px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                Go to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
