const prisma = require('../config/database')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')

const createExpense = async (data, userId, receiptUrl) => {
  const expense = await prisma.expense.create({
    data: {
      userId,
      title: data.title,
      description: data.description || null,
      amount: parseFloat(data.amount),
      category: data.category,
      receiptUrl: receiptUrl || null,
      status: 'PENDING'
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true }
      }
    }
  })
  return expense
}

const getAllExpenses = async (query) => {
  const { page, limit, skip } = getPagination(query)

  const where = {
    AND: [
      query.status ? { status: query.status } : {},
      query.category ? { category: query.category } : {},
      query.userId ? { userId: query.userId } : {},
      query.startDate ? { createdAt: { gte: new Date(query.startDate) } } : {},
      query.endDate ? { createdAt: { lte: new Date(query.endDate) } } : {}
    ]
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.expense.count({ where })
  ])

  const totalAmount = await prisma.expense.aggregate({
    where,
    _sum: { amount: true }
  })

  return {
    expenses,
    meta: getPaginationMeta(total, page, limit),
    totalAmount: totalAmount._sum.amount || 0
  }
}

const getMyExpenses = async (userId, query) => {
  const { page, limit, skip } = getPagination(query)

  const where = {
    userId,
    AND: [
      query.status ? { status: query.status } : {},
      query.category ? { category: query.category } : {}
    ]
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.expense.count({ where })
  ])

  return { expenses, meta: getPaginationMeta(total, page, limit) }
}

const getExpenseById = async (id) => {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  })
  if (!expense) {
    const error = new Error('Expense not found')
    error.statusCode = 404
    throw error
  }
  return expense
}

const updateExpenseStatus = async (expenseId, status, approverId, remarks) => {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId }
  })
  if (!expense) {
    const error = new Error('Expense not found')
    error.statusCode = 404
    throw error
  }
  if (expense.status !== 'PENDING') {
    const error = new Error('Only pending expenses can be updated')
    error.statusCode = 400
    throw error
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status,
      approvedBy: status === 'APPROVED' ? approverId : null,
      approvedAt: status === 'APPROVED' ? new Date() : null,
      rejectedBy: status === 'REJECTED' ? approverId : null,
      rejectedAt: status === 'REJECTED' ? new Date() : null,
      remarks: remarks || null
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  return updated
}

const deleteExpense = async (id, userId, userRole) => {
  const expense = await prisma.expense.findUnique({ where: { id } })
  if (!expense) {
    const error = new Error('Expense not found')
    error.statusCode = 404
    throw error
  }
  if (expense.userId !== userId && userRole !== 'ADMIN') {
    const error = new Error('You can only delete your own expenses')
    error.statusCode = 403
    throw error
  }
  if (expense.status !== 'PENDING') {
    const error = new Error('Only pending expenses can be deleted')
    error.statusCode = 400
    throw error
  }

  await prisma.expense.delete({ where: { id } })
  return { message: 'Expense deleted successfully' }
}

const getExpenseSummary = async (userId) => {
  const currentYear = new Date().getFullYear()
  const startOfYear = new Date(currentYear, 0, 1)

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      createdAt: { gte: startOfYear }
    }
  })

  const summary = {
    total: expenses.length,
    pending: expenses.filter(e => e.status === 'PENDING').length,
    approved: expenses.filter(e => e.status === 'APPROVED').length,
    rejected: expenses.filter(e => e.status === 'REJECTED').length,
    reimbursed: expenses.filter(e => e.status === 'REIMBURSED').length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    approvedAmount: expenses
      .filter(e => e.status === 'APPROVED' || e.status === 'REIMBURSED')
      .reduce((sum, e) => sum + e.amount, 0)
  }

  return summary
}

module.exports = {
  createExpense,
  getAllExpenses,
  getMyExpenses,
  getExpenseById,
  updateExpenseStatus,
  deleteExpense,
  getExpenseSummary
}