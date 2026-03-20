const router = require('express').Router()
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectStats
} = require('../controllers/project.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')
const { validate } = require('../middleware/validate.middleware')
const { auditLog } = require('../middleware/auditLog.middleware')
const {
  createProjectValidator,
  updateProjectValidator,
  addMemberValidator
} = require('../validators/project.validator')

// All routes require authentication
router.use(authMiddleware)

// Project CRUD
router.post(
  '/',
  authorizeRoles('ADMIN', 'MANAGER'),
  createProjectValidator,
  validate,
  auditLog('CREATE', 'Project'),
  createProject
)

router.get('/', getAllProjects)

router.get('/:id', getProjectById)

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'MANAGER'),
  updateProjectValidator,
  validate,
  auditLog('UPDATE', 'Project'),
  updateProject
)

router.delete(
  '/:id',
  authorizeRoles('ADMIN'),
  auditLog('DELETE', 'Project'),
  deleteProject
)

// Project stats
router.get('/:id/stats', getProjectStats)

// Member management
router.post(
  '/:id/members',
  authorizeRoles('ADMIN', 'MANAGER'),
  addMemberValidator,
  validate,
  addMember
)

router.delete(
  '/:id/members/:userId',
  authorizeRoles('ADMIN', 'MANAGER'),
  removeMember
)

module.exports = router