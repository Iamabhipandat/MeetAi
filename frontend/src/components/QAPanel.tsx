import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, Sparkles, Copy, Check } from 'lucide-react'
import clsx from 'clsx'

interface LiveQuestion {
  id: string
  speaker: string
  text: string
  status: 'processing' | 'UNIQUE' | 'DUPLICATE'
  similarity?: number
}

interface Props {
  meetingId: number
  participantName: string
}

export default function QAPanel({ meetingId, participantName }: Props) {
  const [questions, setQuestions] = useState<LiveQuestion[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!meetingId) return
    const ws = new WebSocket(`ws://localhost:8000/ws/meetings/${meetingId}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'question_processed') {
          setQuestions(prev => prev.map(q =>
            q.id === msg.temp_id
              ? { ...q, status: msg.status, id: String(msg.id), similarity: msg.similarity_score }
              : q
          ))
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
    const question: LiveQuestion = {
      id: tempId,
      speaker: participantName,
      text: input.trim(),
      status: 'processing',
    }
    setQuestions(prev => [...prev, question])
    setInput('')

    // Send via WebSocket for real-time processing
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'question_submitted',
        text: question.text,
        speaker: participantName,
        temp_id: tempId,
        meeting_id: meetingId,
      }))
    }

    // Also POST to REST API for persistence + AI processing
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
          content: question.text,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        // Get detected questions
        if (data.detected_questions?.length > 0) {
          const q = data.detected_questions[0]
          setQuestions(prev => prev.map(pq =>
            pq.id === tempId
              ? { ...pq, status: q.is_duplicate ? 'DUPLICATE' : 'UNIQUE', id: String(q.id), similarity: q.similarity_score }
              : pq
          ))
        } else {
          // Not detected as a question
          setQuestions(prev => prev.filter(q => q.id !== tempId))
        }
      }
    } catch {
      setQuestions(prev => prev.filter(q => q.id !== tempId))
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-white text-sm font-semibold">Live Questions</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">
            {questions.filter(q => q.status === 'UNIQUE').length} unique
          </span>
        </div>
        <div className={clsx(
          'w-2 h-2 rounded-full',
          connected ? 'bg-green-500' : 'bg-gray-600'
        )} title={connected ? 'Connected' : 'Disconnected'} />
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageSquare className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-gray-600 text-xs">No questions yet</p>
            <p className="text-gray-700 text-xs">Be the first to ask!</p>
          </div>
        ) : (
          questions.map(q => (
            <QuestionBubble key={q.id} question={q} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendQuestion} className="p-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-colors disabled:opacity-40 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-gray-700 text-xs mt-1.5 text-center">
          AI will filter duplicate questions automatically
        </p>
      </form>
    </div>
  )
}

function QuestionBubble({ question: q }: { question: LiveQuestion }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(q.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={clsx(
      'rounded-xl p-3 transition-all',
      q.status === 'DUPLICATE'
        ? 'bg-gray-800/50 border border-gray-700/50 opacity-60'
        : q.status === 'processing'
        ? 'bg-gray-800 border border-gray-700 animate-pulse'
        : 'bg-gray-800 border border-gray-700'
    )}>
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-indigo-900/60 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
          {q.speaker[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-indigo-400 text-xs font-semibold">{q.speaker}</span>
            {q.status === 'processing' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 animate-pulse" /> AI checking…
              </span>
            )}
            {q.status === 'UNIQUE' && (
              <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-1.5 py-0.5 rounded-full">
                ✦ Unique
              </span>
            )}
            {q.status === 'DUPLICATE' && (
              <span className="text-xs bg-orange-900/40 text-orange-400 border border-orange-800/50 px-1.5 py-0.5 rounded-full">
                ≈ Duplicate {q.similarity ? `${Math.round(q.similarity * 100)}%` : ''}
              </span>
            )}
          </div>
          <p className="text-white text-sm leading-snug">{q.text}</p>
        </div>
        <button onClick={copy} className="text-gray-600 hover:text-gray-400 transition-colors shrink-0">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}
