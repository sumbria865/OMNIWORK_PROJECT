const prisma = require('../config/database')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')
const mlService = require('./mlClient')  // ← ADD THIS

const createProject = async (data, userId) => {
  const project = await prisma.project.create({
    data: {
      name:        data.name,
      description: data.description,
      status:      data.status || 'ACTIVE',
      priority:    data.priority || 'MEDIUM',
      startDate:   data.startDate ? new Date(data.startDate) : null,
      endDate:     data.endDate   ? new Date(data.endDate)   : null,
      budget:      data.budget    ? parseFloat(data.budget)  : null,
      tags:        data.tags || [],
      createdById: userId,
      members: { create: { userId, role: 'OWNER' } }
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
      },
      _count: { select: { tasks: true, members: true } }
    }
  })
  return project
}

const getAllProjects = async (query, userId, userRole) => {
  const { page, limit, skip } = getPagination(query)
  const search = query.search || ''

  const where = {
    AND: [
      search ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      query.status   ? { status: query.status }     : {},
      query.priority ? { priority: query.priority } : {},
      userRole === 'EMPLOYEE' ? { members: { some: { userId } } } : {}
    ]
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } }
        },
        _count: { select: { tasks: true, members: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.project.count({ where })
  ])

  return { projects, meta: getPaginationMeta(total, page, limit) }
}

const getProjectById = async (id, userId, userRole) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, avatar: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } }
        }
      },
      sprints: { orderBy: { createdAt: 'desc' } },
      _count:  { select: { tasks: true, members: true } }
    }
  })

  if (!project) {
    const error = new Error('Project not found')
    error.statusCode = 404
    throw error
  }

  if (userRole === 'EMPLOYEE') {
    const isMember = project.members.some(m => m.userId === userId)
    if (!isMember) {
      const error = new Error('Access denied. You are not a member of this project')
      error.statusCode = 403
      throw error
    }
  }

  return project
}

const updateProject = async (id, data) => {
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    const error = new Error('Project not found')
    error.statusCode = 404
    throw error
  }

  return prisma.project.update({
    where: { id },
    data: {
      name:        data.name,
      description: data.description,
      status:      data.status,
      priority:    data.priority,
      startDate:   data.startDate ? new Date(data.startDate) : undefined,
      endDate:     data.endDate   ? new Date(data.endDate)   : undefined,
      budget:      data.budget    ? parseFloat(data.budget)  : undefined,
      progress:    data.progress  ? parseFloat(data.progress): undefined,
      tags:        data.tags
    },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } }
      }
    }
  })
}

const deleteProject = async (id) => {
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    const error = new Error('Project not found')
    error.statusCode = 404
    throw error
  }
  await prisma.project.delete({ where: { id } })
  return { message: 'Project deleted successfully' }
}

const addMember = async (projectId, userId, role) => {
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } }
  })
  if (existing) {
    const error = new Error('User is already a member of this project')
    error.statusCode = 400
    throw error
  }

  return prisma.projectMember.create({
    data: { projectId, userId, role: role || 'MEMBER' },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
  })
}

const removeMember = async (projectId, userId) => {
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } }
  })
  if (!existing) {
    const error = new Error('User is not a member of this project')
    error.statusCode = 404
    throw error
  }
  if (existing.role === 'OWNER') {
    const error = new Error('Cannot remove the project owner')
    error.statusCode = 400
    throw error
  }
  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } }
  })
  return { message: 'Member removed successfully' }
}

const getProjectStats = async (id) => {
  // ── DB counts ────────────────────────────────────────────────────────────
  const [total, todo, inProgress, inReview, done, blocked, project] = await Promise.all([
    prisma.task.count({ where: { projectId: id } }),
    prisma.task.count({ where: { projectId: id, status: 'TODO' } }),
    prisma.task.count({ where: { projectId: id, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { projectId: id, status: 'IN_REVIEW' } }),
    prisma.task.count({ where: { projectId: id, status: 'DONE' } }),
    prisma.task.count({ where: { projectId: id, status: 'BLOCKED' } }),
    prisma.project.findUnique({ where: { id } })
  ])

  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  // ── ML: predict delay risk ───────────────────────────────────────────────
  let mlDelay = null
  try {
    if (project) {
      const deadlineDaysRemaining = project.endDate
        ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 30  // fallback if no end date set

      const memberCount = await prisma.projectMember.count({ where: { projectId: id } })

      mlDelay = await mlService.predictProjectDelay({
        total_tasks:              total,
        completed_tasks:          done,
        team_size:                memberCount,
        deadline_days_remaining:  deadlineDaysRemaining,
        overdue_tasks:            blocked  // blocked tasks treated as overdue
      })
    }
  } catch (mlErr) {
    console.warn('ML delay prediction failed (non-fatal):', mlErr.message)
  }
  // ────────────────────────────────────────────────────────────────────────

  await prisma.project.update({
    where: { id },
    data: { progress }
  })

  return {
    total, todo, inProgress, inReview, done, blocked, progress,
    mlDelay  // ← e.g. { status_label: "On Track", confidence_pct: 54.8, recommendation: "..." }
  }
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectStats
}