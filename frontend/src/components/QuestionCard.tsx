import { useState } from 'react'
import type { Question } from '../lib/types'
import { aiApi } from '../lib/api'
import { Sparkles, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

const qStatus = {
  UNANSWERED: { cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800', label: 'Unanswered' },
  ANSWERED:   { cls: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800', label: 'Answered' },
  DUPLICATE:  { cls: 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700', label: 'Duplicate' },
  IGNORED:    { cls: 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700', label: 'Ignored' },
}

interface Props { question: Question; onAnswer: () => void; onRefresh: () => void }

export default function QuestionCard({ question: q, onAnswer, onRefresh }: Props) {
  const [answering, setAnswering] = useState(false)
  const [aiText, setAiText] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const cfg = qStatus[q.status]

  const handleAnswer = async () => {
    setAnswering(true)
    try {
      const r = await aiApi.generateAnswer(q.id)
      setAiText(r.data.response_text)
      setExpanded(true)
      onRefresh()
    } finally { setAnswering(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(aiText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={clsx('py-4', q.status === 'DUPLICATE' && 'opacity-50')}>
      <div className="flex items-start gap-3">
        {/* Speaker avatar */}
        <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
          {q.speaker[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">{q.speaker}</span>
            <span className={clsx('text-xs border px-1.5 py-0.5 rounded-md', cfg.cls)}>{cfg.label}</span>
            {q.is_duplicate && q.similarity_score && (
              <span className="muted text-xs">{Math.round(q.similarity_score * 100)}% match</span>
            )}
          </div>
          <p className="text-sm">{q.question_text}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {q.status === 'UNANSWERED' && (
            <button
              onClick={handleAnswer}
              disabled={answering}
              className="btn-primary py-1 px-2.5 text-xs"
            >
              <Sparkles className="w-3 h-3" />
              {answering ? 'Asking…' : 'AI Answer'}
            </button>
          )}
          {(aiText || q.status === 'ANSWERED') && (
            <button onClick={() => setExpanded(x => !x)} className="btn-ghost py-1 px-2 text-xs">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* AI answer expansion */}
      {expanded && aiText && (
        <div className="mt-3 ml-10 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3 h-3" /> AI Answer
            </span>
            <button onClick={copy} className="flex items-center gap-1 text-xs muted hover:text-[rgb(var(--text))] transition-colors">
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[rgb(var(--text))]">{aiText}</p>
        </div>
      )}
    </div>
  )
}
