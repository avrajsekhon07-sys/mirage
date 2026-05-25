import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '../store/store'
import { fetchHeatmap, fetchShapExplanation, fetchRiskTrend } from '../store/dashboardSlice'
import ActivityHeatmap from '../components/charts/ActivityHeatmap'
import ShapChart from '../components/charts/ShapChart'
import MultiRiskChart from '../components/charts/MultiRiskChart'
import { analyticsApi } from '../services/api'
import { useState } from 'react'
import { BarChart3, Download, RefreshCw } from 'lucide-react'

export default function AnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { heatmap, shapExplanation } = useSelector((s: RootState) => s.dashboard)
  const [profile, setProfile] = useState<any>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    dispatch(fetchHeatmap())
    dispatch(fetchShapExplanation())
    dispatch(fetchRiskTrend(14))

    analyticsApi.getBehavioralProfile()
      .then(r => setProfile(r.data))
      .catch(() => {})
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
          `Transaction Velocity: ${profile.transaction_velocity?.toFixed(2)} tx/day`,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-mirage-text tracking-wide">
            DEEP <span className="text-mirage-accent">ANALYTICS</span>
          </h1>
          <p className="text-mirage-muted text-sm font-mono mt-1">Behavioral patterns & AI explainability</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { dispatch(fetchHeatmap()); dispatch(fetchShapExplanation()) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mirage-card border border-mirage-border text-mirage-muted hover:text-mirage-accent text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-mirage-accent/10 border border-mirage-accent/30 text-mirage-accent hover:bg-mirage-accent/20 text-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Behavioral profile cards */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Late Night Activity', value: `${(profile.late_night_transaction_ratio * 100).toFixed(1)}%`, risk: profile.late_night_transaction_ratio > 0.3 },
            { label: 'Gambling Ratio', value: `${(profile.gambling_ratio * 100).toFixed(1)}%`, risk: profile.gambling_ratio > 0.2 },
            { label: 'Crypto Ratio', value: `${(profile.crypto_ratio * 100).toFixed(1)}%`, risk: profile.crypto_ratio > 0.3 },
            { label: 'Transaction Bursts', value: profile.burst_frequency?.toString(), risk: profile.burst_frequency > 3 },
          ].map(({ label, value, risk }) => (
            <div key={label} className={`card p-4 border ${risk ? 'border-mirage-danger/30 bg-mirage-danger/5' : 'border-mirage-border'}`}>
              <p className="text-xl font-display font-bold text-mirage-accent">{value}</p>
              <p className="text-xs text-mirage-muted font-mono mt-1 uppercase">{label}</p>
              {risk && <p className="text-[10px] text-mirage-danger font-mono mt-1">⚠ ELEVATED</p>}
            </div>
          ))}
        </div>
      )}

      {/* Multi-risk trend */}
      <MultiRiskChart />

      {/* Heatmap */}
      <ActivityHeatmap data={heatmap} />

      {/* SHAP explainability */}
      <ShapChart contributions={shapExplanation} />
    </div>
  )
}
