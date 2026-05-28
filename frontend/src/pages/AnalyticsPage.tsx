import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store/store'
import { fetchHeatmap, fetchShapExplanation, fetchRiskTrend } from '../store/dashboardSlice'
import ActivityHeatmap from '../components/charts/ActivityHeatmap'
import ShapChart from '../components/charts/ShapChart'
import MultiRiskChart from '../components/charts/MultiRiskChart'
import { analyticsApi } from '../services/api'
import clsx from 'clsx'

interface ProfileRow { label: string; value: string; flag: boolean; sub?: string }

function ProfileStat({ label, value, flag, sub }: ProfileRow) {
  return (
    <div className={clsx('panel panel-hover p-4', flag && 'border-l-2 border-l-mirage-danger')}>
      <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-2">{label}</p>
      <p className={clsx('text-[26px] font-mono font-bold tabular-nums leading-none', flag ? 'text-mirage-danger' : 'text-white')}>
        {value}
      </p>
      {flag && (
        <p className="text-[10px] font-mono text-mirage-danger mt-1.5 tracking-wide">▲ ELEVATED</p>
      )}
      {sub && !flag && (
        <p className="text-[10px] font-mono text-mirage-muted mt-1">{sub}</p>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { heatmap, shapExplanation } = useSelector((s: RootState) => s.dashboard)
  const [profile, setProfile] = useState<any>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    dispatch(fetchHeatmap())
    dispatch(fetchShapExplanation())
    dispatch(fetchRiskTrend(14))
    analyticsApi.getBehavioralProfile().then(r => setProfile(r.data)).catch(() => {})
  }, [dispatch])

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.text('Mirage — Behavioral Risk Report', 20, 20)
      doc.setFontSize(12)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35)
      if (profile) {
        doc.setFontSize(14)
        doc.text('Behavioral Profile', 20, 55)
        doc.setFontSize(11)
        const lines = [
          `Avg Transaction: $${profile.avg_transaction_amount?.toFixed(2)}`,
          `Max Transaction: $${profile.max_transaction_amount?.toFixed(2)}`,
          `Transactions (7d): ${profile.total_transactions_7d}`,
          `Transactions (30d): ${profile.total_transactions_30d}`,
          `Late Night Ratio: ${(profile.late_night_transaction_ratio * 100).toFixed(1)}%`,
          `Gambling Ratio: ${(profile.gambling_ratio * 100).toFixed(1)}%`,
          `Crypto Ratio: ${(profile.crypto_ratio * 100).toFixed(1)}%`,
          `Tx Velocity: ${profile.transaction_velocity?.toFixed(2)} tx/day`,
          `Burst Frequency: ${profile.burst_frequency}`,
        ]
        lines.forEach((line, i) => doc.text(line, 20, 70 + i * 8))
      }
      if (shapExplanation?.length) {
        doc.setFontSize(14)
        doc.text('Top Risk Factors (SHAP)', 20, 155)
        doc.setFontSize(11)
        shapExplanation.slice(0, 8).forEach((s: any, i: number) => {
          doc.text(`${i + 1}. ${s.label}: ${s.value > 0 ? '+' : ''}${s.value?.toFixed(3)}`, 20, 168 + i * 8)
        })
      }
      doc.save('mirage-risk-report.pdf')
    } catch (e) {
      console.error('PDF export failed:', e)
    }
    setExporting(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-mirage-muted">Behavioral Intelligence</p>
          <h1 className="text-[22px] font-light text-white tracking-tight mt-0.5">Deep Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { dispatch(fetchHeatmap()); dispatch(fetchShapExplanation()) }}
            className="text-[10px] font-mono text-mirage-muted hover:text-white border border-mirage-border hover:border-mirage-border-hi px-2.5 py-1 transition-colors"
          >
            REFRESH
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="text-[10px] font-mono text-mirage-accent border border-mirage-accent/30 hover:bg-mirage-accent hover:text-mirage-bg px-2.5 py-1 transition-colors disabled:opacity-40"
          >
            {exporting ? 'EXPORTING...' : 'EXPORT PDF'}
          </button>
        </div>
      </div>

      {/* Behavioral profile stats */}
      {profile && (
        <>
          <div className="flex items-center gap-2 py-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">Behavioral Profile</span>
            <div className="flex-1 h-px bg-mirage-border" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ProfileStat
              label="Late Night Activity"
              value={`${(profile.late_night_transaction_ratio * 100).toFixed(1)}%`}
              flag={profile.late_night_transaction_ratio > 0.3}
            />
            <ProfileStat
              label="Gambling Ratio"
              value={`${(profile.gambling_ratio * 100).toFixed(1)}%`}
              flag={profile.gambling_ratio > 0.2}
            />
            <ProfileStat
              label="Crypto Ratio"
              value={`${(profile.crypto_ratio * 100).toFixed(1)}%`}
              flag={profile.crypto_ratio > 0.3}
            />
            <ProfileStat
              label="Burst Frequency"
              value={String(profile.burst_frequency ?? 0)}
              flag={profile.burst_frequency > 3}
              sub="TX BURSTS DETECTED"
            />
          </div>

          {/* Secondary stats */}
          <div className="panel px-4 py-3">
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-mirage-border">
              {[
                { label: 'Avg Tx', value: `$${(profile.avg_transaction_amount || 0).toFixed(2)}` },
                { label: 'Max Tx', value: `$${(profile.max_transaction_amount || 0).toFixed(2)}` },
                { label: 'Tx 7D', value: String(profile.total_transactions_7d ?? 0) },
                { label: 'Tx 30D', value: String(profile.total_transactions_30d ?? 0) },
                { label: 'Velocity', value: `${(profile.transaction_velocity || 0).toFixed(2)}/day` },
              ].map(({ label, value }) => (
                <div key={label} className="px-4 first:pl-0 last:pr-0">
                  <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-1">{label}</p>
                  <p className="text-[16px] font-mono font-semibold text-white tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Charts */}
      <div className="flex items-center gap-2 py-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">Risk Trends</span>
        <div className="flex-1 h-px bg-mirage-border" />
      </div>
      <MultiRiskChart />

      <div className="flex items-center gap-2 py-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">Activity Patterns</span>
        <div className="flex-1 h-px bg-mirage-border" />
      </div>
      <ActivityHeatmap data={heatmap} />

      <div className="flex items-center gap-2 py-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted">Model Explainability</span>
        <div className="flex-1 h-px bg-mirage-border" />
      </div>
      <ShapChart contributions={shapExplanation} />
    </div>
  )
}
