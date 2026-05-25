import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Shield, Zap, TrendingUp, Activity, Moon, CheckCheck, Bell } from 'lucide-react'
import { AppDispatch, RootState } from '../store/store'
import { fetchAlerts, markAlertRead } from '../store/alertsSlice'
import { alertsApi } from '../services/api'
import clsx from 'clsx'

const ALERT_ICONS: Record<string, any> = {
  impulsive_spending: Zap, scam_susceptibility: Shield, emotional_trading: TrendingUp,
  gambling_pattern: Activity, transaction_burst: Zap, late_night_activity: Moon,
  anomalous_behavior: AlertTriangle, behavioral_deviation: AlertTriangle,
}

const SEVERITY_CONFIG: Record<string, { label: string; classes: string; icon_color: string }> = {
  low: { label: 'LOW', classes: 'border-mirage-success/30 bg-mirage-success/5', icon_color: 'text-mirage-success' },
  medium: { label: 'MEDIUM', classes: 'border-mirage-warning/30 bg-mirage-warning/5', icon_color: 'text-mirage-warning' },
  high: { label: 'HIGH', classes: 'border-orange-500/30 bg-orange-500/5', icon_color: 'text-orange-500' },
  critical: { label: 'CRITICAL', classes: 'border-mirage-danger/30 bg-mirage-danger/5', icon_color: 'text-mirage-danger' },
}

export default function AlertsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { items: alerts, loading } = useSelector((s: RootState) => s.alerts)
  const unread = alerts.filter(a => !a.is_read).length

  useEffect(() => { dispatch(fetchAlerts()) }, [dispatch])

  const handleMarkAllRead = async () => {
    await alertsApi.markAllRead()
    dispatch(fetchAlerts())
  }

  const handleMarkRead = (id: number) => { dispatch(markAlertRead(id)) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-mirage-text tracking-wide">
            ALERT <span className="text-mirage-accent">CENTER</span>
          </h1>
          <p className="text-mirage-muted text-sm font-mono mt-1">
            {unread > 0 ? `${unread} unread alert${unread > 1 ? 's' : ''}` : 'All alerts reviewed'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-mirage-card border border-mirage-border text-mirage-muted hover:text-mirage-accent text-sm transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner scale-150" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield className="w-16 h-16 text-mirage-success opacity-30 mb-4" />
          <p className="text-mirage-text font-display text-lg tracking-wide">All Clear</p>
          <p className="text-mirage-muted text-sm font-mono mt-2">No behavioral alerts detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((alert, i) => {
              const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium
              const Icon = ALERT_ICONS[alert.alert_type] || Bell

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={clsx('p-5 rounded-xl border transition-all', config.classes, !alert.is_read && 'ring-1 ring-current ring-opacity-20')}
                >
                  <div className="flex items-start gap-4">
                    <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', config.icon_color.replace('text-', 'bg-') + '/10')}>
                      <Icon className={clsx('w-5 h-5', config.icon_color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex items-center gap-3">
                          <h3 className={clsx('font-display text-sm font-bold tracking-wide', config.icon_color)}>{alert.title}</h3>
                          <span className={clsx('text-[10px] font-mono px-2 py-0.5 rounded border', config.icon_color, config.classes)}>{config.label}</span>
                          {!alert.is_read && <span className="w-2 h-2 rounded-full bg-current flex-shrink-0" style={{ color: 'inherit' }} />}
                        </div>
                        <span className="text-xs text-mirage-muted font-mono flex-shrink-0">
                          {alert.created_at ? (() => { try { return format(parseISO(alert.created_at), 'MMM d, HH:mm') } catch { return '' } })() : ''}
                        </span>
                      </div>

                      <p className="text-sm text-mirage-text mb-2">{alert.message}</p>

                      {alert.ai_explanation && (
                        <div className="mt-2 p-3 rounded-lg bg-mirage-bg/50 border border-mirage-border">
                          <p className="text-[10px] font-mono text-mirage-muted mb-1">AI EXPLANATION</p>
                          <p className="text-xs text-mirage-text-dim leading-relaxed">{alert.ai_explanation}</p>
                        </div>
                      )}

                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="mt-3 text-xs text-mirage-muted hover:text-mirage-accent font-mono flex items-center gap-1 transition-colors"
                        >
                          <CheckCheck className="w-3 h-3" /> Mark as read
                        </button>
                      )}
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
