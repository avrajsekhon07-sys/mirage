import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'

interface Contribution { feature: string; label: string; value: number; direction: string; magnitude: number; description: string }
interface Props { contributions: Contribution[] }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-mirage-card border border-mirage-border rounded-lg p-3 max-w-xs">
      <p className="text-xs font-mono text-mirage-accent mb-1">{d?.label}</p>
      <p className="text-xs text-mirage-muted leading-relaxed">{d?.description}</p>
    </div>
  )
}

export default function ShapChart({ contributions }: Props) {
  if (!contributions?.length) {
    return (
      <div className="card p-6">
        <h3 className="font-display text-sm text-mirage-text tracking-wider mb-4">AI EXPLAINABILITY (SHAP)</h3>
        <div className="flex items-center justify-center h-40">
          <p className="text-mirage-muted text-sm font-mono">No SHAP data available</p>
        </div>
      </div>
    )
  }

  const chartData = contributions
    .slice(0, 10)
    .sort((a, b) => b.value - a.value)
    .map(c => ({ ...c, absValue: Math.abs(c.value) }))

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-sm text-mirage-text tracking-wider">AI EXPLAINABILITY (SHAP)</h3>
        <span className="text-xs text-mirage-muted font-mono">Feature contributions to risk score</span>
      </div>
      <p className="text-xs text-mirage-muted mb-6">
        SHAP values show which behavioral features most influence your risk score.
        Positive values increase risk; negative values decrease it.
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={160}
              tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 0 ? 'rgba(255,59,92,0.7)' : 'rgba(16,185,129,0.7)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-mirage-danger/70" />
          <span className="text-mirage-muted">Increases risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-mirage-success/70" />
          <span className="text-mirage-muted">Decreases risk</span>
        </div>
      </div>
    </div>
  )
}
