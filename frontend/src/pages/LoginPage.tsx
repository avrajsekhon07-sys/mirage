import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, Activity, Lock } from 'lucide-react'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(login({ email, password }))
  }

  return (
    <div className="min-h-screen bg-mirage-bg bg-grid flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-mirage-accent rounded-full opacity-30"
          animate={{ y: [-20, -80, -20], x: [0, Math.sin(i) * 30, 0], opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8 }}
          style={{ left: `${15 + i * 14}%`, top: `${40 + Math.sin(i) * 20}%` }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mirage-accent/10 border border-mirage-accent/30 mb-4 glow-accent"
            animate={{ boxShadow: ['0 0 15px rgba(0,212,255,0.2)', '0 0 30px rgba(0,212,255,0.4)', '0 0 15px rgba(0,212,255,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="w-8 h-8 text-mirage-accent" />
          </motion.div>
          <h1 className="font-display text-2xl text-mirage-accent text-glow tracking-wider">MIRAGE</h1>
          <p className="text-mirage-muted text-sm mt-1 font-mono">BEHAVIORAL DETECTION ENGINE</p>
        </div>

        {/* Card */}
        <div className="card-glow p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-mirage-accent" />
            <h2 className="font-display text-sm text-mirage-text tracking-widest">SECURE ACCESS</h2>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 rounded-lg bg-mirage-danger/10 border border-mirage-danger/30 text-mirage-danger text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-mirage-muted mb-2 font-mono uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-mirage-bg border border-mirage-border rounded-lg px-4 py-3 text-mirage-text text-sm focus:outline-none focus:border-mirage-accent/60 transition-colors font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-mirage-muted mb-2 font-mono uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-mirage-bg border border-mirage-border rounded-lg px-4 py-3 pr-11 text-mirage-text text-sm focus:outline-none focus:border-mirage-accent/60 transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mirage-muted hover:text-mirage-text transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-mirage-accent text-mirage-bg font-display text-sm tracking-widest font-bold hover:bg-mirage-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 glow-accent"
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'AUTHENTICATING...' : 'INITIATE ACCESS'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-mirage-muted text-sm">
              No account?{' '}
              <Link to="/register" className="text-mirage-accent hover:text-mirage-accent/80 transition-colors">
                Register access
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-4 p-3 rounded-lg bg-mirage-accent/5 border border-mirage-accent/10">
            <p className="text-xs text-mirage-muted font-mono text-center">
              Demo pre-filled • Password: <span className="text-mirage-accent">Demo1234!</span>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Shield className="w-3 h-3 text-mirage-muted" />
          <span className="text-xs text-mirage-muted font-mono">JWT SECURED • END-TO-END ENCRYPTED</span>
        </div>
      </motion.div>
    </div>
  )
}
