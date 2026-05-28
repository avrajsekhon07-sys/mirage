import clsx from 'clsx'

interface Props { score: any }

const STROKE: Record<string, string> = {
  low: '#16A34A',
  medium: '#D97706',
  high: '#EA580C',
  critical: '#DC2626',
}

const LABEL_COLOR: Record<string, string> = {
  low: 'text-mirage-success border-mirage-success/30',
  medium: 'text-mirage-warning border-mirage-warning/30',
  high: 'text-orange-500 border-orange-500/30',
  critical: 'text-mirage-danger border-mirage-danger/30',
}

export default function RiskScoreGauge({ score }: Props) {
  const overall = score?.overall_score || 0
  const level = score?.risk_level || 'low'
  const stroke = STROKE[level] || '#16A34A'

  const size = 180
  const cx = size / 2
  const cy = size / 2
  const r = 70
  const sw = 7
  const startAngle = -220
  const totalAngle = 260

  const toRad = (deg: number) => (deg * Math.PI) / 180

  const arcPath = (startDeg: number, endDeg: number) => {
    const s = toRad(startDeg)
    const e = toRad(endDeg)
    const x1 = cx + r * Math.cos(s)
    const y1 = cy + r * Math.sin(s)
    const x2 = cx + r * Math.cos(e)
    const y2 = cy + r * Math.sin(e)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  const valueAngle = startAngle + totalAngle * overall

  const subs = [
    { label: 'Behavioral', value: score?.behavioral_risk || 0 },
    { label: 'Scam Susc.', value: score?.scam_susceptibility || 0 },
    { label: 'Gambling', value: score?.gambling_risk || 0 },
  ]

  const subStroke = (v: number) => {
    if (v < 0.25) return 'bg-mirage-success'
    if (v < 0.5) return 'bg-mirage-warning'
    if (v < 0.75) return 'bg-orange-500'
    return 'bg-mirage-danger'
  }

  return (
    <div className="panel panel-hover p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">Risk Score</span>
        <span className={clsx('text-[9px] font-mono uppercase border px-1.5 py-px', LABEL_COLOR[level])}>
          {level}
        </span>
      </div>

      <div className="flex justify-center">
        <svg width={size} height={Math.round(size * 0.72)} viewBox={`0 0 ${size} ${Math.round(size * 0.85)}`}>
          <path
            d={arcPath(startAngle, startAngle + totalAngle)}
            fill="none"
            stroke="#1A1A2C"
            strokeWidth={sw}
            strokeLinecap="square"
          />
          {overall > 0 && (
            <path
              d={arcPath(startAngle, valueAngle)}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
              strokeLinecap="square"
            />
          )}
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const a = toRad(startAngle + totalAngle * v)
            const x1 = cx + (r - sw - 2) * Math.cos(a)
            const y1 = cy + (r - sw - 2) * Math.sin(a)
            const x2 = cx + (r + 4) * Math.cos(a)
            const y2 = cy + (r + 4) * Math.sin(a)
            return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#282838" strokeWidth={1} />
          })}
          <text
            x={cx} y={cy + 18}
            textAnchor="middle"
            fill={stroke}
            fontSize="34"
            fontFamily="JetBrains Mono"
            fontWeight="700"
            letterSpacing="-2"
          >
            {(overall * 100).toFixed(0)}
          </text>
          <text
            x={cx} y={cy + 34}
            textAnchor="middle"
            fill="#5A5A6E"
            fontSize="9"
            fontFamily="JetBrains Mono"
            letterSpacing="3"
          >
            / 100
          </text>
        </svg>
      </div>

      <div className="space-y-3 mt-1">
        {subs.map(({ label, value }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-mono text-mirage-muted">{label}</span>
              <span className="text-[10px] font-mono text-white tabular-nums">{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="h-px bg-mirage-border overflow-hidden">
              <div className={clsx('h-full', subStroke(value))} style={{ width: `${value * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
