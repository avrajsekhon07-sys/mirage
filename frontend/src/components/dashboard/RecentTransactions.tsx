import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  gambling: 'text-mirage-danger bg-mirage-danger/10',
  crypto: 'text-mirage-purple bg-mirage-purple/10',
  retail: 'text-mirage-accent bg-mirage-accent/10',
  food: 'text-mirage-success bg-mirage-success/10',
  entertainment: 'text-mirage-warning bg-mirage-warning/10',
  transfer: 'text-orange-400 bg-orange-400/10',
  investment: 'text-blue-400 bg-blue-400/10',
  subscription: 'text-pink-400 bg-pink-400/10',
  unknown: 'text-mirage-muted bg-mirage-border',
}

interface Props {
  transactions: any[]
}

export default function RecentTransactions({ transactions }: Props) {
  return (
    <div className="card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm text-mirage-text tracking-wider">LIVE TRANSACTIONS</h3>
        <Link to="/transactions" className="text-xs text-mirage-accent hover:text-mirage-accent/80 flex items-center gap-1 font-mono">
          VIEW ALL <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-mirage-muted text-sm font-mono">Waiting for transactions...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {transactions.slice(0, 8).map((tx, i) => (
              <motion.div
                key={tx.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  tx.is_flagged
                    ? 'bg-mirage-danger/5 border-mirage-danger/20'
                    : 'bg-mirage-bg border-mirage-border hover:border-mirage-border/80'
                )}
              >
                <div className={clsx('text-[10px] font-mono px-2 py-1 rounded uppercase tracking-wider', CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.unknown)}>
                  {tx.category}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-mirage-text truncate font-medium">{tx.merchant || 'Unknown'}</p>
                  <p className="text-xs text-mirage-muted font-mono">
                    {tx.timestamp ? (() => { try { return format(parseISO(tx.timestamp), 'MMM d, HH:mm') } catch { return tx.timestamp } })() : '—'}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={clsx('text-sm font-mono font-bold', tx.is_flagged ? 'text-mirage-danger' : 'text-mirage-text')}>
                    ${Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {tx.is_flagged && (
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-mirage-danger" />
                      <span className="text-[10px] text-mirage-danger font-mono">FLAGGED</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
