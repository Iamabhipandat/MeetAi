import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Share2,
  Sparkles,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Code,
  Check
} from 'lucide-react'

export default function NotesPage() {
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript'>('notes')
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`[My Note] Q3 Marketing Kickoff\n\nDiscussion Highlights:\n- Focus Area: Revisiting event theme options introduced in a previous meeting.\n- Key Exploration: Which theme directions feel strongest for moving forward.\n- Emerging Interest: Customer stories and real-world use cases stood out.\n\nIdeas Generated:\n- Customer Storytelling Theme: Emphasizes authenticity and engagement.\n- Real-World Use Cases: Highlights impact and practical relevance.`)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col bg-[var(--window-bg)] overflow-hidden font-sans select-none">
      {/* Top Notes Action Bar */}
      <div className="h-[46px] border-b border-[var(--sidebar-border)] px-6 flex items-center justify-between shrink-0 bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav('/')}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium p-1 rounded hover:bg-black/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="text-[var(--text-muted)]">|</span>
          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
            <button className="p-1.5 hover:text-[var(--text-primary)] rounded"><Bold className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 hover:text-[var(--text-primary)] rounded"><Italic className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 hover:text-[var(--text-primary)] rounded"><Underline className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 hover:text-[var(--text-primary)] rounded"><List className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 hover:text-[var(--text-primary)] rounded"><ListOrdered className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 hover:text-[var(--text-primary)] rounded"><Link className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 hover:text-[var(--text-primary)] rounded"><Code className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Avatar stack */}
          <div className="flex -space-x-1.5 items-center">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[9px] font-bold grid place-items-center border border-white">RS</div>
            <div className="w-6 h-6 rounded-full bg-amber-400 text-white text-[9px] font-bold grid place-items-center border border-white">KM</div>
            <div className="w-6 h-6 rounded-full bg-sky-400 text-white text-[9px] font-bold grid place-items-center border border-white">DP</div>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-[var(--zoom-blue)] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs hover:brightness-110"
          >
            {isCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Share2 className="w-3 h-3" />}
            <span>{isCopied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Document Body (Exact Replica of Image 2) */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 max-w-[860px] mx-auto w-full custom-scroll">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
          [My Note] Q3 Marketing Kickoff
        </h1>

        <div className="flex items-center gap-2 mb-8 text-xs text-[var(--text-muted)]">
          <span
            onClick={() => setActiveTab('notes')}
            className={activeTab === 'notes' ? 'text-[var(--zoom-blue)] font-semibold cursor-pointer underline' : 'cursor-pointer hover:underline'}
          >
            Manual notes
          </span>
          <span>·</span>
          <span
            onClick={() => setActiveTab('transcript')}
            className={activeTab === 'transcript' ? 'text-[var(--zoom-blue)] font-semibold cursor-pointer underline' : 'cursor-pointer hover:underline'}
          >
            AI Transcript Analysis
          </span>
        </div>

        {/* Formatted Content */}
        <div className="flex flex-col gap-6 text-sm text-[var(--text-primary)] leading-relaxed">
          <section>
            <h3 className="text-sm font-bold text-[var(--zoom-blue)] uppercase tracking-wider mb-2">
              Discussion Highlights
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--text-secondary)]">
              <li>
                <strong className="text-[var(--text-primary)]">Focus Area:</strong> Revisiting event theme options introduced in a previous meeting.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Key Exploration:</strong> Which theme directions feel strongest for moving forward.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Emerging Interest:</strong> Customer stories and real-world use cases stood out strongly.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[var(--zoom-blue)] uppercase tracking-wider mb-2">
              Ideas Generated
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--text-secondary)]">
              <li>
                <strong className="text-[var(--text-primary)]">Customer Storytelling Theme:</strong> Emphasizes authenticity and deep engagement.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Real-World Use Cases:</strong> Highlights product impact and practical business relevance.
              </li>
            </ul>
          </section>

          <div className="p-4 rounded-xl bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] mt-4 text-xs text-[var(--text-secondary)] italic leading-relaxed">
            "Follow-up conversation will ensure the selected theme supports overall Q3 goals and provides a strong foundation for upcoming creative work."
          </div>

          {/* Bottom AI Buttons from Image 2 */}
          <div className="flex items-center gap-3 pt-6 border-t border-[var(--sidebar-border)] mt-6">
            <button className="px-3.5 py-1.5 rounded-lg border border-[var(--sidebar-border)] text-xs text-[var(--text-primary)] hover:bg-black/5 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[var(--zoom-blue)]" />
              <span>+ Regenerate</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-lg border border-[var(--sidebar-border)] text-xs text-[var(--text-primary)] hover:bg-black/5 flex items-center gap-1.5 font-medium">
              <span>Template: Short brainstorm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
