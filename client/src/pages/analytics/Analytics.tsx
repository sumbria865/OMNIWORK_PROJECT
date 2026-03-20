import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts'
import {
  TrendingUp,
  Users,
  FolderKanban,
  CheckSquare,
  Calendar,
  Receipt,
  Loader2,
  Award
} from 'lucide-react'
import { getAvatarUrl, formatCurrency } from '../../utils/helpers'
import { getCurrentMonth, getCurrentYear } from '../../utils/formatDate'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface DashboardStats {
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

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [taskAnalytics, setTaskAnalytics] = useState<any>(null)
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<any>(null)
  const [expenseAnalytics, setExpenseAnalytics] = useState<any>(null)
  const [productivity, setProductivity] = useState<any[]>([])
  const [projectAnalytics, setProjectAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const [
        statsRes,
        taskRes,
        attendanceRes,
        expenseRes,
        productivityRes,
        projectRes
      ] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => null),
        api.get('/analytics/tasks').catch(() => null),
        api.get(`/analytics/attendance?month=${getCurrentMonth()}&year=${getCurrentYear()}`).catch(() => null),
        api.get('/analytics/expenses').catch(() => null),
        api.get('/analytics/productivity').catch(() => null),
        api.get('/analytics/projects').catch(() => null)
      ])

      if (statsRes?.data?.data?.stats) setStats(statsRes.data.data.stats)
      if (taskRes?.data?.data?.analytics) setTaskAnalytics(taskRes.data.data.analytics)
      if (attendanceRes?.data?.data?.analytics) setAttendanceAnalytics(attendanceRes.data.data.analytics)
      if (expenseRes?.data?.data?.analytics) setExpenseAnalytics(expenseRes.data.data.analytics)
      if (productivityRes?.data?.data?.productivity) setProductivity(productivityRes.data.data.productivity)
      if (projectRes?.data?.data?.analytics) setProjectAnalytics(projectRes.data.data.analytics)
    } catch {
      toast.error('Failed to fetch analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const taskStatusData = taskAnalytics?.statusDistribution?.map((item: any) => ({
    name: item.status.replace('_', ' '),
    value: item._count.status
  })) || []

  const taskPriorityData = taskAnalytics?.priorityDistribution?.map((item: any) => ({
    name: item.priority,
    value: item._count.priority
  })) || []

  const attendanceData = attendanceAnalytics?.statusDistribution
    ? Object.entries(attendanceAnalytics.statusDistribution).map(([key, value]) => ({
        name: key.replace('_', ' '),
        value: value as number
      }))
    : []

  const expenseCategoryData = expenseAnalytics?.categoryDistribution?.map((item: any) => ({
    name: item.category,
    amount: item._sum.amount || 0,
    count: item._count.category
  })) || []

  const projectStatusData = projectAnalytics?.statusDistribution?.map((item: any) => ({
    name: item.status.replace('_', ' '),
    value: item._count.status
  })) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="page-title">Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">Insights and performance metrics</p>
      </div>

      {/* Overview stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-brand-400', bg: 'bg-brand-500/10' },
            { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Team Members', value: stats.totalEmployees, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Completion Rate', value: `${stats.taskCompletionRate}%`, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map((item, i) => (
            <div key={i} className="card flex items-center gap-4">
              <div className={`p-3 ${item.bg} rounded-xl`}>
                <item.icon size={20} className={item.color} />
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task status distribution */}
        <div className="card">
          <div className="mb-5">
            <h3 className="section-title">Task Status Distribution</h3>
            <p className="text-gray-600 text-xs mt-1">Breakdown by current status</p>
          </div>
          {taskStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={taskStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2028" />
                <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#111218',
                    border: '1px solid #1f2028',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                  {taskStatusData.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">
              No task data available
            </div>
          )}
        </div>

        {/* Task priority distribution */}
        <div className="card">
          <div className="mb-5">
            <h3 className="section-title">Task Priority Distribution</h3>
            <p className="text-gray-600 text-xs mt-1">Breakdown by priority level</p>
          </div>
          {taskPriorityData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={taskPriorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskPriorityData.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#111218',
                      border: '1px solid #1f2028',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {taskPriorityData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-500 text-xs">{item.name}</span>
                    </div>
                    <span className="text-gray-300 text-xs font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">
              No priority data available
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance analytics */}
        <div className="card">
          <div className="mb-5">
            <h3 className="section-title">Attendance Overview</h3>
            <p className="text-gray-600 text-xs mt-1">
              This month · Avg {attendanceAnalytics?.averageWorkHours || 0}h/day
            </p>
          </div>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2028" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{
                    background: '#111218',
                    border: '1px solid #1f2028',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                  {attendanceData.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">
              No attendance data available
            </div>
          )}
        </div>

        {/* Expense by category */}
        <div className="card">
          <div className="mb-5">
            <h3 className="section-title">Expense by Category</h3>
            <p className="text-gray-600 text-xs mt-1">
              Total approved: {formatCurrency(expenseAnalytics?.totalApprovedAmount || 0)}
            </p>
          </div>
          {expenseCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expenseCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2028" />
                <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#111218',
                    border: '1px solid #1f2028',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [formatCurrency(value), 'Amount']}
                />
                <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                  {expenseCategoryData.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">
              No expense data available
            </div>
          )}
        </div>
      </div>

      {/* Employee productivity */}
      {productivity.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Employee Productivity</h3>
              <p className="text-gray-600 text-xs mt-1">Ranked by task completion score</p>
            </div>
            <Award size={16} className="text-yellow-400" />
          </div>

          <div className="space-y-3">
            {productivity.map((emp: any, index: number) => (
              <div
                key={emp.user.id}
                className="flex items-center gap-4 p-3 bg-surface-hover border border-surface-border rounded-xl"
              >
                <div className="flex items-center gap-1 w-6 flex-shrink-0">
                  {index === 0 && <span className="text-yellow-400 text-sm">🥇</span>}
                  {index === 1 && <span className="text-gray-400 text-sm">🥈</span>}
                  {index === 2 && <span className="text-amber-600 text-sm">🥉</span>}
                  {index > 2 && (
                    <span className="text-gray-600 text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <img
                  src={getAvatarUrl(emp.user.avatar, emp.user.name)}
                  alt={emp.user.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm font-medium">{emp.user.name}</p>
                  <p className="text-gray-600 text-xs">
                    {emp.completed}/{emp.total} tasks · {emp.overdue} overdue
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${emp.score}%`,
                        background: emp.score >= 80 ? '#10b981' : emp.score >= 50 ? '#6366f1' : '#ef4444'
                      }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${
                    emp.score >= 80 ? 'text-green-400' :
                    emp.score >= 50 ? 'text-brand-400' : 'text-red-400'
                  }`}>
                    {emp.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project status distribution */}
      {projectStatusData.length > 0 && (
        <div className="card">
          <div className="mb-5">
            <h3 className="section-title">Project Status Distribution</h3>
            <p className="text-gray-600 text-xs mt-1">Overview of all projects</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projectStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2028" />
              <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#111218',
                  border: '1px solid #1f2028',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="value" name="Projects" radius={[4, 4, 0, 0]}>
                {projectStatusData.map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}