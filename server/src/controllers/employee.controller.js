const prisma = require('../config/database')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')

const createEmployee = async (req, res) => {
  try {
    const {
      userId,
      employeeCode,
      designation,
      department,
      phone,
      address,
      dateOfJoining,
      dateOfBirth,
      salary,
      bankAccount,
      emergencyContact
    } = req.body

    const existing = await prisma.employee.findUnique({
      where: { userId }
    })
    if (existing) {
      return errorResponse(res, 'Employee profile already exists for this user', 400)
    }

    const codeExists = await prisma.employee.findUnique({
      where: { employeeCode }
    })
    if (codeExists) {
      return errorResponse(res, 'Employee code already in use', 400)
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        employeeCode,
        designation,
        department,
        phone: phone || null,
        address: address || null,
        dateOfJoining: new Date(dateOfJoining),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        salary: salary ? parseFloat(salary) : null,
        bankAccount: bankAccount || null,
        emergencyContact: emergencyContact || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    return successResponse(res, 'Employee profile created successfully', { employee }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getAllEmployees = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const search = req.query.search || ''

    const where = {
      AND: [
        search ? {
          OR: [
            { designation: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
            { employeeCode: { contains: search, mode: 'insensitive' } },
            {
              user: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          ]
        } : {},
        req.query.department ? { department: req.query.department } : {}
      ]
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              isActive: true,
              lastLogin: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ])

    return successResponse(res, 'Employees fetched successfully', {
      employees,
      meta: getPaginationMeta(total, page, limit)
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getEmployeeById = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true
          }
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 10
        },
        leaves: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        performances: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    })

    if (!employee) {
      return errorResponse(res, 'Employee not found', 404)
    }

    return successResponse(res, 'Employee fetched successfully', { employee })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getMyEmployeeProfile = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    if (!employee) {
      return errorResponse(res, 'Employee profile not found', 404)
    }

    return successResponse(res, 'Employee profile fetched successfully', { employee })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const updateEmployee = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id }
    })
    if (!employee) {
      return errorResponse(res, 'Employee not found', 404)
    }

    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        designation: req.body.designation,
        department: req.body.department,
        phone: req.body.phone,
        address: req.body.address,
        dateOfBirth: req.body.dateOfBirth
          ? new Date(req.body.dateOfBirth)
          : undefined,
        salary: req.body.salary
          ? parseFloat(req.body.salary)
          : undefined,
        bankAccount: req.body.bankAccount,
        emergencyContact: req.body.emergencyContact
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return successResponse(res, 'Employee updated successfully', { employee: updated })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.employee.groupBy({
      by: ['department'],
      _count: { department: true }
    })

    return successResponse(res, 'Departments fetched successfully', { departments })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getMyEmployeeProfile,
  updateEmployee,
  getDepartments
}