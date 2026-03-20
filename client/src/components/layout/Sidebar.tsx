import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAvatarUrl } from '../../utils/helpers'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Users,
  Clock,
  Calendar,
  Receipt,
  BarChart2,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useSocket } from '../../context/SocketContext'

const navItems = [
  { label: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Projects',   path: '/projects',   icon: FolderKanban,    roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Tasks',      path: '/tasks',      icon: CheckSquare,     roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Chat',       path: '/chat',       icon: MessageSquare,   roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Employees',  path: '/employees',  icon: Users,           roles: ['ADMIN', 'MANAGER'] },
  { label: 'Attendance', path: '/attendance', icon: Clock,           roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Leaves',     path: '/leaves',     icon: Calendar,        roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Expenses',   path: '/expenses',   icon: Receipt,         roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Analytics',  path: '/analytics',  icon: BarChart2,       roles: ['ADMIN', 'MANAGER'] },
  { label: 'Payments',   path: '/payments',   icon: CreditCard,      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Settings',   path: '/settings',   icon: Settings,        roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { isConnected } = useSocket()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const filteredItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  )

  return (
    <aside
      className={`
  flex flex-col h-screen border-r transition-all duration-300 ease-in-out flex-shrink-0
  ${collapsed ? 'w-16' : 'w-60'}
`}
style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-surface-border flex-shrink-0">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              O
            </div>
            <span className="text-white font-bold text-base tracking-tight">mniWork</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              O
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-600 hover:text-gray-400 transition-colors p-1 rounded-lg hover:bg-surface-hover"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 cursor-pointer group
                ${isActive
                  ? 'text-brand-400 bg-brand-500/10'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-surface-hover'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : ''}
            >
              <Icon
                size={18}
                className={`flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300'}`}
              />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex-shrink-0 border-t border-surface-border p-2 space-y-1">
        {!collapsed && (
          <div className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-xs
            ${isConnected ? 'text-green-500' : 'text-gray-600'}
          `}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        )}

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-2 text-gray-600 hover:text-gray-400 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}

        <div className={`
          flex items-center gap-3 px-3 py-2 rounded-lg
          hover:bg-surface-hover transition-colors cursor-pointer group
          ${collapsed ? 'justify-center' : ''}
        `}>
          <div className="relative flex-shrink-0">
            <img
              src={getAvatarUrl(user?.avatar || null, user?.name || 'User')}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-surface-border"
            />
            <div className={`
              absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-surface
              ${isConnected ? 'bg-green-500' : 'bg-gray-600'}
            `} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-gray-200 text-xs font-medium truncate">{user?.name}</p>
              <p className="text-gray-600 text-xs truncate capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}