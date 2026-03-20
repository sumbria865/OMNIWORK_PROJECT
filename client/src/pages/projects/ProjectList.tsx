import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatDate, getDaysRemaining } from '../../utils/formatDate'
import { truncateText } from '../../utils/helpers'
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Users,
  CheckSquare,
  Calendar,
  ArrowUpRight,
  X,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  startDate: string | null
  endDate: string | null
  progress: number
  tags: string[]
  createdAt: string
  createdBy: { id: string; name: string; avatar: string | null }
  members: { user: { id: string; name: string; avatar: string | null } }[]
  _count: { tasks: number; members: number }
}

const statusColors: Record<string, string> = {
  ACTIVE:    'badge-green',
  ON_HOLD:   'badge-yellow',
  COMPLETED: 'badge-blue',
  CANCELLED: 'badge-red',
  ARCHIVED:  'badge-gray',
}

const priorityColors: Record<string, string> = {
  LOW:      'badge-gray',
  MEDIUM:   'badge-blue',
  HIGH:     'badge-yellow',
  CRITICAL: 'badge-red',
}

export default function ProjectList() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    tags: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [search, statusFilter])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      const res = await api.get(`/projects?${params.toString()}`)
      setProjects(res.data.data.projects)
    } catch {
      toast.error('Failed to fetch projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/projects', {
        name: form.name,
        description: form.description,
        priority: form.priority,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
      })
      toast.success('Project created successfully')
      setShowCreateModal(false)
      setForm({ name: '', description: '', priority: 'MEDIUM', startDate: '', endDate: '', tags: '' })
      fetchProjects()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="text-gray-500 text-sm mt-1">{projects.length} total projects</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field w-40"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-surface-hover" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban size={40} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-gray-400 font-medium">No projects found</h3>
          <p className="text-gray-600 text-sm mt-2">
            {search || statusFilter ? 'Try adjusting your filters' : 'Create your first project to get started'}
          </p>
          {!search && !statusFilter && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary mt-4 mx-auto"
            >
              <Plus size={16} />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:border-surface-muted transition-all group space-y-4"
            >
              {/* Top */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={16} className="text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-gray-100 font-semibold text-sm group-hover:text-brand-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">
                      {truncateText(project.description || 'No description', 60)}
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-gray-700 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-1" />
              </div>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="badge badge-purple text-xs">{tag}</span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="badge badge-gray text-xs">+{project.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs">Progress</span>
                  <span className="text-gray-400 text-xs font-medium">{project.progress}%</span>
                </div>
                <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-gray-600 text-xs">
                  <span className="flex items-center gap-1">
                    <CheckSquare size={12} />
                    {project._count.tasks} tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {project._count.members}
                  </span>
                  {project.endDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {getDaysRemaining(project.endDate) > 0
                        ? `${getDaysRemaining(project.endDate)}d left`
                        : 'Overdue'
                      }
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${priorityColors[project.priority]}`}>
                    {project.priority}
                  </span>
                  <span className={`badge text-xs ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg shadow-card animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-surface-border">
              <div>
                <h3 className="text-gray-100 font-semibold">Create New Project</h3>
                <p className="text-gray-600 text-xs mt-1">Fill in the details to create a project</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-600 hover:text-gray-400 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="label">Project name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the project"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="label">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={e => setForm({ ...form, tags: e.target.value })}
                    placeholder="react, backend, api"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="label">Start date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">End date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 justify-center"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}