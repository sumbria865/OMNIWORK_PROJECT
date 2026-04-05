import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { User } from '../../types/user.types'

export default function GoogleSuccess() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()  // ← use loginWithGoogle not login

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const user = params.get('user')

    if (token && user) {
      loginWithGoogle(token, JSON.parse(decodeURIComponent(user)) as User)  // ← correct
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Signing you in...</p>
      </div>
    </div>
  )
}