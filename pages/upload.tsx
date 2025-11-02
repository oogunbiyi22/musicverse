import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/utils/supabase'
import { uploadFile } from '@/lib/fileStorage'
import { createPost } from '@/lib/posts'
import Navigation from '../components/Navigation'

export default function UploadPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const id = data.user?.id ?? null
      if (!id) {
        router.push('/login')
        return
      }
      setUserId(id)
    }
    init()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!userId) {
      setMessage('You must be logged in to upload')
      return
    }
    if (!title.trim()) {
      setMessage('Please provide a title')
      return
    }
    setLoading(true)
    try {
      let audioUrl: string | null = null
      if (file) {
        audioUrl = await uploadFile(userId, file)
      }

      await createPost({
        title,
        content,
        user_id: userId,
        audio_url: audioUrl,
        image_url: null
      })

      setMessage('✅ Post created! Redirecting to feed...')
      setTimeout(() => router.push('/posts'), 800)
    } catch (err: any) {
      setMessage(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Upload a track</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }}
        />
        <textarea
          placeholder="Description"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }}
        />
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={loading} style={{ padding: 12, border: '1px solid #111', borderRadius: 6 }}>
          {loading ? 'Uploading…' : 'Create Post'}
        </button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </main>
    </>
  )
}
