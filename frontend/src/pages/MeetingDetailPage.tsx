import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { meetingsApi, transcriptsApi, questionsApi, aiApi, summaryApi } from '../lib/api'
import type { Meeting, Transcript, Question, MeetingSummary } from '../lib/types'
import {
  Play, Square, Trash2, Send, Sparkles, FileText,
  MessageSquare, AlignLeft, ArrowLeft, RefreshCw
} from 'lucide-react'
import QuestionCard from '../components/QuestionCard'
import SummaryModal from '../components/SummaryModal'
import { formatDate } from '../lib/utils'
import clsx from 'clsx'

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  SCHEDULED: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  ENDED:     'bg-gray-100 dark:bg-gray-800 text-gray-500',
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const meetingId = Number(id)
  const nav = useNavigate()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [speaker, setSpeaker] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'transcript' | 'questions'>('transcript')
  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState<MeetingSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadAll = async () => {
    const [mRes, tRes, qRes] = await Promise.all([
      meetingsApi.get(meetingId),
      transcriptsApi.list(meetingId),
      questionsApi.list(meetingId),
    ])
    setMeeting(mRes.data)
    setTranscripts(tRes.data)
    setQuestions(qRes.data)
  }

  useEffect(() => { loadAll() }, [meetingId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcripts])

  const handleStart = async () => { await meetingsApi.start(meetingId); loadAll() }
  const handleFinish = async () => { await meetingsApi.finish(meetingId); loadAll() }
  const handleDelete = async () => {
    if (!confirm('Delete this meeting and all its data?')) return
    await meetingsApi.delete(meetingId); nav('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!speaker.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      await transcriptsApi.add(meetingId, speaker.trim(), content.trim())
      setContent('')
      await loadAll()
    } finally { setSubmitting(false) }
  }

  const handleSummary = async () => {
    setSummaryLoading(true)
    try { const r = await summaryApi.get(meetingId); setSummary(r.data); setShowSummary(true) }
    finally { setSummaryLoading(false) }
  }

  if (!meeting) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isActive = meeting.status === 'ACTIVE'
  const unanswered = questions.filter(q => q.status === 'UNANSWERED').length

  return (
    <div>
      {/* Back */}
      <button onClick={() => nav('/')} className="flex items-center gap-1.5 muted text-sm mb-6 hover:text-[rgb(var(--text))] transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Meetings
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
            <span className={clsx('text-xs font-medium px-2.5 py-0.5 rounded-full', STATUS_BADGE[meeting.status])}>
              {meeting.status}
            </span>
          </div>
          <p className="muted text-sm">{formatDate(meeting.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {meeting.status === 'SCHEDULED' && (
            <button onClick={handleStart} className="btn-primary bg-green-600 hover:bg-green-700">
              <Play className="w-3.5 h-3.5" /> Start
            </button>
          )}
          {isActive && (
            <button onClick={handleFinish} className="btn-primary bg-amber-500 hover:bg-amber-600">
              <Square className="w-3.5 h-3.5" /> End Meeting
            </button>
          )}
          <button onClick={handleSummary} disabled={summaryLoading || transcripts.length === 0} className="btn-ghost disabled:opacity-40">
            {summaryLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            AI Summary
          </button>
          <button onClick={handleDelete} className="btn-ghost text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-300 px-3">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Transcript Lines', value: transcripts.length },
          { label: 'Questions', value: questions.length },
          { label: 'Unanswered', value: unanswered },
        ].map(({ label, value }) => (
          <div key={label} className="card px-5 py-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="muted text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-px mb-0 border-b border-[rgb(var(--border))]">
        {[
          { key: 'transcript', label: 'Transcript', icon: AlignLeft, count: transcripts.length },
          { key: 'questions', label: 'Questions', icon: MessageSquare, count: questions.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              activeTab === key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent muted hover:text-[rgb(var(--text))]'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-normal', activeTab === key ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600' : 'bg-[rgb(var(--bg))] muted')}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card rounded-t-none border-t-0 mt-0">
        {activeTab === 'transcript' ? (
          <>
            <div className="max-h-[450px] overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {transcripts.length === 0 ? (
                <div className="text-center py-16 muted text-sm">
                  {isActive ? 'Add your first transcript line below' : 'No transcript recorded'}
                </div>
              ) : (
                transcripts.map((t) => (
                  <div key={t.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0 mt-0.5">
                      {t.speaker[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{t.speaker}</span>
                        <span className="muted text-xs">#{t.sequence_number}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{t.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {isActive && (
              <form onSubmit={handleSubmit} className="border-t border-[rgb(var(--border))] p-4 flex gap-2">
                <input
                  value={speaker}
                  onChange={e => setSpeaker(e.target.value)}
                  placeholder="Who's speaking"
                  className="input w-36 shrink-0"
                />
                <input
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="What was said…"
                  className="input flex-1"
                />
                <button type="submit" disabled={submitting} className="btn-primary px-4 shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="divide-y divide-[rgb(var(--border))]">
            {questions.length === 0 ? (
              <div className="text-center py-16 muted text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No questions detected yet
              </div>
            ) : (
              questions.map(q => (
                <div key={q.id} className="px-5 py-0">
                  <QuestionCard question={q} onAnswer={() => aiApi.generateAnswer(q.id)} onRefresh={loadAll} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showSummary && summary && (
        <SummaryModal
          summary={summary}
          onClose={() => setShowSummary(false)}
          onRegenerate={async () => {
            const r = await summaryApi.get(meetingId, true)
            setSummary(r.data)
          }}
        />
      )}
    </div>
  )
}
