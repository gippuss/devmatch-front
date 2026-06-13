import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Spinner } from '@/shared/ui/Spinner'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner center />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (adminOnly && !user.is_admin) return <Navigate to="/projects" replace />

  return <>{children}</>
}
