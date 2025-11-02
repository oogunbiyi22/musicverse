import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/utils/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) setError(error.message)
    else router.push('/profile')
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Log In</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white py-2 rounded hover:opacity-80"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
      <button
        onClick={async () => {
          setError('')
          try {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/profile` : undefined,
                queryParams: { prompt: 'select_account' }
              }
            })
            if (error) {
              setError(error.message)
              return
            }
            // In some browsers, supabase auto-redirects. Fallback if not.
            if (data?.url && typeof window !== 'undefined') {
              window.location.href = data.url
            }
          } catch (e: any) {
            setError(e.message || 'Google sign-in failed')
          }
        }}
        className="mt-3 border py-2 px-3 rounded hover:opacity-80"
      >
        Continue with Google
      </button>
      <p className="mt-4 text-center">
        Don\'t have an account?{' '}
        <Link href="/signup" className="text-blue-600 underline">Sign up</Link>
      </p>
      <p className="mt-2 text-center">
        <Link href="/forgot-password" className="text-blue-600 underline">Forgot your password?</Link>
      </p>
    </main>
  )
}
