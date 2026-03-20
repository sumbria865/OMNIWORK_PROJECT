const router = require('express').Router()
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getActiveSubscription,
  getAllPayments,
  getPlans
} = require('../controllers/payment.controller')
const { authMiddleware } = require('../middleware/auth.middleware')
const { authorizeRoles } = require('../middleware/rbac.middleware')

router.use(authMiddleware)

// Public to all authenticated users
router.get('/plans', getPlans)
router.post('/create-order', createOrder)
router.post('/verify', verifyPayment)
router.get('/history', getPaymentHistory)
router.get('/subscription', getActiveSubscription)

// Admin only
router.get(
  '/all',
  authorizeRoles('ADMIN'),
  getAllPayments
)

module.exports = router