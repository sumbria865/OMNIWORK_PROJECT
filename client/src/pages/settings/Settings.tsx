import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import { getAvatarUrl } from '../../utils/helpers'
import {
  User,
  Lock,
  Bell,
  Moon,
  Sun,
  Save,
  Loader2,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'

type TabType = 'profile' | 'password' | 'appearance' | 'notifications'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put('/users/profile', { name: profileForm.name })
      updateUser(res.data.data.user)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    try {
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',       label: 'Profile',       icon: <User size={15} /> },
    { id: 'password',      label: 'Password',      icon: <Lock size={15} /> },
    { id: 'appearance',    label: 'Appearance',    icon: <Moon size={15} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  ]

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h2 className="page-title">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 text-left
                ${activeTab === tab.id
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-surface-hover'
                }
              `}
            >
              {tab.icon}
              {tab.label}




            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="card space-y-6">
              <div>
                <h3 className="section-title">Profile Information</h3>
                <p className="text-gray-600 text-xs mt-1">Update your personal details</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={getAvatarUrl(user?.avatar || null, user?.name || 'User')}
                    alt={user?.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-surface-border"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                    <User size={10} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-200 font-medium">{user?.name}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{user?.email}</p>
                  <span className="badge badge-purple mt-1.5 capitalize">
                    {user?.role?.toLowerCase()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="label">Full name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                  <p className="text-gray-600 text-xs">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <label className="label">Role</label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="input-field opacity-50 cursor-not-allowed capitalize"
                  />
                  <p className="text-gray-600 text-xs">Role is assigned by administrator</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Save size={16} />
                    }
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password tab */}
          {activeTab === 'password' && (
            <div className="card space-y-6">
              <div>
                <h3 className="section-title">Change Password</h3>
                <p className="text-gray-600 text-xs mt-1">
                  Use a strong password with uppercase, lowercase and numbers
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl">
                <Shield size={16} className="text-brand-400 flex-shrink-0" />
                <p className="text-gray-400 text-xs">
                  Password must be at least 8 characters with one uppercase letter and one number
                </p>
              </div>

              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="label">Current password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      required
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label">New password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      required
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label">Confirm new password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    required
                    className={`input-field ${
                      passwordForm.confirmPassword &&
                      passwordForm.confirmPassword !== passwordForm.newPassword
                        ? 'border-red-500/50'
                        : ''
                    }`}
                  />
                  {passwordForm.confirmPassword &&
                   passwordForm.confirmPassword !== passwordForm.newPassword && (
                    <p className="text-red-400 text-xs">Passwords do not match</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Lock size={16} />
                    }
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Appearance tab */}
          
          {activeTab === 'appearance' && (
  <div className="card space-y-6">
    <div>
      <h3 className="section-title">Appearance</h3>
      <p className="text-[var(--text-muted)] text-xs mt-1">Customize how OmniWork looks</p>
    </div>

    <div className="flex items-center justify-between p-4 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-xl">
      <div className="flex items-center gap-3">
        {theme === 'dark'
          ? <Moon size={18} className="text-brand-400" />
          : <Sun size={18} className="text-yellow-500" />
        }
        <div>
          <p className="text-[var(--text-primary)] text-sm font-medium">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">
            {theme === 'dark'
              ? 'Currently using dark theme'
              : 'Currently using light theme'
            }
          </p>
        </div>
      </div>
      <button
        onClick={toggleTheme}
        className={`
          relative w-12 h-6 rounded-full transition-colors duration-200
          ${theme === 'dark' ? 'bg-brand-500' : 'bg-gray-300'}
        `}
      >
        <div className={`
          absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
          ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}
        `} />
      </button>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Dark',  value: 'dark',  bg: '#0a0a0c', border: '#1f2028', text: '#f9fafb' },
        { label: 'Light', value: 'light', bg: '#ffffff',  border: '#e5e7eb', text: '#111827' },
      ].map(option => (
        <button
          key={option.value}
          onClick={() => option.value !== theme && toggleTheme()}
          className={`
            p-4 rounded-xl border-2 transition-all text-left space-y-2
            ${theme === option.value
              ? 'border-brand-500'
              : 'border-[var(--surface-border)] hover:border-[var(--surface-muted)]'
            }
          `}
        >
          <div
            className="w-full h-16 rounded-lg border"
            style={{ background: option.bg, borderColor: option.border }}
          >
            <div className="flex gap-1.5 p-2">
              {['#6366f1', '#10b981', '#f59e0b'].map((c, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="px-2 space-y-1 mt-1">
              <div className="h-1.5 rounded-full w-3/4" style={{ background: option.border }} />
              <div className="h-1.5 rounded-full w-1/2" style={{ background: option.border }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-primary)] text-sm font-medium">{option.label}</span>
            {theme === option.value && (
              <div className="w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  </div>
)}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <div className="card space-y-6">
              <div>
                <h3 className="section-title">Notification Preferences</h3>
                <p className="text-gray-600 text-xs mt-1">Choose what notifications you receive</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Task assigned to me', desc: 'When someone assigns a task to you', enabled: true },
                  { label: 'Task status updated', desc: 'When a task you created is updated', enabled: true },
                  { label: 'Leave request approved', desc: 'When your leave request is approved or rejected', enabled: true },
                  { label: 'Expense approved', desc: 'When your expense is approved or rejected', enabled: true },
                  { label: 'New project added', desc: 'When you are added to a project', enabled: true },
                  { label: 'Chat mentions', desc: 'When someone mentions you in chat', enabled: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-surface-hover border border-surface-border rounded-xl"
                  >
                    <div>
                      <p className="text-gray-200 text-sm font-medium">{item.label}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <div
                      className={`
                        relative w-10 h-5 rounded-full transition-colors cursor-pointer
                        ${item.enabled ? 'bg-brand-500' : 'bg-surface-muted'}
                      `}
                    >
                      <div className={`
                        absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                        ${item.enabled ? 'translate-x-5' : 'translate-x-0.5'}
                      `} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button className="btn-primary">
                  <Save size={16} />
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}