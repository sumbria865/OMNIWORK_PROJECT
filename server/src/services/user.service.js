const prisma = require('../config/database')
const { hashPassword, comparePassword } = require('../utils/bcrypt.utils')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')

const getAllUsers = async (query) => {
  const { page, limit, skip } = getPagination(query)
  const search = query.search || ''

  const where = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      query.role ? { role: query.role } : {},
      query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        employee: {
          select: {
            designation: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  return { users, meta: getPaginationMeta(total, page, limit) }
}

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      employee: true
    }
  })
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user
}

const updateProfile = async (userId, data) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      avatar: data.avatar
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true
    }
  })
  return user
}

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  const isValid = await comparePassword(currentPassword, user.password)
  if (!isValid) {
    const error = new Error('Current password is incorrect')
    error.statusCode = 400
    throw error
  }

  const hashed = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed }
  })

  return { message: 'Password changed successfully' }
}

const toggleUserStatus = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true
    }
  })
  return updated
}

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  changePassword,
  toggleUserStatus
}