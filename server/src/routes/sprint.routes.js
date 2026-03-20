const router = require('express').Router()
const {
  createSprint,
  getSprintsByProject,
  getSprintById,
  updateSprint,
  deleteSprint,
  addTaskToSprint,
  removeTaskFromSprint,
  getSprintStats
} = require('../controllers/sprint.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')

// All routes require authentication
router.use(authMiddleware)

// Sprint CRUD
router.post(
  '/',
  authorizeRoles('ADMIN', 'MANAGER'),
  createSprint
)

router.get('/project/:projectId', getSprintsByProject)

router.get('/:id', getSprintById)

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'MANAGER'),
  updateSprint
)

router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'MANAGER'),
  deleteSprint
)

// Sprint stats
router.get('/:id/stats', getSprintStats)

// Task management within sprint
router.post(
  '/:id/tasks',
  authorizeRoles('ADMIN', 'MANAGER'),
  addTaskToSprint
)

router.delete(
  '/:id/tasks/:taskId',
  authorizeRoles('ADMIN', 'MANAGER'),
  removeTaskFromSprint
)

module.exports = router