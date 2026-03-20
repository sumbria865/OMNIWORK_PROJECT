const router = require('express').Router()
const {
  createExpense,
  getAllExpenses,
  getMyExpenses,
  getExpenseById,
  approveExpense,
  rejectExpense,
  deleteExpense,
  getExpenseSummary
} = require('../controllers/expense.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')
const { upload } = require('../middleware/upload.middleware')

router.use(authMiddleware)

// Employee routes
router.post('/', upload.single('receipt'), createExpense)
router.get('/me', getMyExpenses)
router.get('/summary', getExpenseSummary)
router.get('/:id', getExpenseById)
router.delete('/:id', deleteExpense)

// Admin and manager routes
router.get(
  '/',
  authorizeRoles('ADMIN', 'MANAGER'),
  getAllExpenses
)

router.patch(
  '/:id/approve',
  authorizeRoles('ADMIN', 'MANAGER'),
  approveExpense
)

router.patch(
  '/:id/reject',
  authorizeRoles('ADMIN', 'MANAGER'),
  rejectExpense
)

module.exports = router