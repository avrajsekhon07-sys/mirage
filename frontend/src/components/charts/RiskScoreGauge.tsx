import clsx from 'clsx'

interface Props { score: any }

const STROKE: Record<string, string> = {
  low: '#00FF94', medium: '#FFB800', high: '#FF6600', critical: '#FF3333',
}
const TEXT_CLR: Record<string, string> = {
  low: 'text-mirage-accent', medium: 'text-mirage-warning',
  high: 'text-orange-500',   critical: 'text-mirage-danger',
}

export default function RiskScoreGauge({ score }: Props) {
  const overall = score?.overall_score || 0
  const level   = score?.risk_level || 'low'
  const stroke  = STROKE[level] || '#00FF94'

  const size = 180, cx = 90, cy = 90, r = 70, sw = 7
  const startAngle = -220, totalAngle = 260

  const toRad = (d: number) => (d * Math.PI) / 180
  const arc = (s: number, e: number) => {
    const [x1,y1] = [cx + r*Math.cos(toRad(s)), cy + r*Math.sin(toRad(s))]
    const [x2,y2] = [cx + r*Math.cos(toRad(e)), cy + r*Math.sin(toRad(e))]
    return `M ${x1} ${y1} A ${r} ${r} 0 ${e-s>180?1:0} 1 ${x2} ${y2}`
  }

  const valueAngle = startAngle + totalAngle * overall

  const subs = [
    { label: 'Behavioral',  value: score?.behavioral_risk    || 0 },
    { label: 'Scam Susc.',  value: score?.scam_susceptibility || 0 },
    { label: 'Gambling',    value: score?.gambling_risk       || 0 },
  ]
  const barColor = (v: number) =>
    v < 0.25 ? 'bg-mirage-accent' : v < 0.5 ? 'bg-mirage-warning' : v < 0.75 ? 'bg-orange-500' : 'bg-mirage-danger'

  return (
    <div className="panel panel-hover p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">Risk Score</span>
        <span className={clsx('text-[9px] font-mono uppercase border px-1.5 py-px', TEXT_CLR[level], {
          'border-mirage-accent/30':  level === 'low',
          'border-mirage-warning/30': level === 'medium',
          'border-orange-500/30':     level === 'high',
          'border-mirage-danger/30':  level === 'critical',
        })}>
          {level}
        </span>
      </div>

      <div className="flex justify-center">
        <svg width={size} height={Math.round(size * 0.72)} viewBox={`0 0 ${size} ${Math.round(size * 0.85)}`}>
          <path d={arc(startAngle, startAngle+totalAngle)} fill="none" stroke="#1A1A1A" strokeWidth={sw} strokeLinecap="square" />
          {overall > 0 && (
            <path d={arc(startAngle, valueAngle)} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="square" />
          )}
          {[0,0.25,0.5,0.75,1].map(v => {
            const a = toRad(startAngle + totalAngle * v)
            return <line key={v}
              x1={cx + (r-sw-2)*Math.cos(a)} y1={cy + (r-sw-2)*Math.sin(a)}
              x2={cx + (r+4)*Math.cos(a)}    y2={cy + (r+4)*Math.sin(a)}
              stroke="#252525" strokeWidth={1} />
          })}
          <text x={cx} y={cy+20} textAnchor="middle" fill={stroke}
            fontSize="34" fontFamily="JetBrains Mono" fontWeight="700" letterSpacing="-2">
            {(overall * 100).toFixed(0)}
          </text>
          <text x={cx} y={cy+36} textAnchor="middle" fill="#444"
            fontSize="9" fontFamily="JetBrains Mono" letterSpacing="3">
            / 100
          </text>
        </svg>
      </div>

      <div className="space-y-3 mt-1">
        {subs.map(({ label, value }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-mono text-mirage-muted">{label}</span>
              <span className="text-[10px] font-mono text-white tabular-nums">{(value*100).toFixed(0)}%</span>
            </div>
            <div className="h-px bg-mirage-border overflow-hidden">
              <div className={clsx('h-full', barColor(value))} style={{ width: `${value*100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
