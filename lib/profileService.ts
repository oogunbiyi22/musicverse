import { supabase } from '@/utils/supabase'

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(profile: any) {
  const { error } = await supabase.from("profiles").upsert(profile)
  if (error) throw error
}