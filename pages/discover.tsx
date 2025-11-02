import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import Navigation from '../components/Navigation'

export default function DiscoverPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({})
  const [followingCounts, setFollowingCounts] = useState<Record<string, number>>({})
  const [mutualFollows, setMutualFollows] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setError(null)
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) {
        setError(userErr.message)
        setLoading(false)
        return
      }
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      // Load all profiles except current user
      const { data: profilesData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false })

      if (profErr) {
        setError(profErr.message)
      } else {
        setProfiles(profilesData || [])
      }

      // Load current user's following list
      const { data: followData } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id)

      if (followData) {
        setFollowing(new Set(followData.map(f => f.following_id)))
      }

      // Load follower counts for all profiles
      const { data: allFollowers } = await supabase
        .from('followers')
        .select('following_id')

      const counts: Record<string, number> = {}
      allFollowers?.forEach(f => {
        counts[f.following_id] = (counts[f.following_id] || 0) + 1
      })
      setFollowerCounts(counts)

      // Load following counts for all profiles
      const { data: allFollowing } = await supabase
        .from('followers')
        .select('follower_id')

      const followingCount: Record<string, number> = {}
      allFollowing?.forEach(f => {
        followingCount[f.follower_id] = (followingCount[f.follower_id] || 0) + 1
      })
      setFollowingCounts(followingCount)

      // Find mutual follows (people you follow who also follow you back)
      const { data: mutualData } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', user.id)

      if (mutualData && followData) {
        const followingSet = new Set(followData.map(f => f.following_id))
        const mutual = new Set(
          mutualData
            .map(m => m.follower_id)
            .filter(id => followingSet.has(id))
        )
        setMutualFollows(mutual)
      }

      setLoading(false)
    }
    load()
  }, [router])

  const startConversation = async (profileId: string) => {
    if (!currentUserId) return
    setError(null)
    
    try {
      // Check if conversation already exists between these two users
      const { data: existingConv, error: convErr } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId)
        .single()

      let conversationId: string

      if (existingConv) {
        // Check if the other user is also in a conversation with this user
        const { data: otherUserConv } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('conversation_id', existingConv.conversation_id)
          .eq('user_id', profileId)
          .single()

        if (otherUserConv) {
          conversationId = existingConv.conversation_id
        } else {
          // Create new conversation
          const { data: newConv, error: createErr } = await supabase
            .from('conversations')
            .insert({})
            .select()
            .single()

          if (createErr) throw createErr
          conversationId = newConv.id

          // Add both participants
          const { error: participantErr } = await supabase
            .from('conversation_participants')
            .insert([
              { conversation_id: conversationId, user_id: currentUserId },
              { conversation_id: conversationId, user_id: profileId }
            ])

          if (participantErr) throw participantErr
        }
      } else {
        // Create new conversation
        const { data: newConv, error: createErr } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single()

        if (createErr) throw createErr
        conversationId = newConv.id

        // Add both participants
        const { error: participantErr } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversationId, user_id: currentUserId },
            { conversation_id: conversationId, user_id: profileId }
          ])

        if (participantErr) throw participantErr
      }

      // Navigate to chat with conversation ID
      router.push(`/chat/${conversationId}`)
    } catch (err: any) {
      console.error('Error starting conversation:', err)
      setError(err.message || 'Failed to start conversation')
    }
  }

  const toggleFollow = async (profileId: string) => {
    if (!currentUserId) return
    setError(null)

    const isFollowing = following.has(profileId)

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', profileId)
        
        if (error) throw error
        setFollowing(prev => {
          const next = new Set(prev)
          next.delete(profileId)
          return next
        })
        // Update follower count
        setFollowerCounts(prev => ({
          ...prev,
          [profileId]: Math.max(0, (prev[profileId] || 0) - 1)
        }))
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({ follower_id: currentUserId, following_id: profileId })
        
        if (error) throw error
        setFollowing(prev => new Set(prev).add(profileId))
        // Update follower count
        setFollowerCounts(prev => ({
          ...prev,
          [profileId]: (prev[profileId] || 0) + 1
        }))
      }
    } catch (e: any) {
      setError(e.message || 'Failed to update follow status')
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="flex items-center justify-center min-h-screen p-6">
          <p>Loading creators...</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="p-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Discover Creators</h1>
          <Link href="/profile" className="text-blue-600 underline">
            Back to profile
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {profiles.length === 0 ? (
          <p className="text-gray-500">No other creators yet. Invite friends to join!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="border rounded-xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.username || 'User'} avatar`}
                    className="w-20 h-20 rounded-full object-cover mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 mb-3 flex items-center justify-center text-gray-500 text-2xl font-bold">
                    {(profile.username || '?')[0].toUpperCase()}
                  </div>
                )}
                <h2 className="text-lg font-semibold">{profile.username || 'Anonymous'}</h2>
                {profile.role && (
                  <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                )}
                <div className="flex gap-3 text-xs text-gray-600 mt-1">
                  <span>{followerCounts[profile.id] || 0} followers</span>
                  <span>{followingCounts[profile.id] || 0} following</span>
                </div>
                {mutualFollows.has(profile.id) && (
                  <p className="text-xs text-blue-600 mt-1">• Follows you</p>
                )}
                {profile.bio && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{profile.bio}</p>
                )}
                <div className="flex gap-2 mt-3 w-full">
                  <button
                    onClick={() => toggleFollow(profile.id)}
                    className={`flex-1 px-4 py-2 rounded transition-colors ${
                      following.has(profile.id)
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-black text-white hover:opacity-80'
                    }`}
                  >
                    {following.has(profile.id) ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => startConversation(profile.id)}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    </>
  )
}
