import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { format, parseISO } from 'date-fns'
import { RootState } from '../store/store'
import { transactionsApi } from '../services/api'
import clsx from 'clsx'

const CATS = ['','gambling','crypto','retail','food','entertainment','transfer','investment','subscription','unknown']
const CAT_CLR: Record<string, string> = {
  gambling: 'text-mirage-danger', crypto: 'text-orange-400', retail: 'text-mirage-text-dim',
  food: 'text-mirage-accent', entertainment: 'text-mirage-warning', transfer: 'text-mirage-text-dim',
  investment: 'text-mirage-text-dim', subscription: 'text-mirage-text-dim', unknown: 'text-mirage-muted',
}

function fmtD(ts: string) { try { return format(parseISO(ts), 'MMM dd') } catch { return '—' } }
function fmtT(ts: string) { try { return format(parseISO(ts), 'HH:mm') } catch { return '—' } }

const PAGE = 25

export default function TransactionsPage() {
  const [txs,     setTxs]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat,     setCat]     = useState('')
  const [flagged, setFlagged] = useState(false)
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)

  const wsRecent = useSelector((s: RootState) => s.dashboard.data?.recent_transactions || [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await transactionsApi.list({ page, page_size: PAGE, flagged_only: flagged, category: cat || undefined })
      setTxs(r.data.items); setTotal(r.data.total)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [page, cat, flagged])
  useEffect(() => {
    if (wsRecent.length && page === 1) {
      setTxs(prev => {
        const ids = new Set(prev.map((t: any) => t.id))
        return [...wsRecent.filter((t: any) => !ids.has(t.id)), ...prev].slice(0, PAGE)
      })
    }
  }, [wsRecent])

  const pages = Math.ceil(total / PAGE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-mirage-border">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-mirage-muted">Financial Data</p>
          <h1 className="text-[28px] font-bold text-white tracking-tight mt-0.5 leading-none">Transaction Stream</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-mirage-muted tabular-nums">{total.toLocaleString()} RECORDS</span>
          <button onClick={load} className="text-[10px] font-mono text-mirage-muted hover:text-white border border-mirage-border hover:border-mirage-border-hi px-2.5 py-1.5 transition-colors">
            REFRESH
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono text-mirage-muted mr-1">CAT:</span>
        {CATS.map(c => (
          <button key={c||'all'} onClick={() => { setCat(c); setPage(1) }}
            className={clsx('text-[10px] font-mono px-2.5 py-1 border transition-colors',
              cat === c
                ? 'border-mirage-accent text-mirage-accent'
                : 'border-mirage-border text-mirage-muted hover:border-mirage-border-hi hover:text-white'
            )}>
            {c.toUpperCase() || 'ALL'}
          </button>
        ))}
        <button onClick={() => { setFlagged(!flagged); setPage(1) }}
          className={clsx('ml-auto text-[10px] font-mono px-2.5 py-1 border transition-colors',
            flagged ? 'border-mirage-danger text-mirage-danger' : 'border-mirage-border text-mirage-muted hover:border-mirage-border-hi'
          )}>
          {flagged ? '▲' : '○'} FLAGGED
        </button>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-mirage-border">
                {['Date','Time','Merchant','Category','Amount','Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-mono text-mirage-muted uppercase tracking-[0.08em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mirage-border">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><div className="spinner mx-auto" /></td></tr>
              ) : txs.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-[11px] font-mono text-mirage-muted">No transactions found</td></tr>
              ) : txs.map((tx, i) => (
                <tr key={tx.id||i}
                  className={clsx('hover:bg-white/[0.02] transition-colors',
                    tx.is_flagged && 'border-l-2 border-l-mirage-danger bg-mirage-danger/[0.02]')}>
                  <td className="px-4 py-2.5 text-[11px] font-mono text-mirage-muted tabular-nums">
                    {tx.timestamp ? fmtD(tx.timestamp) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[11px] font-mono text-mirage-muted tabular-nums">
                    {tx.timestamp ? fmtT(tx.timestamp) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-[13px] text-white font-medium leading-snug">{tx.merchant || '—'}</p>
                    {tx.description && <p className="text-[10px] text-mirage-muted truncate max-w-[180px]">{tx.description}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[10px] font-mono uppercase', CAT_CLR[tx.category] || 'text-mirage-muted')}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[13px] font-mono font-semibold tabular-nums', tx.is_flagged ? 'text-mirage-danger' : 'text-white')}>
                      ${Number(tx.amount||0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {tx.is_flagged
                      ? <span className="text-[10px] font-mono text-mirage-danger border border-mirage-danger/30 px-1.5 py-px">FLAGGED</span>
                      : <span className="text-[10px] font-mono text-mirage-accent">CLEAR</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-mirage-border">
            <span className="text-[10px] font-mono text-mirage-muted tabular-nums">
              PAGE {page} / {pages} — {total.toLocaleString()} RECORDS
            </span>
            <div className="flex gap-2">
              {[['← PREV', () => setPage(p => Math.max(1, p-1)), page===1],
                ['NEXT →', () => setPage(p => Math.min(pages, p+1)), page>=pages]].map(([label, fn, dis]) => (
                <button key={label as string} onClick={fn as any} disabled={dis as boolean}
                  className="text-[10px] font-mono px-3 py-1.5 border border-mirage-border text-mirage-muted hover:text-white hover:border-mirage-border-hi disabled:opacity-30 transition-colors">
                  {label as string}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
