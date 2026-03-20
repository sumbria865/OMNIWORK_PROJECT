const router = require('express').Router()
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getEmployeeAttendance,
  getAllAttendance,
  getMyAttendanceSummary,
  getTodayStatus
} = require('../controllers/attendance.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')

router.use(authMiddleware)

// Employee routes
router.post('/checkin', checkIn)
router.post('/checkout', checkOut)
router.get('/me', getMyAttendance)
router.get('/me/summary', getMyAttendanceSummary)
router.get('/today', getTodayStatus)

// Admin and manager routes
router.get(
  '/',
  authorizeRoles('ADMIN', 'MANAGER'),
  getAllAttendance
)

router.get(
  '/employee/:employeeId',
  authorizeRoles('ADMIN', 'MANAGER'),
  getEmployeeAttendance
)

module.exports = router