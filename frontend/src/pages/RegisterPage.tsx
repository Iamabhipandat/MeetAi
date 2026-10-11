import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Zap, Mail, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await register(name, email, password)
      // If result has message (needs verification) show the check-email screen
      if (result?.requiresVerification) {
        setDone(true)
      } else {
        nav('/')
      }
    } catch (err: any) {
      const d = err.response?.data?.detail
      if (typeof d === 'string') {
        setError(d)
      } else if (Array.isArray(d)) {
        setError(d.map((x: any) => x.msg || JSON.stringify(x)).join(', '))
      } else {
        setError(err.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'rgb(var(--bg))' }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="muted text-sm leading-relaxed mb-6">
            We sent a verification link to <strong className="text-[rgb(var(--text))]">{email}</strong>.
            Click it to activate your account.
          </p>
          <div className="card p-4 text-sm text-left space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Check your spam/junk folder too</span>
            </div>
            <div className="flex items-center gap-2 muted">
              <CheckCircle className="w-4 h-4 shrink-0 opacity-30" />
              <span>Link expires in 24 hours</span>
            </div>
          </div>
          <p className="mt-6 text-sm muted">
            Already verified?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'rgb(var(--bg))' }}>
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold tracking-tight text-lg">MeetAI</span>
      </div>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight mb-1 text-center">Create account</h1>
        <p className="muted text-sm text-center mb-8">Start hosting AI-powered meetings</p>
        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input" placeholder="At least 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2 py-2.5">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm muted">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
