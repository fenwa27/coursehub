import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '5rem 1.5rem 3rem' }}>
        <div style={{ display: 'inline-block', background: '#E6F1FB', color: '#185FA5', fontSize: 13, fontWeight: 500, padding: '5px 14px', borderRadius: 20, marginBottom: '1.5rem' }}>
          🇳🇬 Built for Nigerian university students
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, lineHeight: 1.2, marginBottom: '1rem' }}>
          Ace your exams with the right study materials
        </h1>
        <p style={{ fontSize: 17, color: '#555', lineHeight: 1.7, marginBottom: '2rem' }}>
          Past questions, lecture notes, and study guides from students who've been there.
          Buy, sell, and study smarter at your Nigerian university.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/browse" style={{ padding: '12px 28px', background: '#185FA5', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 15 }}>
            Browse materials
          </Link>
          <Link href="/upload" style={{ padding: '12px 28px', border: '1px solid #ddd', borderRadius: 8, fontWeight: 500, fontSize: 15, color: '#333' }}>
            Sell your notes →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: '#f8f8f8', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: '1rem' }}>
          {[
            { num: '50,000+', label: 'Students' },
            { num: '12,000+', label: 'Materials' },
            { num: '10 Schools', label: 'Universities' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#185FA5' }}>{s.num}</div>
              <div style={{ fontSize: 13, color: '#777', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 24, marginBottom: '2rem' }}>Everything you need to pass</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '📄', title: 'Past Questions', desc: 'Years of exam questions with detailed solutions, verified by top students.' },
            { icon: '🤖', title: 'AI Study Assistant', desc: 'Chat with your materials. Get quizzed, summarised, and exam tips powered by AI.' },
            { icon: '⭐', title: 'Verified Reviews', desc: 'Every review comes from a verified buyer. No fake ratings.' },
            { icon: '💸', title: 'Earn from your notes', desc: 'Upload your materials and earn 85% of every sale. Withdraw to your bank instantly.' },
          ].map(f => (
            <div key={f.title} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#185FA5', padding: '3rem 1rem', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 24, marginBottom: '0.75rem' }}>Ready to ace your exams?</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', fontSize: 15 }}>Join 50,000+ students across Nigeria's top universities.</p>
        <Link href="/auth" style={{ display: 'inline-block', padding: '12px 28px', background: '#fff', color: '#185FA5', borderRadius: 8, fontWeight: 600, fontSize: 15 }}>
          Create free account
        </Link>
      </div>
    </div>
  )
}
