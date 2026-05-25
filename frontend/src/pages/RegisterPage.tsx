import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Activity, UserPlus } from 'lucide-react'
import { register, clearError } from '../store/authSlice'
import { AppDispatch, RootState } from '../store/store'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' })
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
    dispatch(register(form))
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-mirage-bg bg-grid flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mirage-accent/10 border border-mirage-accent/30 mb-4">
            <Activity className="w-8 h-8 text-mirage-accent" />
          </div>
          <h1 className="font-display text-2xl text-mirage-accent tracking-wider">MIRAGE</h1>
          <p className="text-mirage-muted text-sm mt-1 font-mono">CREATE OPERATOR ACCOUNT</p>
        </div>

        <div className="card-glow p-8">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-4 h-4 text-mirage-accent" />
            <h2 className="font-display text-sm text-mirage-text tracking-widest">NEW REGISTRATION</h2>
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
            {[
              { label: 'Full Name', field: 'full_name', type: 'text', required: false },
              { label: 'Email', field: 'email', type: 'email', required: true },
              { label: 'Username', field: 'username', type: 'text', required: true },
            ].map(({ label, field, type, required }) => (
              <div key={field}>
                <label className="block text-xs text-mirage-muted mb-2 font-mono uppercase tracking-wider">
                  {label} {required && <span className="text-mirage-danger">*</span>}
                </label>
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={update(field)}
                  required={required}
                  className="w-full bg-mirage-bg border border-mirage-border rounded-lg px-4 py-3 text-mirage-text text-sm focus:outline-none focus:border-mirage-accent/60 transition-colors font-mono"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs text-mirage-muted mb-2 font-mono uppercase tracking-wider">
                Password <span className="text-mirage-danger">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={8}
                  className="w-full bg-mirage-bg border border-mirage-border rounded-lg px-4 py-3 pr-11 text-mirage-text text-sm focus:outline-none focus:border-mirage-accent/60 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mirage-muted hover:text-mirage-text"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-mirage-accent text-mirage-bg font-display text-sm tracking-widest font-bold hover:bg-mirage-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 glow-accent mt-2"
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'CREATING...' : 'CREATE ACCESS'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-mirage-muted text-sm">
              Have an account?{' '}
              <Link to="/login" className="text-mirage-accent hover:text-mirage-accent/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
