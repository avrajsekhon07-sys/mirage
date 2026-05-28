import clsx from 'clsx'

interface Props {
  label: string
  value: string
  color?: 'accent' | 'danger' | 'warning' | 'success' | 'default'
  trend?: 'up' | 'down' | 'neutral'
  sub?: string
}

const VALUE_COLOR = {
  accent: 'text-mirage-accent',
  danger: 'text-mirage-danger',
  warning: 'text-mirage-warning',
  success: 'text-mirage-success',
  default: 'text-white',
}

const TREND_COLOR = {
  up: 'text-mirage-danger',
  down: 'text-mirage-success',
  neutral: 'text-mirage-muted',
}

const TREND_GLYPH = { up: '▲', down: '▼', neutral: '─' }

export default function StatCard({ label, value, color = 'default', trend, sub }: Props) {
  return (
    <div className="panel panel-hover p-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-2.5">{label}</p>
      <p className={clsx('text-[30px] font-mono font-bold leading-none tabular-nums', VALUE_COLOR[color])}>
        {value}
      </p>
      {(trend || sub) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && (
            <span className={clsx('text-[10px] font-mono', TREND_COLOR[trend])}>
              {TREND_GLYPH[trend]}
            </span>
          )}
          {sub && <span className="text-[10px] font-mono text-mirage-muted">{sub}</span>}
        </div>
      )}
    </div>
  )
}
