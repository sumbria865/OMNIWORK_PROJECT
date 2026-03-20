import { STATUS_COLORS, PRIORITY_COLORS } from './constants'

export const getStatusBadgeClass = (status: string): string => {
  const color = STATUS_COLORS[status] || 'gray'
  const colorMap: Record<string, string> = {
    gray:   'badge-gray',
    blue:   'badge-blue',
    green:  'badge-green',
    yellow: 'badge-yellow',
    red:    'badge-red',
    purple: 'badge-purple',
  }
  return colorMap[color] || 'badge-gray'
}

export const getPriorityBadgeClass = (priority: string): string => {
  const color = PRIORITY_COLORS[priority] || 'gray'
  const colorMap: Record<string, string> = {
    gray:   'badge-gray',
    blue:   'badge-blue',
    yellow: 'badge-yellow',
    red:    'badge-red',
  }
  return colorMap[color] || 'badge-gray'
}

export const getInitials = (name: string): string => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export const getAvatarUrl = (avatar: string | null, name: string): string => {
  if (avatar) return avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128`
}

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

export const classNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ')
}

export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
}

export const getPasswordStrength = (password: string): {
  label: string
  color: string
  width: string
  score: number
} => {
  if (!password) return { label: '', color: '', width: '0%', score: 0 }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak',   color: '#ef4444', width: '25%',  score }
  if (score === 2) return { label: 'Fair',   color: '#f59e0b', width: '50%',  score }
  if (score === 3) return { label: 'Good',   color: '#6366f1', width: '75%',  score }
  return               { label: 'Strong', color: '#10b981', width: '100%', score }
}