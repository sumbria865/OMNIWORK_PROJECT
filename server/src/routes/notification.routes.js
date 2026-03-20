const router = require('express').Router()
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notification.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

router.use(authMiddleware)

router.get('/', getMyNotifications)
router.patch('/:id/read', markAsRead)
router.patch('/read-all', markAllAsRead)
router.delete('/:id', deleteNotification)
router.delete('/', deleteAllNotifications)

module.exports = router