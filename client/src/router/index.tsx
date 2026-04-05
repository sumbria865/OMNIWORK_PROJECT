import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import PageWrapper from '../components/layout/PageWrapper'

import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/dashboard/Dashboard'
import ProjectList from '../pages/projects/ProjectList'
import ProjectDetail from '../pages/projects/ProjectDetail'
import AttendanceDashboard from '../pages/attendance/AttendanceDashboard'
import LeaveRequest from '../pages/leaves/LeaveRequest'
import ExpenseForm from '../pages/expenses/ExpenseForm'
import ChatRoom from '../pages/chat/ChatRoom'
import Analytics from '../pages/analytics/Analytics'
import Plans from '../pages/payments/Plans'
import Settings from '../pages/settings/Settings'
import GoogleSuccess from '../pages/auth/GoogleSuccess'


const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading OmniWork...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      {/* Public routes */}
<Route
  path="/login"
  element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
/>
<Route
  path="/register"
  element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
/>
<Route path="/auth/google/success" element={<GoogleSuccess />} />  {/* ← ADD THIS */}

      {/* Protected routes wrapped with PageWrapper */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={
          <PageWrapper><Dashboard /></PageWrapper>
        } />
        <Route path="/projects" element={
          <PageWrapper><ProjectList /></PageWrapper>
        } />
        <Route path="/projects/:id" element={
          <PageWrapper><ProjectDetail /></PageWrapper>
        } />
        <Route path="/attendance" element={
          <PageWrapper><AttendanceDashboard /></PageWrapper>
        } />
        <Route path="/leaves" element={
          <PageWrapper><LeaveRequest /></PageWrapper>
        } />
        <Route path="/expenses" element={
          <PageWrapper><ExpenseForm /></PageWrapper>
        } />
        <Route path="/chat" element={
          <PageWrapper><ChatRoom /></PageWrapper>
        } />
        <Route path="/payments" element={
          <PageWrapper><Plans /></PageWrapper>
        } />

        {/* Admin and Manager only */}
        <Route element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
          <Route path="/analytics" element={
            <PageWrapper><Analytics /></PageWrapper>
          } />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route path="/settings" element={
  <PageWrapper><Settings /></PageWrapper>
} />

    </Routes>
  )
}

export default AppRouter