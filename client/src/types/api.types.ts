export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  errors?: ValidationError[] | null
}

export interface ValidationError {
  field: string
  message: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface DashboardStats {
  totalUsers: number
  totalProjects: number
  totalTasks: number
  completedTasks: number
  totalEmployees: number
  pendingLeaves: number
  pendingExpenses: number
  activeProjects: number
  taskCompletionRate: number
}

export interface ProjectAnalytics {
  recentProjects: unknown[]
  statusDistribution: {
    status: string
    _count: { status: number }
  }[]
  priorityDistribution: {
    priority: string
    _count: { priority: number }
  }[]
}

export interface TaskAnalytics {
  statusDistribution: {
    status: string
    _count: { status: number }
  }[]
  priorityDistribution: {
    priority: string
    _count: { priority: number }
  }[]
  overdueTasksCount: number
  completionTrend: {
    completedAt: string
  }[]
}

export interface AttendanceAnalytics {
  statusDistribution: {
    PRESENT: number
    ABSENT: number
    LATE: number
    HALF_DAY: number
    ON_LEAVE: number
  }
  averageWorkHours: string
  totalRecords: number
}

export interface ExpenseAnalytics {
  categoryDistribution: {
    category: string
    _sum: { amount: number }
    _count: { category: number }
  }[]
  statusDistribution: {
    status: string
    _count: { status: number }
  }[]
  monthlyExpenses: {
    amount: number
    createdAt: string
    status: string
  }[]
  totalApprovedAmount: number
}

export interface EmployeeProductivity {
  user: {
    id: string
    name: string
    avatar: string | null
  }
  total: number
  completed: number
  overdue: number
  score: number
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  role?: string
  startDate?: string
  endDate?: string
  projectId?: string
  employeeId?: string
  sprintId?: string
  assigneeId?: string
  leaveType?: string
  category?: string
  isRead?: boolean
  month?: number
  year?: number
}