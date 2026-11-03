import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send, Copy, Check, Filter, AlertCircle, Bot } from 'lucide-react'
import clsx from 'clsx'

interface LiveQuestion {
  id: string
  speaker: string
  text: string
  status: 'processing' | 'UNIQUE' | 'DUPLICATE'
  similarity?: number
  duplicateOf?: string
}

interface Props {
  meetingId: number
  participantName: string
}

export default function QAPanel({ meetingId, participantName }: Props) {
  const [questions, setQuestions] = useState<LiveQuestion[]>([
    {
      id: 'mock-1',
      speaker: 'Dev Patel',
      text: 'What is the release timeline for the mobile application?',
      status: 'UNIQUE',
    },
    {
      id: 'mock-2',
      speaker: 'Karan Mehta',
      text: 'When will the iOS and Android versions be launched?',
      status: 'DUPLICATE',
      similarity: 0.92,
      duplicateOf: 'What is the release timeline for the mobile application?',
    },
  ])
  const [input, setInput] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'unique' | 'duplicates'>('all')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!meetingId) return

    const wsUrl = `ws://localhost:8000/ws/meetings/${meetingId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'question_processed') {
          setQuestions(prev =>
            prev.map(q =>
              q.id === msg.temp_id
                ? {
                    ...q,
                    status: msg.status,
                    id: String(msg.id),
                    similarity: msg.similarity_score,
                    duplicateOf: msg.duplicate_of,
                  }
                : q
            )
          )
        }
      } catch {}
    }

    return () => ws.close()
  }, [meetingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions])

  const sendQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const tempId = `temp-${Date.now()}`
    const questionText = input.trim()

    const newQ: LiveQuestion = {
      id: tempId,
      speaker: participantName,
      text: questionText,
      status: 'processing',
    }
    setQuestions(prev => [...prev, newQ])
    setInput('')

    // WebSocket optimistic broadcast
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'question_submitted',
          text: questionText,
          speaker: participantName,
          temp_id: tempId,
          meeting_id: meetingId,
        })
      )
    }

    // Call REST API
    try {
      const res = await fetch(`/api/transcripts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          speaker: participantName,
          content: questionText,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.detected_questions?.length > 0) {
          const detected = data.detected_questions[0]
          setQuestions(prev =>
            prev.map(q =>
              q.id === tempId
                ? {
                    ...q,
                    status: detected.is_duplicate ? 'DUPLICATE' : 'UNIQUE',
                    id: String(detected.id),
                    similarity: detected.similarity_score,
                  }
                : q
            )
          )
        } else {
          // If fallback did not flag as question, mark unique
          setQuestions(prev =>
            prev.map(q => (q.id === tempId ? { ...q, status: 'UNIQUE' } : q))
          )
        }
      }
    } catch {
      setQuestions(prev =>
        prev.map(q => (q.id === tempId ? { ...q, status: 'UNIQUE' } : q))
      )
    }
  }

  const displayedQuestions = questions.filter(q => {
    if (filterMode === 'unique') return q.status === 'UNIQUE'
    if (filterMode === 'duplicates') return q.status === 'DUPLICATE'
    return true
  })

  const uniqueCount = questions.filter(q => q.status === 'UNIQUE').length
  const duplicateCount = questions.filter(q => q.status === 'DUPLICATE').length

  return (
    <div className="h-full flex flex-col bg-app-card text-app-text select-none text-xs">
      {/* Subheader info */}
      <div className="px-4 py-3 border-b border-app-line bg-app-card2/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bot className="w-4 h-4 text-[var(--green)]" />
          <span className="font-semibold text-app-text">Gemini Duplicate Filter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'w-2 h-2 rounded-full',
              connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
            )}
          />
          <span className="text-[10px] text-app-mut font-mono">
            {connected ? 'Live Sync' : 'Connecting'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-app-line flex gap-1 bg-app-card">
        <button
          onClick={() => setFilterMode('all')}
          className={clsx(
            'px-2.5 py-1 rounded-lg font-medium transition-colors',
            filterMode === 'all'
              ? 'bg-app-card2 text-app-text font-bold'
              : 'text-app-mut hover:text-app-text'
          )}
        >
          All ({questions.length})
        </button>
        <button
          onClick={() => setFilterMode('unique')}
          className={clsx(
            'px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1',
            filterMode === 'unique'
              ? 'bg-emerald-500/15 text-emerald-400 font-bold'
              : 'text-app-mut hover:text-emerald-400'
          )}
        >
          ✦ Unique ({uniqueCount})
        </button>
        <button
          onClick={() => setFilterMode('duplicates')}
          className={clsx(
            'px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1',
            filterMode === 'duplicates'
              ? 'bg-amber-500/15 text-amber-400 font-bold'
              : 'text-app-mut hover:text-amber-400'
          )}
        >
          ≈ Duplicate ({duplicateCount})
        </button>
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scroll">
        {displayedQuestions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-app-mut">
            <Sparkles className="w-8 h-8 text-[var(--blue)]/40 mb-2" />
            <p className="font-semibold text-app-text">No questions to display</p>
            <p className="text-[11px] mt-1 max-w-[200px]">
              Ask a question below. AI will automatically tag it as unique or duplicate.
            </p>
          </div>
        ) : (
          displayedQuestions.map(q => {
            const isUnique = q.status === 'UNIQUE'
            const isDup = q.status === 'DUPLICATE'
            const isProcessing = q.status === 'processing'

            return (
              <div
                key={q.id}
                className={clsx(
                  'p-3 rounded-xl border transition-all flex flex-col gap-1.5',
                  isUnique && 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100',
                  isDup && 'bg-amber-950/20 border-amber-500/30 text-amber-100 opacity-80',
                  isProcessing && 'bg-app-card2 border-app-line animate-pulse'
                )}
              >
                {/* Header status */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-app-text">{q.speaker}</span>

                  {isProcessing && (
                    <span className="text-[10px] text-app-mut flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                      Analyzing...
                    </span>
                  )}

                  {isUnique && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✦ Unique Question
                    </span>
                  )}

                  {isDup && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      ≈ Duplicate {q.similarity ? `(${Math.round(q.similarity * 100)}%)` : ''}
                    </span>
                  )}
                </div>

                {/* Question body */}
                <p className="text-xs text-app-text leading-relaxed font-medium">{q.text}</p>

                {/* Duplicate reference tag if available */}
                {isDup && q.duplicateOf && (
                  <div className="mt-1 p-1.5 rounded-lg bg-black/20 text-[10px] text-amber-300/80 italic">
                    Similar to: "{q.duplicateOf}"
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={sendQuestion} className="p-3 border-t border-app-line flex gap-2 bg-app-card">
        <input
          type="text"
          placeholder="Ask a question to the host..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input text-xs py-2 flex-1"
        />
        <button type="submit" disabled={!input.trim()} className="btn px-3 py-2 shrink-0">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}
