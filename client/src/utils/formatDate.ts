import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

export const formatDate = (date: string | Date): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM dd, yyyy')
}

export const formatDateTime = (date: string | Date): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM dd, yyyy hh:mm a')
}

export const formatTime = (date: string | Date): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'hh:mm a')
}

export const formatRelative = (date: string | Date): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return `Today at ${format(d, 'hh:mm a')}`
  if (isYesterday(d)) return `Yesterday at ${format(d, 'hh:mm a')}`
  return formatDistanceToNow(d, { addSuffix: true })
}

export const formatShortDate = (date: string | Date): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM dd')
}

export const formatMonthYear = (date: string | Date): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMMM yyyy')
}

export const formatInputDate = (date: string | Date): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}

export const getDaysRemaining = (endDate: string | Date): number => {
  if (!endDate) return 0
  const d = typeof endDate === 'string' ? parseISO(endDate) : endDate
  const today = new Date()
  const diff = d.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const isOverdue = (dueDate: string | Date): boolean => {
  if (!dueDate) return false
  const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
  return d < new Date()
}

export const getWorkHours = (checkIn: string, checkOut: string): string => {
  if (!checkIn || !checkOut) return '0h 0m'
  const start = parseISO(checkIn)
  const end = parseISO(checkOut)
  const diff = end.getTime() - start.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

export const getCurrentMonth = (): number => new Date().getMonth() + 1
export const getCurrentYear = (): number => new Date().getFullYear()