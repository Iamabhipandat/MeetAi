import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Video,
  Sparkles,
  Search,
  BarChart3,
  FileText,
  Keyboard,
  Plus,
  Shield,
  Layers,
  Zap
} from 'lucide-react'

export default function AppLayout() {
  const nav = useNavigate()
  const [quickCode, setQuickCode] = useState('')

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = quickCode.trim()
    if (clean) nav(`/join/${clean}`)
  }

  return (
    <div className="min-h-screen w-screen flex flex-col bg-[#0B0D13] text-[#F8FAFC] overflow-x-hidden relative selection:bg-indigo-500/30">
      {/* Background Ambient Glows */}
      <div className="fixed -top-[250px] -left-[200px] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-[20%] -right-[200px] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP MODERN NAVBAR ─────────────────────────────────────────── */}
      <header className="h-[68px] px-6 lg:px-10 border-b border-white/5 flex items-center justify-between shrink-0 backdrop-blur-xl bg-[#0B0D13]/70 sticky top-0 z-40">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => nav('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0E111A] rounded-[11px] grid place-items-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">MeetAI</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                Studio
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block -mt-0.5 font-medium">Next-gen AI Conferences</span>
          </div>
        </div>

        {/* Center Quick Join Form */}
        <form onSubmit={handleQuickJoin} className="hidden md:flex items-center gap-2 max-w-[360px] w-full">
          <div className="relative flex-1">
            <Keyboard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter meeting code..."
              value={quickCode}
              onChange={e => setQuickCode(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!quickCode.trim()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            Join
          </button>
        </form>

        {/* Right Navigation */}
        <div className="flex items-center gap-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            Search
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            Analytics
          </NavLink>

          <button
            onClick={() => nav('/room/instant-' + Math.random().toString(36).substring(2, 8))}
            className="btn-gradient text-xs py-2 px-3.5 ml-2 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Instant Meeting</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1240px] mx-auto p-6 md:p-10 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
