const prisma = require('../config/database')
const { hashPassword, comparePassword } = require('../utils/bcrypt.utils')
const { generateToken } = require('../utils/jwt.utils')

const register = async ({ name, email, password, role }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })
  if (existingUser) {
    const error = new Error('Email already registered')
    error.statusCode = 400
    throw error
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'EMPLOYEE'
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

  const token = generateToken({ id: user.id, role: user.role })

  return { user, token }
}

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  })
  if (!user) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated')
    error.statusCode = 403
    throw error
  }

  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  })

  const token = generateToken({ id: user.id, role: user.role })

  const { password: _, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token }
}

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
          id: true,
          employeeCode: true,
          designation: true,
          department: true,
          phone: true,
          dateOfJoining: true
        }
      }
    }
  })
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user
}

module.exports = { register, login, getMe }