import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const SEV_BORDER: Record<string, string> = {
  low: 'border-l-mirage-success',
  medium: 'border-l-mirage-warning',
  high: 'border-l-orange-500',
  critical: 'border-l-mirage-danger',
}

const SEV_TEXT: Record<string, string> = {
  low: 'text-mirage-success',
  medium: 'text-mirage-warning',
  high: 'text-orange-500',
  critical: 'text-mirage-danger',
}

const SEV_BORDER_LABEL: Record<string, string> = {
  low: 'border-mirage-success/30',
  medium: 'border-mirage-warning/30',
  high: 'border-orange-500/30',
  critical: 'border-mirage-danger/30',
}

function fmtDate(ts: string) {
  try { return format(parseISO(ts), 'MMM d, HH:mm') } catch { return '' }
}

export default function AlertsFeed({ alerts }: { alerts: any[] }) {
  return (
    <div className="panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-mirage-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">Recent Alerts</span>
        <Link to="/alerts" className="text-[10px] font-mono text-mirage-accent hover:text-mirage-accent-dim transition-colors">
          ALL ALERTS →
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-[11px] font-mono text-mirage-muted">No alerts detected</p>
        </div>
      ) : (
        <div className="divide-y divide-mirage-border">
          {alerts.slice(0, 6).map((alert, i) => (
            <div
              key={alert.id || i}
              className={clsx(
                'flex items-start gap-3 px-4 py-3 border-l-2 hover:bg-white/[0.02] transition-colors',
                SEV_BORDER[alert.severity] || 'border-l-mirage-muted'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={clsx('text-[11px] font-mono font-semibold uppercase tracking-wide truncate', SEV_TEXT[alert.severity] || 'text-white')}>
                    {alert.title}
                  </p>
                  {!alert.is_read && <span className="w-1.5 h-1.5 rounded-full bg-mirage-accent flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-mirage-text-dim leading-snug line-clamp-2">{alert.message}</p>
                <p className="text-[10px] font-mono text-mirage-muted mt-1">{alert.created_at ? fmtDate(alert.created_at) : ''}</p>
              </div>

              <span className={clsx(
                'text-[9px] font-mono uppercase border px-1.5 py-px flex-shrink-0 mt-0.5',
                SEV_TEXT[alert.severity] || 'text-mirage-muted',
                SEV_BORDER_LABEL[alert.severity] || 'border-mirage-border'
              )}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
