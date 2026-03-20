import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useTheme } from '../../context/ThemeContext'
import { getAvatarUrl } from '../../utils/helpers'
import { formatRelative } from '../../utils/formatDate'
import { notificationService } from '../../services/notification.service'
import {
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Check,
  Trash2,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

const pageTitles: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/projects':   'Projects',
  '/tasks':      'Tasks',
  '/chat':       'Chat',
  '/employees':  'Employees',
  '/attendance': 'Attendance',
  '/leaves':     'Leave Management',
  '/expenses':   'Expenses',
  '/analytics':  'Analytics',
  '/payments':   'Payments',
  '/settings':   'Settings',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isConnected, socket } = useSocket()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const pageTitle = pageTitles[location.pathname] || 'OmniWork'

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifs(true)
      const res = await notificationService.getMyNotifications({ limit: 10 })
      setNotifications(res.data.data.notifications)
      setUnreadCount(res.data.data.unreadCount)
    } catch {
      console.error('Failed to fetch notifications')
    } finally {
      setLoadingNotifs(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!socket) return
    socket.on('new_notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      toast(notification.title, { icon: '🔔', duration: 3000 })
    })
    socket.on('all_notifications_read', () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    })
    return () => {
      socket.off('new_notification')
      socket.off('all_notifications_read')
    }
  }, [socket])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      const deleted = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const notifTypeColors: Record<string, string> = {
    TASK_ASSIGNED:    'bg-brand-500/10 text-brand-500',
    TASK_UPDATED:     'bg-blue-500/10 text-blue-500',
    LEAVE_APPROVED:   'bg-green-500/10 text-green-500',
    LEAVE_REJECTED:   'bg-red-500/10 text-red-500',
    EXPENSE_APPROVED: 'bg-green-500/10 text-green-500',
    EXPENSE_REJECTED: 'bg-red-500/10 text-red-500',
    PROJECT_ADDED:    'bg-purple-500/10 text-purple-500',
    GENERAL:          'bg-gray-500/10 text-gray-500',
  }

  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          {pageTitle}
        </h1>
        {isConnected && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 text-xs font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => {
            const query = prompt('Search OmniWork...')
            if (query) window.location.href = `/projects?search=${query}`
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors border"
          style={{
            background: 'var(--surface-hover)',
            borderColor: 'var(--surface-border)',
            color: 'var(--text-muted)'
          }}
        >
          <Search size={14} />
          <span className="hidden sm:block text-xs">Search...</span>
          <kbd
            className="hidden sm:block text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'var(--surface-muted)', color: 'var(--text-hint)' }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              if (!showNotifications) fetchNotifications()
            }}
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold" style={{ fontSize: '9px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 top-full mt-2 w-96 rounded-xl shadow-card z-50 animate-fade-in border"
              style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)' }}
            >
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: 'var(--surface-border)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="badge badge-purple text-xs">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400 transition-colors"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-brand-500" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={24} className="mx-auto mb-2" style={{ color: 'var(--text-hint)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-4 border-b group transition-colors"
                      style={{
                        borderColor: 'var(--surface-border)',
                        background: !notif.isRead ? 'var(--surface-hover)' : 'transparent'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = !notif.isRead ? 'var(--surface-hover)' : 'transparent')}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${notifTypeColors[notif.type] || 'bg-gray-500/10 text-gray-500'}`}>
                        <Bell size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: notif.isRead ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {notif.title}
                        </p>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {notif.message}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>
                          {formatRelative(notif.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1 rounded transition-colors text-brand-500 hover:text-brand-400"
                            title="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="p-1 rounded transition-colors text-red-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {!notif.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div
                  className="p-3 border-t"
                  style={{ borderColor: 'var(--surface-border)' }}
                >
                  <button
                    onClick={async () => {
                      await notificationService.deleteAllNotifications()
                      setNotifications([])
                      setUnreadCount(0)
                      toast.success('All notifications cleared')
                    }}
                    className="w-full text-center text-xs transition-colors py-1 text-red-400 hover:text-red-500"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <img
              src={getAvatarUrl(user?.avatar || null, user?.name || 'User')}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover ring-1"
              style={{ ringColor: 'var(--surface-border)' }}
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium leading-none" style={{ color: 'var(--text-primary)' }}>
                {user?.name}
              </p>
              <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {user?.role?.toLowerCase()}
              </p>
            </div>
            <ChevronDown size={14} className="hidden sm:block" style={{ color: 'var(--text-hint)' }} />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-card z-50 animate-fade-in overflow-hidden border"
              style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)' }}
            >
              <div className="p-3 border-b" style={{ borderColor: 'var(--surface-border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                <span className="mt-1.5 inline-flex badge badge-purple capitalize">
                  {user?.role?.toLowerCase()}
                </span>
              </div>

              <div className="p-1.5 space-y-0.5">
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--surface-hover)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  <User size={15} />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--surface-hover)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  <Settings size={15} />
                  Settings
                </Link>
                <button
                  onClick={() => { setShowUserMenu(false); logout() }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-red-500 hover:bg-red-500/10"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}