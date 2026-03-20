const leaveService = require('../services/leave.service')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const createLeaveRequest = async (req, res) => {
  try {
    const leave = await leaveService.createLeaveRequest(req.body, req.user.id)
    return successResponse(res, 'Leave request submitted successfully', { leave }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getAllLeaves = async (req, res) => {
  try {
    const { leaves, meta } = await leaveService.getAllLeaves(req.query)
    return successResponse(res, 'Leave requests fetched successfully', { leaves, meta })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getMyLeaves = async (req, res) => {
  try {
    const { leaves, meta } = await leaveService.getMyLeaves(req.user.id, req.query)
    return successResponse(res, 'My leave requests fetched successfully', { leaves, meta })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const approveLeave = async (req, res) => {
  try {
    const leave = await leaveService.updateLeaveStatus(
      req.params.id,
      'APPROVED',
      req.user.id,
      req.body.remarks
    )
    return successResponse(res, 'Leave request approved successfully', { leave })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const rejectLeave = async (req, res) => {
  try {
    const leave = await leaveService.updateLeaveStatus(
      req.params.id,
      'REJECTED',
      req.user.id,
      req.body.remarks
    )
    return successResponse(res, 'Leave request rejected successfully', { leave })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const cancelLeave = async (req, res) => {
  try {
    const leave = await leaveService.cancelLeave(req.params.id, req.user.id)
    return successResponse(res, 'Leave request cancelled successfully', { leave })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getLeaveBalance = async (req, res) => {
  try {
    const balance = await leaveService.getLeaveBalance(req.user.id)
    return successResponse(res, 'Leave balance fetched successfully', { balance })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  createLeaveRequest,
  getAllLeaves,
  getMyLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveBalance
}