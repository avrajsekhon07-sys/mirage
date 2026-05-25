import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Activity, LayoutDashboard, CreditCard, Bell, BarChart3,
  ShieldAlert, LogOut, ChevronRight
} from 'lucide-react'
import { logout } from '../../store/authSlice'
import { RootState } from '../../store/store'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: CreditCard, label: 'Transactions' },
  { to: '/alerts', icon: Bell, label: 'Alerts', badge: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

const RISK_COLORS: Record<string, string> = {
  low: 'text-mirage-success', medium: 'text-mirage-warning',
  high: 'text-orange-500', critical: 'text-mirage-danger',
}
const RISK_BG: Record<string, string> = {
  low: 'bg-mirage-success/10 border-mirage-success/30',
  medium: 'bg-mirage-warning/10 border-mirage-warning/30',
  high: 'bg-orange-500/10 border-orange-500/30',
  critical: 'bg-mirage-danger/10 border-mirage-danger/30',
}

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s: RootState) => s.auth)
  const { connected } = useSelector((s: RootState) => s.ws)
  const { data } = useSelector((s: RootState) => s.dashboard)
  const unreadAlerts = useSelector((s: RootState) => s.alerts.items.filter(a => !a.is_read).length)

  const riskLevel = data?.latest_risk_score?.risk_level || 'low'
  const riskScore = data?.latest_risk_score?.overall_score || 0

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  return (
    <div className="flex min-h-screen bg-mirage-bg">
      <aside className="w-64 bg-mirage-surface border-r border-mirage-border flex flex-col fixed top-0 left-0 h-full z-40">
        <div className="px-6 py-5 border-b border-mirage-border">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-lg bg-mirage-accent/10 border border-mirage-accent/30 flex items-center justify-center"
              animate={{ boxShadow: ['0 0 8px rgba(0,212,255,0.2)', '0 0 20px rgba(0,212,255,0.4)', '0 0 8px rgba(0,212,255,0.2)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Activity className="w-5 h-5 text-mirage-accent" />
            </motion.div>
            <div>
              <p className="font-display text-mirage-accent text-sm tracking-widest">MIRAGE</p>
              <p className="text-mirage-muted text-[10px] font-mono">DETECTION ENGINE</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-mirage-border">
          <div className="flex items-center gap-2">
            <motion.div
              className={clsx('w-2 h-2 rounded-full', connected ? 'bg-mirage-success' : 'bg-mirage-danger')}
              animate={connected ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-mono text-mirage-muted">
              {connected ? 'LIVE STREAM ACTIVE' : 'RECONNECTING...'}
            </span>
          </div>
        </div>

        {data?.latest_risk_score && (
          <div className={clsx('mx-4 mt-3 px-3 py-2 rounded-lg border', RISK_BG[riskLevel])}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-mirage-muted uppercase">Risk Level</span>
              <span className={clsx('text-xs font-display font-bold uppercase tracking-wider', RISK_COLORS[riskLevel])}>{riskLevel}</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-mirage-bg rounded-full overflow-hidden">
              <motion.div
                className={clsx('h-full rounded-full', {
                  'bg-mirage-success': riskLevel === 'low',
                  'bg-mirage-warning': riskLevel === 'medium',
                  'bg-orange-500': riskLevel === 'high',
                  'bg-mirage-danger': riskLevel === 'critical',
                })}
                initial={{ width: 0 }}
                animate={{ width: `${riskScore * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className={clsx('text-right text-xs font-mono mt-1', RISK_COLORS[riskLevel])}>{(riskScore * 100).toFixed(0)}%</p>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative',
                isActive ? 'bg-mirage-accent/10 text-mirage-accent border border-mirage-accent/20'
                  : 'text-mirage-muted hover:text-mirage-text hover:bg-mirage-card'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{label}</span>
                  {badge && unreadAlerts > 0 && (
                    <span className="ml-auto bg-mirage-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadAlerts > 99 ? '99+' : unreadAlerts}
                    </span>
                  )}
                  {isActive && <ChevronRight className="absolute right-2 w-3 h-3 text-mirage-accent" />}
                </>
              )}
            </NavLink>
          ))}

          {user?.is_admin && (
            <NavLink to="/admin"
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive ? 'bg-mirage-purple/10 text-mirage-purple border border-mirage-purple/20'
                  : 'text-mirage-muted hover:text-mirage-text hover:bg-mirage-card'
              )}
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="font-medium">Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-mirage-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-mirage-accent/10 border border-mirage-accent/20 flex items-center justify-center">
              <span className="text-xs font-display text-mirage-accent">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-mirage-text truncate font-medium">{user?.username}</p>
              <p className="text-xs text-mirage-muted truncate font-mono">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-mirage-muted hover:text-mirage-danger hover:bg-mirage-danger/10 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen bg-mirage-bg">
        <div className="p-6"><Outlet /></div>
      </main>
    </div>
  )
}
