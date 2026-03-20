const router = require('express').Router()
const {
  createChatRoom,
  getChatRooms,
  getChatRoomById,
  getMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsRead
} = require('../controllers/chat.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')

router.use(authMiddleware)

// Chat room routes
router.post(
  '/rooms',
  authorizeRoles('ADMIN', 'MANAGER'),
  createChatRoom
)

router.get('/rooms', getChatRooms)

router.get('/rooms/:id', getChatRoomById)

// Message routes
router.get('/rooms/:roomId/messages', getMessages)

router.post('/rooms/:roomId/messages', sendMessage)

router.delete(
  '/rooms/:roomId/messages/:messageId',
  deleteMessage
)

router.patch(
  '/rooms/:roomId/read',
  markMessagesAsRead
)

module.exports = router