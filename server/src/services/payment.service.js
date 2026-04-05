const prisma = require('../config/database')
const razorpay = require('../config/razorpay')
const { verifyRazorpaySignature } = require('../utils/razorpay.utils')

const planPricing = {
  BASIC: 999,
  PRO: 2999,
  ENTERPRISE: 7999
}

const planDuration = {
  BASIC: 30,
  PRO: 30,
  ENTERPRISE: 30
}

const createOrder = async (userId, plan) => {
  console.log('Razorpay instance:', razorpay)
  console.log('Creating order for:', userId, plan)

  if (!planPricing[plan]) {
    const error = new Error('Invalid plan selected')
    error.statusCode = 400
    throw error
  }

  const amount = planPricing[plan] * 100

  try {                                           // ← add try/catch here
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,

      notes: { userId, plan }
    })
    console.log('Order created:', order)          // ← log success

    const payment = await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        amount: planPricing[plan],
        currency: 'INR',
        status: 'PENDING',
        plan
      }
    })

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      paymentId: payment.id
    }
  } catch (err) {
    console.error('Razorpay order error:', err)  // ← this shows the real error
    throw err
  }
}

const verifyPayment = async (data) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data

  const isValid = verifyRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  )

  if (!isValid) {
    const error = new Error('Invalid payment signature')
    error.statusCode = 400
    throw error
  }

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId }
  })

  if (!payment) {
    const error = new Error('Payment record not found')
    error.statusCode = 404
    throw error
  }

  const updatedPayment = await prisma.payment.update({
    where: { razorpayOrderId },
    data: {
      razorpayPaymentId,
      razorpaySignature,
      status: 'SUCCESS'
    }
  })

  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + planDuration[payment.plan])

  const subscription = await prisma.subscription.create({
    data: {
      paymentId: updatedPayment.id,
      userId: payment.userId,
      plan: payment.plan,
      status: 'ACTIVE',
      startDate,
      endDate
    }
  })

  return { payment: updatedPayment, subscription }
}

const getPaymentHistory = async (userId) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: {
      subscription: true
    },
    orderBy: { createdAt: 'desc' }
  })
  return payments
}

const getActiveSubscription = async (userId) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() }
    },
    include: {
      payment: true
    },
    orderBy: { createdAt: 'desc' }
  })
  return subscription
}

const getAllPayments = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      subscription: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const totalRevenue = await prisma.payment.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  })

  return {
    payments,
    totalRevenue: totalRevenue._sum.amount || 0
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getActiveSubscription,
  getAllPayments
}