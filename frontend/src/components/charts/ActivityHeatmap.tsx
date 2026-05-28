import clsx from 'clsx'

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface HeatCell { hour: number; day: number; value: number; count: number }
interface Props { data: { heatmap: HeatCell[]; peak_hours: number[]; suspicious_hours: number[] } | null }

function cellColor(value: number, hour: number, suspicious: number[]) {
  if (value === 0) return 'bg-mirage-border/50'
  const susp = suspicious.includes(hour)
  if (susp) return value > 0.5 ? 'bg-mirage-danger' : value > 0.2 ? 'bg-mirage-danger/50' : 'bg-mirage-danger/25'
  if (value > 0.8) return 'bg-mirage-accent'
  if (value > 0.6) return 'bg-mirage-accent/75'
  if (value > 0.4) return 'bg-mirage-accent/55'
  if (value > 0.2) return 'bg-mirage-accent/35'
  return 'bg-mirage-accent/20'
}

export default function ActivityHeatmap({ data }: Props) {
  const heatmap   = data?.heatmap         || []
  const suspicious = data?.suspicious_hours || []
  const peak       = data?.peak_hours       || []
  const getCell   = (h: number, d: number) => heatmap.find(c => c.hour === h && c.day === d)

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted">Transaction Heatmap</span>
          <p className="text-[10px] font-mono text-mirage-muted mt-0.5">Hour × Day — last 30 days</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-mirage-accent/55" /><span className="text-mirage-muted">Activity</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-mirage-danger/60" /><span className="text-mirage-muted">Suspicious</span></div>
        </div>
      </div>

      {heatmap.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-[11px] font-mono text-mirage-muted">Collecting activity data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="flex mb-1 ml-8">
              {HOURS.map(h => (
                <div key={h} className={clsx('flex-1 text-center text-[9px] font-mono', suspicious.includes(h) ? 'text-mirage-danger' : 'text-mirage-muted')}>
                  {h % 4 === 0 ? `${h}h` : ''}
                </div>
              ))}
            </div>
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center mb-0.5">
                <span className="w-8 text-[9px] font-mono text-mirage-muted text-right pr-2 flex-shrink-0">{day}</span>
                {HOURS.map(hour => {
                  const cell = getCell(hour, di)
                  return (
                    <div key={hour}
                      className={clsx('flex-1 h-5 mx-px cursor-default hover:opacity-80 transition-opacity', cellColor(cell?.value || 0, hour, suspicious))}
                      title={cell ? `${day} ${hour}:00 — ${cell.count} tx` : `${day} ${hour}:00 — no activity`}
                    />
                  )
                })}
              </div>
            ))}
            {peak.length > 0 && (
              <p className="text-[10px] font-mono text-mirage-muted mt-2">
                Peak hours: {peak.map(h => `${String(h).padStart(2,'0')}:00`).join(' · ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
