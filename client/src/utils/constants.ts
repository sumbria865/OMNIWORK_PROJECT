export const APP_NAME = 'OmniWork'
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const

export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
} as const

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export const PROJECT_STATUS = {
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ARCHIVED: 'ARCHIVED',
} as const

export const LEAVE_TYPE = {
  CASUAL: 'CASUAL',
  SICK: 'SICK',
  EARNED: 'EARNED',
  MATERNITY: 'MATERNITY',
  PATERNITY: 'PATERNITY',
  UNPAID: 'UNPAID',
} as const

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const

export const EXPENSE_CATEGORY = {
  TRAVEL: 'TRAVEL',
  FOOD: 'FOOD',
  ACCOMMODATION: 'ACCOMMODATION',
  EQUIPMENT: 'EQUIPMENT',
  SOFTWARE: 'SOFTWARE',
  TRAINING: 'TRAINING',
  OTHER: 'OTHER',
} as const

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  ON_LEAVE: 'ON_LEAVE',
  HOLIDAY: 'HOLIDAY',
} as const

export const PLAN_TYPE = {
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const

export const STATUS_COLORS: Record<string, string> = {
  TODO: 'gray',
  IN_PROGRESS: 'blue',
  IN_REVIEW: 'yellow',
  DONE: 'green',
  BLOCKED: 'red',
  ACTIVE: 'green',
  ON_HOLD: 'yellow',
  COMPLETED: 'blue',
  CANCELLED: 'red',
  ARCHIVED: 'gray',
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'yellow',
  HALF_DAY: 'yellow',
  ON_LEAVE: 'blue',
}

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'yellow',
  CRITICAL: 'red',
}

export const KANBAN_COLUMNS = [
  { id: 'TODO', label: 'To Do', color: '#6b7280' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6' },
  { id: 'IN_REVIEW', label: 'In Review', color: '#f59e0b' },
  { id: 'DONE', label: 'Done', color: '#10b981' },
  { id: 'BLOCKED', label: 'Blocked', color: '#ef4444' },
]

export const PAGINATION_LIMIT = 10

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Projects', path: '/projects', icon: 'FolderKanban' },
  { label: 'Tasks', path: '/tasks', icon: 'CheckSquare' },
  { label: 'Chat', path: '/chat', icon: 'MessageSquare' },
  { label: 'Employees', path: '/employees', icon: 'Users' },
  { label: 'Attendance', path: '/attendance', icon: 'Clock' },
  { label: 'Leaves', path: '/leaves', icon: 'Calendar' },
  { label: 'Expenses', path: '/expenses', icon: 'Receipt' },
  { label: 'Analytics', path: '/analytics', icon: 'BarChart2' },
  { label: 'Payments', path: '/payments', icon: 'CreditCard' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
]