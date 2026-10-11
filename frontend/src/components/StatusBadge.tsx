import clsx from 'clsx'
import { Play, CheckCircle, Clock } from 'lucide-react'

const config = {
  ACTIVE:     { label: 'Active',     cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',  Icon: Play },
  SCHEDULED:  { label: 'Scheduled', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',   Icon: Clock },
  ENDED:      { label: 'Ended',      cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500',                          Icon: CheckCircle },
}

export default function StatusBadge({ status }: { status: 'ACTIVE' | 'SCHEDULED' | 'ENDED' }) {
  const { label, cls, Icon } = config[status]
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', cls)}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  )
}
