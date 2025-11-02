import type { Database } from '../types_db'

export type TablesMap = Database['public']['Tables']
export type Profile = TablesMap['profiles']['Row']

export interface ProfileUpdate {
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  website?: string | null
  bio?: string | null
  updated_at?: string
}

export interface NewProfile extends ProfileUpdate {
  id: string
  created_at: string
}

export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]