import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '../../types/project.types'
import { getAvatarUrl } from '../../utils/helpers'
import { formatDate, isOverdue } from '../../utils/formatDate'
import {
  Calendar,
  MessageSquare,
  Paperclip,
  Flag,
  GripVertical
} from 'lucide-react'

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
}

const priorityColors: Record<string, string> = {
  LOW:      'text-gray-500',
  MEDIUM:   'text-blue-400',
  HIGH:     'text-yellow-400',
  CRITICAL: 'text-red-400',
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const overdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'DONE'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-surface-hover border rounded-xl p-3.5 space-y-3
        hover:border-surface-muted transition-all cursor-pointer group
        ${isDragging ? 'shadow-glow border-brand-500/50' : 'border-surface-border'}
      `}
      onClick={() => onClick(task)}
    >
      {/* Drag handle + title row */}
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-700 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-gray-200 text-sm font-medium leading-snug line-clamp-2">
            {task.title}
          </p>
        </div>
        <Flag
          size={12}
          className={`flex-shrink-0 mt-0.5 ${priorityColors[task.priority]}`}
        />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="badge badge-purple text-xs py-0.5">
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="badge badge-gray text-xs py-0.5">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs">
          {/* Due date */}
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${
              overdue ? 'text-red-400' : 'text-gray-600'
            }`}>
              <Calendar size={11} />
              {formatDate(task.dueDate)}
            </span>
          )}

          {/* Comments count */}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-gray-600">
              <MessageSquare size={11} />
              {task._count?.comments}
            </span>
          )}

          {/* Attachments count */}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-gray-600">
              <Paperclip size={11} />
              {task.attachments.length}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {task.assignee && (
          <img
            src={getAvatarUrl(task.assignee.avatar, task.assignee.name)}
            alt={task.assignee.name}
            title={task.assignee.name}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-surface-border"
          />
        )}
      </div>
    </div>
  )
}