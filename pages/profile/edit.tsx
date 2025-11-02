import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { getProfile, updateProfile } from '@/lib/profileService'
import Navigation from '../../components/Navigation'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      setError(null)
      const { data: { user }, error: uerr } = await supabase.auth.getUser()
      if (uerr) {
        setError(uerr.message)
        setLoading(false)
        return
      }
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setEmail(user.email ?? null)

      try {
        const p = await getProfile(user.id)
        if (p) {
          setUsername(p.username ?? '')
          setFullName(p.full_name ?? '')
          setRole(p.role ?? '')
          setBio(p.bio ?? '')
          setAvatarUrl(p.avatar_url ?? '')
        } else {
          // Initialize defaults
          setUsername('')
          setFullName('')
          setRole('')
          setBio('')
          setAvatarUrl('')
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const uploadAvatar = async (uid: string, file: File) => {
    const ext = file.name.split('.').pop() || 'png'
    const path = `avatars/${uid}.${ext}`
    const { error } = await supabase.storage
      .from('user_uploads')
      .upload(path, file, { upsert: true })
    if (error) {
      if ((error as any)?.message?.toLowerCase?.().includes('does not exist')) {
        throw new Error("Storage bucket 'user_uploads' not found. Please create it in Supabase Storage and set it to Public (or switch to signed URLs).")
      }
    }
    const { data } = supabase.storage.from('user_uploads').getPublicUrl(path)
    return data.publicUrl
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      let newAvatarUrl = avatarUrl
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(userId, avatarFile)
      }
      await updateProfile({
        id: userId,
        username,
        full_name: fullName,
        role,
        bio,
        avatar_url: newAvatarUrl
      })
      setMessage('✅ Profile saved')
      // Small delay then navigate back to profile
      setTimeout(() => router.push('/profile'), 600)
    } catch (e: any) {
      setError(e.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <>
      <Navigation />
      <main className="flex items-center justify-center min-h-screen p-6">Loading…</main>
    </>
  )

  return (
    <>
      <Navigation />
      <main className="flex flex-col items-center min-h-screen p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <Link href="/profile" className="text-blue-600 underline">Back to profile</Link>
        </div>

        {email && <p className="text-sm text-gray-500 mb-3">{email}</p>}

        <form onSubmit={onSave} className="flex flex-col gap-3">
          {avatarUrl && (
            <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover self-center" />
          )}
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />

          <input
            type="text"
            placeholder="Username"
            className="border p-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Full name"
            className="border p-2 rounded"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Role (artist/producer/etc)"
            className="border p-2 rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <textarea
            placeholder="Bio"
            className="border p-2 rounded"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white py-2 px-4 rounded hover:opacity-80"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href="/profile" className="border py-2 px-4 rounded hover:opacity-80">Cancel</Link>
          </div>
        </form>

        {message && <p className="mt-3 text-green-700">{message}</p>}
        {error && <p className="mt-3 text-red-600">{error}</p>}
      </div>
      </main>
    </>
  )
}