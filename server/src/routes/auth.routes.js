const router = require('express').Router()
const { register, login, getMe, logout } = require('../controllers/auth.controller')
const { registerValidator, loginValidator } = require('../validators/auth.validator')
const { validate } = require('../middleware/validate.middleware')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authLimiter } = require('../middleware/rateLimit.middleware')
const passport = require('../config/passport')

// Existing routes
router.post('/register', authLimiter, registerValidator, validate, register)
router.post('/login', authLimiter, loginValidator, validate, login)
router.get('/me', authMiddleware, getMe)
router.post('/logout', authMiddleware, logout)

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}))

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    const token = req.user.token
    const user = encodeURIComponent(JSON.stringify(req.user.user))
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}&user=${user}`)
  }
)

module.exports = router