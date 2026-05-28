import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { format, parseISO } from 'date-fns'
import { AppDispatch, RootState } from '../store/store'
import { fetchAlerts, markAlertRead } from '../store/alertsSlice'
import { alertsApi } from '../services/api'
import clsx from 'clsx'

const SEV: Record<string, { border: string; text: string; tag: string; tagBorder: string }> = {
  low:      { border: 'border-l-mirage-accent',  text: 'text-mirage-accent',  tag: 'LOW',  tagBorder: 'border-mirage-accent/30'  },
  medium:   { border: 'border-l-mirage-warning', text: 'text-mirage-warning', tag: 'MED',  tagBorder: 'border-mirage-warning/30' },
  high:     { border: 'border-l-orange-500',      text: 'text-orange-500',     tag: 'HIGH', tagBorder: 'border-orange-500/30'     },
  critical: { border: 'border-l-mirage-danger',  text: 'text-mirage-danger',  tag: 'CRIT', tagBorder: 'border-mirage-danger/30'  },
}

function fmtDate(ts: string) { try { return format(parseISO(ts), 'MMM d, HH:mm') } catch { return '' } }

export default function AlertsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { items: alerts, loading } = useSelector((s: RootState) => s.alerts)
  const unread = alerts.filter(a => !a.is_read).length

  useEffect(() => { dispatch(fetchAlerts()) }, [dispatch])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-mirage-border">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-mirage-muted">Behavioral Detection</p>
          <h1 className="text-[28px] font-bold text-white tracking-tight mt-0.5 leading-none">Alert Center</h1>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && <span className="text-[11px] font-mono text-mirage-muted tabular-nums">{unread} UNREAD</span>}
          {unread > 0 && (
            <button
              onClick={async () => { await alertsApi.markAllRead(); dispatch(fetchAlerts()) }}
              className="text-[10px] font-mono text-mirage-muted hover:text-white border border-mirage-border hover:border-mirage-border-hi px-2.5 py-1.5 transition-colors">
              MARK ALL READ
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      {!loading && alerts.length > 0 && (
        <div className="panel px-5 py-3 flex items-center gap-8">
          {(['critical','high','medium','low'] as const).map(sev => {
            const count = alerts.filter(a => a.severity === sev).length
            return (
              <div key={sev} className="flex items-baseline gap-2">
                <span className={clsx('text-[10px] font-mono uppercase', SEV[sev].text)}>{sev}</span>
                <span className={clsx('text-[22px] font-mono font-bold tabular-nums', SEV[sev].text)}>{count}</span>
              </div>
            )
          })}
          <div className="ml-auto flex items-baseline gap-2">
            <span className="text-[10px] font-mono text-mirage-muted">TOTAL</span>
            <span className="text-[22px] font-mono font-bold text-white tabular-nums">{alerts.length}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-mirage-accent font-mono text-[14px] font-bold">● ALL CLEAR</p>
          <p className="text-[11px] font-mono text-mirage-muted mt-2">No behavioral alerts detected</p>
        </div>
      ) : (
        <div className="panel divide-y divide-mirage-border">
          {alerts.map(alert => {
            const s = SEV[alert.severity] || SEV.medium
            return (
              <div key={alert.id}
                className={clsx('flex gap-4 px-5 py-4 border-l-2 hover:bg-white/[0.015] transition-colors', s.border, !alert.is_read && 'bg-white/[0.01]')}>

                <div className="flex-shrink-0 w-10 pt-0.5">
                  <span className={clsx('text-[9px] font-mono border px-1 py-px', s.text, s.tagBorder)}>
                    {s.tag}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={clsx('text-[12px] font-mono font-semibold uppercase tracking-wide', s.text)}>{alert.title}</h3>
                      {!alert.is_read && <span className="w-1.5 h-1.5 rounded-full bg-mirage-accent flex-shrink-0" />}
                    </div>
                    <span className="text-[10px] font-mono text-mirage-muted flex-shrink-0 tabular-nums">
                      {alert.created_at ? fmtDate(alert.created_at) : ''}
                    </span>
                  </div>

                  <p className="text-[12px] text-mirage-text-dim leading-relaxed">{alert.message}</p>

                  {alert.ai_explanation && (
                    <div className="mt-2.5 px-3 py-2 bg-mirage-bg border border-mirage-border">
                      <p className="text-[9px] font-mono text-mirage-muted tracking-[0.08em] uppercase mb-1">AI Explanation</p>
                      <p className="text-[11px] text-mirage-text-dim leading-relaxed">{alert.ai_explanation}</p>
                    </div>
                  )}

                  {!alert.is_read && (
                    <button onClick={() => dispatch(markAlertRead(alert.id))}
                      className="mt-2 text-[10px] font-mono text-mirage-muted hover:text-mirage-accent transition-colors">
                      MARK READ →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
