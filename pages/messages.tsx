import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import Navigation from '../components/Navigation'

interface ConversationItem {
  conversationId: string
  otherUserId: string
  otherUserName: string | null
  otherUserUsername: string | null
  otherUserAvatar: string | null
  lastMessage: string | null
  lastMessageTime: string | null
  lastMessageSender: string | null
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setError(null)
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      try {
        // Get all conversations for current user
        const { data: participantData, error: partErr } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id)

        if (partErr) throw partErr

        if (!participantData || participantData.length === 0) {
          setConversations([])
          setLoading(false)
          return
        }

        const conversationIds = participantData.map(p => p.conversation_id)

        // For each conversation, get the other participant and latest message
        const conversationsData: ConversationItem[] = []

        for (const convId of conversationIds) {
          try {
            // Get other participant
            const { data: otherParticipant, error: otherErr } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', convId)
              .neq('user_id', user.id)
              .single()

            if (otherErr) continue

            // Get other user's profile
            const { data: otherProfile, error: profErr } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', otherParticipant.user_id)
              .single()

            if (profErr) continue

            // Get latest message
            const { data: latestMsg, error: msgErr } = await supabase
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('conversation_id', convId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            conversationsData.push({
              conversationId: convId,
              otherUserId: otherProfile.id,
              otherUserName: otherProfile.full_name,
              otherUserUsername: otherProfile.username,
              otherUserAvatar: otherProfile.avatar_url,
              lastMessage: latestMsg?.content || null,
              lastMessageTime: latestMsg?.created_at || null,
              lastMessageSender: latestMsg?.sender_id || null
            })
          } catch (err) {
            console.error(`Error loading conversation ${convId}:`, err)
          }
        }

        // Sort by latest message time
        conversationsData.sort((a, b) => {
          const timeA = new Date(a.lastMessageTime || 0).getTime()
          const timeB = new Date(b.lastMessageTime || 0).getTime()
          return timeB - timeA
        })

        setConversations(conversationsData)
      } catch (err: any) {
        console.error('Error loading conversations:', err)
        setError(err.message || 'Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleDelete = async (conversationId: string) => {
    if (!confirm('Delete this conversation?')) return

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error

      setConversations(prev =>
        prev.filter(c => c.conversationId !== conversationId)
      )
    } catch (err: any) {
      console.error('Error deleting conversation:', err)
      alert(err.message || 'Failed to delete conversation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 text-sm mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Conversations List */}
        <div className="space-y-1 mt-4 px-6">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No conversations yet</p>
              <Link
                href="/discover"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start a Conversation
              </Link>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.conversationId}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm"
              >
                <div className="p-4 flex items-center justify-between">
                  <Link
                    href={`/chat/${conv.conversationId}`}
                    className="flex-1 flex items-center gap-3 hover:no-underline"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {conv.otherUserAvatar ? (
                        <img
                          src={conv.otherUserAvatar}
                          alt={conv.otherUserUsername || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {(conv.otherUserUsername?.charAt(0) || 'U').toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Message Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.otherUserName || conv.otherUserUsername || 'Unknown'}
                        </h3>
                        <span className="text-gray-500 text-sm flex-shrink-0">
                          @{conv.otherUserUsername}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm truncate mt-1">
                        {conv.lastMessage ? (
                          <>
                            {conv.lastMessageSender === currentUserId && 'You: '}
                            {conv.lastMessage}
                          </>
                        ) : (
                          <span className="text-gray-400">No messages yet</span>
                        )}
                      </p>
                    </div>

                    {/* Timestamp */}
                    {conv.lastMessageTime && (
                      <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {(() => {
                          const date = new Date(conv.lastMessageTime)
                          const now = new Date()
                          const diffMinutes = Math.floor(
                            (now.getTime() - date.getTime()) / 60000
                          )

                          if (diffMinutes < 1) return 'now'
                          if (diffMinutes < 60) return `${diffMinutes}m`
                          if (diffMinutes < 1440) {
                            const hours = Math.floor(diffMinutes / 60)
                            return `${hours}h`
                          }
                          if (diffMinutes < 10080) {
                            const days = Math.floor(diffMinutes / 1440)
                            return `${days}d`
                          }
                          return date.toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })
                        })()}
                      </div>
                    )}
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(conv.conversationId)}
                    className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete conversation"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
