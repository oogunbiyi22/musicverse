import { supabase } from "@/utils/supabase"
import type { Database } from '@/types_db'

type Tables = Database['public']['Tables']
type Post = Tables['posts']['Row']
type PostInsert = Tables['posts']['Insert']
type PostUpdate = Tables['posts']['Update']

interface PostWithProfile extends Post {
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

export async function createPost(post: Omit<PostInsert, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        ...post,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, profiles(username, avatar_url)')
      .single()

    if (error) throw error
    return data as PostWithProfile
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

export async function getPosts() {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url)")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as PostWithProfile[]
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw error
  }
}

export async function getPostById(postId: string) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url)")
      .eq('id', postId)
      .single()

    if (error) throw error
    return data as PostWithProfile
  } catch (error) {
    console.error('Error fetching post:', error)
    throw error
  }
}

export async function updatePost(postId: string, updates: Omit<PostUpdate, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select('*, profiles(username, avatar_url)')
      .single()

    if (error) throw error
    return data as PostWithProfile
  } catch (error) {
    console.error('Error updating post:', error)
    throw error
  }
}

export async function deletePost(postId: string) {
  try {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq('id', postId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}