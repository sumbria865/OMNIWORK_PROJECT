const prisma = require('../config/database')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const createSprint = async (req, res) => {
  try {
    const { projectId, name, goal, startDate, endDate } = req.body

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })
    if (!project) {
      return errorResponse(res, 'Project not found', 404)
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name,
        goal: goal || null,
        status: 'PLANNED',
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { tasks: true }
        }
      }
    })

    return successResponse(res, 'Sprint created successfully', { sprint }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getSprintsByProject = async (req, res) => {
  try {
    const sprints = await prisma.sprint.findMany({
      where: { projectId: req.params.projectId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return successResponse(res, 'Sprints fetched successfully', { sprints })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getSprintById = async (req, res) => {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true }
            },
            createdBy: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { position: 'asc' }
        },
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { tasks: true }
        }
      }
    })

    if (!sprint) {
      return errorResponse(res, 'Sprint not found', 404)
    }

    return successResponse(res, 'Sprint fetched successfully', { sprint })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const updateSprint = async (req, res) => {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id }
    })
    if (!sprint) {
      return errorResponse(res, 'Sprint not found', 404)
    }

    const updated = await prisma.sprint.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        goal: req.body.goal,
        status: req.body.status,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })

    return successResponse(res, 'Sprint updated successfully', { sprint: updated })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const deleteSprint = async (req, res) => {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id }
    })
    if (!sprint) {
      return errorResponse(res, 'Sprint not found', 404)
    }

    await prisma.task.updateMany({
      where: { sprintId: req.params.id },
      data: { sprintId: null }
    })

    await prisma.sprint.delete({ where: { id: req.params.id } })

    return successResponse(res, 'Sprint deleted successfully')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const addTaskToSprint = async (req, res) => {
  try {
    const { taskId } = req.body

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) {
      return errorResponse(res, 'Task not found', 404)
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { sprintId: req.params.id }
    })

    return successResponse(res, 'Task added to sprint successfully', { task: updated })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const removeTaskFromSprint = async (req, res) => {
  try {
    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: { sprintId: null }
    })

    return successResponse(res, 'Task removed from sprint successfully', { task: updated })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getSprintStats = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { sprintId: req.params.id }
    })

    const total = tasks.length
    const todo = tasks.filter(t => t.status === 'TODO').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const inReview = tasks.filter(t => t.status === 'IN_REVIEW').length
    const done = tasks.filter(t => t.status === 'DONE').length
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0

    return successResponse(res, 'Sprint stats fetched successfully', {
      stats: { total, todo, inProgress, inReview, done, blocked, progress }
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  createSprint,
  getSprintsByProject,
  getSprintById,
  updateSprint,
  deleteSprint,
  addTaskToSprint,
  removeTaskFromSprint,
  getSprintStats
}