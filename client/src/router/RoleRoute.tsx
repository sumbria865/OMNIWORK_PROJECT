import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Role } from '../types/user.types'

interface RoleRouteProps {
  allowedRoles: Role[]
}

const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-dark-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-100">
            Access Denied
          </h2>
          <p className="text-gray-500 text-sm max-w-xs">
            You do not have permission to view this page. Contact your administrator.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}

export default RoleRoute