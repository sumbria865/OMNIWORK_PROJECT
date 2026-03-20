const prisma = require('../config/database')

module.exports = (io, socket) => {
  // Join a chat room
  socket.on('join_room', async (roomId) => {
    try {
      socket.join(roomId)
      console.log(`User ${socket.userId} joined room ${roomId}`)

      socket.to(roomId).emit('user_joined', {
        userId: socket.userId,
        roomId,
        timestamp: new Date()
      })
    } catch (err) {
      console.error('join_room error:', err.message)
    }
  })

  // Leave a chat room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId)
    console.log(`User ${socket.userId} left room ${roomId}`)

    socket.to(roomId).emit('user_left', {
      userId: socket.userId,
      roomId,
      timestamp: new Date()
    })
  })

  // Send a message
  socket.on('send_message', async (data) => {
    try {
      const { roomId, content, fileUrl, fileType } = data

      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId }
      })
      if (!room) return

      const message = await prisma.message.create({
        data: {
          roomId,
          senderId: socket.userId,
          content,
          fileUrl: fileUrl || null,
          fileType: fileType || null
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true }
          }
        }
      })

      io.to(roomId).emit('new_message', message)
    } catch (err) {
      console.error('send_message error:', err.message)
      socket.emit('message_error', { error: err.message })
    }
  })

  // Typing indicator
  socket.on('typing_start', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: socket.userId,
      roomId: data.roomId
    })
  })

  socket.on('typing_stop', (data) => {
    socket.to(data.roomId).emit('user_stopped_typing', {
      userId: socket.userId,
      roomId: data.roomId
    })
  })

  // Delete message
  socket.on('delete_message', async (data) => {
    try {
      const { messageId, roomId } = data

      const message = await prisma.message.findUnique({
        where: { id: messageId }
      })

      if (!message) return
      if (message.senderId !== socket.userId && socket.userRole !== 'ADMIN') return

      await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: 'This message was deleted'
        }
      })

      io.to(roomId).emit('message_deleted', { messageId, roomId })
    } catch (err) {
      console.error('delete_message error:', err.message)
    }
  })

  // Mark messages as read
  socket.on('mark_read', async (data) => {
    try {
      const { roomId } = data

      const messages = await prisma.message.findMany({
        where: {
          roomId,
          NOT: { readBy: { has: socket.userId } }
        }
      })

      await Promise.all(
        messages.map(msg =>
          prisma.message.update({
            where: { id: msg.id },
            data: { readBy: { push: socket.userId } }
          })
        )
      )

      socket.to(roomId).emit('messages_read', {
        userId: socket.userId,
        roomId
      })
    } catch (err) {
      console.error('mark_read error:', err.message)
    }
  })
}