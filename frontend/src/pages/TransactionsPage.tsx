import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Filter, CreditCard, RefreshCw } from 'lucide-react'
import { RootState } from '../store/store'
import { transactionsApi } from '../services/api'
import clsx from 'clsx'

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  gambling: { label: 'Gambling', color: 'text-mirage-danger bg-mirage-danger/10 border-mirage-danger/20' },
  crypto: { label: 'Crypto', color: 'text-mirage-purple bg-mirage-purple/10 border-mirage-purple/20' },
  retail: { label: 'Retail', color: 'text-mirage-accent bg-mirage-accent/10 border-mirage-accent/20' },
  food: { label: 'Food', color: 'text-mirage-success bg-mirage-success/10 border-mirage-success/20' },
  entertainment: { label: 'Entertainment', color: 'text-mirage-warning bg-mirage-warning/10 border-mirage-warning/20' },
  transfer: { label: 'Transfer', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  investment: { label: 'Investment', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  subscription: { label: 'Subscription', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  unknown: { label: 'Unknown', color: 'text-mirage-muted bg-mirage-border border-mirage-border' },
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  const recentFromWS = useSelector((s: RootState) => s.dashboard.data?.recent_transactions || [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await transactionsApi.list({ page, page_size: PAGE_SIZE, flagged_only: flaggedOnly, category: filter || undefined })
      setTransactions(res.data.items)
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filter, flaggedOnly])

  // Inject live WS transactions at top
  useEffect(() => {
    if (recentFromWS.length && page === 1) {
      setTransactions(prev => {
        const ids = new Set(prev.map((t: any) => t.id))
        const newOnes = recentFromWS.filter((t: any) => !ids.has(t.id))
        return [...newOnes, ...prev].slice(0, PAGE_SIZE)
      })
    }
  }, [recentFromWS])

  const CATEGORIES = ['', 'gambling', 'crypto', 'retail', 'food', 'entertainment', 'transfer', 'investment', 'subscription', 'unknown']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-mirage-text tracking-wide">
            TRANSACTION <span className="text-mirage-accent">STREAM</span>
          </h1>
          <p className="text-mirage-muted text-sm font-mono mt-1">{total} total transactions</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-mirage-card border border-mirage-border text-mirage-muted hover:text-mirage-accent transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-mirage-card border border-mirage-border">
        <Filter className="w-4 h-4 text-mirage-muted" />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat || 'all'}
              onClick={() => { setFilter(cat); setPage(1) }}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-mono border transition-all',
                filter === cat
                  ? 'bg-mirage-accent text-mirage-bg border-mirage-accent'
                  : 'text-mirage-muted border-mirage-border hover:border-mirage-accent/30'
              )}
            >
              {cat || 'ALL'}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setFlaggedOnly(!flaggedOnly); setPage(1) }}
          className={clsx(
            'ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all',
            flaggedOnly
              ? 'bg-mirage-danger/10 text-mirage-danger border-mirage-danger/30'
              : 'text-mirage-muted border-mirage-border hover:border-mirage-danger/30'
          )}
        >
          <AlertTriangle className="w-3 h-3" />
          FLAGGED ONLY
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-mirage-border">
                {['TIME', 'MERCHANT', 'CATEGORY', 'AMOUNT', 'STATUS'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono text-mirage-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mirage-border">
              <AnimatePresence initial={false}>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12"><div className="spinner mx-auto" /></td></tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <CreditCard className="w-10 h-10 text-mirage-muted opacity-30 mx-auto mb-3" />
                      <p className="text-mirage-muted font-mono text-sm">No transactions found</p>
                    </td>
                  </tr>
                ) : transactions.map((tx, i) => {
                  const catCfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.unknown
                  return (
                    <motion.tr
                      key={tx.id || i}
                      initial={{ opacity: 0, backgroundColor: 'rgba(0,212,255,0.05)' }}
                      animate={{ opacity: 1, backgroundColor: 'transparent' }}
                      className={clsx('hover:bg-mirage-card/50 transition-colors', tx.is_flagged && 'bg-mirage-danger/3')}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-mono text-mirage-text">
                            {tx.timestamp ? (() => { try { return format(parseISO(tx.timestamp), 'MMM d, yyyy') } catch { return '—' } })() : '—'}
                          </p>
                          <p className="text-[10px] font-mono text-mirage-muted">
                            {tx.timestamp ? (() => { try { return format(parseISO(tx.timestamp), 'HH:mm:ss') } catch { return '' } })() : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-mirage-text font-medium">{tx.merchant || '—'}</p>
                        {tx.description && <p className="text-xs text-mirage-muted truncate max-w-48">{tx.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-[10px] font-mono px-2 py-1 rounded border uppercase tracking-wider', catCfg.color)}>
                          {catCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={clsx('text-sm font-mono font-bold', tx.is_flagged ? 'text-mirage-danger' : 'text-mirage-text')}>
                          ${Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {tx.is_flagged ? (
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-mirage-danger" />
                            <span className="text-xs text-mirage-danger font-mono">FLAGGED</span>
                          </div>
                        ) : (
                          <span className="text-xs text-mirage-success font-mono">CLEAR</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-mirage-border">
            <p className="text-xs text-mirage-muted font-mono">
              Page {page} of {Math.ceil(total / PAGE_SIZE)} — {total} records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded text-xs font-mono bg-mirage-card border border-mirage-border text-mirage-muted hover:text-mirage-accent disabled:opacity-40 transition-all"
              >
                ← PREV
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / PAGE_SIZE)}
                className="px-3 py-1.5 rounded text-xs font-mono bg-mirage-card border border-mirage-border text-mirage-muted hover:text-mirage-accent disabled:opacity-40 transition-all"
              >
                NEXT →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
