import { useState } from 'react'
import { transactionsApi } from '../../services/api'
import clsx from 'clsx'

const CATS = ['retail','food','entertainment','subscription','transfer','crypto','gambling','investment','unknown']

const RISK_CLR: Record<string, string> = {
  low: 'text-mirage-accent', medium: 'text-mirage-warning',
  high: 'text-orange-500', critical: 'text-mirage-danger',
}

function deltaColor(d: number) {
  return d > 5 ? 'text-mirage-danger' : d > 0 ? 'text-mirage-warning' : d < 0 ? 'text-mirage-accent' : 'text-mirage-muted'
}

interface SimResult {
  prev_risk: number; new_risk: number; risk_delta: number; risk_level: string
  flagged: boolean; flag_reason: string | null
  transaction: { merchant: string; amount: number; category: string }
}

interface AttackResult {
  transactions: { merchant: string; amount: number; category: string }[]
  prev_risk: number; new_risk: number; risk_delta: number; risk_level: string; tx_count: number
}

export default function TransactionSimulator({ onComplete }: { onComplete?: () => void }) {
  const [amount,   setAmount]   = useState('')
  const [merchant, setMerchant] = useState('')
  const [cat,      setCat]      = useState('retail')
  const [busy,     setBusy]     = useState(false)
  const [attacking, setAttacking] = useState(false)
  const [result,   setResult]   = useState<SimResult | null>(null)
  const [attack,   setAttack]   = useState<AttackResult | null>(null)
  const [err,      setErr]      = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setBusy(true); setResult(null); setAttack(null); setErr(null)
    try {
      const r = await transactionsApi.simulate({ amount: parseFloat(amount), merchant: merchant || cat, category: cat })
      setResult(r.data); onComplete?.()
    } catch (e: any) { setErr(e.response?.data?.detail || 'Simulation failed') }
    setBusy(false)
  }

  const runAttack = async () => {
    setAttacking(true); setResult(null); setAttack(null); setErr(null)
    try {
      const r = await transactionsApi.attackSim()
      setAttack(r.data); onComplete?.()
    } catch (e: any) { setErr(e.response?.data?.detail || 'Attack simulation failed') }
    setAttacking(false)
  }

  return (
    <div className="panel">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-mirage-border">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">Transaction Simulator</span>
          <span className="text-[9px] font-mono text-mirage-dim border border-mirage-border px-1.5 py-px">ML SCORING · REAL-TIME</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Submit form */}
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          {/* Amount */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-mirage-muted mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-mono text-mirage-muted">$</span>
              <input
                type="number" min="0.01" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" required
                className="w-28 pl-6 pr-2 py-2 text-[12px] font-mono border border-mirage-border focus:border-mirage-accent bg-mirage-bg text-white outline-none tabular-nums"
              />
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-mirage-muted mb-1.5">Merchant</label>
            <input
              type="text" value={merchant} onChange={e => setMerchant(e.target.value)}
              placeholder="Optional"
              className="w-36 px-2.5 py-2 text-[12px] font-mono border border-mirage-border focus:border-mirage-accent bg-mirage-bg text-white outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-mirage-muted mb-1.5">Category</label>
            <select
              value={cat} onChange={e => setCat(e.target.value)}
              className="px-2.5 py-2 text-[12px] font-mono border border-mirage-border focus:border-mirage-accent bg-mirage-bg text-white outline-none appearance-none pr-6"
            >
              {CATS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={busy || !amount}
            className="flex items-center gap-1.5 px-5 py-2 bg-mirage-accent text-black text-[11px] font-mono font-bold uppercase tracking-[0.08em] hover:bg-white transition-colors disabled:opacity-40"
          >
            {busy && <span className="spinner" style={{ borderTopColor: '#000' }} />}
            {busy ? 'Scoring...' : 'Submit TX'}
          </button>

          {/* Attack */}
          <button
            type="button" onClick={runAttack} disabled={attacking || busy}
            className="flex items-center gap-1.5 px-5 py-2 border border-mirage-danger text-mirage-danger text-[11px] font-mono uppercase tracking-[0.08em] hover:bg-mirage-danger hover:text-white transition-colors disabled:opacity-40 ml-auto"
          >
            {attacking && <span className="spinner" />}
            {attacking ? 'Simulating...' : '⚡ Simulate Attack'}
          </button>
        </form>

        {/* Error */}
        {err && (
          <div className="px-3 py-2 border border-mirage-danger/30 text-mirage-danger text-[11px] font-mono">
            {err}
          </div>
        )}

        {/* Single TX result */}
        {result && (
          <div className="border border-mirage-border-hi bg-mirage-bg p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted mb-3">Scoring Result</p>
            <div className="flex items-center gap-8 flex-wrap">
              <div>
                <p className="text-[9px] font-mono text-mirage-muted mb-0.5">MERCHANT</p>
                <p className="text-[14px] font-medium text-white">{result.transaction.merchant}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-mirage-muted mb-0.5">AMOUNT</p>
                <p className="text-[14px] font-mono tabular-nums text-white">
                  ${result.transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-mirage-muted mb-0.5">RISK SHIFT</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[22px] font-mono font-bold tabular-nums text-mirage-text-dim">{result.prev_risk}%</span>
                  <span className="text-mirage-muted font-mono">→</span>
                  <span className={clsx('text-[22px] font-mono font-bold tabular-nums', RISK_CLR[result.risk_level])}>{result.new_risk}%</span>
                  <span className={clsx('text-[12px] font-mono ml-1', deltaColor(result.risk_delta))}>
                    {result.risk_delta > 0 ? `▲ +${result.risk_delta}%` : result.risk_delta < 0 ? `▼ ${result.risk_delta}%` : '─ 0%'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-mono text-mirage-muted mb-0.5">LEVEL</p>
                <span className={clsx('text-[11px] font-mono uppercase border px-2 py-px', RISK_CLR[result.risk_level], {
                  'border-mirage-accent/30':  result.risk_level === 'low',
                  'border-mirage-warning/30': result.risk_level === 'medium',
                  'border-orange-500/30':     result.risk_level === 'high',
                  'border-mirage-danger/30':  result.risk_level === 'critical',
                })}>
                  {result.risk_level}
                </span>
              </div>
              {result.flagged && (
                <div className="border-l-2 border-l-mirage-danger pl-3">
                  <p className="text-[9px] font-mono text-mirage-danger uppercase tracking-wider">Flagged</p>
                  <p className="text-[11px] text-mirage-text-dim">{result.flag_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attack result */}
        {attack && (
          <div className="border border-mirage-danger/40 bg-mirage-bg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-danger">
                Attack Sequence Executed — {attack.tx_count} Transactions
              </p>
              <span className={clsx('text-[9px] font-mono uppercase border px-1.5 py-px', RISK_CLR[attack.risk_level], {
                'border-mirage-accent/30':  attack.risk_level === 'low',
                'border-mirage-warning/30': attack.risk_level === 'medium',
                'border-orange-500/30':     attack.risk_level === 'high',
                'border-mirage-danger/30':  attack.risk_level === 'critical',
              })}>
                {attack.risk_level}
              </span>
            </div>

            <div className="space-y-1 max-h-44 overflow-y-auto mb-4">
              {attack.transactions.map((tx, i) => (
                <div key={i} className="flex items-center gap-3 text-[11px] font-mono py-1 border-b border-mirage-border/50 last:border-0">
                  <span className="text-mirage-danger">✗</span>
                  <span className="text-white flex-1">{tx.merchant}</span>
                  <span className="text-mirage-warning uppercase text-[10px]">{tx.category}</span>
                  <span className="text-mirage-danger tabular-nums">${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-mirage-border/50">
              <span className="text-[10px] font-mono text-mirage-muted">RISK:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[22px] font-mono font-bold tabular-nums text-mirage-text-dim">{attack.prev_risk}%</span>
                <span className="text-mirage-muted font-mono">→</span>
                <span className={clsx('text-[22px] font-mono font-bold tabular-nums', RISK_CLR[attack.risk_level])}>{attack.new_risk}%</span>
                <span className={clsx('text-[13px] font-mono font-bold ml-1', deltaColor(attack.risk_delta))}>
                  ▲ +{attack.risk_delta}%
                </span>
              </div>
              <span className="text-[10px] font-mono text-mirage-muted ml-auto">Detection triggered · Check Alerts</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
