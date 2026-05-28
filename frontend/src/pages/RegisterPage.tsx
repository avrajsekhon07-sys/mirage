import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff } from 'lucide-react'
import { register, clearError } from '../store/authSlice'
import { AppDispatch, RootState } from '../store/store'

const FIELDS = [
  { label: 'Full Name', field: 'full_name', type: 'text',  required: false },
  { label: 'Email',     field: 'email',     type: 'email', required: true  },
  { label: 'Username',  field: 'username',  type: 'text',  required: true  },
] as const

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' })
  const [show, setShow] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    if (token) navigate('/dashboard')
    return () => { dispatch(clearError()) }
  }, [token, navigate, dispatch])

  const upd = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-mirage-bg flex flex-col">
      <header className="border-b border-mirage-border px-8 py-4 flex items-center justify-between flex-shrink-0">
        <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-mirage-accent">MIRAGE</span>
        <Link to="/login" className="font-mono text-[10px] tracking-[0.1em] text-mirage-muted hover:text-white transition-colors">
          SIGN IN →
        </Link>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 lg:border-r lg:border-mirage-border">
          <p className="font-mono text-[10px] tracking-[0.2em] text-mirage-muted mb-6">02 / CREATE OPERATOR ACCOUNT</p>
          <h1 className="text-[56px] sm:text-[72px] font-bold text-white leading-[0.9] tracking-[-3px]">
            JOIN THE<br/>
            <span className="text-mirage-accent">NETWORK.</span>
          </h1>
          <p className="mt-8 text-mirage-text-dim text-[14px] leading-relaxed max-w-sm">
            Access real-time behavioral risk scoring, SHAP explainability, and live transaction monitoring.
          </p>
        </div>

        {/* Form */}
        <div className="lg:w-[420px] flex flex-col justify-center px-8 lg:px-12 py-12">
          <p className="font-mono text-[10px] tracking-[0.15em] text-mirage-muted mb-8 uppercase">New Registration</p>

          {error && (
            <div className="mb-5 px-3 py-2.5 border border-mirage-danger/40 text-mirage-danger text-[12px] font-mono">
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
                  type={type} value={form[field]} onChange={upd(field)} required={required}
                  className="w-full px-3 py-2.5 text-[13px] font-mono border border-mirage-border hover:border-mirage-border-hi focus:border-mirage-accent bg-mirage-bg text-white outline-none"
                />
              </div>
            ))}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-mirage-muted mb-1.5">
                Password<span className="text-mirage-danger ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} value={form.password} onChange={upd('password')}
                  required minLength={8}
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
              {loading ? 'Creating...' : 'Create Access →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-mirage-border">
            <p className="text-[11px] text-mirage-muted">
              Have an account?{' '}
              <Link to="/login" className="text-mirage-accent hover:text-mirage-accent-dim transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
