import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { meetingsApi, roomsApi, summaryApi } from '../lib/api'
import type { Meeting, MeetingSummary } from '../lib/types'
import { Plus, MessageCircle, FileText, ArrowRight, Video, Copy, Check } from 'lucide-react'
import CreateMeetingModal from '../components/CreateMeetingModal'
import SummaryModal from '../components/SummaryModal'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../lib/utils'
import clsx from 'clsx'

const statusDot = {
  ACTIVE:     { cls: 'bg-green-500',  label: 'Active' },
  SCHEDULED:  { cls: 'bg-amber-400',  label: 'Scheduled' },
  ENDED:      { cls: 'bg-gray-400',   label: 'Ended' },
}
const borderAccent = {
  ACTIVE:    'border-l-green-500',
  SCHEDULED: 'border-l-amber-400',
  ENDED:     'border-l-gray-300 dark:border-l-gray-600',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [summary, setSummary] = useState<MeetingSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState<number | null>(null)
  const [joinLinks, setJoinLinks] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<number | null>(null)
  const [startingVideo, setStartingVideo] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    meetingsApi.list().then(r => setMeetings(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleSummarize = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation()
    setSummaryLoading(id)
    try { const r = await summaryApi.get(id); setSummary(r.data) }
    finally { setSummaryLoading(null) }
  }

  const handleStartVideo = async (e: React.MouseEvent, meeting: Meeting) => {
    e.preventDefault(); e.stopPropagation()
    setStartingVideo(meeting.id)
    try {
      // Start meeting if scheduled
      if (meeting.status === 'SCHEDULED') await meetingsApi.start(meeting.id)
      // Create room (idempotent)
      const r = await roomsApi.create(meeting.id)
      const joinCode = r.data.join_code
      setJoinLinks(prev => ({ ...prev, [meeting.id]: joinCode }))
      // Navigate to room as host
      const tokenRes = await roomsApi.getToken(meeting.id, user?.name || 'Host')
      nav(`/room/${joinCode}`, {
        state: {
          token: tokenRes.data.token,
          roomName: tokenRes.data.room_name,
          meetingId: meeting.id,
          participantName: user?.name || 'Host',
        }
      })
    } finally { setStartingVideo(null) }
  }

  const copyJoinLink = (e: React.MouseEvent, id: number, code: string) => {
    e.preventDefault(); e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const active = meetings.filter(m => m.status === 'ACTIVE').length

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="muted text-sm mt-1.5">
            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
            {active > 0 && <span className="ml-2 text-green-600 font-medium">· {active} live</span>}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : meetings.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="font-semibold text-lg mb-1">No meetings yet</p>
          <p className="muted text-sm mb-5">Create a meeting to get started with video + AI Q&A</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create Meeting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {meetings.map(m => {
            const dot = statusDot[m.status]
            const accent = borderAccent[m.status]
            const joinCode = joinLinks[m.id]
            return (
              <div
                key={m.id}
                onClick={() => nav(`/meetings/${m.id}`)}
                className={clsx('card border-l-[3px] p-5 cursor-pointer group hover:shadow-md transition-all', accent)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {m.title}
                  </h3>
                  <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium shrink-0 px-2 py-0.5 rounded-full', {
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': m.status === 'ACTIVE',
                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400': m.status === 'SCHEDULED',
                    'bg-gray-100 dark:bg-gray-800 text-gray-500': m.status === 'ENDED',
                  })}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full', dot.cls)} />
                    {dot.label}
                  </span>
                </div>
                <p className="muted text-xs mb-4">{formatDate(m.created_at)}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {m.status !== 'ENDED' && (
                    <button
                      onClick={e => handleStartVideo(e, m)}
                      disabled={startingVideo === m.id}
                      className="btn-primary py-1 px-3 text-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      {startingVideo === m.id ? 'Starting…' : 'Start Video'}
                    </button>
                  )}
                  {joinCode && (
                    <button
                      onClick={e => copyJoinLink(e, m.id, joinCode)}
                      className="btn-ghost py-1 px-2.5 text-xs"
                    >
                      {copied === m.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied === m.id ? 'Copied!' : 'Copy Link'}
                    </button>
                  )}
                  <button
                    onClick={e => handleSummarize(e, m.id)}
                    disabled={summaryLoading === m.id}
                    className="btn-ghost py-1 px-2.5 text-xs"
                  >
                    <FileText className="w-3 h-3" />
                    {summaryLoading === m.id ? 'Loading…' : 'Summary'}
                  </button>
                  <span className="muted text-xs flex items-center gap-0.5 ml-auto group-hover:text-indigo-600 transition-colors">
                    Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && <CreateMeetingModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {summary && <SummaryModal summary={summary} onClose={() => setSummary(null)} onRegenerate={async () => {
        const r = await summaryApi.get(summary.meeting_id, true); setSummary(r.data)
      }} />}
    </div>
  )
}
