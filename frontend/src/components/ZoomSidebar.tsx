import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home,
  Calendar,
  MessageSquare,
  Phone,
  FileText,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import clsx from 'clsx'

export default function ZoomSidebar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()

  const links = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/search', label: 'Team Chat', icon: MessageSquare },
    { to: '/analytics', label: 'Phone', icon: Phone },
    { to: '/notes', label: 'Notes', icon: FileText },
  ]

  return (
    <aside className="w-[68px] shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col items-center py-4 select-none z-10">
      {/* Mac Traffic Lights (decorative) */}
      <div className="flex gap-1.5 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-2 w-full px-2 flex-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-colors gap-1 w-full',
                isActive
                  ? 'bg-white dark:bg-[#252A36] text-[var(--zoom-blue)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0 stroke-[1.75]" />
            <span className="truncate leading-tight">{label}</span>
          </NavLink>
        ))}

        <button
          className="flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 w-full gap-1"
        >
          <MoreHorizontal className="w-5 h-5 stroke-[1.75]" />
          <span>More</span>
        </button>
      </nav>

      {/* Bottom Profile & Utilities */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-[var(--sidebar-border)] w-full px-2">
        <button
          onClick={toggle}
          title="Toggle Theme"
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {user && (
          <div className="relative group">
            <div className="w-8 h-8 rounded-full bg-[var(--zoom-blue)] text-white font-bold text-xs grid place-items-center cursor-pointer shadow-sm">
              {user.name[0].toUpperCase()}
            </div>
            <button
              onClick={() => { logout(); nav('/login') }}
              title="Sign Out"
              className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <LogOut className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
