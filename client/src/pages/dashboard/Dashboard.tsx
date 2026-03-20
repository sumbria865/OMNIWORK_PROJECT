import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatRelative } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/helpers'
import {
  FolderKanban,
  CheckSquare,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  Receipt,
  ArrowUpRight,
  Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

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

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  change?: string
  link?: string
}

const StatCard = ({ title, value, icon, color, change, link }: StatCardProps) => (
  <div className="card hover:border-surface-muted transition-colors group">
    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-gray-100">{value}</p>
        {change && (
          <p className="text-xs text-green-400 flex items-center gap-1">
            <TrendingUp size={12} />
            {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
    {link && (
      <Link
        to={link}
        className="mt-4 flex items-center gap-1 text-xs text-gray-600 hover:text-brand-400 transition-colors"
      >
        View all
        <ArrowUpRight size={12} />
      </Link>
    )}
  </div>
)

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [taskAnalytics, setTaskAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const [statsRes, projectsRes] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => null),
        api.get('/projects?limit=5').catch(() => null),
      ])

      if (statsRes?.data?.data?.stats) {
        setStats(statsRes.data.data.stats)
      }
      if (projectsRes?.data?.data?.projects) {
        setRecentProjects(projectsRes.data.data.projects)
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const taskChartData = taskAnalytics?.statusDistribution?.map((item: any) => ({
    name: item.status.replace('_', ' '),
    value: item._count.status
  })) || [
    { name: 'TODO', value: stats ? stats.totalTasks - stats.completedTasks : 0 },
    { name: 'DONE', value: stats?.completedTasks || 0 },
  ]

  const areaData = [
    { name: 'Mon', tasks: 4, projects: 2 },
    { name: 'Tue', tasks: 7, projects: 3 },
    { name: 'Wed', tasks: 5, projects: 2 },
    { name: 'Thu', tasks: 9, projects: 4 },
    { name: 'Fri', tasks: 6, projects: 3 },
    { name: 'Sat', tasks: 3, projects: 1 },
    { name: 'Sun', tasks: 8, projects: 5 },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-32 bg-surface-hover" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Here is what is happening with your team today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-surface-border rounded-xl">
            <Activity size={14} className="text-brand-400" />
            <span className="text-gray-400 text-sm">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          icon={<FolderKanban size={20} className="text-brand-400" />}
          color="bg-brand-500/10"
          change="All running smoothly"
          link="/projects"
        />
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          icon={<CheckSquare size={20} className="text-green-400" />}
          color="bg-green-500/10"
          change={`${stats?.taskCompletionRate || 0}% completion rate`}
          link="/tasks"
        />
        <StatCard
          title="Team Members"
          value={stats?.totalEmployees || 0}
          icon={<Users size={20} className="text-blue-400" />}
          color="bg-blue-500/10"
          link="/employees"
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves || 0}
          icon={<Calendar size={20} className="text-yellow-400" />}
          color="bg-yellow-500/10"
          change="Awaiting approval"
          link="/leaves"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Clock size={20} className="text-purple-400" />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Completed Tasks</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">{stats?.completedTasks || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Pending Expenses</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">{stats?.pendingExpenses || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 rounded-xl">
            <Receipt size={20} className="text-teal-400" />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">{stats?.totalUsers || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="section-title">Activity Overview</h3>
              <p className="text-gray-600 text-xs mt-1">Tasks and projects this week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="projectsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2028" />
              <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#111218',
                  border: '1px solid #1f2028',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={2} fill="url(#tasksGrad)" name="Tasks" />
              <Area type="monotone" dataKey="projects" stroke="#10b981" strokeWidth={2} fill="url(#projectsGrad)" name="Projects" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <div className="mb-6">
            <h3 className="section-title">Task Status</h3>
            <p className="text-gray-600 text-xs mt-1">Distribution by status</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={taskChartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {taskChartData.map((_: any, index: number) => (
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
          <div className="space-y-2 mt-2">
            {taskChartData.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-500 text-xs">{item.name}</span>
                </div>
                <span className="text-gray-300 text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-title">Recent Projects</h3>
            <p className="text-gray-600 text-xs mt-1">Your latest projects</p>
          </div>
          <Link to="/projects" className="btn-secondary text-xs py-1.5 px-3">
            View all
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No projects yet</p>
            <Link to="/projects" className="btn-primary text-xs mt-4 inline-flex">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project: any) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center justify-between p-4 bg-surface-hover border border-surface-border rounded-xl hover:border-surface-muted transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-brand-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={16} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-gray-200 text-sm font-medium group-hover:text-brand-400 transition-colors">
                      {project.name}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {project._count?.tasks || 0} tasks · {project._count?.members || 0} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-gray-600 text-xs">{project.progress || 0}%</span>
                    </div>
                  </div>
                  <span className={`badge ${
                    project.status === 'ACTIVE' ? 'badge-green' :
                    project.status === 'ON_HOLD' ? 'badge-yellow' :
                    project.status === 'COMPLETED' ? 'badge-blue' : 'badge-gray'
                  }`}>
                    {project.status}
                  </span>
                  <ArrowUpRight size={14} className="text-gray-700 group-hover:text-brand-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}