const attendanceService = require('../services/attendance.service')
const prisma = require('../config/database')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const checkIn = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    })
    if (!employee) {
      return errorResponse(res, 'Employee profile not found', 404)
    }

    const attendance = await attendanceService.checkIn(employee.id)
    return successResponse(res, 'Checked in successfully', { attendance }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const checkOut = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    })
    if (!employee) {
      return errorResponse(res, 'Employee profile not found', 404)
    }

    const attendance = await attendanceService.checkOut(employee.id)
    return successResponse(res, 'Checked out successfully', { attendance })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getMyAttendance = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    })
    if (!employee) {
      return errorResponse(res, 'Employee profile not found', 404)
    }

    const { records, meta } = await attendanceService.getAttendanceByEmployee(
      employee.id,
      req.query
    )
    return successResponse(res, 'Attendance fetched successfully', { records, meta })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getEmployeeAttendance = async (req, res) => {
  try {
    const { records, meta } = await attendanceService.getAttendanceByEmployee(
      req.params.employeeId,
      req.query
    )
    return successResponse(res, 'Attendance fetched successfully', { records, meta })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getAllAttendance = async (req, res) => {
  try {
    const { records, meta } = await attendanceService.getAllAttendance(req.query)
    return successResponse(res, 'All attendance fetched successfully', { records, meta })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getMyAttendanceSummary = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    })
    if (!employee) {
      return errorResponse(res, 'Employee profile not found', 404)
    }

    const month = parseInt(req.query.month) || new Date().getMonth() + 1
    const year = parseInt(req.query.year) || new Date().getFullYear()

    const summary = await attendanceService.getAttendanceSummary(
      employee.id,
      month,
      year
    )
    return successResponse(res, 'Attendance summary fetched successfully', { summary })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getTodayStatus = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    })
    if (!employee) {
      return errorResponse(res, 'Employee profile not found', 404)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: today }
      }
    })

    return successResponse(res, 'Today status fetched successfully', {
      attendance,
      isCheckedIn: !!attendance && !attendance.checkOut,
      isCheckedOut: !!attendance && !!attendance.checkOut
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getEmployeeAttendance,
  getAllAttendance,
  getMyAttendanceSummary,
  getTodayStatus
}