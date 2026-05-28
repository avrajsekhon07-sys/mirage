import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Contribution {
  feature: string
  label: string
  value: number
  direction: string
  magnitude: number
  description: string
}

const Tip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-mirage-card border border-mirage-border px-3 py-2 max-w-[240px]">
      <p className="text-[10px] font-mono text-mirage-accent mb-1">{d?.label}</p>
      <p className="text-[11px] text-mirage-text-dim leading-relaxed">{d?.description}</p>
    </div>
  )
}

export default function ShapChart({ contributions }: { contributions: Contribution[] }) {
  if (!contributions?.length) {
    return (
      <div className="panel p-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">AI Explainability — SHAP</span>
        <div className="flex items-center justify-center h-40 mt-4">
          <p className="text-[11px] font-mono text-mirage-muted">No SHAP data available</p>
        </div>
      </div>
    )
  }

  const chartData = contributions
    .slice(0, 10)
    .sort((a, b) => b.value - a.value)

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">AI Explainability — SHAP</span>
        <span className="text-[10px] font-mono text-mirage-muted">Feature contributions to risk</span>
      </div>
      <p className="text-[11px] text-mirage-muted mb-4 mt-1">
        Positive values increase risk — negative values decrease it.
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <XAxis
              type="number"
              tick={{ fill: '#5A5A6E', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              tick={{ fill: '#9090A4', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" radius={[0, 2, 2, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value > 0 ? 'rgba(220,38,38,0.65)' : 'rgba(22,163,74,0.65)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-4 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <div className="w-3 h-2 bg-mirage-danger/65" />
          <span className="text-mirage-muted">Increases risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-2 bg-mirage-success/65" />
          <span className="text-mirage-muted">Decreases risk</span>
        </div>
      </div>
    </div>
  )
}
