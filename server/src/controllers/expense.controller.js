const expenseService = require('../services/expense.service')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const createExpense = async (req, res) => {
  try {
    const receiptUrl = req.file ? req.file.path : null
    const expense = await expenseService.createExpense(
      req.body,
      req.user.id,
      receiptUrl
    )
    return successResponse(res, 'Expense submitted successfully', { expense }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getAllExpenses = async (req, res) => {
  try {
    const { expenses, meta, totalAmount } = await expenseService.getAllExpenses(
      req.query
    )
    return successResponse(res, 'Expenses fetched successfully', {
      expenses,
      meta,
      totalAmount
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getMyExpenses = async (req, res) => {
  try {
    const { expenses, meta } = await expenseService.getMyExpenses(
      req.user.id,
      req.query
    )
    return successResponse(res, 'My expenses fetched successfully', { expenses, meta })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getExpenseById = async (req, res) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id)
    return successResponse(res, 'Expense fetched successfully', { expense })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const approveExpense = async (req, res) => {
  try {
    const expense = await expenseService.updateExpenseStatus(
      req.params.id,
      'APPROVED',
      req.user.id,
      req.body.remarks
    )
    return successResponse(res, 'Expense approved successfully', { expense })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const rejectExpense = async (req, res) => {
  try {
    const expense = await expenseService.updateExpenseStatus(
      req.params.id,
      'REJECTED',
      req.user.id,
      req.body.remarks
    )
    return successResponse(res, 'Expense rejected successfully', { expense })
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const deleteExpense = async (req, res) => {
  try {
    const result = await expenseService.deleteExpense(
      req.params.id,
      req.user.id,
      req.user.role
    )
    return successResponse(res, result.message)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getExpenseSummary = async (req, res) => {
  try {
    const summary = await expenseService.getExpenseSummary(req.user.id)
    return successResponse(res, 'Expense summary fetched successfully', { summary })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  createExpense,
  getAllExpenses,
  getMyExpenses,
  getExpenseById,
  approveExpense,
  rejectExpense,
  deleteExpense,
  getExpenseSummary
}