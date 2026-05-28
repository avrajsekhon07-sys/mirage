import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const CAT_CLR: Record<string, string> = {
  gambling:      'text-mirage-danger',
  crypto:        'text-orange-400',
  retail:        'text-mirage-text-dim',
  food:          'text-mirage-accent',
  entertainment: 'text-mirage-warning',
  transfer:      'text-mirage-text-dim',
  investment:    'text-mirage-text-dim',
  subscription:  'text-mirage-text-dim',
  unknown:       'text-mirage-muted',
}

function t(ts: string) {
  try { return format(parseISO(ts), 'HH:mm') } catch { return '—' }
}

export default function RecentTransactions({ transactions }: { transactions: any[] }) {
  return (
    <div className="panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-mirage-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">Live Feed</span>
        <Link to="/transactions" className="text-[10px] font-mono text-mirage-accent hover:text-mirage-accent-dim transition-colors">
          ALL →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-[11px] font-mono text-mirage-muted">Awaiting transactions...</p>
        </div>
      ) : (
        <div className="divide-y divide-mirage-border">
          {transactions.slice(0, 8).map((tx, i) => (
            <div
              key={tx.id || i}
              className={clsx(
                'flex items-center gap-4 px-4 py-2.5 hover:bg-white/[0.02] transition-colors',
                tx.is_flagged && 'border-l-2 border-l-mirage-danger'
              )}
            >
              <span className="w-10 text-[10px] font-mono text-mirage-muted tabular-nums flex-shrink-0">
                {tx.timestamp ? t(tx.timestamp) : '—'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-white truncate leading-snug">{tx.merchant || '—'}</p>
                <p className={clsx('text-[10px] font-mono uppercase', CAT_CLR[tx.category] || 'text-mirage-muted')}>
                  {tx.category}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={clsx('text-[12px] font-mono font-semibold tabular-nums', tx.is_flagged ? 'text-mirage-danger' : 'text-white')}>
                  ${Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {tx.is_flagged && <p className="text-[9px] font-mono text-mirage-danger tracking-wider">FLAGGED</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
