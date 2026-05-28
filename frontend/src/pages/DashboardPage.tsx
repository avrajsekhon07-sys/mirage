import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store/store'
import { fetchDashboard, fetchRiskTrend } from '../store/dashboardSlice'
import { fetchAlerts } from '../store/alertsSlice'
import RiskScoreGauge from '../components/charts/RiskScoreGauge'
import RiskTrendChart from '../components/charts/RiskTrendChart'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import AlertsFeed from '../components/dashboard/AlertsFeed'
import StatCard from '../components/dashboard/StatCard'
import TransactionSimulator from '../components/dashboard/TransactionSimulator'

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { data, loading, riskTrend } = useSelector((s: RootState) => s.dashboard)
  const { connected } = useSelector((s: RootState) => s.ws)

  useEffect(() => {
    dispatch(fetchDashboard())
    dispatch(fetchRiskTrend(7))
    dispatch(fetchAlerts())
    const t = setInterval(() => dispatch(fetchDashboard()), 30_000)
    return () => clearInterval(t)
  }, [dispatch])

  const score   = data?.latest_risk_score
  const profile = data?.behavioral_profile

  const refresh = () => {
    dispatch(fetchDashboard())
    dispatch(fetchRiskTrend(7))
    dispatch(fetchAlerts())
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-[10px] font-mono text-mirage-muted tracking-[0.1em] uppercase">Initializing engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between pb-2 border-b border-mirage-border">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-mirage-muted">Behavioral Finance</p>
          <h1 className="text-[28px] font-bold text-white tracking-tight mt-0.5 leading-none">Risk Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 border ${
            connected ? 'text-mirage-accent border-mirage-accent/30' : 'text-mirage-danger border-mirage-danger/30'
          }`}>
            <span className={`w-1 h-1 rounded-full ${connected ? 'bg-mirage-accent' : 'bg-mirage-danger'}`} />
            {connected ? 'LIVE' : 'OFFLINE'}
          </div>
          <button onClick={() => { dispatch(fetchDashboard()); dispatch(fetchRiskTrend(7)) }}
            className="text-[10px] font-mono text-mirage-muted hover:text-white border border-mirage-border hover:border-mirage-border-hi px-2.5 py-1.5 transition-colors">
            REFRESH
          </button>
        </div>
      </div>

      {/* AI summary */}
      {data?.ai_summary && (
        <div className="panel border-l-2 border-l-mirage-accent px-5 py-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-accent mb-1">AI Behavioral Analysis</p>
          <p className="text-[12px] text-mirage-text-dim leading-relaxed">{data.ai_summary}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Manipulation Prob."
          value={`${((score?.manipulation_probability || 0) * 100).toFixed(0)}%`}
          color={score?.manipulation_probability > 0.6 ? 'danger' : score?.manipulation_probability > 0.3 ? 'warning' : 'accent'}
          trend={score?.manipulation_probability > 0.5 ? 'up' : 'down'}
          sub={score?.manipulation_probability > 0.5 ? 'ELEVATED' : 'NORMAL'}
        />
        <StatCard
          label="Impulsiveness Score"
          value={`${((score?.impulsiveness_score || 0) * 100).toFixed(0)}%`}
          color={score?.impulsiveness_score > 0.6 ? 'danger' : score?.impulsiveness_score > 0.3 ? 'warning' : 'accent'}
          trend={score?.impulsiveness_score > 0.5 ? 'up' : 'down'}
        />
        <StatCard
          label="Anomaly Score"
          value={`${((score?.anomaly_score || 0) * 100).toFixed(0)}%`}
          color={score?.anomaly_score > 0.6 ? 'danger' : score?.anomaly_score > 0.3 ? 'warning' : 'default'}
          trend="neutral"
        />
        <StatCard
          label="Tx Velocity"
          value={`${(profile?.transaction_velocity || 0).toFixed(1)}`}
          sub="TX / DAY"
          color="accent"
        />
      </div>

      {/* Gauge + trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1"><RiskScoreGauge score={score} /></div>
        <div className="lg:col-span-2"><RiskTrendChart data={riskTrend} /></div>
      </div>

      {/* Live feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RecentTransactions transactions={data?.recent_transactions || []} />
        <AlertsFeed alerts={data?.recent_alerts || []} />
      </div>

      {/* Transaction simulator */}
      <TransactionSimulator onComplete={refresh} />
    </div>
  )
}
