import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'
import { analyticsApi } from '../../services/api'

function fmt(ts: string) { try { return format(parseISO(ts), 'MMM d') } catch { return ts } }

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-mirage-card border border-mirage-border px-3 py-2 min-w-[140px]">
      <p className="text-[10px] font-mono text-mirage-muted mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 text-[10px] font-mono mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="tabular-nums" style={{ color: p.color }}>{p.value?.toFixed(1)}%</span>
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
      const td = r.data
      const risk = td.risk_trend || [], anomaly = td.anomaly_trend || [], impulsive = td.impulsiveness_trend || []
      setData(risk.map((r: any, i: number) => ({
        t: fmt(r.timestamp),
        risk: r.value,
        anomaly: anomaly[i]?.value || 0,
        impulsive: impulsive[i]?.value || 0,
      })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="panel panel-hover p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">Multi-Dimensional Risk</span>
        <span className="text-[10px] font-mono text-mirage-muted">14D WINDOW</span>
      </div>
      {loading || data.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-[11px] font-mono text-mirage-muted">Accumulating data...</p>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
              <XAxis dataKey="t" tick={{ fill: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickCount={5} />
              <Tooltip content={<Tip />} cursor={{ stroke: '#252525', strokeWidth: 1 }} />
              <Legend formatter={(v) => <span className="text-[10px] font-mono text-mirage-muted">{v}</span>} />
              <Line type="monotone" dataKey="risk"      name="Overall Risk"  stroke="#00FF94" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="anomaly"   name="Anomaly"       stroke="#FF3333" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="impulsive" name="Impulsiveness"  stroke="#FFB800" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
