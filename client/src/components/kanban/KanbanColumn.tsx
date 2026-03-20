import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task } from '../../types/project.types'
import TaskCard from './TaskCard'
import { Plus } from 'lucide-react'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  tasks: Task[]
  onAddTask: (status: string) => void
  onTaskClick: (task: Task) => void
}

export default function KanbanColumn({
  id,
  title,
  color,
  tasks,
  onAddTask,
  onTaskClick
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      className={`
        flex flex-col w-72 flex-shrink-0 bg-surface rounded-xl border transition-all
        ${isOver ? 'border-brand-500/50 bg-brand-500/5' : 'border-surface-border'}
      `}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="text-gray-300 text-sm font-medium">{title}</span>
          <span className="text-gray-600 text-xs bg-surface-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(id)}
          className="p-1 text-gray-600 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
          title={`Add task to ${title}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Tasks list */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-24 max-h-[calc(100vh-280px)]"
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mb-2 opacity-30"
              style={{ background: color + '20' }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color }}
              />
            </div>
            <p className="text-gray-700 text-xs">No tasks here</p>
            <button
              onClick={() => onAddTask(id)}
              className="text-xs text-gray-600 hover:text-brand-400 mt-1 transition-colors"
            >
              Add one
            </button>
          </div>
        )}
      </div>
    </div>
  )
}