const router = require('express').Router()
const {
  createTask,
  getTasksByProject,
  getKanbanTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  deleteComment
} = require('../controllers/task.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')
const { validate } = require('../middleware/validate.middleware')
const { auditLog } = require('../middleware/auditLog.middleware')
const {
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  addCommentValidator
} = require('../validators/task.validator')

// All routes require authentication
router.use(authMiddleware)

// Task CRUD
router.post(
  '/',
  createTaskValidator,
  validate,
  auditLog('CREATE', 'Task'),
  createTask
)

router.get('/project/:projectId', getTasksByProject)

router.get('/project/:projectId/kanban', getKanbanTasks)

router.get('/:id', getTaskById)

router.put(
  '/:id',
  updateTaskValidator,
  validate,
  auditLog('UPDATE', 'Task'),
  updateTask
)

router.patch(
  '/:id/status',
  updateTaskStatusValidator,
  validate,
  auditLog('UPDATE_STATUS', 'Task'),
  updateTaskStatus
)

router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'MANAGER'),
  auditLog('DELETE', 'Task'),
  deleteTask
)

// Comments
router.post(
  '/:id/comments',
  addCommentValidator,
  validate,
  addComment
)

router.delete(
  '/:id/comments/:commentId',
  deleteComment
)

module.exports = router