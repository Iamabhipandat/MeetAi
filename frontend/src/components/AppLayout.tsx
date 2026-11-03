import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import CreateMeetingModal from './CreateMeetingModal'
import {
  Video,
  Phone,
  HelpCircle,
  Settings,
  Grid,
  Sun,
  Moon,
  Keyboard,
  Plus
} from 'lucide-react'

export default function AppLayout() {
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joinCodeInput, setJoinCodeInput] = useState('')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = joinCodeInput.trim()
    if (clean) nav(`/join/${clean}`)
  }

  return (
    <div className="min-h-screen w-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)] select-none">
      {/* ── TOP NAV HEADER (Google Meet Style) ─────────────────────────── */}
      <header className="h-[64px] px-6 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-page)]">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => nav('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-blue-500 flex items-center justify-center shadow-sm">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-medium tracking-tight text-[var(--text-primary)]">
            Meet<span className="font-bold text-[#0B57D0] dark:text-[#A8C7FA]">AI</span>
          </span>
        </div>

        {/* Center: Quick Join input & New Meeting pill */}
        <form onSubmit={handleJoin} className="flex items-center gap-3 max-w-[480px] w-full mx-4">
          <div className="relative flex-1">
            <Keyboard className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter a code or link"
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value)}
              className="pill-input w-full pl-10 pr-4"
            />
          </div>
          <button
            type="submit"
            disabled={!joinCodeInput.trim()}
            className="btn-pill-join"
          >
            Join
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-pill-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </form>

        {/* Right side utilities */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            title="Toggle theme"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]">
            <Grid className="w-5 h-5" />
          </button>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#007A5A] text-white font-medium text-xs grid place-items-center shadow-sm ml-1">
            {user?.name ? user.name[0].toUpperCase() : 'G'}
          </div>
        </div>
      </header>

      {/* ── BODY: LEFT VERTICAL TAB BAR + MAIN VIEW ─────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Vertical Tab Rail */}
        <aside className="w-[80px] shrink-0 border-r border-[var(--border-color)] flex flex-col items-center py-6 gap-6 bg-[var(--bg-page)]">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 w-full py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-[#0B57D0] dark:text-[#A8C7FA]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-12 h-8 rounded-full grid place-items-center transition-colors ${
                    isActive ? 'bg-[#D3E3FD] dark:bg-[#004A77]' : 'hover:bg-black/5'
                  }`}
                >
                  <Video className="w-4 h-4" />
                </div>
                <span>Meetings</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/notes"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 w-full py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-[#0B57D0] dark:text-[#A8C7FA]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-12 h-8 rounded-full grid place-items-center transition-colors ${
                    isActive ? 'bg-[#D3E3FD] dark:bg-[#004A77]' : 'hover:bg-black/5'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                </div>
                <span>Notes & AI</span>
              </>
            )}
          </NavLink>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-[960px] flex flex-col gap-6">
            <Outlet context={{ openCreateMeeting: () => setShowCreateModal(true) }} />
          </div>
        </main>
      </div>

      {showCreateModal && (
        <CreateMeetingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            window.dispatchEvent(new CustomEvent('meetai:meeting-created'))
          }}
        />
      )}
    </div>
  )
}
