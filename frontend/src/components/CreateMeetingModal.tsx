import { useState } from 'react'
import { meetingsApi } from '../lib/api'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface Props { onClose: () => void; onCreated: () => void }

export default function CreateMeetingModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try { await meetingsApi.create(title.trim()); onCreated(); onClose() }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-md shadow-2xl shadow-black/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[rgb(var(--border))]">
          <h2 className="font-semibold">New Meeting</h2>
          <button onClick={onClose} className="muted hover:text-[rgb(var(--text))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Meeting title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning, Design Review…"
              className="input"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading || !title.trim()} className="btn-primary">
              {loading ? 'Creating…' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
