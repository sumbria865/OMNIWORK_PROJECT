const authService = require('../services/auth.service')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const register = async (req, res) => {
  try {
    const { user, token } = await authService.register(req.body)
    return successResponse(res, 'Registration successful', { user, token }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const login = async (req, res) => {
  try {
    const { user, token } = await authService.login(req.body)
    return successResponse(res, 'Login successful', { user, token })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id)
    return successResponse(res, 'User fetched successfully', { user })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const logout = async (req, res) => {
  try {
    return successResponse(res, 'Logged out successfully')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = { register, login, getMe, logout }