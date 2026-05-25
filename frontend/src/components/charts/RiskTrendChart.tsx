import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'

interface Props {
  data: Array<{ timestamp: string; value: number }>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-mirage-card border border-mirage-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-mirage-muted font-mono mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-mirage-muted">{p.name}:</span>
          <span className="font-mono" style={{ color: p.color }}>{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function RiskTrendChart({ data }: Props) {
  const riskTrend = useSelector((s: RootState) => s.dashboard.riskTrend) || data || []

  const chartData = riskTrend.map((d: any) => ({
    time: (() => { try { return format(parseISO(d.timestamp), 'MMM d HH:mm') } catch { return d.timestamp } })(),
    risk: d.value,
  }))

  if (chartData.length === 0) {
    return (
      <div className="card p-6 h-full flex flex-col">
        <h3 className="font-display text-sm text-mirage-text tracking-wider mb-4">RISK TREND</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-mirage-muted text-sm font-mono">Accumulating behavioral data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm text-mirage-text tracking-wider">RISK TREND</h3>
        <span className="text-xs text-mirage-muted font-mono">LAST 7 DAYS</span>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={75} stroke="#FF3B5C" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine y={50} stroke="#FFB020" strokeDasharray="4 4" strokeOpacity={0.4} />
            <Area type="monotone" dataKey="risk" name="Risk Score" stroke="#00D4FF" strokeWidth={2} fill="url(#riskGrad)" dot={false} activeDot={{ r: 4, fill: '#00D4FF', stroke: '#080B14', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
