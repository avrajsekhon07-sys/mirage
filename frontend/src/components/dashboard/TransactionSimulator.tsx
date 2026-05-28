import { useState } from 'react'
import { transactionsApi } from '../../services/api'
import clsx from 'clsx'

const CATEGORIES = [
  'retail', 'food', 'entertainment', 'subscription',
  'transfer', 'crypto', 'gambling', 'investment', 'unknown',
]

interface SimResult {
  prev_risk: number
  new_risk: number
  risk_delta: number
  risk_level: string
  flagged: boolean
  flag_reason: string | null
  transaction: { merchant: string; amount: number; category: string }
}

interface AttackResult {
  transactions: { merchant: string; amount: number; category: string }[]
  prev_risk: number
  new_risk: number
  risk_delta: number
  risk_level: string
  tx_count: number
}

const RISK_COLOR: Record<string, string> = {
  low: 'text-mirage-success',
  medium: 'text-mirage-warning',
  high: 'text-orange-500',
  critical: 'text-mirage-danger',
}

const DELTA_COLOR = (d: number) => d > 5 ? 'text-mirage-danger' : d > 0 ? 'text-mirage-warning' : d < 0 ? 'text-mirage-success' : 'text-mirage-muted'

export default function TransactionSimulator({ onComplete }: { onComplete?: () => void }) {
  const [amount, setAmount]     = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('retail')
  const [submitting, setSubmitting] = useState(false)
  const [attacking, setAttacking]   = useState(false)
  const [simResult, setSimResult]   = useState<SimResult | null>(null)
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setSubmitting(true)
    setSimResult(null)
    setAttackResult(null)
    setError(null)
    try {
      const res = await transactionsApi.simulate({
        amount: parseFloat(amount),
        merchant: merchant || category,
        category,
      })
      setSimResult(res.data)
      onComplete?.()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Simulation failed')
    }
    setSubmitting(false)
  }

  const handleAttack = async () => {
    setAttacking(true)
    setSimResult(null)
    setAttackResult(null)
    setError(null)
    try {
      const res = await transactionsApi.attackSim()
      setAttackResult(res.data)
      onComplete?.()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Attack simulation failed')
    }
    setAttacking(false)
  }

  return (
    <div className="panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-mirage-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">
          Transaction Simulator
        </span>
        <span className="text-[10px] font-mono text-mirage-dim">ML Engine · Real-time scoring</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Manual submit form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-mirage-muted mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-mono text-mirage-muted">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-28 bg-mirage-bg border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent pl-6 pr-2 py-2 text-[12px] font-mono text-white outline-none transition-colors tabular-nums"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-mirage-muted mb-1">Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              placeholder="Optional"
              className="w-36 bg-mirage-bg border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent px-2.5 py-2 text-[12px] font-mono text-white outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-mirage-muted mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-mirage-bg border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent px-2.5 py-2 text-[12px] font-mono text-white outline-none transition-colors appearance-none pr-6"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting || !amount}
            className="flex items-center gap-1.5 px-4 py-2 border border-mirage-accent text-mirage-accent hover:bg-mirage-accent hover:text-mirage-bg text-[11px] font-mono tracking-[0.06em] uppercase transition-colors disabled:opacity-40"
          >
            {submitting && <span className="spinner" />}
            {submitting ? 'Scoring...' : 'Submit TX'}
          </button>

          <button
            type="button"
            onClick={handleAttack}
            disabled={attacking || submitting}
            className="flex items-center gap-1.5 px-4 py-2 border border-mirage-danger text-mirage-danger hover:bg-mirage-danger hover:text-white text-[11px] font-mono tracking-[0.06em] uppercase transition-colors disabled:opacity-40 ml-auto"
          >
            {attacking && <span className="spinner" style={{ borderTopColor: '#DC2626' }} />}
            {attacking ? 'Simulating...' : '⚡ Simulate Attack'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="px-3 py-2 bg-mirage-danger/8 border border-mirage-danger/30 text-mirage-danger text-[11px] font-mono">
            {error}
          </div>
        )}

        {/* Single TX result */}
        {simResult && (
          <div className="border border-mirage-border-hi bg-mirage-bg p-3 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">Result</p>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-[9px] font-mono text-mirage-muted mb-0.5">MERCHANT</p>
                <p className="text-[13px] text-white">{simResult.transaction.merchant}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-mirage-muted mb-0.5">AMOUNT</p>
                <p className="text-[13px] font-mono tabular-nums text-white">
                  ${simResult.transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-mirage-muted mb-0.5">RISK SHIFT</p>
                <p className="text-[16px] font-mono font-bold tabular-nums">
                  <span className="text-mirage-muted">{simResult.prev_risk}%</span>
                  <span className="text-mirage-muted mx-1.5">→</span>
                  <span className={RISK_COLOR[simResult.risk_level]}>{simResult.new_risk}%</span>
                  <span className={clsx('text-[11px] ml-1.5', DELTA_COLOR(simResult.risk_delta))}>
                    {simResult.risk_delta > 0 ? `▲ +${simResult.risk_delta}%` : simResult.risk_delta < 0 ? `▼ ${simResult.risk_delta}%` : '─ 0%'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-mirage-muted mb-0.5">LEVEL</p>
                <span className={clsx('text-[10px] font-mono uppercase border px-1.5 py-px', RISK_COLOR[simResult.risk_level], {
                  'border-mirage-success/30': simResult.risk_level === 'low',
                  'border-mirage-warning/30': simResult.risk_level === 'medium',
                  'border-orange-500/30': simResult.risk_level === 'high',
                  'border-mirage-danger/30': simResult.risk_level === 'critical',
                })}>
                  {simResult.risk_level}
                </span>
              </div>
              {simResult.flagged && (
                <div className="border-l-2 border-l-mirage-danger pl-2">
                  <p className="text-[9px] font-mono text-mirage-danger uppercase tracking-wider">Flagged</p>
                  <p className="text-[10px] text-mirage-text-dim">{simResult.flag_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attack simulation result */}
        {attackResult && (
          <div className="border border-mirage-danger/40 bg-mirage-danger/[0.03] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-danger">Attack Sequence — {attackResult.tx_count} Transactions</p>
              <span className={clsx('text-[9px] font-mono uppercase border px-1.5 py-px', RISK_COLOR[attackResult.risk_level], {
                'border-mirage-success/30': attackResult.risk_level === 'low',
                'border-mirage-warning/30': attackResult.risk_level === 'medium',
                'border-orange-500/30': attackResult.risk_level === 'high',
                'border-mirage-danger/30': attackResult.risk_level === 'critical',
              })}>
                {attackResult.risk_level}
              </span>
            </div>

            {/* Tx log */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {attackResult.transactions.map((tx, i) => (
                <div key={i} className="flex items-center gap-3 text-[11px] font-mono py-1 border-b border-mirage-border/50 last:border-0">
                  <span className="text-mirage-danger">✗</span>
                  <span className="text-white flex-1">{tx.merchant}</span>
                  <span className="text-mirage-warning uppercase text-[10px]">{tx.category}</span>
                  <span className="text-mirage-danger tabular-nums">${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            {/* Risk summary */}
            <div className="flex items-center gap-2 pt-1 border-t border-mirage-border/50">
              <span className="text-[10px] font-mono text-mirage-muted">RISK:</span>
              <span className="text-[16px] font-mono font-bold tabular-nums">
                <span className="text-mirage-muted">{attackResult.prev_risk}%</span>
                <span className="text-mirage-muted mx-1.5">→</span>
                <span className={RISK_COLOR[attackResult.risk_level]}>{attackResult.new_risk}%</span>
              </span>
              <span className={clsx('text-[12px] font-mono font-bold', DELTA_COLOR(attackResult.risk_delta))}>
                ▲ +{attackResult.risk_delta}%
              </span>
              <span className="text-[10px] font-mono text-mirage-muted ml-auto">Detection engine triggered · Check Alerts</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
