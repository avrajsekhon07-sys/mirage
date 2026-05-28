import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff } from 'lucide-react'
import { login, clearError } from '../store/authSlice'
import { AppDispatch, RootState } from '../store/store'

export default function LoginPage() {
  const [email, setEmail] = useState('alex@mirage.demo')
  const [password, setPassword] = useState('Demo1234!')
  const [showPass, setShowPass] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    if (token) navigate('/dashboard')
    return () => { dispatch(clearError()) }
  }, [token, navigate, dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(login({ email, password }))
  }

  return (
    <div className="min-h-screen bg-mirage-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">

        {/* Wordmark */}
        <div className="mb-10">
          <p className="font-mono text-mirage-accent text-[13px] font-bold tracking-[0.3em]">MIRAGE</p>
          <p className="font-mono text-mirage-muted text-[10px] tracking-[0.15em] mt-1">BEHAVIORAL RISK ENGINE</p>
        </div>

        {/* Form card */}
        <div className="panel p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted mb-5">Operator Access</p>

          {error && (
            <div className="mb-4 px-3 py-2 bg-mirage-danger/8 border border-mirage-danger/30 text-mirage-danger text-[12px] font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-mirage-bg border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent px-3 py-2.5 text-[13px] font-mono text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-mirage-bg border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent px-3 py-2.5 pr-10 text-[13px] font-mono text-white outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mirage-muted hover:text-mirage-text-dim transition-colors"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 border border-mirage-accent text-mirage-accent hover:bg-mirage-accent hover:text-mirage-bg text-[11px] font-mono tracking-[0.1em] uppercase font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="spinner" />}
              {loading ? 'Authenticating...' : 'Initiate Access'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-mirage-border flex items-center justify-between">
            <p className="text-[11px] text-mirage-muted">
              No account?{' '}
              <Link to="/register" className="text-mirage-accent hover:text-mirage-accent-dim transition-colors">
                Register
              </Link>
            </p>
            <p className="text-[10px] font-mono text-mirage-dim">Demo pre-filled</p>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] font-mono text-mirage-dim tracking-[0.06em]">
          JWT SECURED · END-TO-END ENCRYPTED
        </p>
      </div>
    </div>
  )
}
