import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Zap, Video, Users } from 'lucide-react'
import api from '../lib/api'

export default function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const join = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      // Get token for guest
      const r = await api.post(`/rooms/join/${code}/token?participant_name=${encodeURIComponent(name.trim())}`)
      // Navigate to room with token
      nav(`/room/${code}`, { state: { token: r.data.token, roomName: r.data.room_name, participantName: name.trim(), meetingId: r.data.meeting_id } })
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Invalid join code. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'rgb(var(--bg))' }}>
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold tracking-tight text-lg">MeetAI</span>
      </div>

      <div className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Video className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Join Meeting</h1>
            <p className="muted text-xs">Code: <span className="font-mono font-bold">{code}</span></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <form onSubmit={join} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Your name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="input"
              placeholder="How should we call you?"
            />
          </div>
          <button type="submit" disabled={loading || !name.trim()} className="btn-primary w-full justify-center py-2.5">
            <Video className="w-4 h-4" />
            {loading ? 'Joining…' : 'Join Meeting'}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-2 text-xs muted">
          <Users className="w-3.5 h-3.5" />
          No account needed to join as a guest
        </div>
      </div>
    </div>
  )
}
