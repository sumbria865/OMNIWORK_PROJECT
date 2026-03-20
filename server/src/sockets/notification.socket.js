const prisma = require('../config/database')

module.exports = (io, socket) => {
  // Send notification to specific user
  socket.on('send_notification', async (data) => {
    try {
      const { userId, title, message, type, link } = data

      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          link: link || null
        }
      })

      io.to(`user_${userId}`).emit('new_notification', notification)
    } catch (err) {
      console.error('send_notification error:', err.message)
    }
  })

  // Mark notification as read
  socket.on('read_notification', async (notificationId) => {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })

      socket.emit('notification_read', { notificationId })
    } catch (err) {
      console.error('read_notification error:', err.message)
    }
  })

  // Mark all notifications as read
  socket.on('read_all_notifications', async () => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: socket.userId,
          isRead: false
        },
        data: { isRead: true }
      })

      socket.emit('all_notifications_read')
    } catch (err) {
      console.error('read_all_notifications error:', err.message)
    }
  })

  // Get unread count
  socket.on('get_unread_count', async () => {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: socket.userId,
          isRead: false
        }
      })

      socket.emit('unread_count', { count })
    } catch (err) {
      console.error('get_unread_count error:', err.message)
    }
  })
}