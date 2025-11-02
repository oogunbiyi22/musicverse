import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPosts } from '@/lib/posts'
import Navigation from '../components/Navigation'

interface PostItem {
  id: string
  title: string
  content: string
  audio_url: string | null
  created_at: string
  profiles?: {
    username: string | null
    avatar_url: string | null
  } | null
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPosts()
        setPosts(data as any)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <>
      <Navigation />
      <main style={{ padding: 24 }}>Loading…</main>
    </>
  )
  if (error) return (
    <>
      <Navigation />
      <main style={{ padding: 24, color: '#b91c1c' }}>Error: {error}</main>
    </>
  )

  return (
    <>
      <Navigation />
      <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Recent Posts</h1>
        <Link href="/upload" style={{ textDecoration: 'underline' }}>Upload a track</Link>
      </div>

      {posts.length === 0 && <p>No posts yet. Be the first to upload!</p>}

      <ul style={{ display: 'grid', gap: 16 }}>
        {posts.map((p) => (
          <li key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{p.title}</h2>
              <span style={{ color: '#6b7280', fontSize: 12 }}>{new Date(p.created_at).toLocaleString()}</span>
            </div>
            {p.profiles?.username && (
              <p style={{ color: '#6b7280', fontSize: 13 }}>by {p.profiles.username}</p>
            )}
            <p style={{ marginTop: 8 }}>{p.content}</p>
            {p.audio_url && (
              <audio style={{ marginTop: 12, width: '100%' }} controls src={p.audio_url} />
            )}
          </li>
        ))}
      </ul>
      </main>
    </>
  )
}
