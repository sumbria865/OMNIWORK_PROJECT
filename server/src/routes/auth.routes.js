const router = require('express').Router()
const { register, login, getMe, logout } = require('../controllers/auth.controller')
const { registerValidator, loginValidator } = require('../validators/auth.validator')
const { validate } = require('../middleware/validate.middleware')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authLimiter } = require('../middleware/rateLimit.middleware')

// Public routes
router.post('/register', authLimiter, registerValidator, validate, register)
router.post('/login', authLimiter, loginValidator, validate, login)

// Protected routes
router.get('/me', authMiddleware, getMe)
router.post('/logout', authMiddleware, logout)

module.exports = router