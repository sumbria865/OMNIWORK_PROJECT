const prisma = require('../config/database')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')

const getMyNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)

    const where = {
      userId: req.user.id,
      AND: [
        req.query.isRead !== undefined
          ? { isRead: req.query.isRead === 'true' }
          : {}
      ]
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ])

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    })

    return successResponse(res, 'Notifications fetched successfully', {
      notifications,
      meta: getPaginationMeta(total, page, limit),
      unreadCount
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const markAsRead = async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    })

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404)
    }

    if (notification.userId !== req.user.id) {
      return errorResponse(res, 'Access denied', 403)
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    })

    return successResponse(res, 'Notification marked as read', { notification: updated })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    })

    return successResponse(res, 'All notifications marked as read')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const deleteNotification = async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    })

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404)
    }

    if (notification.userId !== req.user.id) {
      return errorResponse(res, 'Access denied', 403)
    }

    await prisma.notification.delete({ where: { id: req.params.id } })

    return successResponse(res, 'Notification deleted successfully')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const deleteAllNotifications = async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id }
    })

    return successResponse(res, 'All notifications deleted successfully')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const createNotification = async (userId, data) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null
      }
    })
    return notification
  } catch (err) {
    console.error('Create notification error:', err.message)
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification
}