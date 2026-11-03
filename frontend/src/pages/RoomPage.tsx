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
  Smile,
  Shield,
  MoreHorizontal,
  ChevronUp,
  Sparkles,
  FileText,
  X,
  Check
} from 'lucide-react'
import clsx from 'clsx'

export default function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const location = useLocation()
  const nav = useNavigate()
  const { user } = useAuth()

  const [token, setToken] = useState<string>(location.state?.token || '')
  const [roomName, setRoomName] = useState<string>(location.state?.roomName || 'Q3 Marketing Kickoff')
  const [meetingId, setMeetingId] = useState<number>(location.state?.meetingId || 0)
  const [participantName] = useState<string>(
    location.state?.participantName || user?.name || 'Guest'
  )

  // Control states
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [showNotesModal, setShowNotesModal] = useState(true) // Image 4
  const [showRightQA, setShowRightQA] = useState(false)
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(0)

  // Notes config checkboxes (Image 4 modal)
  const [useTranscript, setUseTranscript] = useState(true)
  const [autoStartNotes, setAutoStartNotes] = useState(true)
  const [allowEveryoneNotes, setAllowEveryoneNotes] = useState(true)

  // Video Grid Mock matching Image 3 & 4
  const participants = [
    {
      name: 'Riya Sharma (Host)',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      speaking: true
    },
    {
      name: 'Claire Bishop',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      speaking: false
    },
    {
      name: 'Marcus Vance',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      speaking: false
    },
    {
      name: 'Daniel Craig',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      speaking: false
    }
  ]

  useEffect(() => {
    if (!token && code) {
      api.get(`/rooms/join/${code}`).then(r => {
        setMeetingId(r.data.meeting_id)
        setRoomName(r.data.room_name || 'Meeting Room')
      }).catch(err => console.error(err))
    }
  }, [code, token])

  return (
    <div className="h-screen w-screen bg-[#1E2024] flex items-center justify-center p-2 md:p-6 overflow-hidden select-none font-sans">
      {/* Zoom Video Meeting Window Frame (Images 3 & 4) */}
      <div className="w-full max-w-[1240px] h-full max-h-[820px] bg-[#121418] rounded-xl flex flex-col overflow-hidden shadow-2xl border border-black/50 relative">
        {/* Top Header Bar */}
        <div className="h-[36px] bg-[#1A1D24] px-4 flex items-center justify-between text-xs text-white/80 shrink-0 border-b border-black/30">
          <div className="flex items-center gap-2">
            {/* Mac Traffic Lights */}
            <div className="flex gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
            </div>
            <span className="text-white font-medium">{roomName}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] text-emerald-400">Encrypted</span>
          </div>
        </div>

        {/* Video Area + Right QA Overlay */}
        <div className="flex-1 flex min-h-0 relative bg-black">
          {/* 2x2 Video Tiles Grid matching Image 3 */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 bg-black">
            {participants.map((p, idx) => (
              <div
                key={p.name}
                onClick={() => setActiveSpeakerIndex(idx)}
                className={clsx(
                  'relative rounded-lg overflow-hidden bg-[#1E222B] flex items-center justify-center border-2 transition-all cursor-pointer',
                  idx === activeSpeakerIndex ? 'border-emerald-500' : 'border-transparent'
                )}
              >
                <img
                  src={p.photo}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />

                {/* Name Badge */}
                <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-medium text-white flex items-center gap-1.5">
                  {idx === activeSpeakerIndex && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <span>{p.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* "My Notes" Flyout Panel overlay (Exact Replica of Image 4) */}
          {showNotesModal && (
            <div className="absolute top-4 right-4 w-[280px] bg-[#1E222A]/95 backdrop-blur-md rounded-xl p-4 border border-white/10 text-white shadow-2xl z-20">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                <span className="text-xs font-semibold">My Notes</span>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-white/70 leading-relaxed mb-3">
                Take notes or use meeting transcript to create a personal summary for you.
              </p>

              <div className="flex flex-col gap-2.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTranscript}
                    onChange={e => setUseTranscript(e.target.checked)}
                    className="rounded text-[var(--zoom-blue)] accent-[var(--zoom-blue)]"
                  />
                  <span>Use meeting transcript</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStartNotes}
                    onChange={e => setAutoStartNotes(e.target.checked)}
                    className="rounded text-[var(--zoom-blue)] accent-[var(--zoom-blue)]"
                  />
                  <span>Auto-start note for future meetings</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowEveryoneNotes}
                    onChange={e => setAllowEveryoneNotes(e.target.checked)}
                    className="rounded text-[var(--zoom-blue)] accent-[var(--zoom-blue)]"
                  />
                  <span>Allow everyone to use the meeting transcripts with My Notes</span>
                </label>
              </div>

              <button
                onClick={() => {
                  setShowNotesModal(false)
                  nav('/notes')
                }}
                className="w-full mt-4 py-2 bg-gradient-to-r from-[#0E71EB] to-[#4F46E5] text-white rounded-lg text-xs font-semibold shadow-md hover:brightness-110"
              >
                Start taking notes
              </button>
            </div>
          )}

          {/* Right QA Panel */}
          {showRightQA && (
            <div className="w-[340px] bg-[#181B20] border-l border-white/10 flex flex-col z-10">
              <div className="h-[40px] px-3 border-b border-white/10 flex items-center justify-between text-xs text-white">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--zoom-blue)]" />
                  AI Question Filter
                </span>
                <button onClick={() => setShowRightQA(false)} className="text-white/60 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <QAPanel meetingId={meetingId} participantName={participantName} />
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM ZOOM CONTROL BAR (Exact Replica of Image 3 Bottom) ───── */}
        <div className="h-[64px] bg-[#1A1D24] px-4 flex items-center justify-between shrink-0 select-none border-t border-black/40">
          {/* Audio & Video Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMicOn(m => !m)}
              className="flex flex-col items-center text-white/80 hover:text-white group"
            >
              <div className="p-1.5 rounded-lg group-hover:bg-white/10">
                {micOn ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-rose-500" />}
              </div>
              <span className="text-[10px] text-white/70">Audio</span>
            </button>

            <button
              onClick={() => setCamOn(c => !c)}
              className="flex flex-col items-center text-white/80 hover:text-white group"
            >
              <div className="p-1.5 rounded-lg group-hover:bg-white/10">
                {camOn ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-rose-500" />}
              </div>
              <span className="text-[10px] text-white/70">Video</span>
            </button>
          </div>

          {/* Middle Collaboration Controls */}
          <div className="flex items-center gap-5">
            <button className="flex flex-col items-center text-white/80 hover:text-white group">
              <div className="p-1.5 rounded-lg group-hover:bg-white/10">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-white/70">Participants</span>
            </button>

            <button
              onClick={() => setShowRightQA(q => !q)}
              className="flex flex-col items-center text-white/80 hover:text-white group"
            >
              <div className={clsx('p-1.5 rounded-lg', showRightQA ? 'bg-[var(--zoom-blue)] text-white' : 'group-hover:bg-white/10')}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-white/70">Chat / AI Q&A</span>
            </button>

            <button className="flex flex-col items-center text-white/80 hover:text-white group">
              <div className="p-1.5 rounded-lg group-hover:bg-white/10">
                <Smile className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-white/70">React</span>
            </button>

            <button className="flex flex-col items-center text-emerald-400 hover:text-emerald-300 group">
              <div className="p-1.5 rounded-lg group-hover:bg-white/10">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-[10px]">Share</span>
            </button>

            <button
              onClick={() => setShowNotesModal(n => !n)}
              className="flex flex-col items-center text-white/80 hover:text-white group"
            >
              <div className={clsx('p-1.5 rounded-lg', showNotesModal ? 'bg-[var(--zoom-blue)] text-white' : 'group-hover:bg-white/10')}>
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-white/70">Notes</span>
            </button>
          </div>

          {/* End Meeting Button */}
          <div>
            <button
              onClick={() => nav('/')}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-colors"
            >
              End
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
