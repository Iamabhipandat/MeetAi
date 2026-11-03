import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ZoomSidebar from './ZoomSidebar'
import CreateMeetingModal from './CreateMeetingModal'
import { Search, ChevronLeft, ChevronRight, History, Plus, Bell, Sparkles } from 'lucide-react'

export default function AppLayout() {
  const { user, loading } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E3A5F]">
        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )

  if (!user) return <Navigate to="/login" replace />

  return (
    <div
      className="h-screen w-screen p-2 md:p-4 lg:p-6 flex items-center justify-center bg-cover bg-center overflow-hidden font-sans select-none"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 25, 45, 0.4), rgba(10, 25, 45, 0.5)), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80')`
      }}
    >
      {/* Zoom Workplace App Window */}
      <div className="zoom-window w-full max-w-[1400px] h-full flex flex-col overflow-hidden relative backdrop-blur-md">
        {/* Window Top Title / Search Bar */}
        <header className="h-[44px] bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] flex items-center justify-between px-4 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 ml-14">
              <span className="font-bold text-[var(--zoom-blue)]">zoom</span> Workplace
            </span>
            <div className="flex items-center gap-1 text-[var(--text-muted)] ml-2">
              <button className="p-1 hover:text-[var(--text-primary)] rounded"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-1 hover:text-[var(--text-primary)] rounded"><ChevronRight className="w-4 h-4" /></button>
              <button className="p-1 hover:text-[var(--text-primary)] rounded"><History className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-[420px] mx-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--sidebar-border)] rounded-md pl-8 pr-3 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--zoom-blue)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-black/5 dark:hover:bg-white/5">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-[var(--zoom-blue)] hover:bg-[var(--zoom-blue)]/10 rounded-md">
              <Sparkles className="w-4 h-4" />
            </button>
            {user && (
              <div className="w-6 h-6 rounded-full bg-[var(--zoom-blue)] text-white text-[10px] font-bold grid place-items-center ml-1">
                {user.name[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Window Body: Sidebar + Main Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[var(--window-bg)]">
          <ZoomSidebar />
          <main className="flex-1 min-w-0 h-full overflow-hidden">
            <Outlet context={{ openCreateMeeting: () => setShowCreateModal(true) }} />
          </main>
        </div>
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
