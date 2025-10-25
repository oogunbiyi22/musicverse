import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { getProfile, updateProfile } from "../lib/profileService"
import { useRouter } from "next/router"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth") // redirect if not logged in
        return
      }

      const profileData = await getProfile(user.id)
      setProfile(profileData || { id: user.id, username: "", full_name: "", bio: "", role: "", avatar_url: "" })
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setMessage("")
    try {
      await updateProfile(profile)
      setMessage("✅ Profile updated successfully!")
    } catch (err: any) {
      setMessage(err.message)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: 30, maxWidth: 500, margin: "auto" }}>
      <h1>My Profile</h1>
      <input placeholder="Username" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} style={{ display: "block", margin: "10px 0", padding: 8, width: "100%" }} />
      <input placeholder="Full Name" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} style={{ display: "block", margin: "10px 0", padding: 8, width: "100%" }} />
      <input placeholder="Role (artist/producer/etc)" value={profile.role} onChange={e => setProfile({ ...profile, role: e.target.value })} style={{ display: "block", margin: "10px 0", padding: 8, width: "100%" }} />
      <textarea placeholder="Bio" value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} style={{ display: "block", margin: "10px 0", padding: 8, width: "100%", height: 100 }} />
      <button onClick={handleSave} style={{ padding: 10, width: "100%" }}>Save Profile</button>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  )
}
