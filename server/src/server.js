const http = require('http')
const app = require('./app')
const { initSocket } = require('./config/socket')

const PORT = process.env.PORT || 5000

const server = http.createServer(app)

initSocket(server)

server.listen(PORT, () => {
  console.log(`OmniWork server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message)
  server.close(() => process.exit(1))
})

