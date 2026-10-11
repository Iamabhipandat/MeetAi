import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import api from '../lib/api'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { setUserFromToken } = useAuth()
  const token = params.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('No verification token found.'); return }
    api.get(`/auth/verify?token=${token}`)
      .then(r => {
        // Store token and set user
        localStorage.setItem('token', r.data.access_token)
        setUserFromToken(r.data)
        setStatus('success')
        setTimeout(() => nav('/'), 2500)
      })
      .catch(e => {
        setStatus('error')
        setError(e.response?.data?.detail || 'Verification failed. Link may have expired.')
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'rgb(var(--bg))' }}>
      <div className="card p-10 w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 mx-auto text-indigo-500 animate-spin mb-4" />
            <p className="font-medium">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Email verified! 🎉</h1>
            <p className="muted text-sm">Redirecting you to the dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">Verification failed</h1>
            <p className="muted text-sm mb-5">{error}</p>
            <Link to="/register" className="btn-primary">Try registering again</Link>
          </>
        )}
      </div>
    </div>
  )
}
