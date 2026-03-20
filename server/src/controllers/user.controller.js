const userService = require('../services/user.service')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const getAllUsers = async (req, res) => {
  try {
    const { users, meta } = await userService.getAllUsers(req.query)
    return successResponse(res, 'Users fetched successfully', { users, meta })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id)
    return successResponse(res, 'User fetched successfully', { user })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const updateProfile = async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      avatar: req.file ? req.file.path : req.body.avatar
    }
    const user = await userService.updateProfile(req.user.id, data)
    return successResponse(res, 'Profile updated successfully', { user })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const changePassword = async (req, res) => {
  try {
    const result = await userService.changePassword(req.user.id, req.body)
    return successResponse(res, result.message)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const toggleUserStatus = async (req, res) => {
  try {
    const user = await userService.toggleUserStatus(req.params.id)
    return successResponse(res, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, { user })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  changePassword,
  toggleUserStatus
}