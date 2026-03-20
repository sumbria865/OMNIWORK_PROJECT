const { Server } = require('socket.io')
const { verifyToken } = require('../utils/jwt.utils')

let io

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication error'))
    try {
      const decoded = verifyToken(token)
      socket.userId = decoded.id
      socket.userRole = decoded.role
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`)
    socket.join(`user_${socket.userId}`)

    require('../sockets/chat.socket')(io, socket)
    require('../sockets/notification.socket')(io, socket)
    require('../sockets/presence.socket')(io, socket)

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)
    })
  })
}

const getIO = () => {
  if (!io) throw new Error('Socket not initialized')
  return io
}

module.exports = { initSocket, getIO }