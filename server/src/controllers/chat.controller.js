const prisma = require('../config/database')
const { successResponse, errorResponse } = require('../utils/apiResponse.utils')
const { getPagination, getPaginationMeta } = require('../utils/pagination.utils')

const createChatRoom = async (req, res) => {
  try {
    const { name, type, projectId } = req.body

    if (type === 'PROJECT' && projectId) {
      const existing = await prisma.chatRoom.findFirst({
        where: { projectId }
      })
      if (existing) {
        return errorResponse(res, 'Chat room already exists for this project', 400)
      }
    }

    if (type === 'GROUP' || type === 'DIRECT' || !type) {
      const existing = await prisma.chatRoom.findFirst({
        where: { name, type: type || 'GROUP' }
      })
      if (existing) {
        return errorResponse(res, 'A room with this name already exists', 400)
      }
    }

    const roomData = {
      name,
      type: type || 'GROUP',
    }

    if (type === 'PROJECT' && projectId) {
      roomData.projectId = projectId
    }

    const room = await prisma.chatRoom.create({
      data: roomData,
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    })

    return successResponse(res, 'Chat room created successfully', { room }, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getChatRooms = async (req, res) => {
  try {
    const rooms = await prisma.chatRoom.findMany({
      include: {
        project: {
          select: { id: true, name: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return successResponse(res, 'Chat rooms fetched successfully', { rooms })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getChatRoomById = async (req, res) => {
  try {
    const room = await prisma.chatRoom.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    })

    if (!room) {
      return errorResponse(res, 'Chat room not found', 404)
    }

    return successResponse(res, 'Chat room fetched successfully', { room })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const getMessages = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          roomId: req.params.roomId,
          isDeleted: false
        },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.message.count({
        where: {
          roomId: req.params.roomId,
          isDeleted: false
        }
      })
    ])

    return successResponse(res, 'Messages fetched successfully', {
      messages: messages.reverse(),
      meta: getPaginationMeta(total, page, limit)
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const sendMessage = async (req, res) => {
  try {
    const { content, fileUrl, fileType } = req.body

    const room = await prisma.chatRoom.findUnique({
      where: { id: req.params.roomId }
    })
    if (!room) {
      return errorResponse(res, 'Chat room not found', 404)
    }

    const message = await prisma.message.create({
      data: {
        roomId: req.params.roomId,
        senderId: req.user.id,
        content,
        fileUrl: fileUrl || null,
        fileType: fileType || null
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    })

    return successResponse(res, 'Message sent successfully', { message }, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const deleteMessage = async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId }
    })

    if (!message) {
      return errorResponse(res, 'Message not found', 404)
    }

    if (message.senderId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'You can only delete your own messages', 403)
    }

    await prisma.message.update({
      where: { id: req.params.messageId },
      data: { isDeleted: true, content: 'This message was deleted' }
    })

    return successResponse(res, 'Message deleted successfully')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

const markMessagesAsRead = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        roomId: req.params.roomId,
        NOT: { readBy: { has: req.user.id } }
      }
    })

    await Promise.all(
      messages.map(msg =>
        prisma.message.update({
          where: { id: msg.id },
          data: { readBy: { push: req.user.id } }
        })
      )
    )

    return successResponse(res, 'Messages marked as read')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

module.exports = {
  createChatRoom,
  getChatRooms,
  getChatRoomById,
  getMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsRead
}