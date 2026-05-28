import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/authSlice'
import { RootState } from '../../store/store'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard'     },
  { to: '/transactions', label: 'Transactions'   },
  { to: '/alerts',       label: 'Alerts', badge: true },
  { to: '/analytics',    label: 'Analytics'     },
]

const RISK_CLR: Record<string, string> = {
  low: 'text-mirage-accent', medium: 'text-mirage-warning',
  high: 'text-orange-500',   critical: 'text-mirage-danger',
}
const RISK_BAR: Record<string, string> = {
  low: 'bg-mirage-accent', medium: 'bg-mirage-warning',
  high: 'bg-orange-500',   critical: 'bg-mirage-danger',
}

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user }      = useSelector((s: RootState) => s.auth)
  const { connected } = useSelector((s: RootState) => s.ws)
  const { data }      = useSelector((s: RootState) => s.dashboard)
  const unread        = useSelector((s: RootState) => s.alerts.items.filter(a => !a.is_read).length)

  const level = data?.latest_risk_score?.risk_level || 'low'
  const score = data?.latest_risk_score?.overall_score || 0

  return (
    <div className="flex min-h-screen bg-mirage-bg">
      {/* Sidebar */}
      <aside className="w-[220px] bg-mirage-surface border-r border-mirage-border flex flex-col fixed top-0 left-0 h-full z-40">

        {/* Wordmark */}
        <div className="px-5 py-5 border-b border-mirage-border">
          <p className="font-mono text-[13px] font-bold tracking-[0.25em] text-mirage-accent">MIRAGE</p>
          <div className="flex items-center justify-between mt-1">
            <p className="font-mono text-[9px] tracking-[0.12em] text-mirage-muted">RISK ENGINE v2</p>
            <div className={clsx('flex items-center gap-1', connected ? 'text-mirage-accent' : 'text-mirage-danger')}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="text-[9px] font-mono">{connected ? 'LIVE' : 'OFF'}</span>
            </div>
          </div>
        </div>

        {/* Risk meter */}
        {data?.latest_risk_score && (
          <div className="px-5 py-4 border-b border-mirage-border">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[9px] font-mono text-mirage-muted uppercase tracking-[0.1em]">Risk Score</span>
              <span className={clsx('text-[9px] font-mono uppercase', RISK_CLR[level])}>{level}</span>
            </div>
            <p className={clsx('text-[34px] font-mono font-bold leading-none tabular-nums', RISK_CLR[level])}>
              {(score * 100).toFixed(0)}
              <span className="text-[14px] font-normal text-mirage-muted ml-0.5">/100</span>
            </p>
            <div className="mt-2 h-px bg-mirage-border overflow-hidden">
              <div className={clsx('h-full transition-all duration-700', RISK_BAR[level])} style={{ width: `${score * 100}%` }} />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3">
          {NAV.map(({ to, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => clsx(
                'flex items-center justify-between py-2.5 text-[13px] font-medium transition-colors border-l-2 pl-[18px] pr-5',
                isActive ? 'text-white border-l-mirage-accent' : 'text-mirage-muted hover:text-mirage-text-dim border-l-transparent'
              )}
            >
              <span>{label}</span>
              {badge && unread > 0 && (
                <span className="text-[9px] font-mono bg-mirage-danger text-white px-1.5 py-px min-w-[18px] text-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          ))}
          {user?.is_admin && (
            <NavLink to="/admin"
              className={({ isActive }) => clsx(
                'flex items-center py-2.5 text-[13px] font-medium transition-colors border-l-2 pl-[18px] pr-5',
                isActive ? 'text-white border-l-mirage-accent' : 'text-mirage-muted hover:text-mirage-text-dim border-l-transparent'
              )}
            >Admin</NavLink>
          )}
        </nav>

        {/* User */}
        <div className="px-5 py-4 border-t border-mirage-border">
          <p className="text-[12px] font-semibold text-white truncate">{user?.username}</p>
          <p className="text-[10px] font-mono text-mirage-muted truncate mt-0.5 mb-3">{user?.email}</p>
          <button
            onClick={() => { dispatch(logout()); navigate('/login') }}
            className="text-[10px] font-mono text-mirage-muted hover:text-mirage-danger transition-colors tracking-[0.06em]"
          >
            SIGN OUT →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[220px] min-h-screen">
        <div className="p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
