import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import QAPanel from '../components/QAPanel'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react'

export default function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const location = useLocation()
  const nav = useNavigate()
  const { user } = useAuth()

  const [token, setToken] = useState<string>(location.state?.token || '')
  const [roomName, setRoomName] = useState<string>(location.state?.roomName || '')
  const [meetingId, setMeetingId] = useState<number>(location.state?.meetingId || 0)
  const [participantName] = useState<string>(location.state?.participantName || user?.name || 'Guest')
  const [loading, setLoading] = useState(!token)
  const [showQA, setShowQA] = useState(true)
  const [error, setError] = useState('')

  const LIVEKIT_URL = 'ws://localhost:7880'

  useEffect(() => {
    // If no token in state (host navigating directly), fetch it
    if (!token && code && user) {
      api.get(`/rooms/join/${code}`)
        .then(async roomInfo => {
          setMeetingId(roomInfo.data.meeting_id)
          setRoomName(roomInfo.data.room_name)
          const tokenRes = await api.post(
            `/rooms/${roomInfo.data.meeting_id}/token?participant_name=${encodeURIComponent(user.name)}`
          )
          setToken(tokenRes.data.token)
        })
        .catch(e => setError(e.response?.data?.detail || 'Could not join room'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => nav('/')} className="btn-primary">Go Home</button>
      </div>
    </div>
  )

  if (!token) return null

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">MeetAI</span>
          <span className="text-gray-500 text-xs font-mono">·  {code}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQA(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showQA ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Q&A
          </button>
          <button
            onClick={() => nav('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" /> Leave
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Video area */}
        <div className={`flex-1 transition-all ${showQA ? 'mr-80' : ''}`}>
          <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={LIVEKIT_URL}
            data-lk-theme="default"
            style={{ height: '100%' }}
            onDisconnected={() => nav('/')}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>

        {/* Q&A Panel */}
        {showQA && (
          <div className="w-80 fixed right-0 top-14 bottom-0 bg-gray-900 border-l border-gray-800 flex flex-col">
            <QAPanel meetingId={meetingId} participantName={participantName} />
          </div>
        )}
      </div>
    </div>
  )
}
