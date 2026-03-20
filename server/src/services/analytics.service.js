const prisma = require('../config/database')

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalProjects,
    totalTasks,
    completedTasks,
    totalEmployees,
    pendingLeaves,
    pendingExpenses,
    activeProjects
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: 'DONE' } }),
    prisma.employee.count(),
    prisma.leave.count({ where: { status: 'PENDING' } }),
    prisma.expense.count({ where: { status: 'PENDING' } }),
    prisma.project.count({ where: { status: 'ACTIVE' } })
  ])

  const taskCompletionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  return {
    totalUsers,
    totalProjects,
    totalTasks,
    completedTasks,
    totalEmployees,
    pendingLeaves,
    pendingExpenses,
    activeProjects,
    taskCompletionRate
  }
}

const getProjectAnalytics = async () => {
  const projects = await prisma.project.findMany({
    include: {
      _count: {
        select: { tasks: true, members: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const statusDistribution = await prisma.project.groupBy({
    by: ['status'],
    _count: { status: true }
  })

  const priorityDistribution = await prisma.project.groupBy({
    by: ['priority'],
    _count: { priority: true }
  })

  return {
    recentProjects: projects,
    statusDistribution,
    priorityDistribution
  }
}

const getTaskAnalytics = async (projectId) => {
  const where = projectId ? { projectId } : {}

  const [
    statusDistribution,
    priorityDistribution,
    overdueTasksCount
  ] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true }
    }),
    prisma.task.count({
      where: {
        ...where,
        dueDate: { lt: new Date() },
        status: { notIn: ['DONE'] }
      }
    })
  ])

  const completionTrend = await prisma.task.findMany({
    where: {
      ...where,
      status: 'DONE',
      completedAt: { not: null }
    },
    select: { completedAt: true },
    orderBy: { completedAt: 'asc' },
    take: 30
  })

  return {
    statusDistribution,
    priorityDistribution,
    overdueTasksCount,
    completionTrend
  }
}

const getAttendanceAnalytics = async (month, year) => {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate }
    },
    include: {
      employee: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      }
    }
  })

  const statusDistribution = {
    PRESENT: records.filter(r => r.status === 'PRESENT').length,
    ABSENT: records.filter(r => r.status === 'ABSENT').length,
    LATE: records.filter(r => r.status === 'LATE').length,
    HALF_DAY: records.filter(r => r.status === 'HALF_DAY').length,
    ON_LEAVE: records.filter(r => r.status === 'ON_LEAVE').length
  }

  const averageWorkHours = records.length > 0
    ? (records.reduce((sum, r) => sum + (r.workHours || 0), 0) / records.length).toFixed(2)
    : 0

  return {
    statusDistribution,
    averageWorkHours,
    totalRecords: records.length
  }
}

const getExpenseAnalytics = async () => {
  const currentYear = new Date().getFullYear()
  const startOfYear = new Date(currentYear, 0, 1)

  const [
    categoryDistribution,
    statusDistribution,
    monthlyExpenses
  ] = await Promise.all([
    prisma.expense.groupBy({
      by: ['category'],
      where: { createdAt: { gte: startOfYear } },
      _sum: { amount: true },
      _count: { category: true }
    }),
    prisma.expense.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.expense.findMany({
      where: { createdAt: { gte: startOfYear } },
      select: { amount: true, createdAt: true, status: true },
      orderBy: { createdAt: 'asc' }
    })
  ])

  const totalExpenseAmount = await prisma.expense.aggregate({
    where: {
      status: { in: ['APPROVED', 'REIMBURSED'] },
      createdAt: { gte: startOfYear }
    },
    _sum: { amount: true }
  })

  return {
    categoryDistribution,
    statusDistribution,
    monthlyExpenses,
    totalApprovedAmount: totalExpenseAmount._sum.amount || 0
  }
}

const getEmployeeProductivity = async () => {
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true,
      avatar: true,
      assignedTasks: {
        select: {
          status: true,
          dueDate: true,
          completedAt: true
        }
      }
    },
    take: 10
  })

  const productivity = employees.map(emp => {
    const tasks = emp.assignedTasks
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'DONE').length
    const overdue = tasks.filter(t =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== 'DONE'
    ).length
    const score = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      user: { id: emp.id, name: emp.name, avatar: emp.avatar },
      total,
      completed,
      overdue,
      score
    }
  })

  return productivity.sort((a, b) => b.score - a.score)
}

module.exports = {
  getDashboardStats,
  getProjectAnalytics,
  getTaskAnalytics,
  getAttendanceAnalytics,
  getExpenseAnalytics,
  getEmployeeProductivity
}