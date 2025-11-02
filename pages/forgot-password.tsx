import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined
      })
      if (error) throw error
      setMessage('✅ Check your email for a reset link.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Forgot password</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="bg-black text-white py-2 rounded hover:opacity-80">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}
      </form>
      <p className="mt-4 text-center">
        Remembered it?{' '}
        <Link href="/login" className="text-blue-600 underline">Log in</Link>
      </p>
    </main>
  )
}
