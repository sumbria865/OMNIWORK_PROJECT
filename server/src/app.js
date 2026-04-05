const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const rateLimit = require('express-rate-limit')
const corsOptions = require('./config/cors')
const { errorMiddleware } = require('./middleware/error.middleware')
const passport = require('./config/passport') // ← ADD THIS


dotenv.config()

const app = express()
// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(passport.initialize()) // ← ADD THIS


// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
})
app.use('/api', globalLimiter)

// Routes
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/users', require('./routes/user.routes'))
app.use('/api/projects', require('./routes/project.routes'))
app.use('/api/tasks', require('./routes/task.routes'))
app.use('/api/sprints', require('./routes/sprint.routes'))
app.use('/api/employees', require('./routes/employee.routes'))
app.use('/api/attendance', require('./routes/attendance.routes'))
app.use('/api/leaves', require('./routes/leave.routes'))
app.use('/api/expenses', require('./routes/expense.routes'))
app.use('/api/chat', require('./routes/chat.routes'))
app.use('/api/payments', require('./routes/payment.routes'))
app.use('/api/analytics', require('./routes/analytics.routes'))
app.use('/api/upload', require('./routes/upload.routes'))
app.use('/api/notifications', require('./routes/notification.routes'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'OmniWork API is running',
    timestamp: new Date()
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Global error handler
app.use(errorMiddleware)

module.exports = app