export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar: string | null
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
  employee?: Employee | null
}

export interface Employee {
  id: string
  userId: string
  employeeCode: string
  designation: string
  department: string
  phone: string | null
  address: string | null
  dateOfJoining: string
  dateOfBirth: string | null
  salary: number | null
  bankAccount: string | null
  emergencyContact: string | null
  documents: string[]
  createdAt: string
  updatedAt: string
  user?: User
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: AttendanceStatus
  workHours: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  employee?: Employee
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'HOLIDAY'

export interface Leave {
  id: string
  employeeId: string
  userId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: LeaveStatus
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  remarks: string | null
  createdAt: string
  updatedAt: string
  employee?: Employee
  user?: User
}

export type LeaveType =
  | 'CASUAL'
  | 'SICK'
  | 'EARNED'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'UNPAID'

export type LeaveStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export interface Expense {
  id: string
  userId: string
  title: string
  description: string | null
  amount: number
  category: ExpenseCategory
  receiptUrl: string | null
  status: ExpenseStatus
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  remarks: string | null
  createdAt: string
  updatedAt: string
  user?: User
}

export type ExpenseCategory =
  | 'TRAVEL'
  | 'FOOD'
  | 'ACCOMMODATION'
  | 'EQUIPMENT'
  | 'SOFTWARE'
  | 'TRAINING'
  | 'OTHER'

export type ExpenseStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REIMBURSED'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  link: string | null
  createdAt: string
}

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'PROJECT_ADDED'
  | 'MENTION'
  | 'GENERAL'

export interface LeaveBalance {
  CASUAL:    { allocated: number; used: number; remaining: number }
  SICK:      { allocated: number; used: number; remaining: number }
  EARNED:    { allocated: number; used: number; remaining: number }
  MATERNITY: { allocated: number; used: number; remaining: number }
  PATERNITY: { allocated: number; used: number; remaining: number }
  UNPAID:    { allocated: number; used: number; remaining: number }
}

export interface AttendanceSummary {
  present:        number
  absent:         number
  late:           number
  halfDay:        number
  onLeave:        number
  totalWorkHours: string
  totalDays:      number
}