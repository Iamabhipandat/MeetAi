import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { meetingsApi, roomsApi } from '../lib/api'
import type { Meeting } from '../lib/types'
import {
  Video,
  Plus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Filter,
  MessageSquare,
  Clock,
  Copy,
  Check,
  Play
} from 'lucide-react'

export default function DashboardPage() {
  const nav = useNavigate()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const loadMeetings = () => {
    meetingsApi
      .list()
      .then(r => setMeetings(r.data))
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMeetings()
  }, [])

  const handleStartInstantMeeting = async () => {
    setCreating(true)
    const title = newTitle.trim() || `AI Meeting — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    try {
      const meetingRes = await meetingsApi.create(title)
      const meetingId = meetingRes.data.id
      await meetingsApi.start(meetingId)
      const roomRes = await roomsApi.create(meetingId)
      const joinCode = roomRes.data.join_code

      nav(`/room/${joinCode}`, {
        state: {
          meetingId,
          roomName: title,
          participantName: 'Host',
        },
      })
    } catch {
      // Fallback: direct instant Google Meet style code (e.g. zbp-pnjs-tsv)
      const p1 = Math.random().toString(36).substring(2, 5)
      const p2 = Math.random().toString(36).substring(2, 6)
      const p3 = Math.random().toString(36).substring(2, 5)
      const instantCode = `${p1}-${p2}-${p3}`
      nav(`/room/${instantCode}`, {
        state: {
          meetingId: 1,
          roomName: title,
          participantName: 'Host',
        },
      })
    } finally {
      setCreating(false)
    }
  }

  const copyLink = (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    e.stopPropagation()
    roomsApi.create(id).then(r => {
      navigator.clipboard.writeText(`${window.location.origin}/join/${r.data.join_code}`)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {
      navigator.clipboard.writeText(`${window.location.origin}/join/room-${id}`)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-10">
      {/* ── HERO SECTION ───────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center pt-4 md:pt-8 max-w-[800px] mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Gemini-Powered Real-Time Duplicate Question Filtering</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          Supercharge your video meetings with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
            Live AI
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-[620px] mt-4 leading-relaxed font-normal">
          Crystal clear WebRTC video calls with automatic speech transcription, instant duplicate Q&A detection, and one-click meeting summaries.
        </p>

        {/* Instant Meeting Action Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-[500px]">
          <input
            type="text"
            placeholder="Name your meeting (optional)..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
          />
          <button
            onClick={handleStartInstantMeeting}
            disabled={creating}
            className="btn-gradient py-3 px-6 rounded-2xl w-full sm:w-auto shrink-0 text-sm font-bold justify-center"
          >
            <Video className="w-4 h-4" />
            <span>{creating ? 'Starting…' : 'Start Instant Call'}</span>
          </button>
        </div>
      </section>

      {/* ── 3 PILLARS BENTO CARDS ──────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 grid place-items-center mb-4 text-cyan-400">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">Duplicate Q&A Filter</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never answer the same question twice. AI calculates semantic cosine similarity and badges repeated questions automatically.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ✦ Unique
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ≈ Duplicate 91%
            </span>
          </div>
        </div>

        <div className="glass-card-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center mb-4 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">No Login Barrier</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Just share a short link or meeting code. Any guest can jump straight into the room with zero account creation required.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-indigo-400 font-semibold flex items-center gap-1">
            <span>Instant guest access enabled</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="glass-card-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 grid place-items-center mb-4 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">Executive Summaries</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              One-click structured meeting notes, decisions made, action items, and unanswered questions ready to export.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-purple-300 font-semibold flex items-center gap-1">
            <span>Powered by Google Gemini</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>

      {/* ── ACTIVE / SCHEDULED SESSIONS ─────────────────────────────────── */}
      <section className="glass-panel p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Active & Recent Sessions</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {meetings.length} recorded session{meetings.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading sessions...</div>
        ) : meetings.length === 0 ? (
          <div className="p-8 border border-white/5 rounded-2xl text-center bg-white/[0.02]">
            <p className="text-sm font-semibold text-white mb-1">No past sessions yet</p>
            <p className="text-xs text-slate-400 mb-4">
              Click "Start Instant Call" above to launch your first AI conference room.
            </p>
            <button
              onClick={handleStartInstantMeeting}
              className="btn-gradient py-2 px-4 text-xs font-bold mx-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch Room</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {meetings.map(m => {
              const isLive = m.status === 'ACTIVE'
              return (
                <div
                  key={m.id}
                  onClick={() => nav(`/meetings/${m.id}`)}
                  className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{m.title}</h4>
                      {isLive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                          Live
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      ID #{m.id} · {m.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => copyLink(e, m.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy join link"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        roomsApi.create(m.id).then(r => nav(`/room/${r.data.join_code}`))
                      }}
                      className="btn-gradient text-xs py-1.5 px-3"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Join</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
