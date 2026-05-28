import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff } from 'lucide-react'
import { login, clearError } from '../store/authSlice'
import { AppDispatch, RootState } from '../store/store'

export default function LoginPage() {
  const [email,    setEmail]    = useState('alex@mirage.demo')
  const [password, setPassword] = useState('Demo1234!')
  const [show,     setShow]     = useState(false)
  const dispatch   = useDispatch<AppDispatch>()
  const navigate   = useNavigate()
  const { loading, error, token } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    if (token) navigate('/dashboard')
    return () => { dispatch(clearError()) }
  }, [token, navigate, dispatch])

  return (
    <div className="min-h-screen bg-mirage-bg flex flex-col">

      {/* Top bar */}
      <header className="border-b border-mirage-border px-8 py-4 flex items-center justify-between flex-shrink-0">
        <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-mirage-accent">MIRAGE</span>
        <Link to="/register" className="font-mono text-[10px] tracking-[0.1em] text-mirage-muted hover:text-white transition-colors">
          CREATE ACCOUNT →
        </Link>
      </header>

      {/* Body: hero left + form right */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-between px-8 lg:px-16 py-12 lg:border-r lg:border-mirage-border">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-mirage-muted mb-6">01 / FINANCIAL RISK INTELLIGENCE</p>
            <h1 className="text-[56px] sm:text-[72px] lg:text-[88px] font-bold text-white leading-[0.9] tracking-[-3px]">
              BEHAVIORAL<br/>
              RISK<br/>
              <span className="text-mirage-accent">ENGINE.</span>
            </h1>
            <p className="mt-8 text-mirage-text-dim text-[14px] leading-relaxed max-w-md">
              AI-powered financial manipulation detection. Real-time behavioral scoring with SHAP explainability for modern institutions.
            </p>
          </div>

          {/* Live stats strip */}
          <div className="flex items-end gap-10 mt-12 pt-8 border-t border-mirage-border">
            {[
              { val: '84.1%', label: 'DEMO RISK SCORE',    color: 'text-mirage-danger'  },
              { val: '105',   label: 'TX ANALYZED',         color: 'text-white'          },
              { val: 'CRIT',  label: 'ALERT LEVEL',         color: 'text-mirage-accent'  },
              { val: '21.6%', label: 'GAMBLING RATIO',      color: 'text-mirage-warning' },
            ].map(({ val, label, color }) => (
              <div key={label}>
                <p className={`text-[28px] font-mono font-bold tabular-nums leading-none ${color}`}>{val}</p>
                <p className="text-[9px] font-mono text-mirage-muted uppercase tracking-[0.1em] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="lg:w-[420px] flex flex-col justify-center px-8 lg:px-12 py-12">
          <p className="font-mono text-[10px] tracking-[0.15em] text-mirage-muted mb-8 uppercase">Operator Access</p>

          {error && (
            <div className="mb-5 px-3 py-2.5 border border-mirage-danger/40 text-mirage-danger text-[12px] font-mono">
              {error}
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); dispatch(login({ email, password })) }} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 text-[13px] font-mono border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent bg-mirage-bg text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-3 py-2.5 pr-10 text-[13px] font-mono border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent bg-mirage-bg text-white outline-none"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mirage-muted hover:text-white transition-colors">
                  {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 mt-2 bg-mirage-accent text-black font-bold text-[12px] font-mono tracking-[0.1em] uppercase hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="spinner" style={{ borderTopColor: '#000' }} />}
              {loading ? 'Authenticating...' : 'Initiate Access →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-mirage-border">
            <p className="text-[11px] text-mirage-muted">
              No account?{' '}
              <Link to="/register" className="text-mirage-accent hover:text-mirage-accent-dim transition-colors">Register</Link>
            </p>
            <p className="text-[10px] font-mono text-mirage-dim mt-2">Demo credentials pre-filled</p>
          </div>

          <p className="text-[10px] font-mono text-mirage-dim tracking-[0.06em] mt-8">
            JWT SECURED · END-TO-END ENCRYPTED
          </p>
        </div>
      </div>
    </div>
  )
}
