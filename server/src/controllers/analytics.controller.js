const analyticsService = require('../services/analytics.service')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const getDashboardStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats()
    return successResponse(res, 'Dashboard stats fetched successfully', { stats })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getProjectAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getProjectAnalytics()
    return successResponse(res, 'Project analytics fetched successfully', { analytics })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getTaskAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getTaskAnalytics(
      req.query.projectId || null
    )
    return successResponse(res, 'Task analytics fetched successfully', { analytics })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getAttendanceAnalytics = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1
    const year = parseInt(req.query.year) || new Date().getFullYear()
    const analytics = await analyticsService.getAttendanceAnalytics(month, year)
    return successResponse(res, 'Attendance analytics fetched successfully', { analytics })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getExpenseAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getExpenseAnalytics()
    return successResponse(res, 'Expense analytics fetched successfully', { analytics })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getEmployeeProductivity = async (req, res) => {
  try {
    const productivity = await analyticsService.getEmployeeProductivity()
    return successResponse(res, 'Employee productivity fetched successfully', { productivity })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  getDashboardStats,
  getProjectAnalytics,
  getTaskAnalytics,
  getAttendanceAnalytics,
  getExpenseAnalytics,
  getEmployeeProductivity
}