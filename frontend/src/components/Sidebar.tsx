import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  Search,
  BarChart3,
  Sun,
  Moon,
  LogOut,
  HelpCircle,
  Settings,
  FolderClosed,
  ChevronRight,
  Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import clsx from 'clsx'

interface Props {
  onNewMeeting?: () => void
}

export default function Sidebar({ onNewMeeting }: Props) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()

  const handleLogout = () => {
    logout()
    nav('/login')
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <aside className="w-[240px] shrink-0 h-screen bg-app-side border-r border-app-line p-[18px_14px] flex flex-col gap-1.5 overflow-y-auto select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-1 mb-3">
        <div className="w-[34px] h-[34px] rounded-[11px] bg-gradient-to-br from-[var(--blue)] to-[var(--green)] grid place-items-center text-[#0E111B] font-bold text-base shadow-lg shadow-blue-500/20">
          H
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-app-text block leading-none">Huddle</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-app-mut">AI Meeting Studio</span>
        </div>
      </div>

      {/* Primary Actions */}
      {onNewMeeting && (
        <button
          onClick={onNewMeeting}
          className="btn w-full justify-center py-2.5 mb-2 shadow-md shadow-blue-600/25"
        >
          <Plus className="w-4 h-4" />
          <span>New Meeting</span>
        </button>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left',
              isActive
                ? 'bg-app-blue text-white shadow-sm'
                : 'text-app-mut hover:bg-app-card hover:text-app-text'
            )
          }
        >
          <LayoutDashboard className="w-[18px] h-[18px]" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left',
              isActive
                ? 'bg-app-blue text-white shadow-sm'
                : 'text-app-mut hover:bg-app-card hover:text-app-text'
            )
          }
        >
          <Search className="w-[18px] h-[18px]" />
          <span>Search Transcripts</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left',
              isActive
                ? 'bg-app-blue text-white shadow-sm'
                : 'text-app-mut hover:bg-app-card hover:text-app-text'
            )
          }
        >
          <BarChart3 className="w-[18px] h-[18px]" />
          <span>Analytics</span>
        </NavLink>
      </nav>

      {/* Section Divider */}
      <div className="px-3 pt-4 pb-1 text-[11px] uppercase tracking-wider font-semibold text-app-mut">
        Workspaces
      </div>
      <div className="flex flex-col gap-1">
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-app-mut hover:bg-app-card hover:text-app-text transition-colors text-left">
          <FolderClosed className="w-4 h-4 text-emerald-400" />
          <span className="flex-1 truncate">Product & Design</span>
          <span className="text-[11px] bg-app-card2 px-1.5 py-0.5 rounded-md text-app-text">8</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-app-mut hover:bg-app-card hover:text-app-text transition-colors text-left">
          <FolderClosed className="w-4 h-4 text-sky-400" />
          <span className="flex-1 truncate">Engineering Sync</span>
          <span className="text-[11px] bg-app-card2 px-1.5 py-0.5 rounded-md text-app-text">5</span>
        </button>
      </div>

      <div className="flex-1 min-h-4" />

      {/* Utilities */}
      <div className="flex flex-col gap-1 pt-2 border-t border-app-line">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-app-mut hover:bg-app-card hover:text-app-text transition-colors w-full"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        {user && (
          <div className="mt-2 p-2 rounded-xl bg-app-card border border-app-line flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--blue)] to-[var(--green)] grid place-items-center text-xs font-bold text-[#0E111B] shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-app-text truncate">{user.name}</p>
              <p className="text-[11px] text-app-mut truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-app-mut hover:text-app-red hover:bg-app-card2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
