const projectService = require('../services/project.service')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(req.body, req.user.id)
    return successResponse(res, 'Project created successfully', { project }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getAllProjects = async (req, res) => {
  try {
    const { projects, meta } = await projectService.getAllProjects(
      req.query,
      req.user.id,
      req.user.role
    )
    return successResponse(res, 'Projects fetched successfully', { projects, meta })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user.id,
      req.user.role
    )
    return successResponse(res, 'Project fetched successfully', { project })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const updateProject = async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body)
    return successResponse(res, 'Project updated successfully', { project })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const deleteProject = async (req, res) => {
  try {
    const result = await projectService.deleteProject(req.params.id)
    return successResponse(res, result.message)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const addMember = async (req, res) => {
  try {
    const member = await projectService.addMember(
      req.params.id,
      req.body.userId,
      req.body.role
    )
    return successResponse(res, 'Member added successfully', { member }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const removeMember = async (req, res) => {
  try {
    const result = await projectService.removeMember(
      req.params.id,
      req.params.userId
    )
    return successResponse(res, result.message)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getProjectStats = async (req, res) => {
  try {
    const stats = await projectService.getProjectStats(req.params.id)
    return successResponse(res, 'Project stats fetched successfully', { stats })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
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