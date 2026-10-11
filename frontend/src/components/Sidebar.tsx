import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Search, BarChart3, Sun, Moon, LogOut, Mic } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import clsx from 'clsx'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()

  const handleLogout = () => { logout(); nav('/login') }

  return (
    <aside className="w-56 h-screen flex flex-col surface border-r border-[rgb(var(--border))] fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 p-5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Mic className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm leading-tight">AI Meeting<br />Assistant</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'muted hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--text))]'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm muted hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--text))] w-full transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {user && (
          <div className="px-3 py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-xs muted truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="muted hover:text-red-500 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
