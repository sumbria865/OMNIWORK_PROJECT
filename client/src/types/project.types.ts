export type ProjectStatus =
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED'

export type Priority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'BLOCKED'

export type MemberRole =
  | 'OWNER'
  | 'MANAGER'
  | 'MEMBER'
  | 'VIEWER'

export type SprintStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: MemberRole
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
  }
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  priority: Priority
  startDate: string | null
  endDate: string | null
  budget: number | null
  progress: number
  coverImage: string | null
  tags: string[]
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    avatar: string | null
  }
  members: ProjectMember[]
  _count?: {
    tasks: number
    members: number
  }
}

export interface Task {
  id: string
  projectId: string
  sprintId: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  assigneeId: string | null
  createdById: string
  dueDate: string | null
  completedAt: string | null
  estimatedHrs: number | null
  actualHrs: number | null
  tags: string[]
  attachments: string[]
  position: number
  parentTaskId: string | null
  createdAt: string
  updatedAt: string
  assignee?: {
    id: string
    name: string
    avatar: string | null
  } | null
  createdBy?: {
    id: string
    name: string
    avatar: string | null
  }
  comments?: Comment[]
  subTasks?: Task[]
  parentTask?: {
    id: string
    title: string
  } | null
  project?: {
    id: string
    name: string
  }
  sprint?: {
    id: string
    name: string
  } | null
  _count?: {
    comments: number
    subTasks: number
  }
}

export interface Comment {
  id: string
  taskId: string
  authorId: string
  content: string
  attachments: string[]
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    name: string
    avatar: string | null
  }
}

export interface Sprint {
  id: string
  projectId: string
  name: string
  goal: string | null
  status: SprintStatus
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  tasks?: Task[]
  project?: {
    id: string
    name: string
  }
  _count?: {
    tasks: number
  }
}

export interface KanbanBoard {
  TODO:        Task[]
  IN_PROGRESS: Task[]
  IN_REVIEW:   Task[]
  DONE:        Task[]
  BLOCKED:     Task[]
}

export interface ProjectStats {
  total:      number
  todo:       number
  inProgress: number
  done:       number
  blocked:    number
  progress:   number
}

export interface SprintStats {
  total:      number
  todo:       number
  inProgress: number
  inReview:   number
  done:       number
  blocked:    number
  progress:   number
}

export interface ChatRoom {
  id: string
  name: string
  type: 'PROJECT' | 'DIRECT' | 'GROUP'
  projectId: string | null
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    name: string
  } | null
  messages?: Message[]
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  content: string
  fileUrl: string | null
  fileType: string | null
  isEdited: boolean
  isDeleted: boolean
  readBy: string[]
  createdAt: string
  updatedAt: string
  sender?: {
    id: string
    name: string
    avatar: string | null
  }
}

export interface Payment {
  id: string
  userId: string
  razorpayOrderId: string
  razorpayPaymentId: string | null
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE'
  createdAt: string
  updatedAt: string
  subscription?: Subscription | null
}

export interface Subscription {
  id: string
  paymentId: string
  userId: string
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE'
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface Plan {
  id: string
  name: string
  price: number
  currency: string
  duration: number
  features: string[]
}