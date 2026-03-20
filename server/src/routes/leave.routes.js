const router = require('express').Router()
const {
  createLeaveRequest,
  getAllLeaves,
  getMyLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveBalance
} = require('../controllers/leave.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')
const { validate } = require('../middleware/validate.middleware')
const { leaveRequestValidator } = require('../validators/leave.validator')

router.use(authMiddleware)

// Employee routes
router.post('/', leaveRequestValidator, validate, createLeaveRequest)
router.get('/me', getMyLeaves)
router.get('/balance', getLeaveBalance)
router.patch('/:id/cancel', cancelLeave)

// Admin and manager routes
router.get(
  '/',
  authorizeRoles('ADMIN', 'MANAGER'),
  getAllLeaves
)

router.patch(
  '/:id/approve',
  authorizeRoles('ADMIN', 'MANAGER'),
  approveLeave
)

router.patch(
  '/:id/reject',
  authorizeRoles('ADMIN', 'MANAGER'),
  rejectLeave
)

module.exports = router