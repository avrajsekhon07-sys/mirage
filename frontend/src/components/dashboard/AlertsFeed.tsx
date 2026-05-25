import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Shield, Zap, TrendingUp, Moon, Activity, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const ALERT_ICONS: Record<string, any> = {
  impulsive_spending: Zap,
  scam_susceptibility: Shield,
  emotional_trading: TrendingUp,
  gambling_pattern: Activity,
  transaction_burst: Zap,
  late_night_activity: Moon,
  anomalous_behavior: AlertTriangle,
  behavioral_deviation: AlertTriangle,
}

const SEVERITY_STYLE: Record<string, string> = {
  low: 'border-mirage-success/20 bg-mirage-success/5 text-mirage-success',
  medium: 'border-mirage-warning/20 bg-mirage-warning/5 text-mirage-warning',
  high: 'border-orange-500/20 bg-orange-500/5 text-orange-500',
  critical: 'border-mirage-danger/20 bg-mirage-danger/5 text-mirage-danger',
}

interface Props {
  alerts: any[]
}

export default function AlertsFeed({ alerts }: Props) {
  return (
    <div className="card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm text-mirage-text tracking-wider">RECENT ALERTS</h3>
        <Link to="/alerts" className="text-xs text-mirage-accent hover:text-mirage-accent/80 flex items-center gap-1 font-mono">
          VIEW ALL <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="w-8 h-8 text-mirage-success mx-auto mb-2 opacity-50" />
            <p className="text-mirage-muted text-sm font-mono">No alerts detected</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {alerts.slice(0, 6).map((alert, i) => {
              const Icon = ALERT_ICONS[alert.alert_type] || AlertTriangle
              const style = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.medium
              return (
                <motion.div
                  key={alert.id || i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={clsx('p-3 rounded-lg border', style, !alert.is_read && 'ring-1 ring-current ring-opacity-20')}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-display font-bold uppercase tracking-wider truncate">{alert.title}</p>
                        {!alert.is_read && (
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed line-clamp-2">{alert.message}</p>
                      <p className="text-[10px] opacity-60 font-mono mt-1">
                        {alert.created_at ? (() => { try { return format(parseISO(alert.created_at), 'MMM d, HH:mm') } catch { return '' } })() : ''}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
