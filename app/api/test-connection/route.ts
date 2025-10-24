import { supabase } from '@/utils/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase.from('profiles').select('*')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '✅ Supabase connected successfully!',
      data
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}