import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Contribution { feature: string; label: string; value: number; direction: string; magnitude: number; description: string }

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
      <div className="panel p-5">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">AI Explainability — SHAP</span>
        <div className="flex items-center justify-center h-40 mt-4">
          <p className="text-[11px] font-mono text-mirage-muted">No SHAP data available</p>
        </div>
      </div>
    )
  }

  const chartData = contributions.slice(0, 10).sort((a, b) => b.value - a.value)

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">AI Explainability — SHAP</span>
        <span className="text-[10px] font-mono text-mirage-muted">Feature contributions</span>
      </div>
      <p className="text-[11px] text-mirage-muted mt-1 mb-4">Positive values increase risk — negative values decrease it.</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={150} tick={{ fill: '#888', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" radius={[0, 2, 2, 0]}>
              {chartData.map((e, i) => <Cell key={i} fill={e.value > 0 ? 'rgba(255,51,51,0.7)' : 'rgba(0,255,148,0.6)'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-4 text-[10px] font-mono">
        <div className="flex items-center gap-2"><div className="w-3 h-2 bg-mirage-danger/70" /><span className="text-mirage-muted">Increases risk</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-2 bg-mirage-accent/60" /><span className="text-mirage-muted">Decreases risk</span></div>
      </div>
    </div>
  )
}
