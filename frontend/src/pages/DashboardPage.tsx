import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { meetingsApi, roomsApi, summaryApi } from '../lib/api'
import type { Meeting, MeetingSummary } from '../lib/types'
import {
  Plus,
  Video,
  FileText,
  Copy,
  Check,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Users,
  Search,
  Hash
} from 'lucide-react'
import SummaryModal from '../components/SummaryModal'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../lib/utils'
import clsx from 'clsx'

interface LayoutContext {
  openCreateMeeting: () => void
}

type TabFilter = 'all' | 'ACTIVE' | 'SCHEDULED' | 'ENDED'

export default function DashboardPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { openCreateMeeting } = useOutletContext<LayoutContext>()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>('all')
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [joinCodeError, setJoinCodeError] = useState('')
  const [summary, setSummary] = useState<MeetingSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [startingVideoId, setStartingVideoId] = useState<number | null>(null)

  const loadMeetings = () => {
    setLoading(true)
    meetingsApi
      .list()
      .then(r => setMeetings(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMeetings()

    const handleCreated = () => loadMeetings()
    window.addEventListener('meetai:meeting-created', handleCreated)
    return () => window.removeEventListener('meetai:meeting-created', handleCreated)
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleStartOrJoinVideo = async (e: React.MouseEvent, meeting: Meeting) => {
    e.preventDefault()
    e.stopPropagation()
    setStartingVideoId(meeting.id)

    try {
      if (meeting.status === 'SCHEDULED') {
        await meetingsApi.start(meeting.id)
      }
      const roomRes = await roomsApi.create(meeting.id)
      const joinCode = roomRes.data.join_code

      const tokenRes = await roomsApi.getToken(meeting.id, user?.name || 'Host')
      nav(`/room/${joinCode}`, {
        state: {
          token: tokenRes.data.token,
          roomName: tokenRes.data.room_name,
          meetingId: meeting.id,
          participantName: user?.name || 'Host',
        },
      })
    } catch (err: any) {
      console.error(err)
    } finally {
      setStartingVideoId(null)
    }
  }

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinCodeError('')
    const clean = joinCodeInput.trim()
    if (!clean) return

    try {
      const res = await roomsApi.getByCode(clean)
      nav(`/join/${clean}`)
    } catch (err: any) {
      setJoinCodeError('Invalid or expired meeting code')
    }
  }

  const handleSummarize = async (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    e.stopPropagation()
    setSummaryLoading(id)
    try {
      const r = await summaryApi.get(id)
      setSummary(r.data)
    } finally {
      setSummaryLoading(null)
    }
  }

  const copyMeetingLink = (e: React.MouseEvent, m: Meeting) => {
    e.preventDefault()
    e.stopPropagation()
    roomsApi.create(m.id).then(r => {
      const code = r.data.join_code
      navigator.clipboard.writeText(`${window.location.origin}/join/${code}`)
      setCopiedId(m.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  // Filtered lists
  const activeMeetings = meetings.filter(m => m.status === 'ACTIVE')
  const scheduledMeetings = meetings.filter(m => m.status === 'SCHEDULED')
  const endedMeetings = meetings.filter(m => m.status === 'ENDED')

  const displayedMeetings = meetings.filter(m => {
    if (tab === 'all') return true
    return m.status === tab
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar matching mockup */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-app-text">
            {greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-app-mut text-sm mt-1">
            {activeMeetings.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {activeMeetings.length} live meeting{activeMeetings.length > 1 ? 's' : ''} in progress
              </span>
            ) : (
              <span>You have {scheduledMeetings.length} upcoming meetings scheduled.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateMeeting}
            className="btn btn-ghost"
          >
            <Calendar className="w-4 h-4 text-app-mut" />
            <span>Schedule</span>
          </button>
          <button
            onClick={openCreateMeeting}
            className="btn shadow-lg shadow-blue-600/25"
          >
            <Video className="w-4 h-4" />
            <span>New Meeting</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex p-1 bg-app-card border border-app-line rounded-2xl gap-1">
          <button
            onClick={() => setTab('all')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all',
              tab === 'all'
                ? 'bg-app-card2 text-app-text shadow-sm'
                : 'text-app-mut hover:text-app-text'
            )}
          >
            All ({meetings.length})
          </button>
          <button
            onClick={() => setTab('ACTIVE')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-1.5',
              tab === 'ACTIVE'
                ? 'bg-app-card2 text-app-text shadow-sm'
                : 'text-app-mut hover:text-app-text'
            )}
          >
            {activeMeetings.length > 0 && <span className="w-2 h-2 rounded-full bg-[var(--green)]" />}
            Ongoing ({activeMeetings.length})
          </button>
          <button
            onClick={() => setTab('SCHEDULED')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all',
              tab === 'SCHEDULED'
                ? 'bg-app-card2 text-app-text shadow-sm'
                : 'text-app-mut hover:text-app-text'
            )}
          >
            Upcoming ({scheduledMeetings.length})
          </button>
          <button
            onClick={() => setTab('ENDED')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all',
              tab === 'ENDED'
                ? 'bg-app-card2 text-app-text shadow-sm'
                : 'text-app-mut hover:text-app-text'
            )}
          >
            Past ({endedMeetings.length})
          </button>
        </div>

        <div className="text-xs text-app-mut">
          Showing <span className="font-semibold text-app-text">{displayedMeetings.length}</span> meetings
        </div>
      </div>

      {/* Main content grid: Meetings list + Side Column (Join by code + Schedule) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left Column: Meetings Cards List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card h-48 animate-pulse bg-app-card/60" />
              ))}
            </div>
          ) : displayedMeetings.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center justify-center border-dashed">
              <div className="w-14 h-14 rounded-2xl bg-app-card2 grid place-items-center mb-4 text-app-mut">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-lg text-app-text mb-1">No meetings found</h3>
              <p className="text-app-mut text-sm max-w-sm mb-6">
                {tab === 'all'
                  ? 'Get started by creating your first AI-assisted video meeting room.'
                  : `No meetings in '${tab.toLowerCase()}' status.`}
              </p>
              <button onClick={openCreateMeeting} className="btn">
                <Plus className="w-4 h-4" /> Create meeting
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedMeetings.map(m => {
                const isLive = m.status === 'ACTIVE'
                const isEnded = m.status === 'ENDED'

                return (
                  <div
                    key={m.id}
                    onClick={() => nav(`/meetings/${m.id}`)}
                    className={clsx(
                      'card-interactive p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden group',
                      isLive &&
                        'bg-gradient-to-br from-[#1E2750] via-app-card to-app-card border-[var(--blue)] shadow-md shadow-blue-900/20'
                    )}
                  >
                    {/* Top status & time */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-app-mut">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(m.created_at)}
                        </span>
                        {isLive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-[var(--red)] border border-rose-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] animate-pulse" />
                            Live
                          </span>
                        ) : isEnded ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/10 text-app-mut border border-app-line">
                            Concluded
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Scheduled
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-app-text group-hover:text-[var(--blue)] transition-colors line-clamp-1 mb-1.5">
                        {m.title}
                      </h3>
                      {m.description && (
                        <p className="text-xs text-app-mut line-clamp-2 mb-4 leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom avatars & action buttons */}
                    <div className="pt-4 border-t border-app-line flex items-center justify-between gap-3 mt-4">
                      {/* Avatar stack matching mockup */}
                      <div className="flex -space-x-2 overflow-hidden items-center">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-[#0E111B] text-[10px] font-bold grid place-items-center border-2 border-app-card">
                          RS
                        </div>
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-[#0E111B] text-[10px] font-bold grid place-items-center border-2 border-app-card">
                          KM
                        </div>
                        <div className="w-7 h-7 rounded-full bg-sky-400 text-[#0E111B] text-[10px] font-bold grid place-items-center border-2 border-app-card">
                          DP
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={e => copyMeetingLink(e, m)}
                          title="Copy guest link"
                          className="p-2 rounded-xl bg-app-card2 text-app-mut hover:text-app-text border border-app-line transition-colors"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isEnded ? (
                          <button
                            onClick={e => handleSummarize(e, m.id)}
                            disabled={summaryLoading === m.id}
                            className="btn btn-ghost py-1.5 px-3 text-xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-app-blue" />
                            <span>{summaryLoading === m.id ? 'Loading…' : 'AI Summary'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={e => handleStartOrJoinVideo(e, m)}
                            disabled={startingVideoId === m.id}
                            className={clsx(
                              'btn py-1.5 px-3.5 text-xs font-semibold',
                              isLive ? 'bg-[var(--blue)]' : 'bg-app-card2 border border-app-line hover:border-app-blue'
                            )}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{startingVideoId === m.id ? 'Connecting…' : isLive ? 'Join now' : 'Start'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick Join & Today's Schedule */}
        <div className="flex flex-col gap-5">
          {/* Join with a code card */}
          <div className="card p-5 flex flex-col gap-3">
            <h4 className="font-bold text-base text-app-text flex items-center gap-2">
              <Hash className="w-4 h-4 text-[var(--blue)]" />
              Join with a code
            </h4>
            <p className="text-xs text-app-mut">
              Enter the room code shared by the host to jump directly into the video conference.
            </p>
            <form onSubmit={handleJoinByCode} className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="e.g. abc-defg-hij"
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value)}
                className="input font-mono text-sm py-2"
              />
              <button type="submit" className="btn px-4 shrink-0">
                Join
              </button>
            </form>
            {joinCodeError && (
              <span className="text-xs text-[var(--red)]">{joinCodeError}</span>
            )}
          </div>

          {/* Quick Schedule widget */}
          <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-app-text">Today's Agenda</h4>
              <span className="text-xs bg-app-card2 px-2 py-0.5 rounded-full text-app-mut">
                {scheduledMeetings.length + activeMeetings.length} sessions
              </span>
            </div>

            <div className="flex flex-col divide-y divide-app-line mt-1">
              <div className="flex items-center gap-3 py-3">
                <span className="text-xs font-mono font-bold text-app-blue w-14 shrink-0">10:00 AM</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-app-text truncate">Sprint Review & Demo</p>
                  <p className="text-[11px] text-app-mut">Host: You</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <span className="text-xs font-mono font-semibold text-app-mut w-14 shrink-0">12:30 PM</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-app-text truncate">Design System Sync</p>
                  <p className="text-[11px] text-app-mut">With UI/UX Team</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <span className="text-xs font-mono font-semibold text-app-mut w-14 shrink-0">03:00 PM</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-app-text truncate">Client Q&A Live Call</p>
                  <p className="text-[11px] text-app-mut">AI Duplicate filter enabled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {summary && (
        <SummaryModal
          summary={summary}
          onClose={() => setSummary(null)}
          onRegenerate={async () => {
            const r = await summaryApi.get(summary.meeting_id, true)
            setSummary(r.data)
          }}
        />
      )}
    </div>
  )
}
