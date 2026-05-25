import { motion } from 'framer-motion'
import clsx from 'clsx'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface HeatCell { hour: number; day: number; value: number; count: number }
interface Props { data: { heatmap: HeatCell[]; peak_hours: number[]; suspicious_hours: number[] } | null }

function getColor(value: number, hour: number, suspiciousHours: number[]) {
  if (value === 0) return 'bg-mirage-border/30'
  const isSuspicious = suspiciousHours.includes(hour)
  if (isSuspicious && value > 0.5) return 'bg-mirage-danger'
  if (isSuspicious && value > 0.2) return 'bg-mirage-danger/60'
  if (isSuspicious) return 'bg-mirage-danger/30'
  if (value > 0.8) return 'bg-mirage-accent'
  if (value > 0.6) return 'bg-mirage-accent/80'
  if (value > 0.4) return 'bg-mirage-accent/60'
  if (value > 0.2) return 'bg-mirage-accent/40'
  return 'bg-mirage-accent/20'
}

export default function ActivityHeatmap({ data }: Props) {
  const heatmap = data?.heatmap || []
  const suspicious = data?.suspicious_hours || []
  const peak = data?.peak_hours || []
  const getCell = (hour: number, day: number) => heatmap.find(c => c.hour === hour && c.day === day)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-sm text-mirage-text tracking-wider">TRANSACTION HEATMAP</h3>
          <p className="text-xs text-mirage-muted font-mono mt-1">Activity by hour x day — last 30 days</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-mirage-accent/40" /><span className="text-mirage-muted">Normal</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-mirage-danger/60" /><span className="text-mirage-muted">Suspicious</span></div>
        </div>
      </div>
      {heatmap.length === 0 ? (
        <div className="flex items-center justify-center h-40"><p className="text-mirage-muted text-sm font-mono">Collecting activity data...</p></div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="flex mb-1 ml-10">
              {HOURS.map(h => (
                <div key={h} className={clsx('flex-1 text-center text-[9px] font-mono', suspicious.includes(h) ? 'text-mirage-danger' : 'text-mirage-muted')}>
                  {h % 3 === 0 ? `${h}h` : ''}
                </div>
              ))}
            </div>
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center mb-1">
                <span className="w-10 text-xs text-mirage-muted font-mono text-right pr-2">{day}</span>
                {HOURS.map(hour => {
                  const cell = getCell(hour, dayIdx)
                  const value = cell?.value || 0
                  return (
                    <motion.div
                      key={hour}
                      className={clsx('flex-1 h-6 rounded-sm mx-px cursor-pointer', getColor(value, hour, suspicious))}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (dayIdx * 24 + hour) * 0.002 }}
                      title={cell ? `${day} ${hour}:00 — ${cell.count} tx` : `${day} ${hour}:00 — no activity`}
                      whileHover={{ scale: 1.3 }}
                    />
                  )
                })}
              </div>
            ))}
            {peak.length > 0 && <p className="text-xs text-mirage-muted font-mono mt-3">Peak hours: {peak.map(h => `${h}:00`).join(', ')}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
