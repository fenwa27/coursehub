'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const supabase = createBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const links = [
    { href: '/browse', label: 'Browse' },
    { href: '/upload', label: 'Sell' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ]

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e5e5e5',
      padding: '0 1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: '1rem' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 16, textDecoration: 'none', color: '#000' }}>
          <span style={{ background: '#185FA5', color: '#fff', borderRadius: 8, padding: '4px 8px', fontSize: 13 }}>📚</span>
          CourseHub
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 14,
              textDecoration: 'none',
              background: pathname === l.href ? '#E6F1FB' : 'transparent',
              color: pathname === l.href ? '#185FA5' : '#555',
              fontWeight: pathname === l.href ? 600 : 400,
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <button onClick={signOut} style={{
              padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6,
              cursor: 'pointer', background: 'transparent', fontSize: 13, color: '#555'
            }}>
              Sign out
            </button>
          ) : (
            <Link href="/auth" style={{
              padding: '7px 16px', background: '#185FA5', color: '#fff',
              borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: 'none'
            }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
