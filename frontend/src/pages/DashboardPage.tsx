import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle, Zap, Activity, RefreshCw, Bot } from 'lucide-react'
import { AppDispatch, RootState } from '../store/store'
import { fetchDashboard, fetchRiskTrend } from '../store/dashboardSlice'
import { fetchAlerts } from '../store/alertsSlice'
import RiskScoreGauge from '../components/charts/RiskScoreGauge'
import RiskTrendChart from '../components/charts/RiskTrendChart'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import AlertsFeed from '../components/dashboard/AlertsFeed'
import StatCard from '../components/dashboard/StatCard'
import clsx from 'clsx'

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { data, loading, riskTrend } = useSelector((s: RootState) => s.dashboard)
  const { connected } = useSelector((s: RootState) => s.ws)

  useEffect(() => {
    dispatch(fetchDashboard())
    dispatch(fetchRiskTrend(7))
    dispatch(fetchAlerts())

    // Auto-refresh every 30s
    const interval = setInterval(() => {
      dispatch(fetchDashboard())
    }, 30_000)
    return () => clearInterval(interval)
  }, [dispatch])

  const score = data?.latest_risk_score
  const profile = data?.behavioral_profile

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-mirage-border border-t-mirage-accent rounded-full mx-auto mb-4"
          />
          <p className="text-mirage-muted font-mono text-sm">INITIALIZING ENGINE...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-mirage-text tracking-wide">
            RISK <span className="text-mirage-accent">OVERVIEW</span>
          </h1>
          <p className="text-mirage-muted text-sm font-mono mt-1">
            Behavioral manipulation detection dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono',
            connected
              ? 'bg-mirage-success/10 border-mirage-success/30 text-mirage-success'
              : 'bg-mirage-danger/10 border-mirage-danger/30 text-mirage-danger'
          )}>
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-current"
              animate={connected ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            {connected ? 'LIVE' : 'OFFLINE'}
          </div>
          <button
            onClick={() => { dispatch(fetchDashboard()); dispatch(fetchRiskTrend(7)) }}
            className="p-2 rounded-lg bg-mirage-card border border-mirage-border text-mirage-muted hover:text-mirage-accent hover:border-mirage-accent/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Summary Banner */}
      {data?.ai_summary && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'p-4 rounded-xl border flex items-start gap-3',
            score?.risk_level === 'critical' ? 'bg-mirage-danger/10 border-mirage-danger/30' :
            score?.risk_level === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
            score?.risk_level === 'medium' ? 'bg-mirage-warning/10 border-mirage-warning/30' :
            'bg-mirage-success/10 border-mirage-success/30'
          )}
        >
          <Bot className="w-5 h-5 text-mirage-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-mono text-mirage-muted mb-1">AI BEHAVIORAL ANALYSIS</p>
            <p className="text-sm text-mirage-text leading-relaxed">{data.ai_summary}</p>
          </div>
        </motion.div>
      )}

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Manipulation Prob."
          value={`${((score?.manipulation_probability || 0) * 100).toFixed(0)}%`}
          icon={Brain}
          color={score?.manipulation_probability > 0.6 ? 'danger' : score?.manipulation_probability > 0.3 ? 'warning' : 'success'}
          trend={score?.manipulation_probability > 0.5 ? 'up' : 'down'}
        />
        <StatCard
          label="Impulsiveness"
          value={`${((score?.impulsiveness_score || 0) * 100).toFixed(0)}%`}
          icon={Zap}
          color={score?.impulsiveness_score > 0.6 ? 'danger' : score?.impulsiveness_score > 0.3 ? 'warning' : 'success'}
          trend={score?.impulsiveness_score > 0.5 ? 'up' : 'down'}
        />
        <StatCard
          label="Anomaly Score"
          value={`${((score?.anomaly_score || 0) * 100).toFixed(0)}%`}
          icon={AlertTriangle}
          color={score?.anomaly_score > 0.6 ? 'danger' : score?.anomaly_score > 0.3 ? 'warning' : 'success'}
          trend="neutral"
        />
        <StatCard
          label="Tx Velocity"
          value={`${(profile?.transaction_velocity || 0).toFixed(1)}/day`}
          icon={Activity}
          color="accent"
          trend="up"
        />
      </div>

      {/* Middle row: gauge + trend chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RiskScoreGauge score={score} />
        </div>
        <div className="lg:col-span-2">
          <RiskTrendChart data={riskTrend} />
        </div>
      </div>

      {/* Bottom row: transactions + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={data?.recent_transactions || []} />
        <AlertsFeed alerts={data?.recent_alerts || []} />
      </div>
    </div>
  )
}
