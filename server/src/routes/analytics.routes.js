const router = require('express').Router()
const {
  getDashboardStats,
  getProjectAnalytics,
  getTaskAnalytics,
  getAttendanceAnalytics,
  getExpenseAnalytics,
  getEmployeeProductivity
} = require('../controllers/analytics.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')

router.use(authMiddleware)

// All analytics routes are admin and manager only
router.get(
  '/dashboard',
  authorizeRoles('ADMIN', 'MANAGER'),
  getDashboardStats
)

router.get(
  '/projects',
  authorizeRoles('ADMIN', 'MANAGER'),
  getProjectAnalytics
)

router.get(
  '/tasks',
  authorizeRoles('ADMIN', 'MANAGER'),
  getTaskAnalytics
)

router.get(
  '/attendance',
  authorizeRoles('ADMIN', 'MANAGER'),
  getAttendanceAnalytics
)

router.get(
  '/expenses',
  authorizeRoles('ADMIN', 'MANAGER'),
  getExpenseAnalytics
)

router.get(
  '/productivity',
  authorizeRoles('ADMIN', 'MANAGER'),
  getEmployeeProductivity
)

module.exports = router