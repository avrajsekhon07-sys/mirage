import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'
import { analyticsApi } from '../../services/api'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-mirage-card border border-mirage-border rounded-lg p-3">
      <p className="text-xs text-mirage-muted font-mono mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-mirage-muted">{p.name}:</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function MultiRiskChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.getRiskTrend(14).then(r => {
      const trendData = r.data
      const risk = trendData.risk_trend || []
      const anomaly = trendData.anomaly_trend || []
      const impulsive = trendData.impulsiveness_trend || []

      const merged = risk.map((r: any, i: number) => ({
        time: (() => { try { return format(parseISO(r.timestamp), 'MMM d') } catch { return r.timestamp } })(),
        risk: r.value,
        anomaly: anomaly[i]?.value || 0,
        impulsive: impulsive[i]?.value || 0,
      }))
      setData(merged)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm text-mirage-text tracking-wider">MULTI-DIMENSIONAL RISK TRENDS</h3>
        <span className="text-xs text-mirage-muted font-mono">14-DAY WINDOW</span>
      </div>

      {loading || data.length === 0 ? (
        <div className="flex items-center justify-center h-56">
          <p className="text-mirage-muted text-sm font-mono">Accumulating data...</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs font-mono text-mirage-muted">{value}</span>}
              />
              <Line type="monotone" dataKey="risk" name="Overall Risk" stroke="#00D4FF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="anomaly" name="Anomaly Score" stroke="#FF3B5C" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="impulsive" name="Impulsiveness" stroke="#FFB020" strokeWidth={2} dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
