import clsx from 'clsx'

interface Props {
  label: string
  value: string
  color?: 'accent' | 'danger' | 'warning' | 'default'
  trend?: 'up' | 'down' | 'neutral'
  sub?: string
  large?: boolean
}

const CLR = {
  accent:  'text-mirage-accent',
  danger:  'text-mirage-danger',
  warning: 'text-mirage-warning',
  default: 'text-white',
}

const TREND_CLR = { up: 'text-mirage-danger', down: 'text-mirage-accent', neutral: 'text-mirage-muted' }
const TREND_G   = { up: '▲', down: '▼', neutral: '─' }

export default function StatCard({ label, value, color = 'default', trend, sub, large }: Props) {
  return (
    <div className="panel panel-hover p-5">
      <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted mb-3">{label}</p>
      <p className={clsx('font-mono font-bold tabular-nums leading-none', large ? 'text-[42px]' : 'text-[34px]', CLR[color])}>
        {value}
      </p>
      {(trend || sub) && (
        <div className="flex items-center gap-1.5 mt-2.5">
          {trend && <span className={clsx('text-[11px] font-mono', TREND_CLR[trend])}>{TREND_G[trend]}</span>}
          {sub && <span className="text-[10px] font-mono text-mirage-muted">{sub}</span>}
        </div>
      )}
    </div>
  )
}
