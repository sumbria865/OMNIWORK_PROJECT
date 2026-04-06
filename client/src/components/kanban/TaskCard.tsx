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
  GripVertical,
  Brain
} from 'lucide-react'

interface TaskCardProps {
  task: Task & {
    mlInsight?: {
      priority_label: string
      confidence_pct: number
      priority_color: string
      recommendation: string
      all_probabilities: Record<string, number>
    } | null
  }
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
  const ml = task.mlInsight

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

      {/* ── ML Insight Badge ───────────────────────────────────────────── */}
      {ml && (
        <div
          className="flex items-start gap-2 rounded-lg px-2.5 py-2 border"
          style={{
            backgroundColor: `${ml.priority_color}15`,
            borderColor: `${ml.priority_color}40`,
          }}
          onClick={e => e.stopPropagation()}
        >
          <Brain size={12} className="mt-0.5 flex-shrink-0" style={{ color: ml.priority_color }} />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: ml.priority_color }}>
                AI: {ml.priority_label}
              </span>
              <span className="text-xs text-gray-500">{ml.confidence_pct.toFixed(0)}%</span>
            </div>
            {/* Confidence bar */}
            <div className="h-1 bg-surface-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${ml.confidence_pct}%`,
                  backgroundColor: ml.priority_color,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 line-clamp-1">{ml.recommendation}</p>
          </div>
        </div>
      )}
      {/* ────────────────────────────────────────────────────────────────── */}

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
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-gray-600'}`}>
              <Calendar size={11} />
              {formatDate(task.dueDate)}
            </span>
          )}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-gray-600">
              <MessageSquare size={11} />
              {task._count?.comments}
            </span>
          )}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-gray-600">
              <Paperclip size={11} />
              {task.attachments.length}
            </span>
          )}
        </div>
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