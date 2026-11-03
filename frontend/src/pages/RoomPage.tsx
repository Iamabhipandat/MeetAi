import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import QAPanel from '../components/QAPanel'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  Copy,
  Check,
  Sparkles,
  UserPlus,
  ShieldCheck,
  X,
  Info,
  Users,
  MessageSquare,
  Hand,
  Smile,
  MoreVertical,
  Subtitles,
  Lock
} from 'lucide-react'
import clsx from 'clsx'

export default function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const location = useLocation()
  const nav = useNavigate()

  // Google Meet style formatted code (e.g. zbp-pnjs-tsv)
  const defaultCode = () => {
    const p1 = Math.random().toString(36).substring(2, 5)
    const p2 = Math.random().toString(36).substring(2, 6)
    const p3 = Math.random().toString(36).substring(2, 5)
    return `${p1}-${p2}-${p3}`
  }

  const meetingCode = code || defaultCode()
  const roomName = location.state?.roomName || 'AI Video Meeting'
  const myName = location.state?.participantName || localStorage.getItem('meet_user_name') || 'You'
  const myEmail = localStorage.getItem('meet_user_email') || 'guest@meetai.io'

  // Device & Permission states
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)
  const [captionsOn, setCaptionsOn] = useState(false)

  // Floating "Your meeting's ready" card
  const [showReadyCard, setShowReadyCard] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Sidebars
  const [activeSideTab, setActiveSideTab] = useState<'qa' | 'chat' | 'people' | null>(null)

  // WebRTC MediaStream
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // Clock
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Start real camera and mic
  const requestMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      localStreamRef.current = stream
      setHasPermission(true)
      setMicOn(true)
      setCamOn(true)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (err) {
      console.warn('Camera/Mic permission denied or not found:', err)
      setHasPermission(false)
      setMicOn(false)
      setCamOn(false)
    } finally {
      setShowPermissionPrompt(false)
      setShowReadyCard(true)
    }
  }

  // User chose to continue without camera/mic
  const continueWithoutMedia = () => {
    setHasPermission(false)
    setMicOn(false)
    setCamOn(false)
    setShowPermissionPrompt(false)
    setShowReadyCard(true)
  }

  // Toggle Mic Audio Track
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !micOn
      })
      setMicOn(!micOn)
    } else if (!hasPermission) {
      requestMediaAccess()
    }
  }

  // Toggle Camera Video Track
  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !camOn
      })
      setCamOn(!camOn)
    } else if (!hasPermission) {
      requestMediaAccess()
    }
  }

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        setScreenSharing(true)
        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current
          }
          setScreenSharing(false)
        }
      } catch (err) {
        console.warn('Screen share canceled:', err)
      }
    } else {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
      setScreenSharing(false)
    }
  }

  // Reaction trigger
  const triggerReaction = (emoji: string) => {
    setSelectedReaction(emoji)
    setShowReactions(false)
    setTimeout(() => setSelectedReaction(null), 3000)
  }

  const joinUrl = `${window.location.origin}/join/${meetingCode}`

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2200)
  }

  return (
    <div className="h-screen w-screen bg-[#202124] text-white flex flex-col overflow-hidden select-none font-sans relative">
      {/* ── 1. INITIAL PERMISSION POPUP (EXACT GOOGLE MEET DESIGN) ───────── */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#202124] rounded-[28px] max-w-[560px] w-full p-8 md:p-10 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Friendly Google Meet style illustration */}
            <div className="w-full max-w-[340px] h-44 flex items-center justify-center relative mb-4">
              <svg viewBox="0 0 400 240" className="w-full h-full" fill="none">
                {/* Desk Base Line */}
                <path d="M 40 210 L 360 210" stroke="#E0E0E0" strokeWidth="3" strokeLinecap="round" />

                {/* Left Person (Participant with braided hair) */}
                <path d="M 90 210 C 90 180 110 165 130 160 C 145 156 160 165 170 175 L 180 210" fill="#E8F0FE" stroke="#202124" strokeWidth="2.5" />
                <circle cx="140" cy="120" r="24" fill="#FCE8E6" stroke="#202124" strokeWidth="2.5" />
                {/* Hair Braid */}
                <circle cx="112" cy="126" r="11" fill="#202124" />
                <circle cx="102" cy="140" r="10" fill="#202124" />
                <circle cx="94" cy="156" r="9" fill="#202124" />
                <circle cx="88" cy="172" r="8" fill="#202124" />

                {/* Right Computer Monitor Screen */}
                <rect x="200" y="70" width="150" height="110" rx="8" fill="#FFFFFF" stroke="#202124" strokeWidth="2.5" />
                <path d="M 275 180 L 275 210 M 250 210 L 300 210" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />

                {/* Person Inside Monitor */}
                <path d="M 230 180 C 230 155 245 145 275 145 C 305 145 320 155 320 180" fill="#D2E3FC" stroke="#202124" strokeWidth="2" />
                <circle cx="275" cy="115" r="18" fill="#F6AEA9" stroke="#202124" strokeWidth="2" />
                <path d="M 260 102 C 265 92 285 92 290 102" fill="#202124" />

                {/* Speech / Media Permission Bubble */}
                <g transform="translate(180, 20)">
                  {/* Outer glow rays */}
                  <line x1="10" y1="18" x2="0" y2="10" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="26" y1="6" x2="26" y2="-4" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="42" y1="18" x2="52" y2="10" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Bubble Container */}
                  <rect x="-10" y="8" width="88" height="52" rx="26" fill="#FFFFFF" stroke="#202124" strokeWidth="2.5" />
                  
                  {/* Blue Video Camera Circle */}
                  <circle cx="16" cy="34" r="18" fill="#1A73E8" />
                  <rect x="9" y="27" width="10" height="14" rx="2" fill="white" />
                  <polygon points="19,30 25,26 25,42 19,38" fill="white" />

                  {/* Red Microphone Circle */}
                  <circle cx="52" cy="34" r="18" fill="#EA4335" />
                  <rect x="48" y="27" width="8" height="11" rx="4" fill="white" />
                  <path d="M 45 33 C 45 38 59 38 59 33" stroke="white" strokeWidth="2" fill="none" />
                  <line x1="52" y1="38" x2="52" y2="42" stroke="white" strokeWidth="2" />
                </g>
              </svg>
            </div>

            {/* Prompt Heading */}
            <h2 className="text-[22px] md:text-[24px] font-normal text-[#202124] leading-snug tracking-tight mb-2">
              Do you want people to see and hear you in the meeting?
            </h2>

            {/* Prompt Subtitle */}
            <p className="text-sm text-[#5F6368] font-normal mb-8 max-w-md">
              You can turn off your microphone and camera any time you want.
            </p>

            {/* Primary Action Button */}
            <button
              onClick={requestMediaAccess}
              className="w-auto px-8 py-3 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium text-sm transition-all shadow-sm hover:shadow cursor-pointer"
            >
              Allow microphone and camera
            </button>

            {/* Secondary Text Link */}
            <button
              onClick={continueWithoutMedia}
              className="text-sm font-medium text-[#1A73E8] hover:underline mt-4 cursor-pointer bg-transparent border-none py-1"
            >
              Continue without microphone and camera
            </button>
          </div>
        </div>
      )}

      {/* ── 2. MAIN MEETING VIEW ─────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative p-4 gap-3 overflow-hidden">
        {/* Central Stage Canvas */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 relative rounded-2xl overflow-hidden bg-[#131314] border border-white/5 shadow-2xl">
          {/* Main User Video Tile */}
          <div className="w-full h-full relative flex items-center justify-center bg-[#131314]">
            {camOn && hasPermission ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1] rounded-2xl"
              />
            ) : (
              /* Google Meet Avatar Circle when Camera is OFF */
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-32 h-32 rounded-full bg-[#004D40] flex items-center justify-center text-5xl font-normal text-white shadow-xl ring-4 ring-white/5">
                  {myName[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                  {micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{camOn ? 'Connecting camera…' : 'Camera is off'}</span>
                </div>
              </div>
            )}

            {/* Local User Badge (Bottom-Left of Video Tile) */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium text-white border border-white/10">
              <span className={clsx('w-2 h-2 rounded-full', micOn ? 'bg-emerald-400' : 'bg-rose-500')} />
              <span>{myName} (You)</span>
            </div>

            {/* Floating Reaction Animation */}
            {selectedReaction && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-6xl animate-bounce">
                {selectedReaction}
              </div>
            )}

            {/* Hand Raised Indicator */}
            {handRaised && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500/90 text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                <Hand className="w-4 h-4" />
                <span>Hand Raised</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. GOOGLE MEET FLOATING "YOUR MEETING'S READY" CARD ───────── */}
        {showReadyCard && (
          <div className="absolute bottom-4 left-6 z-40 w-[350px] bg-white rounded-lg p-5 shadow-2xl border border-gray-100 text-[#202124] animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header with Title and Close X */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-base text-[#202124]">Your meeting's ready</h3>
              <button
                onClick={() => setShowReadyCard(false)}
                className="text-[#5F6368] hover:text-[#202124] hover:bg-gray-100 p-1 rounded-full cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Others Button */}
            <button
              onClick={copyMeetingLink}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full text-xs font-medium my-2 transition-colors cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add others</span>
            </button>

            {/* Share link instruction */}
            <p className="text-xs text-[#5F6368] leading-relaxed mb-3">
              Or share this meeting link with others that you want in the meeting
            </p>

            {/* Meeting Link Box with Copy Button */}
            <div className="flex items-center justify-between gap-2 bg-[#F1F3F4] rounded-md px-3 py-2 text-xs font-sans border border-transparent hover:border-gray-300 transition-colors">
              <span className="text-[#3C4043] truncate flex-1 select-all font-mono text-[11px]">
                {joinUrl}
              </span>
              <button
                onClick={copyMeetingLink}
                className="text-[#5F6368] hover:text-[#1A73E8] p-1 rounded transition-colors cursor-pointer shrink-0"
                title="Copy meeting link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copiedLink && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Link copied to clipboard!</p>
            )}

            {/* Permission Security Hint */}
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-100 text-[11px] text-[#5F6368] leading-normal">
              <ShieldCheck className="w-4 h-4 text-[#1A73E8] shrink-0 mt-0.5" />
              <span>People who use this meeting link can join directly with real camera and microphone.</span>
            </div>

            {/* Joined as identity */}
            <div className="text-[11px] text-[#70757A] mt-2 truncate">
              Joined as {myEmail}
            </div>
          </div>
        )}

        {/* ── 4. RIGHT SIDEBAR (GEMINI AI DUPLICATE FILTER & TOOLS) ─────── */}
        {activeSideTab === 'qa' && (
          <aside className="w-[380px] shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-[#1E1F22] flex flex-col z-30 shadow-2xl animate-in slide-in-from-right-4 duration-200">
            <div className="h-[52px] px-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wide">Gemini Duplicate Radar</span>
              </div>
              <button
                onClick={() => setActiveSideTab(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <QAPanel meetingId={1} participantName={myName} />
            </div>
          </aside>
        )}
      </div>

      {/* ── 5. GOOGLE MEET BOTTOM CONTROL BAR ────────────────────────────── */}
      <footer className="h-20 bg-[#202124] px-6 flex items-center justify-between shrink-0 z-40 border-t border-white/5">
        {/* Left: Clock | Meeting Code (e.g. 22:08 | zbp-pnjs-tsv) */}
        <div className="flex items-center gap-3 text-sm font-medium text-slate-200 min-w-[200px]">
          <span>{currentTime || '22:08'}</span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-slate-300">{meetingCode}</span>
          <button
            onClick={() => setShowReadyCard(true)}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer transition-colors"
            title="Meeting details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Google Meet Circular Action Buttons */}
        <div className="flex items-center gap-2.5 md:gap-3">
          {/* Microphone */}
          <button
            onClick={toggleMic}
            className={clsx(
              'w-12 h-12 rounded-full grid place-items-center transition-all cursor-pointer',
              micOn ? 'bg-[#3C4043] hover:bg-[#474A4D] text-white' : 'bg-[#EA4335] hover:bg-[#D93025] text-white'
            )}
            title={micOn ? 'Turn off microphone' : 'Turn on microphone'}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCam}
            className={clsx(
              'w-12 h-12 rounded-full grid place-items-center transition-all cursor-pointer',
              camOn ? 'bg-[#3C4043] hover:bg-[#474A4D] text-white' : 'bg-[#EA4335] hover:bg-[#D93025] text-white'
            )}
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Captions (CC) */}
          <button
            onClick={() => setCaptionsOn(!captionsOn)}
            className={clsx(
              'w-12 h-12 rounded-full grid place-items-center transition-all cursor-pointer',
              captionsOn ? 'bg-[#8AB4F8] text-[#202124]' : 'bg-[#3C4043] hover:bg-[#474A4D] text-white'
            )}
            title="Turn on captions"
          >
            <Subtitles className="w-5 h-5" />
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={clsx(
              'w-12 h-12 rounded-full grid place-items-center transition-all cursor-pointer',
              screenSharing ? 'bg-[#8AB4F8] text-[#202124]' : 'bg-[#3C4043] hover:bg-[#474A4D] text-white'
            )}
            title="Present now"
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          {/* Reactions */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="w-12 h-12 rounded-full bg-[#3C4043] hover:bg-[#474A4D] text-white grid place-items-center transition-all cursor-pointer"
              title="Send a reaction"
            >
              <Smile className="w-5 h-5" />
            </button>
            {showReactions && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#3C4043] px-3 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 z-50">
                {['❤️', '👍', '👏', '🎉', '💡', '🚀'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => triggerReaction(emoji)}
                    className="hover:scale-125 transition-transform text-lg cursor-pointer p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Raise Hand */}
          <button
            onClick={() => setHandRaised(!handRaised)}
            className={clsx(
              'w-12 h-12 rounded-full grid place-items-center transition-all cursor-pointer',
              handRaised ? 'bg-[#8AB4F8] text-[#202124]' : 'bg-[#3C4043] hover:bg-[#474A4D] text-white'
            )}
            title="Raise hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* More Options */}
          <button
            onClick={() => setShowReadyCard(c => !c)}
            className="w-12 h-12 rounded-full bg-[#3C4043] hover:bg-[#474A4D] text-white grid place-items-center transition-all cursor-pointer"
            title="Meeting details and invite"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* End Call (Red Oval Pill) */}
          <button
            onClick={() => nav('/')}
            className="w-16 h-12 rounded-full bg-[#EA4335] hover:bg-[#D93025] text-white grid place-items-center transition-all shadow-md ml-2 cursor-pointer"
            title="Leave call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Info, People, Chat, Gemini AI Sidebar Toggles */}
        <div className="flex items-center gap-1 min-w-[200px] justify-end">
          {/* Details / Link popup toggle */}
          <button
            onClick={() => setShowReadyCard(c => !c)}
            className={clsx(
              'p-2.5 rounded-full transition-colors cursor-pointer',
              showReadyCard ? 'text-[#8AB4F8] bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
            title="Meeting details"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Participants */}
          <button
            onClick={() => setShowReadyCard(true)}
            className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative cursor-pointer"
            title="People (1)"
          >
            <Users className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#1A73E8] rounded-full text-[10px] font-bold text-white grid place-items-center">
              1
            </span>
          </button>

          {/* Gemini AI Superpower Button */}
          <button
            onClick={() => setActiveSideTab(activeSideTab === 'qa' ? null : 'qa')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ml-1',
              activeSideTab === 'qa'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/10 text-cyan-300 hover:bg-white/15'
            )}
            title="Gemini AI Duplicate Radar"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">AI Radar</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
