import type { MeetingSummary } from '../lib/types'
import { X, RefreshCw, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface Props { summary: MeetingSummary; onClose: () => void; onRegenerate: () => Promise<void> }

export default function SummaryModal({ summary, onClose, onRegenerate }: Props) {
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try { await onRegenerate() } finally { setRegenerating(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(summary.summary_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--border))] shrink-0">
          <h2 className="font-semibold">AI Meeting Summary</h2>
          <div className="flex items-center gap-2">
            <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 surface rounded-lg text-xs muted hover:text-[rgb(var(--text))] transition-colors">
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleRegenerate} disabled={regenerating} className="flex items-center gap-1.5 px-3 py-1.5 surface rounded-lg text-xs muted hover:text-[rgb(var(--text))] transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            <button onClick={onClose} className="muted hover:text-[rgb(var(--text))] transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <p className="text-xs muted mb-4">
            Generated {new Date(summary.generated_at).toLocaleString()}
          </p>
          <div className="prose prose-sm dark:prose-invert max-w-none text-[rgb(var(--text))] text-sm leading-relaxed whitespace-pre-wrap">
            {summary.summary_text}
          </div>
        </div>
      </div>
    </div>
  )
}
