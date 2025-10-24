import { Profile, ProfileForm } from '@/types/profile'
import { supabase } from '@/utils/supabase'

export async function getProfile(id: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        created_at,
        updated_at,
        username,
        full_name,
        avatar_url,
        website,
        bio
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting profile:', error)
    throw error
  }
}

export async function updateProfile(id: string, profile: ProfileForm) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

export async function createProfile(id: string, profile: ProfileForm) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id,
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating profile:', error)
    throw error
  }
}
}