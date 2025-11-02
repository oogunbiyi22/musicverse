import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // When user clicks the email link, Supabase sets a recovery session.
    // Optional: we could check for a session here for UX, but updateUser will error if invalid.
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage('✅ Password updated. Redirecting to login…')
      setTimeout(() => router.push('/login'), 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Open the link from your email again and retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Reset password</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="password"
          placeholder="New password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          className="border p-2 rounded"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="bg-black text-white py-2 rounded hover:opacity-80">
          {loading ? 'Updating…' : 'Update password'}
        </button>
        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}
      </form>
      <p className="mt-4 text-center">
        Go back to{' '}
        <Link href="/login" className="text-blue-600 underline">Login</Link>
      </p>
    </main>
  )
}
