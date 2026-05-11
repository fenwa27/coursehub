import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: "CourseHub — Nigeria's #1 Study Materials Platform",
  description: 'Find past questions, lecture notes, and study guides for Nigerian universities.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  )
}
