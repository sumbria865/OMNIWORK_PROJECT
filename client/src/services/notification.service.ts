import api from './api'

const getMyNotifications = (params?: { isRead?: boolean; page?: number; limit?: number }) => {
  return api.get('/notifications', { params })
}

const markAsRead = (id: string) => {
  return api.patch(`/notifications/${id}/read`)
}

const markAllAsRead = () => {
  return api.patch('/notifications/read-all')
}

const deleteNotification = (id: string) => {
  return api.delete(`/notifications/${id}`)
}

const deleteAllNotifications = () => {
  return api.delete('/notifications')
}

export const notificationService = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
}