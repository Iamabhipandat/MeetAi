import { useState } from 'react'
import { searchApi } from '../lib/api'
import type { SearchResult } from '../lib/types'
import { Search, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const r = await searchApi.search(query.trim())
      setResults(r.data.results)
    } finally {
      setLoading(false)
    }
  }

  const highlight = (text: string, q: string) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded px-0.5">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Search</h1>
      <p className="muted text-sm mb-6">Search across all your meeting transcripts</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings, transcripts…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl surface focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searched && !loading && (
        <p className="muted text-sm mb-4">
          {results.length === 0 ? 'No results found.' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      <div className="space-y-3">
        {results.map((r) => (
          <Link
            key={r.transcript_id}
            to={`/meetings/${r.meeting_id}`}
            className="surface rounded-2xl p-5 block hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
                {r.meeting_title}
              </span>
              <span className="muted text-xs">· {r.speaker}</span>
            </div>
            <p className="text-sm leading-relaxed">{highlight(r.content, query)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
