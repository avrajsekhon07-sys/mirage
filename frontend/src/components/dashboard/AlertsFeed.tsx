import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const SEV: Record<string, { border: string; text: string; tag: string }> = {
  low:      { border: 'border-l-mirage-accent',  text: 'text-mirage-accent',  tag: 'LOW'  },
  medium:   { border: 'border-l-mirage-warning', text: 'text-mirage-warning', tag: 'MED'  },
  high:     { border: 'border-l-orange-500',      text: 'text-orange-500',     tag: 'HIGH' },
  critical: { border: 'border-l-mirage-danger',  text: 'text-mirage-danger',  tag: 'CRIT' },
}

function d(ts: string) {
  try { return format(parseISO(ts), 'MMM d HH:mm') } catch { return '' }
}

export default function AlertsFeed({ alerts }: { alerts: any[] }) {
  return (
    <div className="panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-mirage-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">Recent Alerts</span>
        <Link to="/alerts" className="text-[10px] font-mono text-mirage-accent hover:text-mirage-accent-dim transition-colors">
          ALL →
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-[11px] font-mono text-mirage-muted">No alerts detected</p>
        </div>
      ) : (
        <div className="divide-y divide-mirage-border">
          {alerts.slice(0, 6).map((alert, i) => {
            const s = SEV[alert.severity] || SEV.medium
            return (
              <div key={alert.id || i}
                className={clsx('flex items-start gap-3 px-4 py-3 border-l-2 hover:bg-white/[0.02] transition-colors', s.border)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={clsx('text-[11px] font-mono font-semibold uppercase tracking-wide truncate', s.text)}>
                      {alert.title}
                    </p>
                    {!alert.is_read && <span className="w-1.5 h-1.5 rounded-full bg-mirage-accent flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-mirage-text-dim leading-snug line-clamp-1">{alert.message}</p>
                  <p className="text-[10px] font-mono text-mirage-muted mt-0.5">{alert.created_at ? d(alert.created_at) : ''}</p>
                </div>
                <span className={clsx('text-[9px] font-mono uppercase border px-1.5 py-px flex-shrink-0 mt-0.5', s.text, {
                  'border-mirage-accent/30':  alert.severity === 'low',
                  'border-mirage-warning/30': alert.severity === 'medium',
                  'border-orange-500/30':     alert.severity === 'high',
                  'border-mirage-danger/30':  alert.severity === 'critical',
                })}>
                  {s.tag}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
