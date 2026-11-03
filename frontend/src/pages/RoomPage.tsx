import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import QAPanel from '../components/QAPanel'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  MessageSquare,
  Share2,
  Hand,
  Volume2,
  VolumeX,
  Radio,
  Copy,
  Check,
  Sparkles,
  Smile
} from 'lucide-react'
import clsx from 'clsx'

interface ParticipantInfo {
  name: string
  color: string
  gradient: string
  isSpeaking?: boolean
}

const PARTICIPANTS_MOCK: ParticipantInfo[] = [
  { name: 'Riya Sharma', color: '#3DDC97', gradient: 'linear-gradient(135deg,#1E4A6B,#2B7A78)' },
  { name: 'Karan Mehta', color: '#FFB86B', gradient: 'linear-gradient(135deg,#5B3A2E,#8A5A3C)' },
  { name: 'Ananya Rao', color: '#FF8FB1', gradient: 'linear-gradient(135deg,#5A2B48,#8A3F66)' },
  { name: 'Dev Patel', color: '#8FD3FF', gradient: 'linear-gradient(135deg,#1F3A66,#3A5FA0)' },
]

export default function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const location = useLocation()
  const nav = useNavigate()
  const { user } = useAuth()

  const [token, setToken] = useState<string>(location.state?.token || '')
  const [roomName, setRoomName] = useState<string>(location.state?.roomName || 'Sprint Review')
  const [meetingId, setMeetingId] = useState<number>(location.state?.meetingId || 0)
  const [participantName] = useState<string>(
    location.state?.participantName || user?.name || 'Guest Participant'
  )
  const [loading, setLoading] = useState(!token)
  const [error, setError] = useState('')

  // Control toggles
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [volumeOn, setVolumeOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [recording, setRecording] = useState(false)
  const [activeTab, setActiveTab] = useState<'qa' | 'chat'>('qa')
  const [showRightPanel, setShowRightPanel] = useState(true)

  // Featured speaker focus
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; left: number }[]>([])

  // Live Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  // In-room chat messages
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: string; time: string; text: string; isMe: boolean; color?: string }[]
  >([
    { id: '1', sender: 'Karan Mehta', time: '10:02', text: 'Can everyone see the architecture diagram?', isMe: false, color: '#FFB86B' },
    { id: '2', sender: 'Ananya Rao', time: '10:03', text: 'Loading fine on my screen 👍', isMe: false, color: '#FF8FB1' },
    { id: '3', sender: 'You', time: '10:03', text: 'Crystal clear, ready when you are.', isMe: true },
  ])
  const [chatInput, setChatInput] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const toastTimeoutRef = useRef<number | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(''), 2200)
  }

  // Load meeting data
  useEffect(() => {
    if (!token && code) {
      api
        .get(`/rooms/join/${code}`)
        .then(async roomInfo => {
          setMeetingId(roomInfo.data.meeting_id)
          setRoomName(roomInfo.data.room_name || `Room ${code}`)
          const userName = user?.name || 'Participant'
          const tokenRes = await api.post(
            `/rooms/${roomInfo.data.meeting_id}/token?participant_name=${encodeURIComponent(userName)}`
          )
          setToken(tokenRes.data.token)
        })
        .catch(e => setError(e.response?.data?.detail || 'Could not connect to room'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [code, token, user])

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setSecondsElapsed(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTimer = (total: number) => {
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getInitials = (n: string) =>
    n
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setChatMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'You',
        time: now,
        text: chatInput.trim(),
        isMe: true,
      },
    ])
    setChatInput('')
  }

  const triggerReaction = (char: string) => {
    const newEmoji = {
      id: Date.now() + Math.random(),
      char,
      left: 20 + Math.random() * 50,
    }
    setFloatingEmojis(prev => [...prev, newEmoji])
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id))
    }, 1800)
  }

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href)
    showToast('Meeting link copied to clipboard!')
  }

  if (loading)
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-app-bg text-app-text">
        <div className="w-10 h-10 border-3 border-[var(--blue)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-app-mut font-medium">Entering meeting studio...</p>
      </div>
    )

  if (error)
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-app-bg text-app-text p-6">
        <div className="card p-8 max-w-md text-center">
          <p className="text-[var(--red)] font-semibold mb-4">{error}</p>
          <button onClick={() => nav('/')} className="btn w-full justify-center">
            Back to Dashboard
          </button>
        </div>
      </div>
    )

  const activeSpeaker = PARTICIPANTS_MOCK[featuredIndex]

  return (
    <div className="h-screen w-screen bg-app-bg text-app-text flex flex-col overflow-hidden select-none font-['Outfit',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-[#0E111B] px-4 py-2 rounded-xl text-xs font-bold shadow-2xl z-50 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Floating Emojis Animation */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            style={{ left: `${item.left}%` }}
            className="absolute bottom-24 text-3xl animate-[bounce_1.5s_ease-out_forwards] opacity-90"
          >
            {item.char}
          </div>
        ))}
      </div>

      {/* ── TOP ROOM HEADER ────────────────────────────────────────────── */}
      <header className="h-[60px] shrink-0 border-b border-app-line bg-app-side px-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-app-text flex items-center gap-2">
            <span>{roomName}</span>
          </h1>

          <div className="inline-flex items-center gap-2 bg-app-card px-3 py-1 rounded-full border border-app-line text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--red)] animate-pulse" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 bg-app-card px-3 py-1 rounded-full border border-app-line text-xs text-app-mut">
            <span className="w-5 h-5 rounded-full bg-emerald-400 text-[#0E111B] font-bold text-[9px] grid place-items-center">
              RS
            </span>
            <span>Host: Riya Sharma</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Avatar stack */}
          <div className="hidden md:flex -space-x-2 items-center">
            <div className="w-7 h-7 rounded-full bg-emerald-400 text-[#0E111B] text-[10px] font-bold grid place-items-center border-2 border-app-side">
              RS
            </div>
            <div className="w-7 h-7 rounded-full bg-amber-400 text-[#0E111B] text-[10px] font-bold grid place-items-center border-2 border-app-side">
              KM
            </div>
            <div className="w-7 h-7 rounded-full bg-pink-400 text-[#0E111B] text-[10px] font-bold grid place-items-center border-2 border-app-side">
              AR
            </div>
            <div className="w-7 h-7 rounded-full bg-app-card2 text-app-text text-[10px] font-semibold grid place-items-center border-2 border-app-side">
              +24
            </div>
          </div>

          <button onClick={copyRoomLink} className="btn btn-ghost py-1.5 px-3 text-xs">
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share Code</span>
          </button>

          <button
            onClick={() => setShowRightPanel(p => !p)}
            className={clsx(
              'btn py-1.5 px-3 text-xs',
              showRightPanel ? 'bg-[var(--blue)]' : 'btn-ghost'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Q&A & Chat</span>
          </button>
        </div>
      </header>

      {/* ── MAIN STAGE + RIGHT SIDEBAR ─────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden p-3 gap-3">
        {/* Left: Video Conference Stage */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
          {/* Featured Active Speaker Window */}
          <div
            className="flex-1 relative rounded-2xl border-2 border-[var(--blue)] overflow-hidden grid place-items-center shadow-inner transition-all duration-300"
            style={{ background: activeSpeaker.gradient }}
          >
            {/* Speaker Name Tag */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0E111B]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{activeSpeaker.name}</span>
            </div>

            {/* Mic Indicator */}
            <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[var(--blue)] grid place-items-center shadow-lg">
              <Mic className="w-4 h-4 text-white" />
            </div>

            {/* Central Avatar Visualizer */}
            <div className="relative flex items-center justify-center">
              <div
                className="w-32 h-32 md:w-36 md:h-36 rounded-full grid place-items-center text-4xl md:text-5xl font-bold text-[#0E111B] shadow-2xl transition-transform duration-200"
                style={{
                  backgroundColor: activeSpeaker.color,
                  boxShadow: '0 0 0 16px rgba(255,255,255,0.06), 0 0 0 34px rgba(255,255,255,0.03)',
                }}
              >
                {getInitials(activeSpeaker.name)}
              </div>
            </div>

            {/* Live Captioning overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[85%] bg-[#0E111B]/80 backdrop-blur-md px-4 py-2 rounded-xl text-center text-xs md:text-sm text-white/90 border border-white/10 shadow-lg">
              <span className="text-[var(--green)] font-semibold mr-1.5">✦ Live AI Caption:</span>
              "Let's walk through what shipped this sprint, then open it up for live AI duplicate-filtered questions."
            </div>
          </div>

          {/* Bottom Participants Strip */}
          <div className="h-[120px] shrink-0 grid grid-cols-4 md:grid-cols-5 gap-2.5">
            {PARTICIPANTS_MOCK.map((p, idx) => (
              <div
                key={p.name}
                onClick={() => setFeaturedIndex(idx)}
                className={clsx(
                  'relative rounded-xl border-2 cursor-pointer overflow-hidden grid place-items-center transition-all group',
                  idx === featuredIndex
                    ? 'border-[var(--green)] shadow-md shadow-emerald-500/20'
                    : 'border-transparent hover:border-app-line'
                )}
                style={{ background: p.gradient }}
              >
                <div
                  className="w-12 h-12 rounded-full grid place-items-center text-sm font-bold text-[#0E111B]"
                  style={{ backgroundColor: p.color }}
                >
                  {getInitials(p.name)}
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-[#0E111B]/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-medium truncate text-center">
                  {p.name.split(' ')[0]}
                </div>
              </div>
            ))}

            {/* Self Video View */}
            <div className="relative rounded-xl border-2 border-transparent bg-gradient-to-br from-[#2A2F6B] to-[#4B4FB0] grid place-items-center overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-[#7C8CFF] text-[#0E111B] text-sm font-bold grid place-items-center">
                YOU
              </div>
              <div className="absolute bottom-2 left-2 right-2 bg-[#0E111B]/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-medium text-center">
                You {micOn ? '' : '(Muted)'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Q&A + Live Chat Panel */}
        {showRightPanel && (
          <aside className="w-[340px] shrink-0 bg-app-card border border-app-line rounded-2xl flex flex-col overflow-hidden min-h-0">
            {/* Panel Tabs: AI Q&A vs Live Chat */}
            <div className="p-2 border-b border-app-line bg-app-card2/50 flex items-center gap-1">
              <button
                onClick={() => setActiveTab('qa')}
                className={clsx(
                  'flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'qa'
                    ? 'bg-app-blue text-white shadow-sm'
                    : 'text-app-mut hover:text-app-text'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Q&A Filter</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={clsx(
                  'flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'chat'
                    ? 'bg-app-blue text-white shadow-sm'
                    : 'text-app-mut hover:text-app-text'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat</span>
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {activeTab === 'qa' ? (
                // Full AI Q&A Panel with WebSocket duplicate detection
                <div className="flex-1 min-h-0 overflow-hidden">
                  <QAPanel meetingId={meetingId} participantName={participantName} />
                </div>
              ) : (
                // In-Room Live Chat
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scroll">
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={clsx('flex gap-2.5 text-xs', msg.isMe && 'flex-row-reverse')}
                      >
                        {!msg.isMe && (
                          <div
                            className="w-7 h-7 rounded-full text-[#0E111B] font-bold text-[10px] grid place-items-center shrink-0"
                            style={{ backgroundColor: msg.color || '#3DDC97' }}
                          >
                            {msg.sender[0]}
                          </div>
                        )}
                        <div className={clsx('max-w-[80%]', msg.isMe && 'text-right')}>
                          <div className="text-[10px] text-app-mut mb-1">
                            {msg.sender} · {msg.time}
                          </div>
                          <div
                            className={clsx(
                              'p-2.5 rounded-2xl text-xs leading-relaxed',
                              msg.isMe
                                ? 'bg-app-blue text-white rounded-br-none'
                                : 'bg-app-card2 text-app-text rounded-bl-none'
                            )}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Emoji Quick Bar */}
                  <div className="px-3 py-1.5 border-t border-app-line flex items-center justify-between">
                    {['👍', '👏', '🔥', '😂', '😮', '❤️', '🎉', '🙌'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => triggerReaction(emoji)}
                        className="text-base p-1 rounded-lg hover:bg-app-card2 transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChat} className="p-3 border-t border-app-line flex gap-2">
                    <input
                      type="text"
                      placeholder="Send message to everyone..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="input text-xs py-2"
                    />
                    <button type="submit" className="btn px-3 py-2 shrink-0">
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── BOTTOM CONTROL BAR (Huddle Style) ──────────────────────────── */}
      <footer className="h-[76px] shrink-0 border-t border-app-line bg-app-side px-6 flex items-center justify-center gap-3 md:gap-5">
        {/* Volume */}
        <button
          onClick={() => {
            setVolumeOn(v => !v)
            showToast(volumeOn ? 'Muted in-call audio' : 'In-call audio restored')
          }}
          className="flex flex-col items-center gap-1 text-[11px] text-app-mut group"
        >
          <div
            className={clsx(
              'w-11 h-11 rounded-full grid place-items-center transition-all',
              volumeOn ? 'bg-app-card2 text-app-text group-hover:bg-app-line' : 'bg-[var(--red)] text-white'
            )}
          >
            {volumeOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </div>
          <span>Volume</span>
        </button>

        {/* Record */}
        <button
          onClick={() => {
            setRecording(r => !r)
            showToast(recording ? 'Recording stopped and saved to backend' : 'Meeting recording started')
          }}
          className="flex flex-col items-center gap-1 text-[11px] text-app-mut group"
        >
          <div
            className={clsx(
              'w-11 h-11 rounded-full grid place-items-center transition-all',
              recording ? 'bg-[var(--red)] text-white animate-pulse' : 'bg-app-card2 text-app-text group-hover:bg-app-line'
            )}
          >
            <Radio className="w-5 h-5" />
          </div>
          <span>{recording ? 'Recording' : 'Record'}</span>
        </button>

        {/* Mic Toggle */}
        <button
          onClick={() => {
            setMicOn(m => !m)
            showToast(micOn ? 'Microphone muted' : 'Microphone unmuted')
          }}
          className="flex flex-col items-center gap-1 text-[11px] text-app-mut group"
        >
          <div
            className={clsx(
              'w-11 h-11 rounded-full grid place-items-center transition-all',
              micOn ? 'bg-app-blue text-white' : 'bg-[var(--red)] text-white'
            )}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </div>
          <span>{micOn ? 'Mic On' : 'Mic Off'}</span>
        </button>

        {/* Cam Toggle */}
        <button
          onClick={() => {
            setCamOn(c => !c)
            showToast(camOn ? 'Camera disabled' : 'Camera enabled')
          }}
          className="flex flex-col items-center gap-1 text-[11px] text-app-mut group"
        >
          <div
            className={clsx(
              'w-11 h-11 rounded-full grid place-items-center transition-all',
              camOn ? 'bg-app-blue text-white' : 'bg-[var(--red)] text-white'
            )}
          >
            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </div>
          <span>{camOn ? 'Cam On' : 'Cam Off'}</span>
        </button>

        {/* Share Screen */}
        <button
          onClick={() => {
            setScreenSharing(s => !s)
            showToast(screenSharing ? 'Screen sharing stopped' : 'Screen sharing active')
          }}
          className="flex flex-col items-center gap-1 text-[11px] text-app-mut group"
        >
          <div
            className={clsx(
              'w-11 h-11 rounded-full grid place-items-center transition-all',
              screenSharing ? 'bg-[var(--green)] text-[#0E111B]' : 'bg-app-card2 text-app-text group-hover:bg-app-line'
            )}
          >
            <Share2 className="w-5 h-5" />
          </div>
          <span>Share</span>
        </button>

        {/* Raise Hand */}
        <button
          onClick={() => {
            setHandRaised(h => !h)
            showToast(handRaised ? 'Hand lowered' : 'Hand raised to speak')
          }}
          className="flex flex-col items-center gap-1 text-[11px] text-app-mut group"
        >
          <div
            className={clsx(
              'w-11 h-11 rounded-full grid place-items-center transition-all',
              handRaised ? 'bg-amber-400 text-[#0E111B]' : 'bg-app-card2 text-app-text group-hover:bg-app-line'
            )}
          >
            <Hand className="w-5 h-5" />
          </div>
          <span>{handRaised ? 'Lower' : 'Hand'}</span>
        </button>

        {/* Leave Room Button */}
        <button
          onClick={() => nav('/')}
          className="flex flex-col items-center gap-1 text-[11px] text-[var(--red)] ml-2 group"
        >
          <div className="w-14 h-11 rounded-2xl bg-[var(--red)] text-white grid place-items-center transition-transform group-hover:scale-105 shadow-md shadow-red-500/20">
            <PhoneOff className="w-5 h-5" />
          </div>
          <span className="font-semibold">Leave</span>
        </button>
      </footer>
    </div>
  )
}
