'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"
import { getPosts, createPost } from "@/lib/posts"
import { useRouter } from "next/navigation"

interface Post {
  id: string
  title: string
  content: string
  audio_url: string | null
  created_at: string
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      const data = await getPosts()
      setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to create a post')
        return
      }

      // Create the post
      const newPost = await createPost({
        title,
        content,
        user_id: user.id,
        audio_url: null // We'll update this after file upload
      })

      // If there's an audio file, upload it and update the post
      if (audioFile && newPost) {
        const filePath = `posts/${newPost.id}/${audioFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filePath, audioFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('audio')
          .getPublicUrl(filePath)

        // Update the post with the audio URL
        await supabase
          .from('posts')
          .update({ audio_url: publicUrl })
          .eq('id', newPost.id)

        newPost.audio_url = publicUrl
      }

      // Add new post to the list and reset form
      setPosts(prev => [newPost, ...prev])
      setTitle("")
      setContent("")
      setAudioFile(null)
      setError(null)

    } catch (error: any) {
      console.error('Error creating post:', error)
      setError(error.message || 'Failed to create post')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading posts...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Music Feed</h1>

      {/* Create Post Form */}
      <form onSubmit={handleSubmit} className="mb-12 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-xl font-semibold">Share Your Music</h2>
        
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <textarea
              placeholder="Description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="h-32 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2
                file:mr-4 file:cursor-pointer file:rounded-full file:border-0
                file:bg-blue-50 file:px-4 file:py-2 file:text-sm
                file:font-semibold file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white 
              transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 
              focus:ring-blue-500/20 disabled:bg-gray-400"
          >
            {creating ? "Creating..." : "Share"}
          </button>
        </div>
      </form>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center">
              {post.profiles?.avatar_url && (
                <img
                  src={post.profiles.avatar_url}
                  alt={post.profiles.username || 'User'}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold">{post.title}</h3>
                <p className="text-sm text-gray-600">
                  {post.profiles?.username || 'Anonymous'} • 
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className="mb-4 text-gray-700">{post.content}</p>

            {post.audio_url && (
              <div className="mt-4">
                <audio controls className="w-full">
                  <source src={post.audio_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center text-gray-500">
            No posts yet. Be the first to share!
          </div>
        )}
      </div>
    </div>
  )
}