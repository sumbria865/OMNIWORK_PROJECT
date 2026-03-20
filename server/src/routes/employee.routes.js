const router = require('express').Router()
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getMyEmployeeProfile,
  updateEmployee,
  getDepartments
} = require('../controllers/employee.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')

router.use(authMiddleware)

// Get my own employee profile
router.get('/me', getMyEmployeeProfile)

// Get all departments
router.get('/departments', getDepartments)

// Get all employees — admin and manager only
router.get(
  '/',
  authorizeRoles('ADMIN', 'MANAGER'),
  getAllEmployees
)

// Create employee profile — admin only
router.post(
  '/',
  authorizeRoles('ADMIN'),
  createEmployee
)

// Get employee by id
router.get('/:id', getEmployeeById)

// Update employee — admin only
router.put(
  '/:id',
  authorizeRoles('ADMIN'),
  updateEmployee
)

module.exports = router