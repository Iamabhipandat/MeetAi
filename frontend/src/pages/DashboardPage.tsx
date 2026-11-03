import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { meetingsApi, roomsApi } from '../lib/api'
import type { Meeting } from '../lib/types'
import {
  Video,
  Plus,
  Calendar,
  ScreenShare,
  FileText,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Sparkles,
  Send,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import clsx from 'clsx'

interface LayoutContext {
  openCreateMeeting: () => void
}

export default function DashboardPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { openCreateMeeting } = useOutletContext<LayoutContext>()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [startingVideoId, setStartingVideoId] = useState<number | null>(null)

  // AI Assistant Chat state (Right side of Zoom Workplace)
  const [aiChatInput, setAiChatInput] = useState('')
  const [aiChatMessages, setAiChatMessages] = useState<
    { id: string; sender: 'ai' | 'user'; text: string; thought?: string; time: string }[]
  >([
    {
      id: '1',
      sender: 'ai',
      thought: 'Checked user calendar and participant availability...',
      text: 'John and Daniel are unavailable at this time. Here are three alternative slots when all of you are available: 10-11 AM or 4-5 PM. Would you like to pick one?',
      time: '9:20 AM'
    },
    {
      id: '2',
      sender: 'user',
      text: 'Help me coordinate',
      time: '9:21 AM'
    },
    {
      id: '3',
      sender: 'ai',
      thought: 'Drafting email request to ask participants for preference...',
      text: "Sure, I'll send them an email to ask if they are available from 2 to 4 PM today. Would you like me to send this email now?",
      time: '9:22 AM'
    }
  ])

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

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

  const handleSendAiPrompt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiChatInput.trim()) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userPrompt = aiChatInput.trim()
    setAiChatMessages(prev => [
      ...prev,
      { id: String(Date.now()), sender: 'user', text: userPrompt, time: now }
    ])
    setAiChatInput('')

    // Simulate AI Copilot Response
    setTimeout(() => {
      setAiChatMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          thought: `Processing request: "${userPrompt}" with Gemini meeting intelligence...`,
          text: `I've analyzed your upcoming schedule. I can automatically filter duplicate questions and generate notes for your next meeting.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }, 800)
  }

  const formatHoursMins = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const formatDateString = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return (
    <div className="h-full flex overflow-hidden bg-[var(--window-bg)]">
      {/* ── LEFT / CENTER PANE: ZOOM HOME ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto custom-scroll border-r border-[var(--sidebar-border)]">
        {/* Upper Big Clock Section */}
        <div className="pt-8 pb-6 flex flex-col items-center justify-center shrink-0">
          <h2 className="text-4xl font-normal tracking-tight text-[var(--text-primary)]">
            {formatHoursMins(currentTime)}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            {formatDateString(currentTime)}
          </p>
        </div>

        {/* 4 Big Zoom Action Buttons (Exact Replica of Image 1) */}
        <div className="flex items-center justify-center gap-6 pb-8 px-4 shrink-0">
          {/* 1. New Meeting (Orange) */}
          <button
            onClick={openCreateMeeting}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-[62px] h-[62px] rounded-2xl bg-[var(--zoom-orange)] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
              <Video className="w-8 h-8 fill-current" />
            </div>
            <span className="text-xs font-medium text-[var(--text-primary)]">New meeting</span>
          </button>

          {/* 2. Join (Blue) */}
          <button
            onClick={() => {
              const code = prompt('Enter meeting code:')
              if (code) nav(`/join/${code.trim()}`)
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-[62px] h-[62px] rounded-2xl bg-[var(--zoom-blue)] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
              <Plus className="w-8 h-8 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-[var(--text-primary)]">Join</span>
          </button>

          {/* 3. Schedule (Blue) */}
          <button
            onClick={openCreateMeeting}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-[62px] h-[62px] rounded-2xl bg-[var(--zoom-blue)] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
              <Calendar className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-[var(--text-primary)]">Schedule</span>
          </button>

          {/* 4. Share Screen (Blue) */}
          <button
            onClick={() => alert('Screen share will be initiated inside meeting room.')}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-[62px] h-[62px] rounded-2xl bg-[var(--zoom-blue)] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
              <ScreenShare className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-[var(--text-primary)]">Share screen</span>
          </button>

          {/* 5. My Notes (Blue) */}
          <button
            onClick={() => nav('/notes')}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-[62px] h-[62px] rounded-2xl bg-[var(--zoom-blue)] hover:brightness-110 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
              <FileText className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-[var(--text-primary)]">My notes</span>
          </button>
        </div>

        {/* Meeting Cards List ("Today" section from Image 1) */}
        <div className="max-w-[560px] w-full mx-auto px-4 pb-8 flex-1">
          <div className="flex items-center justify-between py-2 text-xs font-semibold text-[var(--text-primary)]">
            <span className="flex items-center gap-1 cursor-pointer">
              Today <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            </span>
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <button onClick={loadMeetings} className="hover:text-[var(--text-primary)] p-1 rounded">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading meetings...</div>
            ) : meetings.length === 0 ? (
              <div className="p-8 border border-[var(--card-border)] rounded-xl text-center bg-[var(--card-bg)]">
                <p className="text-xs text-[var(--text-secondary)]">No meetings scheduled for today</p>
                <button
                  onClick={openCreateMeeting}
                  className="mt-3 text-xs text-[var(--zoom-blue)] font-semibold hover:underline"
                >
                  + Create a meeting
                </button>
              </div>
            ) : (
              meetings.map(m => {
                const isLive = m.status === 'ACTIVE'
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs flex flex-col gap-2 hover:border-[var(--zoom-blue)] transition-colors relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          {m.title}
                          {isLive && (
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                              Live Now
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Today, 1:00 - 2:00 PM · Host: {user?.name || 'You'} · 14 invitees
                        </p>
                      </div>

                      <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Participant Avatars & Join Button */}
                    <div className="flex items-center justify-between pt-2 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[8px] grid place-items-center border border-white">
                            RS
                          </div>
                          <div className="w-5 h-5 rounded-full bg-amber-400 text-white font-bold text-[8px] grid place-items-center border border-white">
                            KM
                          </div>
                        </div>
                        <span className="text-[11px] text-[var(--text-secondary)]">2 joined</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => nav(`/meetings/${m.id}`)}
                          className="px-3 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleStartOrJoinVideo(m)}
                          disabled={startingVideoId === m.id}
                          className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[var(--zoom-blue)] hover:bg-[var(--zoom-hover)] shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{startingVideoId === m.id ? 'Connecting…' : 'Join'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANE: ZOOM AI COMPANION (Exact Replica of Image 1 Right Side) ── */}
      <div className="w-[380px] shrink-0 h-full flex flex-col bg-[var(--sidebar-bg)] border-l border-[var(--sidebar-border)] select-none">
        {/* AI Top Bar */}
        <div className="h-[44px] px-4 border-b border-[var(--sidebar-border)] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--zoom-blue)]" />
            <span>AI Companion</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">MeetAI Intelligence</span>
        </div>

        {/* AI Conversation Scroll */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scroll text-xs">
          {aiChatMessages.map(msg => (
            <div key={msg.id} className="flex flex-col gap-1">
              {msg.sender === 'ai' ? (
                <div className="flex flex-col gap-1.5 bg-white dark:bg-[#1E222B] p-3.5 rounded-xl border border-[var(--sidebar-border)] shadow-xs">
                  {/* Thought process disclosure tag */}
                  {msg.thought && (
                    <div className="text-[10px] text-[var(--zoom-blue)] font-semibold flex items-center justify-between border-b border-[var(--sidebar-border)] pb-1.5 mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Thought process
                      </span>
                      <span className="text-[var(--text-muted)] hover:underline cursor-pointer">
                        Show details
                      </span>
                    </div>
                  )}

                  <p className="text-[var(--text-primary)] leading-relaxed text-xs">
                    {msg.text}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-[var(--text-muted)] text-[10px]">
                    <div className="flex items-center gap-2">
                      <button className="hover:text-[var(--text-primary)]"><ThumbsUp className="w-3 h-3" /></button>
                      <button className="hover:text-[var(--text-primary)]"><ThumbsDown className="w-3 h-3" /></button>
                    </div>
                    <span>{msg.time}</span>
                  </div>
                </div>
              ) : (
                <div className="self-end max-w-[85%] bg-[var(--zoom-blue)] text-white p-2.5 rounded-xl text-xs leading-relaxed">
                  {msg.text}
                  <div className="text-[9px] text-white/70 text-right mt-1">{msg.time}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Input Composer (Image 1 Bottom) */}
        <form onSubmit={handleSendAiPrompt} className="p-3 border-t border-[var(--sidebar-border)] bg-[var(--window-bg)]">
          <div className="relative">
            <input
              type="text"
              placeholder="Write a message or type '/' for more"
              value={aiChatInput}
              onChange={e => setAiChatInput(e.target.value)}
              className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg pl-3 pr-10 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--zoom-blue)]"
            />
            <button
              type="submit"
              disabled={!aiChatInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--zoom-blue)] disabled:text-[var(--text-muted)]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] text-center mt-2">
            AI can make mistakes. Review for accuracy.
          </p>
        </form>
      </div>
    </div>
  )
}
