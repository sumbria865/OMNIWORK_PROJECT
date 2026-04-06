const prisma = require('../config/database')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')
const mlService = require('./mlClient')  // ← ADD THIS

const createTask = async (data, userId) => {

  // ── ML: predict priority before saving ──
  let mlPriority = null
  try {
    if (data.dueDate && data.estimatedHrs && data.type) {
      const deadlineDays = Math.ceil(
        (new Date(data.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
      )
      mlPriority = await mlService.predictTaskPriority({
        deadline_days:   deadlineDays,
        estimated_hours: parseFloat(data.estimatedHrs),
        task_type:       data.type,  // must be: bug|feature|research|devops|qa
      })
    }
  } catch (mlErr) {
    console.warn('ML priority prediction failed (non-fatal):', mlErr.message)
  }
  // ────────────────────────────────────────────────────────────────────────

  const task = await prisma.task.create({
    data: {
      projectId:    data.projectId,
      sprintId:     data.sprintId || null,
      title:        data.title,
      description:  data.description || null,
      status:       data.status || 'TODO',
      priority: mlPriority?.priority_label?.toUpperCase() || data.priority || 'MEDIUM',      assigneeId:   data.assigneeId || null,
      createdById:  userId,
      dueDate:      data.dueDate ? new Date(data.dueDate) : null,
      estimatedHrs: data.estimatedHrs ? parseFloat(data.estimatedHrs) : null,
      tags:         data.tags || [],
      position:     data.position || 0,
      parentTaskId: data.parentTaskId || null,
      // Store full ML insight if your schema has a JSON field for it:
      // mlInsight: mlPriority || undefined,
    },
    include: {
      assignee:  { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { id: true, name: true, avatar: true } },
      project:   { select: { id: true, name: true } },
      _count:    { select: { comments: true, subTasks: true } }
    }
  })

  // Return ML insight alongside the task so the frontend can show it
  return { ...task, mlInsight: mlPriority }
}

const getTasksByProject = async (projectId, query) => {
  const { page, limit, skip } = getPagination(query)

  const where = {
    projectId,
    AND: [
      query.status     ? { status: query.status }         : {},
      query.priority   ? { priority: query.priority }     : {},
      query.assigneeId ? { assigneeId: query.assigneeId } : {},
      query.sprintId   ? { sprintId: query.sprintId }     : {},
      query.search ? {
        OR: [
          { title:       { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ]
      } : {},
      { parentTaskId: null }
    ]
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        assignee:  { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        subTasks: {
          select: {
            id: true, title: true, status: true, priority: true,
            assignee: { select: { id: true, name: true, avatar: true } }
          }
        },
        _count: { select: { comments: true, subTasks: true } }
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }]
    }),
    prisma.task.count({ where })
  ])

  return { tasks, meta: getPaginationMeta(total, page, limit) }
}

const getKanbanTasks = async (projectId) => {
  const tasks = await prisma.task.findMany({
    where: { projectId, parentTaskId: null },
    include: {
      assignee:  { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { id: true, name: true, avatar: true } },
      _count:    { select: { comments: true, subTasks: true } }
    },
    orderBy: { position: 'asc' }
  })

  return {
    TODO:        tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    IN_REVIEW:   tasks.filter(t => t.status === 'IN_REVIEW'),
    DONE:        tasks.filter(t => t.status === 'DONE'),
    BLOCKED:     tasks.filter(t => t.status === 'BLOCKED')
  }
}

const getTaskById = async (id) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee:   { select: { id: true, name: true, email: true, avatar: true } },
      createdBy:  { select: { id: true, name: true, avatar: true } },
      project:    { select: { id: true, name: true } },
      sprint:     { select: { id: true, name: true } },
      comments: {
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'asc' }
      },
      subTasks: {
        include: { assignee: { select: { id: true, name: true, avatar: true } } }
      },
      parentTask: { select: { id: true, title: true } }
    }
  })

  if (!task) {
    const error = new Error('Task not found')
    error.statusCode = 404
    throw error
  }

  return task
}

const updateTask = async (id, data) => {
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    const error = new Error('Task not found')
    error.statusCode = 404
    throw error
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title:        data.title,
      description:  data.description,
      status:       data.status,
      priority:     data.priority,
      assigneeId:   data.assigneeId,
      dueDate:      data.dueDate ? new Date(data.dueDate) : undefined,
      estimatedHrs: data.estimatedHrs ? parseFloat(data.estimatedHrs) : undefined,
      actualHrs:    data.actualHrs   ? parseFloat(data.actualHrs)    : undefined,
      tags:         data.tags,
      position:     data.position,
      sprintId:     data.sprintId,
      completedAt:  data.status === 'DONE' ? new Date() : null
    },
    include: {
      assignee:  { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { id: true, name: true, avatar: true } }
    }
  })

  return updated
}

const updateTaskStatus = async (id, status) => {
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    const error = new Error('Task not found')
    error.statusCode = 404
    throw error
  }

  return prisma.task.update({
    where: { id },
    data: { status, completedAt: status === 'DONE' ? new Date() : null }
  })
}

const deleteTask = async (id) => {
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    const error = new Error('Task not found')
    error.statusCode = 404
    throw error
  }
  await prisma.task.delete({ where: { id } })
  return { message: 'Task deleted successfully' }
}

const addComment = async (taskId, userId, content, attachments) => {
  return prisma.comment.create({
    data: { taskId, authorId: userId, content, attachments: attachments || [] },
    include: { author: { select: { id: true, name: true, avatar: true } } }
  })
}

const deleteComment = async (commentId, userId, userRole) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) {
    const error = new Error('Comment not found')
    error.statusCode = 404
    throw error
  }
  if (comment.authorId !== userId && userRole !== 'ADMIN') {
    const error = new Error('You can only delete your own comments')
    error.statusCode = 403
    throw error
  }
  await prisma.comment.delete({ where: { id: commentId } })
  return { message: 'Comment deleted successfully' }
}

module.exports = {
  createTask,
  getTasksByProject,
  getKanbanTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  deleteComment
}