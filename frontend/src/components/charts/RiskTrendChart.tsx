import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'

function fmt(ts: string) { try { return format(parseISO(ts), 'MMM d') } catch { return ts } }

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-mirage-card border border-mirage-border px-3 py-2">
      <p className="text-[10px] font-mono text-mirage-muted mb-1">{label}</p>
      <p className="text-[13px] font-mono font-bold text-mirage-accent tabular-nums">{payload[0]?.value?.toFixed(1)}%</p>
    </div>
  )
}

export default function RiskTrendChart({ data }: { data: any[] }) {
  const riskTrend = useSelector((s: RootState) => s.dashboard.riskTrend) || data || []
  const chartData = riskTrend.map((d: any) => ({ t: fmt(d.timestamp), v: d.value }))

  return (
    <div className="panel panel-hover p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">Risk Trend</span>
        <span className="text-[10px] font-mono text-mirage-muted">7D WINDOW</span>
      </div>
      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] font-mono text-mirage-muted">Accumulating data...</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
              <XAxis dataKey="t" tick={{ fill: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickCount={5} />
              <Tooltip content={<Tip />} cursor={{ stroke: '#252525', strokeWidth: 1 }} />
              <ReferenceLine y={75} stroke="#FF3333" strokeDasharray="3 3" strokeOpacity={0.4} strokeWidth={1} />
              <ReferenceLine y={50} stroke="#FFB800" strokeDasharray="3 3" strokeOpacity={0.35} strokeWidth={1} />
              <Line type="monotone" dataKey="v" stroke="#00FF94" strokeWidth={1.5} dot={false}
                activeDot={{ r: 3, fill: '#00FF94', stroke: '#050505', strokeWidth: 1.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
