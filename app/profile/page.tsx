'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"
import { getProfile, updateProfile } from "@/lib/profileService"

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        if (user) {
          const data = await getProfile(user.id).catch(() => null)
          setProfile(
            data || {
              id: user.id,
              updated_at: null,
              username: null,
              full_name: null,
              bio: null,
              role: null,
              avatar_url: null,
              website: null,
            }
          )
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!profile) return

    setMessage("")
    try {
      await updateProfile(profile)
      setMessage("Profile updated successfully!")
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage("Error updating profile. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Please log in to view your profile.</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-3xl font-bold">My Profile</h1>
      
      <div className="space-y-4">
        <div>
          <input
            placeholder="Username"
            value={profile.username || ''}
            onChange={(e) => setProfile({ ...profile, username: e.target.value || null })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <input
            placeholder="Full Name"
            value={profile.full_name || ''}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value || null })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <input
            placeholder="Role (artist/producer/etc)"
            value={profile.role || ''}
            onChange={(e) => setProfile({ ...profile, role: e.target.value || null })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <textarea
            placeholder="Bio"
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value || null })}
            className="h-32 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          Save Profile
        </button>

        {message && (
          <div className={`mt-4 rounded-lg p-4 ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700' 
              : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}