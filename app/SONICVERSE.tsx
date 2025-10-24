'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'

export default function Home() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const testConnection = async () => {
      const { data } = await supabase.from('test').select('*')
      setData(data)
    }
    testConnection()
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-5 font-sans dark:bg-black">
      <h1 className="mb-8 text-3xl font-semibold text-black dark:text-zinc-50">
        Musicverse Supabase Connection Test
      </h1>
      <pre className="rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-800 dark:text-zinc-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}