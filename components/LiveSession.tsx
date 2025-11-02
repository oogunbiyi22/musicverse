"use client"

import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { supabase } from '@/lib/supabaseClient'

interface LiveSessionProps {
  sessionId: string
}

export default function LiveSession({ sessionId }: LiveSessionProps) {
  const waveformRef = useRef<HTMLDivElement | null>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [members, setMembers] = useState<string[]>([])
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
      setSession(data)

      if (!waveformRef.current || !data) return
      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#ccc',
        progressColor: '#111',
        cursorColor: '#000',
        barWidth: 2,
        barRadius: 3,
        height: 80,
      })

      ws.load(data.file_url)
      ws.on('timeupdate', (time: number) => setCurrentTime(time))
      wavesurferRef.current = ws

      // Subscribe to session changes
      const updateChannel = supabase
        .channel(`session-${sessionId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
          (payload) => {
            const newData = payload.new as any
            setSession(newData)
            syncPlayback(newData)
          }
        )
        .subscribe()

      // Track presence
      const presenceKey = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      const presenceChannel = supabase.channel(`presence-${sessionId}`, {
        config: { presence: { key: presenceKey } },
      })

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState() as Record<string, unknown>
          setMembers(Object.keys(state))
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            presenceChannel.track({ online_at: new Date().toISOString() })
          }
        })

      return () => {
        ws.destroy()
        supabase.removeChannel(presenceChannel)
        supabase.removeChannel(updateChannel)
      }
    }

    init()
  }, [sessionId])

  const syncPlayback = (data: any) => {
    const ws = wavesurferRef.current
    if (!ws) return
    if (data.is_playing && !ws.isPlaying()) {
      ws.play()
    } else if (!data.is_playing && ws.isPlaying()) {
      ws.pause()
    }
    const dur = ws.getDuration() || 1
    ws.seekTo((data.current_time || 0) / dur)
  }

  const handlePlayPause = async () => {
    if (!session) return
    const ws = wavesurferRef.current
    const newStatus = !isPlaying
    setIsPlaying(newStatus)

    await supabase
      .from('sessions')
      .update({
        is_playing: newStatus,
        current_time: Math.floor(ws?.getCurrentTime ? (ws as any).getCurrentTime() : (currentTime || 0)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  }

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      <div ref={waveformRef} className="w-full" />
      <button
        onClick={handlePlayPause}
        className="bg-black text-white px-3 py-1 rounded hover:opacity-80"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div className="text-sm text-gray-500">Members online: {members.length}</div>
      <div className="text-xs text-gray-700">
        {members.map((m, i) => (
          <div key={i}>👤 {m}</div>
        ))}
      </div>
    </div>
  )
}
