import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getPasswordStrength } from '../../utils/helpers'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const strength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden border-r"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #0d0d0d 0%, #111218 100%)'
            : 'linear-gradient(135deg, #f8f9ff 0%, #eef2ff 100%)',
          borderColor: 'var(--surface-border)'
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(var(--surface-border) 1px, transparent 1px), linear-gradient(90deg, var(--surface-border) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
              mniWork
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Built for teams<br />that move
              <span className="text-gradient"> fast.</span>
            </h1>
            <p className="text-lg leading-relaxed max-w-md" style={{ color: 'var(--text-muted)' }}>
              Join teams using OmniWork to manage projects, track attendance, and collaborate in real time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: 'Real-time', desc: 'Live collaboration via Socket.io' },
              { icon: '🔒', title: 'Secure', desc: 'JWT + RBAC authentication' },
              { icon: '📊', title: 'Analytics', desc: 'Smart insights and reports' },
              { icon: '🚀', title: 'Scalable', desc: 'Docker + Kubernetes ready' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border space-y-1"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--surface-border)'
                }}
              >
                <div className="text-xl">{item.icon}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs" style={{ color: 'var(--text-hint)' }}>
            Built with MERN Stack + Socket.io + Prisma + Docker
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="w-full lg:w-[520px] flex items-center justify-center p-8 overflow-y-auto"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="w-full max-w-sm space-y-6 animate-fade-in py-8">
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>mniWork</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Create account
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Start managing your team with OmniWork
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              background: 'transparent',
              border: '1px solid var(--surface-border)',
              color: 'var(--text-secondary)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--surface-border)' }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-hint)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--surface-border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="label">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ninad Gawade"
                  required
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <label className="label">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field cursor-pointer"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  required
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-hint)' }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="label">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                className="input-field"
                style={{
                  borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password
                    ? 'rgb(239 68 68 / 0.5)'
                    : undefined
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-400 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--text-hint)' }}>
            By creating an account you agree to our{' '}
            <a href="#" className="underline hover:opacity-80">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:opacity-80">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}