import { NavLink, useNavigate } from 'react-router-dom'
import { Search, Moon, Sun, LogOut, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import clsx from 'clsx'

const navLinks = [
  { to: '/', label: 'Meetings' },
  { to: '/search', label: 'Search' },
  { to: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'rgb(var(--surface))',
        borderBottom: '1px solid rgb(var(--border))',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">MeetAI</span>
        </div>

        {/* Nav links — center */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--bg))]'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--bg))] transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-[rgb(var(--border))]">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {user.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user.name.split(' ')[0]}</span>
              <button
                onClick={() => { logout(); nav('/login') }}
                className="w-7 h-7 rounded-lg flex items-center justify-center muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
