'use client'

import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { supabase } from '@/lib/supabaseClient'

interface AudioWaveformProps {
  fileUrl: string
}

export default function AudioWaveform({ fileUrl }: AudioWaveformProps) {
  const waveformRef = useRef<HTMLDivElement | null>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (!waveformRef.current) return

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
    }

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#d1d1d1',
      progressColor: '#000',
      cursorColor: '#000',
      barWidth: 2,
      barRadius: 3,
      height: 80,
    })

    ws.load(fileUrl)
    ws.on('timeupdate', (time) => setCurrentTime(time))
    wavesurferRef.current = ws

    const loadComments = async () => {
      const { data } = await supabase
        .from('wave_comments')
        .select('*')
        .eq('file_url', fileUrl)
        .order('timestamp', { ascending: true })
      setComments(data || [])
    }

    loadComments()

    // Realtime updates
    const channel = supabase
      .channel('wave-comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wave_comments' },
        (payload) => {
          if (payload.new.file_url === fileUrl) {
            setComments((c) => [...c, payload.new])
          }
        }
      )
      .subscribe()

    return () => {
      ws.destroy()
      supabase.removeChannel(channel)
    }
  }, [fileUrl])

  const togglePlay = () => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.playPause()
    setIsPlaying(!isPlaying)
  }

  const handleAddComment = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !newComment) return

    await supabase.from('wave_comments').insert([
      {
        file_url: fileUrl,
        user_id: user.id,
        username: user.email?.split('@')[0],
        comment: newComment,
        timestamp: Math.floor(currentTime),
      },
    ])

    setNewComment('')
  }

  const jumpTo = (time: number) => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.seekTo(time / wavesurferRef.current.getDuration())
  }

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      <div className="w-full relative">
        <div ref={waveformRef} className="w-full" />
        {/* Comment markers */}
        {comments.map((c) => (
          <div
            key={c.id}
            className="absolute bottom-0 text-[10px] text-red-600 cursor-pointer"
            style={{
              left: `${(c.timestamp / (wavesurferRef.current?.getDuration() || 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
            title={c.comment}
            onClick={() => jumpTo(c.timestamp)}
          >
            ●
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 w-full">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-grow border border-gray-300 px-3 py-1 rounded-lg text-sm"
        />
        <button
          onClick={handleAddComment}
          className="bg-black text-white px-3 py-1 rounded text-sm hover:opacity-80"
        >
          Comment
        </button>
      </div>

      <button
        onClick={togglePlay}
        className="bg-gray-800 text-white px-3 py-1 rounded hover:opacity-80 text-sm"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      {/* Comment list */}
      <div className="w-full mt-2 border-t pt-2">
        {comments.map((c) => (
          <div key={c.id} className="text-xs text-gray-700 mb-1">
            <span className="font-bold">{c.username}</span> @ {c.timestamp}s: {c.comment}
          </div>
        ))}
      </div>
    </div>
  )
}
