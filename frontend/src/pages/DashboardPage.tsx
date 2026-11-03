import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { meetingsApi, roomsApi } from '../lib/api'
import type { Meeting } from '../lib/types'
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Clock,
  Sparkles,
  Calendar as CalendarIcon,
  Bell,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutContext {
  openCreateMeeting: () => void
}

export default function DashboardPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { openCreateMeeting } = useOutletContext<LayoutContext>()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDayOffset, setSelectedDayOffset] = useState(0) // 0 = Tuesday 3 Nov (Today)
  const [showNotificationCard, setShowNotificationCard] = useState(true)

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

  const handleStartOrJoinVideo = async (meeting: Meeting) => {
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
    }
  }

  // Days of week strip from screenshot: Mon 2, Tue 3, Wed 4, Thu 5, Fri 6, Sat 7, Sun 8
  const daysOfWeek = [
    { label: 'MON', date: 2, offset: -1 },
    { label: 'TUE', date: 3, offset: 0, isToday: true },
    { label: 'WED', date: 4, offset: 1 },
    { label: 'THU', date: 5, offset: 2 },
    { label: 'FRI', date: 6, offset: 3 },
    { label: 'SAT', date: 7, offset: 4 },
    { label: 'SUN', date: 8, offset: 5 },
  ]

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {/* ── DATE STRIP (Exact Header: "Tue 3 Nov [calendar]" + Days Bar) ─── */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-normal text-[var(--text-primary)] flex items-center gap-2">
            <span>Tue 3 Nov</span>
            <CalendarIcon className="w-5 h-5 text-[var(--text-muted)] stroke-[1.5]" />
          </h2>
        </div>

        {/* Days of week selector matching screenshot */}
        <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {daysOfWeek.map(d => {
              const isSelected = selectedDayOffset === d.offset
              return (
                <button
                  key={d.label}
                  onClick={() => setSelectedDayOffset(d.offset)}
                  className={`flex flex-col items-center justify-center w-9 h-11 rounded-full transition-colors ${
                    isSelected
                      ? 'bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#C2E7FF] font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    {d.label}
                  </span>
                  <span className="text-xs">{d.date}</span>
                </button>
              )
            })}
          </div>

          <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── SECURITY / TRUST BANNER ("Your meeting is safe") ────────────── */}
      <div className="p-4 rounded-2xl bg-[#EDF3FD] dark:bg-[#1E2738] flex items-center justify-between text-xs text-[#0B57D0] dark:text-[#A8C7FA]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#0B57D0] text-white grid place-items-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)]">Your meeting is safe</h4>
            <p className="text-[var(--text-secondary)]">
              No one can join a meeting unless invited or admitted by the host. Gemini AI actively filters duplicate questions.
            </p>
          </div>
        </div>

        <button className="px-3 py-1.5 rounded-full border border-[#0B57D0]/30 hover:bg-[#0B57D0]/10 font-medium">
          Learn more
        </button>
      </div>

      {/* ── MEETINGS CONTENT / EMPTY STATE ──────────────────────────────── */}
      <div className="py-8 flex flex-col items-center justify-center min-h-[380px]">
        {loading ? (
          <div className="w-7 h-7 border-2 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
        ) : meetings.length === 0 ? (
          /* Exact Illustration Empty State from Screenshot */
          <div className="flex flex-col items-center text-center max-w-md">
            {/* SVG Minimal Illustration (Mug + Pencil + Tablet) */}
            <div className="w-56 h-36 mb-4 flex items-center justify-center relative">
              <svg viewBox="0 0 200 120" className="w-full h-full stroke-[#444746] dark:stroke-[#E3E3E3] fill-none" strokeWidth="1.5">
                {/* Yellow glowing circle */}
                <circle cx="130" cy="25" r="10" fill="#FEE75C" stroke="#FEE75C" />
                {/* Coffee mug with gradient yellow */}
                <path d="M70,85 C70,105 100,105 100,85 L100,60 L70,60 Z" fill="#FFE27A" strokeWidth="1.5" />
                <path d="M100,66 C108,66 108,80 100,80" strokeWidth="1.5" />
                {/* Steam curves */}
                <path d="M80,55 C70,45 90,35 80,25" strokeLinecap="round" />
                {/* Pink shape */}
                <path d="M40,70 C40,90 65,90 65,70 Z" fill="#F8B4D9" />
                {/* Pencil leaning */}
                <line x1="105" y1="50" x2="115" y2="90" strokeWidth="2" stroke="#444746" />
                {/* Tablet / Screen with video icon */}
                <polygon points="120,55 170,55 155,100 105,100" strokeWidth="1.5" fill="none" />
                <rect x="125" y="70" width="16" height="12" rx="2" />
                <polygon points="141,74 148,70 148,82 141,78" fill="currentColor" />
              </svg>
            </div>

            <h3 className="text-2xl font-normal text-[var(--text-primary)] mb-2">
              No meetings scheduled for today
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Schedule a meeting or enjoy the free time
            </p>

            <button
              onClick={openCreateMeeting}
              className="btn-pill-primary px-6 py-2.5 text-sm shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
        ) : (
          /* List of Scheduled/Active Meetings in Clean Cards */
          <div className="w-full flex flex-col gap-3">
            {meetings.map(m => {
              const isLive = m.status === 'ACTIVE'
              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-page)] hover:shadow-sm transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl grid place-items-center ${
                        isLive ? 'bg-rose-100 text-rose-600' : 'bg-[#D3E3FD] text-[#0B57D0]'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base text-[var(--text-primary)] flex items-center gap-2">
                        {m.title}
                        {isLive && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live Now
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Today, 1:00 PM · Host: {user?.name || 'You'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => nav(`/meetings/${m.id}`)}
                      className="px-4 py-2 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:bg-black/5"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleStartOrJoinVideo(m)}
                      className="btn-pill-primary px-5 py-2 text-xs"
                    >
                      <span>Join call</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── NOTIFICATION PROMPT FLYOUT (Exact bottom-right card from Screenshot) ── */}
      {showNotificationCard && (
        <div className="fixed bottom-6 right-6 w-[340px] p-5 rounded-2xl bg-[#D3E3FD] dark:bg-[#003354] text-[#001D35] dark:text-[#C2E7FF] shadow-xl border border-[#0B57D0]/20 flex flex-col gap-3 z-30 animate-fade-in">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-[#0B57D0] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-xs text-[#041E49] dark:text-white leading-snug">
                Receive desktop notifications from Meet
              </h5>
              <p className="text-[11px] text-[#001D35]/80 dark:text-[#C2E7FF]/80 mt-1 leading-relaxed">
                Allowing notifications lets Meet alert you about incoming calls and updates that occur while you're in another tab
              </p>
            </div>
            <button
              onClick={() => setShowNotificationCard(false)}
              className="text-[#001D35]/60 hover:text-[#001D35]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowNotificationCard(false)}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-[#0B57D0] hover:bg-black/5"
            >
              Not now
            </button>
            <button
              onClick={() => {
                alert('Notifications allowed!')
                setShowNotificationCard(false)
              }}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#0B57D0] text-white hover:bg-[#0842A0] shadow-xs"
            >
              Allow notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
