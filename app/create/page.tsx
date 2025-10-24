'use client'

import { useState } from "react"
import { supabase } from "@/utils/supabase"
import { createPost } from "@/lib/posts"
import { uploadFile } from "@/lib/fileStorage"
import { useRouter } from "next/navigation"

export default function CreatePost() {
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState("")
  const router = useRouter()

  const handlePost = async () => {
    if (!title.trim()) {
      setMsg("Please enter a title")
      return
    }

    if (!file) {
      setMsg("Please select an audio file")
      return
    }

    setUploading(true)
    setMsg("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMsg("Please log in to create a post")
        router.push('/auth')
        return
      }

      // Upload the audio file
      const file_url = await uploadFile(user.id, file)

      // Create the post
      await createPost({
        user_id: user.id,
        title: title.trim(),
        content: desc.trim(),
        audio_url: file_url
      })

      // Reset form and show success message
      setMsg("✅ Posted successfully!")
      setTitle("")
      setDesc("")
      setFile(null)

      // Redirect to posts page after short delay
      setTimeout(() => {
        router.push('/posts')
      }, 1500)

    } catch (error: any) {
      console.error('Error creating post:', error)
      setMsg(error.message || 'Error creating post')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Create New Post</h1>
      
      <div className="space-y-6 rounded-lg bg-white p-6 shadow-md">
        <div>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <textarea
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="h-32 w-full rounded-lg border border-gray-300 px-4 py-2 
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null)
              setMsg("") // Clear any previous error messages
            }}
            className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2
              file:mr-4 file:cursor-pointer file:rounded-full file:border-0
              file:bg-blue-50 file:px-4 file:py-2 file:text-sm
              file:font-semibold file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        <button
          onClick={handlePost}
          disabled={uploading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white 
            transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 
            focus:ring-blue-500/20 disabled:bg-gray-400"
        >
          {uploading ? "Creating Post..." : "Create Post"}
        </button>

        {msg && (
          <div className={`rounded-lg p-4 ${
            msg.includes('✅') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}