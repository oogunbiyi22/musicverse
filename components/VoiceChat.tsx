'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Peer from 'simple-peer'
import { supabase } from '@/lib/supabaseClient'

interface VoiceChatProps {
  sessionId: string
  userId: string
}

type PeersMap = Record<string, any>

type RemoteStreamsMap = Record<string, MediaStream>

export default function VoiceChat({ sessionId, userId }: VoiceChatProps) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const myStream = useRef<MediaStream | null>(null)
  const peersRef = useRef<PeersMap>({})
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamsMap>({})
  const [muted, setMuted] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const topic = useMemo(() => `voice:${sessionId}`, [sessionId])

  const getMembers = useCallback((): string[] => {
    const ch = channelRef.current
    if (!ch) return []
    const state = ch.presenceState() as Record<string, Array<Record<string, unknown>>> | undefined
    return state ? Object.keys(state) : []
  }, [])

  const destroyPeer = useCallback((otherId: string) => {
    const p = peersRef.current[otherId]
    if (p) {
      try { p.destroy() } catch {}
      delete peersRef.current[otherId]
    }
    setRemoteStreams(prev => {
      const { [otherId]: _omit, ...rest } = prev
      return rest
    })
  }, [])

  const createPeer = useCallback((otherId: string, initiator: boolean) => {
    if (otherId === userId) return
    if (peersRef.current[otherId]) return peersRef.current[otherId]
    if (!myStream.current) return

    const peer = new Peer({
      initiator,
      trickle: true,
      stream: myStream.current,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    })

    const channel = channelRef.current
    if (!channel) return

  peer.on('signal', (data: any) => {
      // Send to the intended recipient only
      channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { from: userId, to: otherId, signal: data },
      })
    })

    peer.on('stream', (remoteStream: MediaStream) => {
      setRemoteStreams(prev => ({ ...prev, [otherId]: remoteStream }))
    })

    peer.on('close', () => {
      destroyPeer(otherId)
    })

    peer.on('error', () => {
      // Best-effort cleanup
      destroyPeer(otherId)
    })

    peersRef.current[otherId] = peer
    return peer
  }, [destroyPeer, userId])

  useEffect(() => {
    let cancelled = false
    const setup = async () => {
      try {
        setError(null)
        setConnecting(true)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) return
        myStream.current = stream

        // Apply mute state to mic initially
        stream.getAudioTracks().forEach(t => (t.enabled = !muted))

        const channel = supabase.channel(topic, {
          config: {
            presence: { key: userId },
            broadcast: { self: false },
          },
        })

        channel
          .on('broadcast', { event: 'signal' }, (payload: any) => {
            const { from, to, signal } = payload?.payload || {}
            if (!from || to !== userId) return

            let peer = peersRef.current[from]
            if (!peer) {
              peer = createPeer(from, false) as any
            }
            try {
              peer?.signal(signal)
            } catch {}
          })
          .on('presence', { event: 'sync' }, () => {
            // Determine the full membership and connect to peers deterministically
            const members = getMembers().filter(id => id !== userId)

            // Create connections where I am lexicographically smaller (to avoid double connections)
            members.forEach((otherId) => {
              if (userId < otherId && !peersRef.current[otherId]) {
                createPeer(otherId, true)
              }
            })

            // Cleanup peers for members that left
            Object.keys(peersRef.current).forEach((peerId) => {
              if (!members.includes(peerId)) {
                destroyPeer(peerId)
              }
            })

            setConnecting(false)
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Announce presence
              try { await channel.track({ online: true }) } catch {}
            }
          })

        channelRef.current = channel
      } catch (e: any) {
        console.error('VoiceChat init error:', e)
        setError(e?.message || 'Failed to start voice chat')
        setConnecting(false)
      }
    }

    setup()
    return () => {
      cancelled = true
      try {
        Object.keys(peersRef.current).forEach(destroyPeer)
      } catch {}
      try {
        channelRef.current && supabase.removeChannel(channelRef.current)
      } catch {}
      try { myStream.current?.getTracks().forEach(t => t.stop()) } catch {}
    }
  }, [topic, userId, muted, createPeer, destroyPeer, getMembers])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      try {
        myStream.current?.getAudioTracks().forEach(t => (t.enabled = !next))
      } catch {}
      return next
    })
  }, [])

  const remoteIds = Object.keys(remoteStreams)

  const RemoteAudio = ({ stream }: { stream: MediaStream }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    useEffect(() => {
      if (audioRef.current) {
        try { (audioRef.current as any).srcObject = stream } catch {}
      }
    }, [stream])
    return <audio ref={audioRef} autoPlay />
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className={`px-3 py-1 rounded border ${muted ? 'bg-gray-200' : 'bg-blue-600 text-white'} `}
          title={muted ? 'Unmute mic' : 'Mute mic'}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        {connecting ? (
          <span className="text-sm text-gray-500">Connecting…</span>
        ) : (
          <span className="text-sm text-gray-400">🎙 Voice Chat Active</span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* Render remote audio elements */}
      <div className="flex flex-col gap-2">
        {remoteIds.length === 0 ? (
          <p className="text-xs text-gray-400">No peers connected yet</p>
        ) : (
          remoteIds.map((rid) => (
            <RemoteAudio key={rid} stream={remoteStreams[rid]} />
          ))
        )}
      </div>
    </div>
  )
}
