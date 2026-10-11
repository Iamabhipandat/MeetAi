import { useEffect, useState } from 'react'
import { analyticsApi } from '../lib/api'
import type { OverallAnalytics } from '../lib/types'
import { BarChart3, MessageCircle, CheckCircle, AlertCircle, FileStack } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AnalyticsPage() {
  const [data, setData] = useState<OverallAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.get().then((r) => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 muted text-sm">Loading analytics…</div>
  if (!data) return null

  const stats = [
    { label: 'Total Meetings', value: data.total_meetings, icon: BarChart3, color: 'text-indigo-500' },
    { label: 'Transcript Lines', value: data.total_transcripts, icon: FileStack, color: 'text-sky-500' },
    { label: 'Questions Detected', value: data.total_questions, icon: MessageCircle, color: 'text-violet-500' },
    { label: 'Answered', value: data.answered_questions, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Unanswered', value: data.unanswered_questions, icon: AlertCircle, color: 'text-amber-500' },
    { label: 'Duplicates', value: data.duplicate_questions, icon: MessageCircle, color: 'text-slate-400' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Analytics</h1>
      <p className="muted text-sm mb-8">Your meeting insights at a glance</p>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface rounded-2xl p-5 flex items-center gap-4">
            <Icon className={`w-8 h-8 ${color} shrink-0`} />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="muted text-xs mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Per-meeting table */}
      <h2 className="text-lg font-semibold mb-4">Per Meeting Breakdown</h2>
      {data.meetings.length === 0 ? (
        <div className="surface rounded-2xl p-12 text-center muted text-sm">No meeting data yet</div>
      ) : (
        <div className="surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))]">
                  {['Meeting', 'Lines', 'Questions', 'Answered', 'Unanswered', 'Duplicates', 'Summary'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left muted font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.meetings.map((m) => (
                  <tr key={m.meeting_id} className="border-b border-[rgb(var(--border))] last:border-0 hover:bg-[rgb(var(--bg))] transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/meetings/${m.meeting_id}`} className="font-medium text-indigo-600 hover:underline">
                        {m.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 muted">{m.total_transcripts}</td>
                    <td className="px-5 py-3">{m.total_questions}</td>
                    <td className="px-5 py-3 text-green-600">{m.answered_questions}</td>
                    <td className="px-5 py-3 text-amber-500">{m.unanswered_questions}</td>
                    <td className="px-5 py-3 muted">{m.duplicate_questions}</td>
                    <td className="px-5 py-3">
                      {m.has_summary ? (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Yes</span>
                      ) : (
                        <span className="text-xs muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
