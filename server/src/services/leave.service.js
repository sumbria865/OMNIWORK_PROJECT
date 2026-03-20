const prisma = require('../config/database')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')

const createLeaveRequest = async (data, userId) => {
  const employee = await prisma.employee.findUnique({
    where: { userId }
  })
  if (!employee) {
    const error = new Error('Employee profile not found')
    error.statusCode = 404
    throw error
  }

  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

  const overlapping = await prisma.leave.findFirst({
    where: {
      employeeId: employee.id,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate }
        }
      ]
    }
  })

  if (overlapping) {
    const error = new Error('You already have a leave request for this period')
    error.statusCode = 400
    throw error
  }

  const leave = await prisma.leave.create({
    data: {
      employeeId: employee.id,
      userId,
      leaveType: data.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: data.reason,
      status: 'PENDING'
    },
    include: {
      employee: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      }
    }
  })

  return leave
}

const getAllLeaves = async (query) => {
  const { page, limit, skip } = getPagination(query)

  const where = {
    AND: [
      query.status ? { status: query.status } : {},
      query.leaveType ? { leaveType: query.leaveType } : {},
      query.employeeId ? { employeeId: query.employeeId } : {},
      query.startDate ? { startDate: { gte: new Date(query.startDate) } } : {},
      query.endDate ? { endDate: { lte: new Date(query.endDate) } } : {}
    ]
  }

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
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
      orderBy: { createdAt: 'desc' }
    }),
    prisma.leave.count({ where })
  ])

  return { leaves, meta: getPaginationMeta(total, page, limit) }
}

const getMyLeaves = async (userId, query) => {
  const { page, limit, skip } = getPagination(query)

  const where = {
    userId,
    AND: [
      query.status ? { status: query.status } : {},
      query.leaveType ? { leaveType: query.leaveType } : {}
    ]
  }

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.leave.count({ where })
  ])

  return { leaves, meta: getPaginationMeta(total, page, limit) }
}

const updateLeaveStatus = async (leaveId, status, approverId, remarks) => {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId }
  })
  if (!leave) {
    const error = new Error('Leave request not found')
    error.statusCode = 404
    throw error
  }
  if (leave.status !== 'PENDING') {
    const error = new Error('Only pending leave requests can be updated')
    error.statusCode = 400
    throw error
  }

  const updated = await prisma.leave.update({
    where: { id: leaveId },
    data: {
      status,
      approvedBy: status === 'APPROVED' ? approverId : null,
      approvedAt: status === 'APPROVED' ? new Date() : null,
      rejectedBy: status === 'REJECTED' ? approverId : null,
      rejectedAt: status === 'REJECTED' ? new Date() : null,
      remarks: remarks || null
    },
    include: {
      employee: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  })

  if (status === 'APPROVED') {
    await prisma.attendance.createMany({
      data: Array.from({ length: updated.totalDays }, (_, i) => {
        const date = new Date(updated.startDate)
        date.setDate(date.getDate() + i)
        return {
          employeeId: updated.employeeId,
          date,
          status: 'ON_LEAVE'
        }
      }),
      skipDuplicates: true
    })
  }

  return updated
}

const cancelLeave = async (leaveId, userId) => {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId }
  })
  if (!leave) {
    const error = new Error('Leave request not found')
    error.statusCode = 404
    throw error
  }
  if (leave.userId !== userId) {
    const error = new Error('You can only cancel your own leave requests')
    error.statusCode = 403
    throw error
  }
  if (leave.status !== 'PENDING') {
    const error = new Error('Only pending leave requests can be cancelled')
    error.statusCode = 400
    throw error
  }

  const updated = await prisma.leave.update({
    where: { id: leaveId },
    data: { status: 'CANCELLED' }
  })

  return updated
}

const getLeaveBalance = async (userId) => {
  const currentYear = new Date().getFullYear()
  const startOfYear = new Date(currentYear, 0, 1)

  const leaves = await prisma.leave.findMany({
    where: {
      userId,
      status: 'APPROVED',
      startDate: { gte: startOfYear }
    }
  })

  const used = {
    CASUAL: 0,
    SICK: 0,
    EARNED: 0,
    MATERNITY: 0,
    PATERNITY: 0,
    UNPAID: 0
  }

  leaves.forEach(l => {
    used[l.leaveType] = (used[l.leaveType] || 0) + l.totalDays
  })

  const allocated = {
    CASUAL: 12,
    SICK: 10,
    EARNED: 15,
    MATERNITY: 90,
    PATERNITY: 15,
    UNPAID: 0
  }

  const balance = {}
  Object.keys(allocated).forEach(type => {
    balance[type] = {
      allocated: allocated[type],
      used: used[type] || 0,
      remaining: Math.max(0, allocated[type] - (used[type] || 0))
    }
  })

  return balance
}

module.exports = {
  createLeaveRequest,
  getAllLeaves,
  getMyLeaves,
  updateLeaveStatus,
  cancelLeave,
  getLeaveBalance
}