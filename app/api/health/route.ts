import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types_db'

// This endpoint verifies auth is working and that a profile row exists for the
// currently authenticated user (created by the signup trigger).
// Call it from the browser and pass the access token:
//   const { data: { session } } = await supabase.auth.getSession();
//   const res = await fetch('/api/health', {
//     headers: { Authorization: `Bearer ${session?.access_token}` }
//   })

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    return NextResponse.json(
      { ok: false, error: 'Supabase env vars missing' },
      { status: 500 }
    )
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader) {
    return NextResponse.json({
      ok: true,
      requiresAuth: true,
      message: 'Provide Authorization: Bearer <access_token> header from supabase.auth.getSession().',
      steps: [
        'const { data: { session } } = await supabase.auth.getSession()',
        "fetch('/api/health', { headers: { Authorization: `Bearer ${session?.access_token}` } })"
      ]
    })
  }

  const supabase = createClient<Database>(url, anon, {
    global: {
      headers: { Authorization: authHeader }
    },
    auth: { persistSession: false, autoRefreshToken: false }
  })

  // Verify auth
  const { data: userRes, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userRes?.user) {
    return NextResponse.json(
      { ok: false, error: userErr?.message || 'No user' },
      { status: 401 }
    )
  }

  const userId = userRes.user.id

  // Check for a profile row created by the trigger
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .eq('id', userId)
    .maybeSingle()

  if (profErr) {
    return NextResponse.json(
      { ok: false, userId, error: profErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    userId,
    profileFound: Boolean(profile),
    profile
  })
}
