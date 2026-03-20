const onlineUsers = new Map()

module.exports = (io, socket) => {
  // User comes online
  onlineUsers.set(socket.userId, {
    userId: socket.userId,
    socketId: socket.id,
    status: 'online',
    lastSeen: new Date()
  })

  // Broadcast to everyone that this user is online
  socket.broadcast.emit('user_online', {
    userId: socket.userId,
    status: 'online',
    timestamp: new Date()
  })

  // Send current online users to the newly connected user
  socket.emit('online_users', Array.from(onlineUsers.values()))

  // User sets their status
  socket.on('set_status', (status) => {
    if (!['online', 'away', 'busy', 'offline'].includes(status)) return

    const user = onlineUsers.get(socket.userId)
    if (user) {
      user.status = status
      user.lastSeen = new Date()
      onlineUsers.set(socket.userId, user)
    }

    socket.broadcast.emit('user_status_changed', {
      userId: socket.userId,
      status,
      timestamp: new Date()
    })
  })

  // Get online users
  socket.on('get_online_users', () => {
    socket.emit('online_users', Array.from(onlineUsers.values()))
  })

  // User goes offline on disconnect
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.userId)

    socket.broadcast.emit('user_offline', {
      userId: socket.userId,
      status: 'offline',
      lastSeen: new Date()
    })
  })
}