import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/utils/supabase'
import { useState } from 'react'

export default function Navigation() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Hide nav on login/signup/auth pages
  const hideNavRoutes = ['/login', '/signup', '/auth', '/forgot-password', '/reset-password']
  if (hideNavRoutes.includes(router.pathname)) {
    return null
  }

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      padding: '12px 24px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#fff'
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 700, textDecoration: 'none', color: '#000' }}>
          🎵 Musicverse
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link href="/posts" style={{ textDecoration: 'none', color: router.pathname === '/posts' ? '#000' : '#6b7280' }}>
          Feed
        </Link>
        <Link href="/discover" style={{ textDecoration: 'none', color: router.pathname === '/discover' ? '#000' : '#6b7280' }}>
          Discover
        </Link>
        <Link href="/messages" style={{ textDecoration: 'none', color: router.pathname === '/messages' ? '#000' : '#6b7280' }}>
          Messages
        </Link>
        <Link href="/profile" style={{ textDecoration: 'none', color: router.pathname === '/profile' ? '#000' : '#6b7280' }}>
          Profile
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            padding: '6px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            cursor: 'pointer',
            backgroundColor: '#fff',
            fontSize: 14
          }}
        >
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </nav>
  )
}
