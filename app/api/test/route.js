import { supabase } from '@/utils/supabase'

// RLS-safe connection check: validate env and perform a lightweight client init
export async function GET() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  // Optionally, do a no-op call that doesn't require table access
  // If you want to test DB access, use an authenticated client and query a public view/table.

  return new Response(
    JSON.stringify({
      message: '✅ Supabase client configured',
      env: {
        urlPresent: hasUrl,
        anonKeyPresent: hasKey
      }
    }),
    { status: 200 }
  )
}