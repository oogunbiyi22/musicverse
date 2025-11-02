'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/test')
        const json = await res.json()
        setResult(json)
      } catch (e: any) {
        setError(e.message || 'Failed to fetch /api/test')
      }
    }
    check()
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-5 font-sans dark:bg-black">
      <h1 className="mb-8 text-3xl font-semibold text-black dark:text-zinc-50">
        Musicverse Supabase Config Check
      </h1>
      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div>
      ) : (
        <pre className="rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-800 dark:text-zinc-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}