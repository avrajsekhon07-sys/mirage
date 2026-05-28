import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff } from 'lucide-react'
import { register, clearError } from '../store/authSlice'
import { AppDispatch, RootState } from '../store/store'

const FIELDS = [
  { label: 'Full Name',  field: 'full_name', type: 'text',  required: false },
  { label: 'Email',      field: 'email',     type: 'email', required: true  },
  { label: 'Username',   field: 'username',  type: 'text',  required: true  },
] as const

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

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-mirage-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">

        {/* Wordmark */}
        <div className="mb-10">
          <p className="font-mono text-mirage-accent text-[13px] font-bold tracking-[0.3em]">MIRAGE</p>
          <p className="font-mono text-mirage-muted text-[10px] tracking-[0.15em] mt-1">CREATE OPERATOR ACCOUNT</p>
        </div>

        <div className="panel p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-mirage-muted mb-5">New Registration</p>

          {error && (
            <div className="mb-4 px-3 py-2 bg-mirage-danger/8 border border-mirage-danger/30 text-mirage-danger text-[12px] font-mono">
              {error}
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); dispatch(register(form)) }} className="space-y-4">
            {FIELDS.map(({ label, field, type, required }) => (
              <div key={field}>
                <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-1.5">
                  {label}{required && <span className="text-mirage-danger ml-0.5">*</span>}
                </label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={update(field)}
                  required={required}
                  className="w-full bg-mirage-bg border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent px-3 py-2.5 text-[13px] font-mono text-white outline-none transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-1.5">
                Password<span className="text-mirage-danger ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={8}
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
              {loading ? 'Creating...' : 'Create Access'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-mirage-border">
            <p className="text-[11px] text-mirage-muted">
              Have an account?{' '}
              <Link to="/login" className="text-mirage-accent hover:text-mirage-accent-dim transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
