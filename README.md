# OmniWork

Integrated Enterprise Resource Planning (ERP) and Project Management System built on the MERN stack.

---

## Overview

OmniWork is a web-based platform designed for small to medium-sized enterprises that centralizes project management, HR operations, team communication, and business analytics into a single unified system. It replaces the need for separate tools like Jira, Zoho People, and Slack by combining all their core functionality into one application.

The system is built as a production-grade SaaS platform with role-based access control, real-time communication via Socket.io, cloud file storage via Cloudinary, subscription-based payments via Razorpay, and is fully containerized using Docker with Kubernetes manifests for production deployment.

---




## Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS
- Recharts (analytics charts)
- Socket.io-client (real-time)
- Axios (API calls)
- React Router v6
- dnd-kit (drag and drop Kanban)

**Backend**
- Node.js with Express.js
- Prisma ORM v5 (MongoDB adapter)
- MongoDB Atlas (database)
- Socket.io (real-time WebSocket server)
- JWT (authentication)
- bcryptjs (password hashing)
- Cloudinary + Multer (file uploads)
- Razorpay (payment gateway, sandbox mode)
- Nodemailer (email notifications)
- express-rate-limit (API rate limiting)
- express-validator (request validation)

**DevOps**
- Docker (containerization)
- Docker Compose (local orchestration)
- Kubernetes (production deployment manifests)
- Nginx (reverse proxy and React SPA serving)

---

## Modules

### Module 1 — Authentication and User Management
JWT-based authentication with Role-Based Access Control (RBAC). Three roles are supported: Admin, Manager, and Employee. Every API route is protected by auth middleware and role-check middleware. Passwords are hashed using bcrypt. Tokens are verified on every request.

### Module 2 — Project Management
Full project lifecycle management. Includes project creation, task assignment, Kanban board with drag-and-drop, task priorities and deadlines, file attachments, comments, bug tracking, sprint management (Agile), task dependency mapping, Gantt chart view, and activity logs.

### Module 3 — ERP and HR Management
Employee record management, attendance system with manual check-in and check-out, leave request and approval workflow, leave balance auto-calculation, expense reimbursement with receipt uploads, department management, attendance analytics, and performance tracking.

### Module 4 — Real-Time Communication
Project-based chat rooms and private messaging powered by Socket.io. Includes typing indicators, online presence tracking, file sharing in chat, and live notifications across the platform.

### Module 5 — Analytics and Integration Layer
Admin intelligence dashboard with charts for project completion trends, employee productivity scores, attendance percentages, and expense summaries. Integrates Cloudinary for all file storage, Razorpay for subscription payments (Basic, Pro, Enterprise plans), and maintains audit logs and activity tracking across all modules.

---

## Project Structure

```
omniwork/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │     ├── database.js
│   │   │     ├── cloudinary.js
│   │   │     ├── razorpay.js
│   │   │     ├── socket.js
│   │   │     └── cors.js
│   │   ├── controllers/
│   │   │     ├── auth.controller.js
│   │   │     ├── user.controller.js
│   │   │     ├── project.controller.js
│   │   │     ├── task.controller.js
│   │   │     ├── sprint.controller.js
│   │   │     ├── employee.controller.js
│   │   │     ├── attendance.controller.js
│   │   │     ├── leave.controller.js
│   │   │     ├── expense.controller.js
│   │   │     ├── chat.controller.js
│   │   │     ├── payment.controller.js
│   │   │     ├── analytics.controller.js
│   │   │     ├── upload.controller.js
│   │   │     └── notification.controller.js
│   │   ├── routes/
│   │   │     ├── auth.routes.js
│   │   │     ├── user.routes.js
│   │   │     ├── project.routes.js
│   │   │     ├── task.routes.js
│   │   │     ├── sprint.routes.js
│   │   │     ├── employee.routes.js
│   │   │     ├── attendance.routes.js
│   │   │     ├── leave.routes.js
│   │   │     ├── expense.routes.js
│   │   │     ├── chat.routes.js
│   │   │     ├── payment.routes.js
│   │   │     ├── analytics.routes.js
│   │   │     └── upload.routes.js
│   │   ├── middleware/
│   │   │     ├── auth.middleware.js
│   │   │     ├── rbac.middleware.js
│   │   │     ├── upload.middleware.js
│   │   │     ├── rateLimit.middleware.js
│   │   │     ├── error.middleware.js
│   │   │     ├── validate.middleware.js
│   │   │     └── auditLog.middleware.js
│   │   ├── services/
│   │   │     ├── auth.service.js
│   │   │     ├── user.service.js
│   │   │     ├── project.service.js
│   │   │     ├── task.service.js
│   │   │     ├── attendance.service.js
│   │   │     ├── leave.service.js
│   │   │     ├── expense.service.js
│   │   │     ├── payment.service.js
│   │   │     ├── analytics.service.js
│   │   │     ├── email.service.js
│   │   │     └── cloudinary.service.js
│   │   ├── sockets/
│   │   │     ├── index.js
│   │   │     ├── chat.socket.js
│   │   │     ├── notification.socket.js
│   │   │     └── presence.socket.js
│   │   ├── utils/
│   │   │     ├── jwt.utils.js
│   │   │     ├── bcrypt.utils.js
│   │   │     ├── apiResponse.utils.js
│   │   │     ├── pagination.utils.js
│   │   │     └── razorpay.utils.js
│   │   ├── validators/
│   │   │     ├── auth.validator.js
│   │   │     ├── project.validator.js
│   │   │     ├── task.validator.js
│   │   │     └── leave.validator.js
│   │   ├── app.js
│   │   └── server.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed/seed.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── project.test.js
│   │   └── task.test.js
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── store/
│   │   ├── router/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── k8s/
│   ├── deployments/
│   ├── services/
│   ├── ingress/
│   ├── configmaps/
│   ├── secrets/
│   ├── volumes/
│   └── hpa/
│
├── nginx/nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Database Models

All models are defined in `server/prisma/schema.prisma`.

| Model | Module | Description |
|---|---|---|
| User | Auth | Login, roles, profile, password reset |
| Employee | ERP | Employee records, department, salary |
| Attendance | ERP | Check-in, check-out, work hours, status |
| Leave | ERP | Leave requests, approvals, balance tracking |
| Expense | ERP | Reimbursement requests with receipt uploads |
| Performance | ERP | Employee ratings and feedback |
| Project | Project Mgmt | Project lifecycle, progress, budget |
| ProjectMember | Project Mgmt | Role-based project membership |
| Task | Project Mgmt | Kanban tasks, subtasks, comments |
| Sprint | Project Mgmt | Agile sprint planning and tracking |
| Comment | Project Mgmt | Task-level comments with attachments |
| ChatRoom | Communication | Project and direct chat rooms |
| Message | Communication | Real-time messages with read receipts |
| Notification | Communication | Platform-wide notifications |
| Payment | Analytics | Razorpay orders and transactions |
| Subscription | Analytics | Plan management and expiry |
| ActivityLog | Analytics | Full audit trail for all actions |

---

## API Reference

Base URL (development): `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

### Auth Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /auth/register | Public | Register new user |
| POST | /auth/login | Public | Login and get token |
| GET | /auth/me | Protected | Get current user profile |
| POST | /auth/logout | Protected | Logout user |

### User Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /users | Admin, Manager | Get all users |
| GET | /users/:id | Protected | Get user by ID |
| PUT | /users/profile | Protected | Update own profile |
| PUT | /users/change-password | Protected | Change password |
| PATCH | /users/:id/toggle-status | Admin | Activate or deactivate user |

### Project Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /projects | Admin, Manager | Create project |
| GET | /projects | Protected | Get all projects |
| GET | /projects/:id | Protected | Get project by ID |
| PUT | /projects/:id | Admin, Manager | Update project |
| DELETE | /projects/:id | Admin | Delete project |
| GET | /projects/:id/stats | Protected | Get project statistics |
| POST | /projects/:id/members | Admin, Manager | Add member |
| DELETE | /projects/:id/members/:userId | Admin, Manager | Remove member |

### Task Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /tasks | Protected | Create task |
| GET | /tasks/project/:projectId | Protected | Get tasks by project |
| GET | /tasks/project/:projectId/kanban | Protected | Get Kanban board |
| GET | /tasks/:id | Protected | Get task by ID |
| PUT | /tasks/:id | Protected | Update task |
| PATCH | /tasks/:id/status | Protected | Update task status |
| DELETE | /tasks/:id | Admin, Manager | Delete task |
| POST | /tasks/:id/comments | Protected | Add comment |
| DELETE | /tasks/:id/comments/:commentId | Protected | Delete comment |

### Sprint Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /sprints | Admin, Manager | Create sprint |
| GET | /sprints/project/:projectId | Protected | Get sprints by project |
| GET | /sprints/:id | Protected | Get sprint by ID |
| PUT | /sprints/:id | Admin, Manager | Update sprint |
| DELETE | /sprints/:id | Admin, Manager | Delete sprint |
| GET | /sprints/:id/stats | Protected | Get sprint statistics |
| POST | /sprints/:id/tasks | Admin, Manager | Add task to sprint |
| DELETE | /sprints/:id/tasks/:taskId | Admin, Manager | Remove task from sprint |

### Employee Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /employees | Admin | Create employee profile |
| GET | /employees | Admin, Manager | Get all employees |
| GET | /employees/me | Protected | Get own employee profile |
| GET | /employees/departments | Protected | Get all departments |
| GET | /employees/:id | Protected | Get employee by ID |
| PUT | /employees/:id | Admin | Update employee |

### Attendance Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /attendance/checkin | Protected | Check in for today |
| POST | /attendance/checkout | Protected | Check out for today |
| GET | /attendance/me | Protected | Get own attendance history |
| GET | /attendance/me/summary | Protected | Get monthly summary |
| GET | /attendance/today | Protected | Get today check-in status |
| GET | /attendance | Admin, Manager | Get all attendance records |
| GET | /attendance/employee/:employeeId | Admin, Manager | Get employee attendance |

### Leave Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /leaves | Protected | Submit leave request |
| GET | /leaves | Admin, Manager | Get all leave requests |
| GET | /leaves/me | Protected | Get own leave requests |
| GET | /leaves/balance | Protected | Get leave balance |
| PATCH | /leaves/:id/approve | Admin, Manager | Approve leave |
| PATCH | /leaves/:id/reject | Admin, Manager | Reject leave |
| PATCH | /leaves/:id/cancel | Protected | Cancel own leave |

### Expense Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /expenses | Protected | Submit expense with receipt |
| GET | /expenses | Admin, Manager | Get all expenses |
| GET | /expenses/me | Protected | Get own expenses |
| GET | /expenses/summary | Protected | Get expense summary |
| GET | /expenses/:id | Protected | Get expense by ID |
| PATCH | /expenses/:id/approve | Admin, Manager | Approve expense |
| PATCH | /expenses/:id/reject | Admin, Manager | Reject expense |
| DELETE | /expenses/:id | Protected | Delete pending expense |

### Analytics Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /analytics/dashboard | Admin, Manager | Get dashboard stats |
| GET | /analytics/projects | Admin, Manager | Get project analytics |
| GET | /analytics/tasks | Admin, Manager | Get task analytics |
| GET | /analytics/attendance | Admin, Manager | Get attendance analytics |
| GET | /analytics/expenses | Admin, Manager | Get expense analytics |
| GET | /analytics/productivity | Admin, Manager | Get employee productivity |

### Payment Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /payments/plans | Protected | Get subscription plans |
| POST | /payments/create-order | Protected | Create Razorpay order |
| POST | /payments/verify | Protected | Verify payment signature |
| GET | /payments/history | Protected | Get payment history |
| GET | /payments/subscription | Protected | Get active subscription |
| GET | /payments/all | Admin | Get all payments |

### Chat Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /chat/rooms | Admin, Manager | Create chat room |
| GET | /chat/rooms | Protected | Get all chat rooms |
| GET | /chat/rooms/:id | Protected | Get chat room by ID |
| GET | /chat/rooms/:roomId/messages | Protected | Get messages |
| POST | /chat/rooms/:roomId/messages | Protected | Send message |
| DELETE | /chat/rooms/:roomId/messages/:messageId | Protected | Delete message |
| PATCH | /chat/rooms/:roomId/read | Protected | Mark as read |

### Upload Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /upload/single | Protected | Upload single file |
| POST | /upload/multiple | Protected | Upload multiple files |
| DELETE | /upload | Protected | Delete file |

---

## Socket.io Events

### Chat Events
| Event | Direction | Description |
|---|---|---|
| join_room | Client to Server | Join a chat room |
| leave_room | Client to Server | Leave a chat room |
| send_message | Client to Server | Send a message |
| new_message | Server to Client | Receive new message |
| typing_start | Client to Server | Started typing |
| typing_stop | Client to Server | Stopped typing |
| user_typing | Server to Client | Someone is typing |
| delete_message | Client to Server | Delete a message |
| message_deleted | Server to Client | Message was deleted |
| mark_read | Client to Server | Mark messages as read |
| messages_read | Server to Client | Messages were read |

### Notification Events
| Event | Direction | Description |
|---|---|---|
| send_notification | Client to Server | Send notification |
| new_notification | Server to Client | Receive notification |
| read_notification | Client to Server | Mark as read |
| read_all_notifications | Client to Server | Mark all as read |
| get_unread_count | Client to Server | Get unread count |
| unread_count | Server to Client | Unread count response |

### Presence Events
| Event | Direction | Description |
|---|---|---|
| user_online | Server to Client | User came online |
| user_offline | Server to Client | User went offline |
| user_status_changed | Server to Client | Status changed |
| set_status | Client to Server | Set own status |
| get_online_users | Client to Server | Get online users |
| online_users | Server to Client | Online users list |

---

## Getting Started

### Prerequisites
- Node.js v20 or above
- MongoDB Atlas account (free tier works)
- Docker Desktop (optional but recommended)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/sumbria865/OMNIWORK_PROJECT.git
cd OMNIWORK_PROJECT
```

### 2. Set up environment variables

```bash
cd server
```

Create a `.env` file:

```env
PORT=5000
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/omniwork?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 3. Install dependencies

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:push
```

### 4. Run in development

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Or with Docker:

```bash
docker-compose up --build
```

### 5. Access

```
Frontend:       http://localhost:5173
Backend API:    http://localhost:5000
Health check:   http://localhost:5000/api/health
Prisma Studio:  http://localhost:5555
```

---

## Backend Scripts

```bash
npm run dev              # Start with nodemon
npm run start            # Start production server
npm run prisma:push      # Sync schema to MongoDB
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:studio    # Open visual database browser
npm run seed             # Seed test data
```

---

## Middleware Stack

```
Request
  → CORS
  → Rate Limiter
  → JSON Parser
  → Route Handler
    → Auth Middleware (verify JWT)
    → RBAC Middleware (check role)
    → Validator (check body)
    → Controller
      → Service (business logic)
        → Prisma (database)
  → Audit Log (on success)
  → Response
  → Error Handler (on failure)
```

---

## RBAC Permissions

| Feature | Admin | Manager | Employee |
|---|---|---|---|
| Create project | Yes | Yes | No |
| Delete project | Yes | No | No |
| View all projects | Yes | Yes | Own only |
| Create task | Yes | Yes | Yes |
| Delete task | Yes | Yes | No |
| View all employees | Yes | Yes | No |
| Create employee | Yes | No | No |
| Approve leave | Yes | Yes | No |
| Approve expense | Yes | Yes | No |
| View analytics | Yes | Yes | No |
| View all payments | Yes | No | No |

---

## Subscription Plans

| Plan | Price | Features |
|---|---|---|
| Basic | Rs. 999 per month | 5 projects, 10 members, basic analytics |
| Pro | Rs. 2999 per month | Unlimited projects, 50 members, advanced analytics, sprints |
| Enterprise | Rs. 7999 per month | Unlimited everything, custom integrations, dedicated support |

Payments are processed via Razorpay in sandbox mode only.

---

## Docker

```bash
docker-compose up --build
```

Services: client on port 3000, server on port 5000, mongo on port 27017, nginx as reverse proxy.

---

## Kubernetes

```bash
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/volumes/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/hpa/
```

Server deployment runs 2 replicas with HorizontalPodAutoscaler scaling at 70% CPU.

---

## Branch Strategy

```
main                  production only
feat/auth             Ninad
feat/project          Ninad
feat/hr-module        Sarthi
feat/analytics        Sarthi
feat/kanban-ui        Prinka
feat/dashboard        Prinka
```

---

## References

1. A. M. Pimparkar et al., "Software as a Service based Project Management System," IJSRSET, 2025. https://ijsrset.com/index.php/home/article/view/IJSRSET2512106
2. S. Tambe et al., "Web Based Project Management System," IJARCCE. https://ijarcce.com/papers/web-based-project-management-system/
3. K. Vaidyanathan et al., "Cloud-based collaboration and project management," ResearchGate, 2021. https://www.researchgate.net/publication/339225923
4. "Cloud Based ERP for Small and Medium Scale Enterprises," IJERT. https://www.ijert.org/cloud-based-erp-for-small-and-medium-scale-enterprises
5. A. Zadeh et al., "Cloud ERP Systems for Small-and-Medium Enterprises," J. Cases Inf. Technol., 2018. https://www.researchgate.net/publication/327370130
6. "A Systematic Literature Review on the Strategic Shift to Cloud ERP," MDPI. https://www.mdpi.com/2079-9292/13/14/2885
7. Auth0, "Role-Based Access Control," https://auth0.com/docs/manage-users/access-control/rbac
8. A. Ebuka, "Building a Real-Time Chat Application with Socket.io," Medium. https://medium.com/@augustineebuka98/building-a-real-time-chat-application-with-socket-io-a-comprehensive-guide-a8bbf65de812
