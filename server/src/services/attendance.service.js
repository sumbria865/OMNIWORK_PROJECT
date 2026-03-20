const prisma = require('../config/database')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')

const checkIn = async (employeeId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.attendance.findFirst({
    where: {
      employeeId,
      date: { gte: today }
    }
  })

  if (existing) {
    const error = new Error('Already checked in today')
    error.statusCode = 400
    throw error
  }

  const now = new Date()
  const lateThreshold = new Date()
  lateThreshold.setHours(9, 30, 0, 0)

  const status = now > lateThreshold ? 'LATE' : 'PRESENT'

  const attendance = await prisma.attendance.create({
    data: {
      employeeId,
      date: new Date(),
      checkIn: now,
      status
    },
    include: {
      employee: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      }
    }
  })

  return attendance
}

const checkOut = async (employeeId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId,
      date: { gte: today },
      checkOut: null
    }
  })

  if (!attendance) {
    const error = new Error('No active check-in found for today')
    error.statusCode = 400
    throw error
  }

  const now = new Date()
  const checkInTime = new Date(attendance.checkIn)
  const workHours = (now - checkInTime) / (1000 * 60 * 60)

  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOut: now,
      workHours: parseFloat(workHours.toFixed(2))
    }
  })

  return updated
}

const getAttendanceByEmployee = async (employeeId, query) => {
  const { page, limit, skip } = getPagination(query)

  const where = {
    employeeId,
    AND: [
      query.startDate ? { date: { gte: new Date(query.startDate) } } : {},
      query.endDate ? { date: { lte: new Date(query.endDate) } } : {},
      query.status ? { status: query.status } : {}
    ]
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' }
    }),
    prisma.attendance.count({ where })
  ])

  return { records, meta: getPaginationMeta(total, page, limit) }
}

const getAllAttendance = async (query) => {
  const { page, limit, skip } = getPagination(query)

  const where = {
    AND: [
      query.startDate ? { date: { gte: new Date(query.startDate) } } : {},
      query.endDate ? { date: { lte: new Date(query.endDate) } } : {},
      query.status ? { status: query.status } : {},
      query.employeeId ? { employeeId: query.employeeId } : {}
    ]
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      include: {
        employee: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    }),
    prisma.attendance.count({ where })
  ])

  return { records, meta: getPaginationMeta(total, page, limit) }
}

const getAttendanceSummary = async (employeeId, month, year) => {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const records = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate }
    }
  })

  const summary = {
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    halfDay: records.filter(r => r.status === 'HALF_DAY').length,
    onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
    totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(2),
    totalDays: records.length
  }

  return summary
}

module.exports = {
  checkIn,
  checkOut,
  getAttendanceByEmployee,
  getAllAttendance,
  getAttendanceSummary
}