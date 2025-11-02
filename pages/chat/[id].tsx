import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Navigation from '../../components/Navigation'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export default function ChatPage() {
  const router = useRouter()
  const { id: conversationId } = router.query
  const [messages, setMessages] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const typingChannelRef = useRef<any>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      setError(null)
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      if (!conversationId || typeof conversationId !== 'string') {
        setLoading(false)
        return
      }

      try {
        // Get other participant in conversation
        const { data: participants, error: partErr } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)

        if (partErr) throw partErr

        const otherUserId = participants?.find(p => p.user_id !== user.id)?.user_id
        if (!otherUserId) {
          setError('Could not find conversation participant')
          setLoading(false)
          return
        }

        // Get other user's profile
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single()

        if (profErr) throw profErr
        setOtherUser(profile)

        // Load messages
        const { data: messagesData, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (msgErr) throw msgErr
        setMessages(messagesData || [])

        // Mark unseen messages as read
        if (messagesData) {
          const unseen = messagesData.filter(
            (msg: any) => msg.sender_id !== user.id && !msg.is_read
          )
          if (unseen.length > 0) {
            await supabase
              .from('messages')
              .update({ is_read: true, seen_at: new Date().toISOString() })
              .in('id', unseen.map((m: any) => m.id))
          }
        }

        // Subscribe to new messages
        const messageChannel = supabase
          .channel(`messages:${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
              setMessages(prev => [...prev, payload.new])
              // Mark as read immediately if it's from the other user
              if (payload.new.sender_id !== user.id) {
                supabase
                  .from('messages')
                  .update({ is_read: true, seen_at: new Date().toISOString() })
                  .eq('id', payload.new.id)
                  .then(() => {})
              }
            }
          )
          .subscribe()

        // Subscribe to typing indicators
        const typingChannel = supabase.channel(`typing:${conversationId}`, {
          config: { presence: { key: user.id } }
        })

        typingChannel
          .on('presence', { event: 'sync' }, () => {
            const state = typingChannel.presenceState() as Record<string, Array<{ typing?: boolean }>>
            const otherUsersTyping = Object.entries(state)
              .filter(([uid, metas]) => uid !== user.id && metas?.some(m => m.typing))
              .map(([uid]) => uid)
            setTypingUsers(otherUsersTyping)
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // User joined
              typingChannel.track({ typing: false })
            }
          })

        typingChannelRef.current = typingChannel

        setLoading(false)

        return () => {
          try { typingChannelRef.current?.track({ typing: false }) } catch {}
          messageChannel.unsubscribe()
          typingChannel.unsubscribe()
        }
      } catch (err: any) {
        console.error('Error loading chat:', err)
        setError(err.message || 'Failed to load chat')
        setLoading(false)
      }
    }

    load()
  }, [conversationId, router])

  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)
    
    // Clear existing timeout
    if (typingTimeout) clearTimeout(typingTimeout)
    
    // Broadcast typing status
    try {
      await typingChannelRef.current?.track({ typing: true })
    } catch {}
    
    // Stop typing after 3 seconds of inactivity
    const timeout = setTimeout(async () => {
      try { await typingChannelRef.current?.track({ typing: false }) } catch {}
    }, 3000)
    setTypingTimeout(timeout)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !currentUserId || !conversationId) return

    // Clear typing indicator
    if (typingTimeout) clearTimeout(typingTimeout)
    try { await typingChannelRef.current?.track({ typing: false }) } catch {}

    setSending(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId as string,
          sender_id: currentUserId,
          content: messageInput
        })

      if (error) throw error
      setMessageInput('')
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUserId || !conversationId) return
    setError(null)
    setUploading(true)
    try {
      const filePath = `${conversationId}/${currentUserId}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file)
      if (uploadErr) throw uploadErr

      const { error: insertErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId as string,
          sender_id: currentUserId,
          content: file.name,
          file_path: filePath
        })
      if (insertErr) throw insertErr
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      console.error('File upload error:', err)
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  // Resolve signed URLs for any message with a private file_path
  useEffect(() => {
    const fetchSigned = async () => {
      const toFetch = messages.filter((m: any) => m.file_path && !signedUrls[m.id])
      if (toFetch.length === 0) return
      const results = await Promise.allSettled(
        toFetch.map(async (m: any) => {
          const { data, error } = await supabase.storage
            .from('chat-files')
            .createSignedUrl(m.file_path as string, 60 * 60) // 1 hour
          if (error) throw error
          return { id: m.id as string, url: data?.signedUrl as string }
        })
      )
      const additions: Record<string, string> = {}
      results.forEach((res) => {
        if (res.status === 'fulfilled' && res.value?.id && res.value?.url) {
          additions[res.value.id] = res.value.url
        }
      })
      if (Object.keys(additions).length > 0) {
        setSignedUrls((prev) => ({ ...prev, ...additions }))
      }
    }
    fetchSigned()
  }, [messages])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Navigation />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Navigation />
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chat not found</p>
          <Link href="/messages" className="text-blue-500 hover:underline">
            Back to Messages
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {otherUser.avatar_url && (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.username || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <h2 className="font-semibold text-gray-900">
                  {otherUser.full_name || otherUser.username || 'Unknown'}
                </h2>
                <p className="text-sm text-gray-500">@{otherUser.username}</p>
              </div>
            </div>
            <Link
              href="/messages"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`p-3 rounded-2xl ${msg.sender_id === currentUserId ? 'bg-black text-white self-end' : 'bg-gray-100 text-black self-start'} max-w-xs`}>
                  {msg.file_url || msg.file_path ? (
                    <div>
                      {(() => {
                        const displayUrl: string | undefined = msg.file_url || signedUrls[msg.id]
                        if (!displayUrl && msg.file_path) {
                          return <p className="text-sm opacity-70">Loading attachment…</p>
                        }
                        const isAudio = /\.(mp3|wav|m4a)$/i.test(msg.content || '') || /\.(mp3|wav|m4a)$/i.test(displayUrl || '')
                        return isAudio ? (
                          <>
                            <p className="text-sm mb-1">{msg.content}</p>
                            <audio controls className="w-full rounded-lg">
                              <source src={displayUrl} />
                            </audio>
                          </>
                        ) : (
                          <a href={displayUrl} target="_blank" rel="noreferrer" className="underline text-sm">
                            {msg.content}
                          </a>
                        )
                      })()}
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <p className="text-sm text-gray-500 mb-1">
              {typingUsers.length === 1
                ? 'User is typing...'
                : 'Multiple users are typing...'}
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={sendMessage}
          className="bg-white border-t border-gray-200 px-6 py-4"
        >
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={sending || uploading}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              title="Attach a file"
            >
              📎
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={handleTyping}
              placeholder="Type a message..."
              disabled={sending || uploading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={sending || uploading || !messageInput.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-medium transition-colors"
            >
              {uploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
