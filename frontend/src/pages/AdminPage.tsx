import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Activity, AlertTriangle, TrendingUp, Shield, RefreshCw } from 'lucide-react'
import { adminApi } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import clsx from 'clsx'

const RISK_COLORS: Record<string, string> = {
  low: '#10B981', medium: '#FFB020', high: '#F97316', critical: '#FF3B5C'
}

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([adminApi.getStats(), adminApi.getUsers()])
      setStats(statsRes.data)
      setUsers(usersRes.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="spinner scale-150" />
    </div>
  )

  const riskDist = [
    { label: 'Low', count: users.filter(u => u.risk_level === 'low').length, color: '#10B981' },
    { label: 'Medium', count: users.filter(u => u.risk_level === 'medium').length, color: '#FFB020' },
    { label: 'High', count: users.filter(u => u.risk_level === 'high').length, color: '#F97316' },
    { label: 'Critical', count: users.filter(u => u.risk_level === 'critical').length, color: '#FF3B5C' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-mirage-text tracking-wide">
            ADMIN <span className="text-mirage-purple">COMMAND CENTER</span>
          </h1>
          <p className="text-mirage-muted text-sm font-mono mt-1">Platform-wide surveillance overview</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-mirage-card border border-mirage-border text-mirage-muted hover:text-mirage-purple transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total_users, icon: Users, color: 'accent' },
            { label: 'Active (24h)', value: stats.active_users_24h, icon: Activity, color: 'success' },
            { label: 'Transactions (24h)', value: stats.total_transactions_24h, icon: TrendingUp, color: 'warning' },
            { label: 'Alerts (24h)', value: stats.total_alerts_24h, icon: AlertTriangle, color: 'danger' },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={clsx('w-5 h-5', {
                  'text-mirage-accent': color === 'accent', 'text-mirage-success': color === 'success',
                  'text-mirage-warning': color === 'warning', 'text-mirage-danger': color === 'danger',
                })} />
              </div>
              <p className="text-2xl font-display font-bold text-mirage-text">{value?.toLocaleString()}</p>
              <p className="text-xs text-mirage-muted font-mono mt-1 uppercase">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Risk distribution + Top risk users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display text-sm text-mirage-text tracking-wider mb-4">RISK DISTRIBUTION</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDist} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDist.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-mirage-danger/10 border border-mirage-danger/20">
              <p className="text-mirage-danger font-display text-xl">{stats?.critical_risk_users || 0}</p>
              <p className="text-xs text-mirage-muted font-mono">CRITICAL RISK USERS</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-orange-500 font-display text-xl">{stats?.high_risk_users || 0}</p>
              <p className="text-xs text-mirage-muted font-mono">HIGH RISK USERS</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-sm text-mirage-text tracking-wider mb-4">TOP RISK USERS</h3>
          <div className="space-y-3">
            {(stats?.top_risk_users || []).map((u: any, i: number) => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-mirage-bg border border-mirage-border">
                <span className="text-xs font-mono text-mirage-muted w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-mirage-text font-medium">{u.username}</p>
                  <p className="text-xs text-mirage-muted font-mono truncate">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold" style={{ color: RISK_COLORS[u.risk_level] || '#fff' }}>
                    {(u.overall_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-[10px] font-mono uppercase" style={{ color: RISK_COLORS[u.risk_level] }}>
                    {u.risk_level}
                  </p>
                </div>
              </div>
            ))}
            {!stats?.top_risk_users?.length && (
              <p className="text-center text-mirage-muted text-sm font-mono py-6">No risk data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* All users table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-mirage-border">
          <h3 className="font-display text-sm text-mirage-text tracking-wider">ALL USERS — RISK OVERVIEW</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-mirage-border">
                {['USER', 'EMAIL', 'RISK SCORE', 'LEVEL', 'REGISTERED'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono text-mirage-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mirage-border">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-mirage-card/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-mirage-text font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-mirage-muted font-mono">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-mirage-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${user.overall_score * 100}%`, background: RISK_COLORS[user.risk_level] }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: RISK_COLORS[user.risk_level] }}>
                        {(user.overall_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono uppercase px-2 py-1 rounded border" style={{
                      color: RISK_COLORS[user.risk_level],
                      borderColor: RISK_COLORS[user.risk_level] + '40',
                      background: RISK_COLORS[user.risk_level] + '10',
                    }}>
                      {user.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-mirage-muted font-mono">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
