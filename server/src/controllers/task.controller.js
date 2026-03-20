const taskService = require('../services/task.service')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.user.id)
    return successResponse(res, 'Task created successfully', { task }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getTasksByProject = async (req, res) => {
  try {
    const { tasks, meta } = await taskService.getTasksByProject(
      req.params.projectId,
      req.query
    )
    return successResponse(res, 'Tasks fetched successfully', { tasks, meta })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getKanbanTasks = async (req, res) => {
  try {
    const kanban = await taskService.getKanbanTasks(req.params.projectId)
    return successResponse(res, 'Kanban tasks fetched successfully', { kanban })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id)
    return successResponse(res, 'Task fetched successfully', { task })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body)
    return successResponse(res, 'Task updated successfully', { task })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const updateTaskStatus = async (req, res) => {
  try {
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.body.status
    )
    return successResponse(res, 'Task status updated successfully', { task })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const deleteTask = async (req, res) => {
  try {
    const result = await taskService.deleteTask(req.params.id)
    return successResponse(res, result.message)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const addComment = async (req, res) => {
  try {
    const comment = await taskService.addComment(
      req.params.id,
      req.user.id,
      req.body.content,
      req.body.attachments
    )
    return successResponse(res, 'Comment added successfully', { comment }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const deleteComment = async (req, res) => {
  try {
    const result = await taskService.deleteComment(
      req.params.commentId,
      req.user.id,
      req.user.role
    )
    return successResponse(res, result.message)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
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