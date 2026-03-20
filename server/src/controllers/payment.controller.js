const paymentService = require('../services/payment.service')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')

const createOrder = async (req, res) => {
  try {
    const { plan } = req.body
    if (!plan) {
      return errorResponse(res, 'Plan is required', 400)
    }
    const order = await paymentService.createOrder(req.user.id, plan)
    return successResponse(res, 'Order created successfully', { order }, 201)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return errorResponse(res, 'Payment details are incomplete', 400)
    }

    const result = await paymentService.verifyPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    })

    return successResponse(res, 'Payment verified successfully', result)
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500)
  }
}

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await paymentService.getPaymentHistory(req.user.id)
    return successResponse(res, 'Payment history fetched successfully', { payments })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getActiveSubscription = async (req, res) => {
  try {
    const subscription = await paymentService.getActiveSubscription(req.user.id)
    return successResponse(res, 'Subscription fetched successfully', { subscription })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getAllPayments = async (req, res) => {
  try {
    const { payments, totalRevenue } = await paymentService.getAllPayments()
    return successResponse(res, 'All payments fetched successfully', {
      payments,
      totalRevenue
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'BASIC',
        name: 'Basic',
        price: 999,
        currency: 'INR',
        duration: 30,
        features: [
          'Up to 5 projects',
          'Up to 10 team members',
          'Basic analytics',
          'Email support'
        ]
      },
      {
        id: 'PRO',
        name: 'Pro',
        price: 2999,
        currency: 'INR',
        duration: 30,
        features: [
          'Unlimited projects',
          'Up to 50 team members',
          'Advanced analytics',
          'Priority support',
          'Kanban board',
          'Sprint management'
        ]
      },
      {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        price: 7999,
        currency: 'INR',
        duration: 30,
        features: [
          'Unlimited everything',
          'Custom integrations',
          'Dedicated support',
          'SLA guarantee',
          'Custom branding',
          'API access'
        ]
      }
    ]
    return successResponse(res, 'Plans fetched successfully', { plans })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getActiveSubscription,
  getAllPayments,
  getPlans
}