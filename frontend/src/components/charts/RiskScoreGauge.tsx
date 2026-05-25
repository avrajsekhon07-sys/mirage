import { motion } from 'framer-motion'
import clsx from 'clsx'

interface Props {
  score: any
}

const RISK_COLORS: Record<string, { stroke: string; text: string; glow: string }> = {
  low: { stroke: '#10B981', text: 'text-mirage-success', glow: 'rgba(16,185,129,0.4)' },
  medium: { stroke: '#FFB020', text: 'text-mirage-warning', glow: 'rgba(255,176,32,0.4)' },
  high: { stroke: '#F97316', text: 'text-orange-500', glow: 'rgba(249,115,22,0.4)' },
  critical: { stroke: '#FF3B5C', text: 'text-mirage-danger', glow: 'rgba(255,59,92,0.4)' },
}

export default function RiskScoreGauge({ score }: Props) {
  const overall = score?.overall_score || 0
  const riskLevel = score?.risk_level || 'low'
  const colors = RISK_COLORS[riskLevel]

  // SVG arc parameters
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const r = 80
  const strokeWidth = 12
  const startAngle = -220
  const endAngle = 40
  const totalAngle = endAngle - startAngle

  const valueAngle = startAngle + totalAngle * overall
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const arcPath = (start: number, end: number, radius: number) => {
    const s = toRad(start)
    const e = toRad(end)
    const x1 = cx + radius * Math.cos(s)
    const y1 = cy + radius * Math.sin(s)
    const x2 = cx + radius * Math.cos(e)
    const y2 = cy + radius * Math.sin(e)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  const needleX = cx + (r - 20) * Math.cos(toRad(valueAngle))
  const needleY = cy + (r - 20) * Math.sin(toRad(valueAngle))

  const scores = [
    { label: 'Behavioral Risk', value: score?.behavioral_risk || 0 },
    { label: 'Scam Susceptibility', value: score?.scam_susceptibility || 0 },
    { label: 'Gambling Risk', value: score?.gambling_risk || 0 },
  ]

  return (
    <div className="card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm text-mirage-text tracking-wider">RISK SCORE</h3>
        <span className={clsx('text-xs font-mono px-2 py-1 rounded border uppercase', {
          'text-mirage-success border-mirage-success/30 bg-mirage-success/10': riskLevel === 'low',
          'text-mirage-warning border-mirage-warning/30 bg-mirage-warning/10': riskLevel === 'medium',
          'text-orange-500 border-orange-500/30 bg-orange-500/10': riskLevel === 'high',
          'text-mirage-danger border-mirage-danger/30 bg-mirage-danger/10': riskLevel === 'critical',
        })}>
          {riskLevel}
        </span>
      </div>

      {/* Gauge SVG */}
      <div className="flex justify-center">
        <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.85}`}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d={arcPath(startAngle, endAngle, r)}
            fill="none"
            stroke="#1F2937"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value arc */}
          <motion.path
            d={arcPath(startAngle, valueAngle, r)}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const a = toRad(startAngle + totalAngle * v)
            const x1 = cx + (r - strokeWidth) * Math.cos(a)
            const y1 = cy + (r - strokeWidth) * Math.sin(a)
            const x2 = cx + (r + strokeWidth * 0.5) * Math.cos(a)
            const y2 = cy + (r + strokeWidth * 0.5) * Math.sin(a)
            return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth={1.5} />
          })}

          {/* Needle dot */}
          <motion.circle
            cx={needleX}
            cy={needleY}
            r={5}
            fill={colors.stroke}
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          />

          {/* Center dot */}
          <circle cx={cx} cy={cy} r={4} fill="#1F2937" stroke={colors.stroke} strokeWidth={2} />

          {/* Score text */}
          <text x={cx} y={cy + 28} textAnchor="middle" fill={colors.stroke} fontSize="28" fontFamily="Space Mono" fontWeight="700">
            {(overall * 100).toFixed(0)}
          </text>
          <text x={cx} y={cy + 44} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="JetBrains Mono">
            OVERALL RISK %
          </text>
        </svg>
      </div>

      {/* Sub-scores */}
      <div className="space-y-2 mt-2">
        {scores.map(({ label, value }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-mirage-muted font-mono">{label}</span>
              <span className="text-mirage-text font-mono">{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-mirage-border rounded-full overflow-hidden">
              <motion.div
                className={clsx('h-full rounded-full', {
                  'bg-mirage-success': value < 0.25,
                  'bg-mirage-warning': value >= 0.25 && value < 0.5,
                  'bg-orange-500': value >= 0.5 && value < 0.75,
                  'bg-mirage-danger': value >= 0.75,
                })}
                initial={{ width: 0 }}
                animate={{ width: `${value * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
