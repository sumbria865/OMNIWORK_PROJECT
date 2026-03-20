import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/formatDate'
import { getAvatarUrl } from '../../utils/helpers'
import {
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  CheckSquare,
  Settings,
  Loader2,
  X,
  Flag
} from 'lucide-react'
import toast from 'react-hot-toast'
import KanbanBoard from '../../components/kanban/KanbanBoard'

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
  createdBy: { id: string; name: string; avatar: string | null }
  members: {
    id: string
    role: string
    user: { id: string; name: string; email: string; avatar: string | null; role: string }
  }[]
  sprints: any[]
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

type TabType = 'kanban' | 'members' | 'sprints' | 'settings'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('kanban')
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (id) fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/projects/${id}`)
      setProject(res.data.data.project)
    } catch {
      toast.error('Failed to fetch project')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data.data.users)
    } catch {
      console.error('Failed to fetch users')
    }
  }

  const handleAddMember = async (userId: string) => {
    setAddingMember(true)
    try {
      await api.post(`/projects/${id}/members`, { userId, role: 'MEMBER' })
      toast.success('Member added successfully')
      setShowAddMember(false)
      fetchProject()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      toast.success('Member removed')
      fetchProject()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Project not found</p>
        <Link to="/projects" className="btn-primary mt-4 inline-flex">
          Back to Projects
        </Link>
      </div>
    )
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'kanban',   label: 'Kanban Board' },
    { id: 'members',  label: `Members (${project._count.members})` },
    { id: 'sprints',  label: 'Sprints' },
    { id: 'settings', label: 'Settings' },
  ]

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <Link
          to="/projects"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="page-title truncate">{project.name}</h2>
              <span className={`badge ${statusColors[project.status]}`}>
                {project.status}
              </span>
              <span className={`badge ${priorityColors[project.priority]}`}>
                <Flag size={10} className="mr-1" />
                {project.priority}
              </span>
            </div>
            {project.description && (
              <p className="text-gray-500 text-sm">{project.description}</p>
            )}
            <div className="flex items-center gap-4 text-gray-600 text-xs flex-wrap">
              {project.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(project.startDate)}
                </span>
              )}
              {project.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(project.endDate)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CheckSquare size={12} />
                {project._count.tasks} tasks
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} />
                {project._count.members} members
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="flex-shrink-0 w-32 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs">Progress</span>
              <span className="text-gray-300 text-xs font-medium">{project.progress}%</span>
            </div>
            <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag, i) => (
              <span key={i} className="badge badge-purple">{tag}</span>
            ))}
          </div>
        )}

        {/* Member avatars */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {project.members.slice(0, 5).map((member) => (
              <img
                key={member.id}
                src={getAvatarUrl(member.user.avatar, member.user.name)}
                alt={member.user.name}
                title={member.user.name}
                className="w-7 h-7 rounded-full ring-2 ring-surface object-cover"
              />
            ))}
            {project.members.length > 5 && (
              <div className="w-7 h-7 rounded-full ring-2 ring-surface bg-surface-muted flex items-center justify-center">
                <span className="text-gray-400 text-xs">+{project.members.length - 5}</span>
              </div>
            )}
          </div>
          <span className="text-gray-600 text-xs">
            Created by {project.createdBy.name}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-border">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'text-brand-400 border-brand-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'kanban' && (
        <KanbanBoard projectId={project.id} />
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Project Members</h3>
            {isAdminOrManager && (
              <button
                onClick={() => { setShowAddMember(true); fetchUsers() }}
                className="btn-primary"
              >
                <Plus size={16} />
                Add Member
              </button>
            )}
          </div>

          <div className="space-y-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={getAvatarUrl(member.user.avatar, member.user.name)}
                    alt={member.user.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{member.user.name}</p>
                    <p className="text-gray-600 text-xs">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge badge-purple capitalize">
                    {member.role.toLowerCase()}
                  </span>
                  {isAdminOrManager && member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add member modal */}
          {showAddMember && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md shadow-card animate-slide-up">
                <div className="flex items-center justify-between p-5 border-b border-surface-border">
                  <h3 className="text-gray-100 font-semibold">Add Member</h3>
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="p-1.5 text-gray-600 hover:text-gray-400 hover:bg-surface-hover rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={memberEmail}
                    onChange={e => setMemberEmail(e.target.value)}
                    className="input-field"
                  />
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {users
                      .filter(u =>
                        !project.members.some(m => m.user.id === u.id) &&
                        (u.name.toLowerCase().includes(memberEmail.toLowerCase()) ||
                         u.email.toLowerCase().includes(memberEmail.toLowerCase()))
                      )
                      .map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleAddMember(u.id)}
                          disabled={addingMember}
                          className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover rounded-xl transition-colors text-left"
                        >
                          <img
                            src={getAvatarUrl(u.avatar, u.name)}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-gray-200 text-sm font-medium">{u.name}</p>
                            <p className="text-gray-600 text-xs">{u.email}</p>
                          </div>
                        </button>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sprints' && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-sm">Sprint management coming soon</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card text-center py-12">
          <Settings size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Project settings coming soon</p>
        </div>
      )}
    </div>
  )
}