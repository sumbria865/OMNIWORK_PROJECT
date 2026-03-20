import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import api from '../../services/api'
import { Task, KanbanBoard as KanbanBoardType } from '../../types/project.types'
import { useAuth } from '../../context/AuthContext'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import { KANBAN_COLUMNS } from '../../utils/constants'
import toast from 'react-hot-toast'
import { X, Loader2, Plus } from 'lucide-react'

interface KanbanBoardProps {
  projectId: string
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { user } = useAuth()
  const [board, setBoard] = useState<KanbanBoardType>({
    TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [], BLOCKED: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('TODO')
  const [creating, setCreating] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    estimatedHrs: '',
    tags: ''
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  useEffect(() => {
    fetchKanban()
    fetchUsers()
  }, [projectId])

  const fetchKanban = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/tasks/project/${projectId}/kanban`)
      setBoard(res.data.data.kanban)
    } catch {
      toast.error('Failed to load Kanban board')
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

  const findColumnOfTask = (taskId: string): keyof KanbanBoardType | null => {
    for (const col of Object.keys(board) as (keyof KanbanBoardType)[]) {
      if (board[col].find(t => t.id === taskId)) return col
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const col = findColumnOfTask(active.id as string)
    if (col) {
      const task = board[col].find(t => t.id === active.id)
      if (task) setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeCol = findColumnOfTask(active.id as string)
    const overCol = (Object.keys(board).includes(over.id as string)
      ? over.id
      : findColumnOfTask(over.id as string)
    ) as keyof KanbanBoardType | null

    if (!activeCol || !overCol || activeCol === overCol) return

    setBoard(prev => {
      const activeTask = prev[activeCol].find(t => t.id === active.id)!
      return {
        ...prev,
        [activeCol]: prev[activeCol].filter(t => t.id !== active.id),
        [overCol]: [...prev[overCol], { ...activeTask, status: overCol }]
      }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeCol = findColumnOfTask(active.id as string)
    const overCol = (Object.keys(board).includes(over.id as string)
      ? over.id
      : findColumnOfTask(over.id as string)
    ) as keyof KanbanBoardType | null

    if (!activeCol || !overCol) return

    if (activeCol === overCol) {
      const oldIndex = board[activeCol].findIndex(t => t.id === active.id)
      const newIndex = board[activeCol].findIndex(t => t.id === over.id)
      if (oldIndex !== newIndex) {
        setBoard(prev => ({
          ...prev,
          [activeCol]: arrayMove(prev[activeCol], oldIndex, newIndex)
        }))
      }
    } else {
      try {
        await api.patch(`/tasks/${active.id}/status`, { status: overCol })
        toast.success(`Task moved to ${overCol.replace('_', ' ')}`)
      } catch {
        toast.error('Failed to update task status')
        fetchKanban()
      }
    }
  }

  const handleAddTask = (status: string) => {
    setDefaultStatus(status)
    setShowCreateTask(true)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/tasks', {
        projectId,
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        status: defaultStatus,
        assigneeId: taskForm.assigneeId || undefined,
        dueDate: taskForm.dueDate || undefined,
        estimatedHrs: taskForm.estimatedHrs ? parseFloat(taskForm.estimatedHrs) : undefined,
        tags: taskForm.tags ? taskForm.tags.split(',').map(t => t.trim()) : []
      })
      toast.success('Task created successfully')
      setShowCreateTask(false)
      setTaskForm({
        title: '', description: '', priority: 'MEDIUM',
        assigneeId: '', dueDate: '', estimatedHrs: '', tags: ''
      })
      fetchKanban()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Board header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {KANBAN_COLUMNS.map(col => (
            <div key={col.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              {board[col.id as keyof KanbanBoardType]?.length || 0}
            </div>
          ))}
        </div>
        <button
          onClick={() => handleAddTask('TODO')}
          className="btn-primary text-xs py-1.5 px-3"
        >
          <Plus size={14} />
          Add Task
        </button>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {KANBAN_COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.label}
              color={col.color}
              tasks={board[col.id as keyof KanbanBoardType] || []}
              onAddTask={handleAddTask}
              onTaskClick={setSelectedTask}
            />
          ))}

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                onClick={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg shadow-card animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-surface-border">
              <div>
                <h3 className="text-gray-100 font-semibold">Create New Task</h3>
                <p className="text-gray-600 text-xs mt-1">
                  Adding to <span className="text-brand-400">{defaultStatus.replace('_', ' ')}</span>
                </p>
              </div>
              <button
                onClick={() => setShowCreateTask(false)}
                className="p-2 text-gray-600 hover:text-gray-400 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="label">Task title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="label">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Assignee</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="label">Due date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Estimated hours</label>
                  <input
                    type="number"
                    value={taskForm.estimatedHrs}
                    onChange={e => setTaskForm({ ...taskForm, estimatedHrs: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.5"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label">Tags (comma separated)</label>
                <input
                  type="text"
                  value={taskForm.tags}
                  onChange={e => setTaskForm({ ...taskForm, tags: e.target.value })}
                  placeholder="bug, feature, urgent"
                  className="input-field"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 justify-center"
                >
                  {creating
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Plus size={16} />
                  }
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg shadow-card animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-surface-border">
              <h3 className="text-gray-100 font-semibold">Task Details</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 text-gray-600 hover:text-gray-400 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-gray-100 font-semibold text-lg">{selectedTask.title}</h4>
                {selectedTask.description && (
                  <p className="text-gray-500 text-sm mt-2">{selectedTask.description}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label mb-1">Status</p>
                  <span className="badge badge-blue">{selectedTask.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <p className="label mb-1">Priority</p>
                  <span className={`badge ${
                    selectedTask.priority === 'HIGH' ? 'badge-yellow' :
                    selectedTask.priority === 'CRITICAL' ? 'badge-red' :
                    selectedTask.priority === 'LOW' ? 'badge-gray' : 'badge-blue'
                  }`}>{selectedTask.priority}</span>
                </div>
                {selectedTask.assignee && (
                  <div>
                    <p className="label mb-1">Assignee</p>
                    <p className="text-gray-300 text-sm">{selectedTask.assignee.name}</p>
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div>
                    <p className="label mb-1">Due Date</p>
                    <p className="text-gray-300 text-sm">{formatDate(selectedTask.dueDate)}</p>
                  </div>
                )}
              </div>
              {selectedTask.tags.length > 0 && (
                <div>
                  <p className="label mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTask.tags.map((tag, i) => (
                      <span key={i} className="badge badge-purple">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}