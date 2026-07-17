import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface RequireSuperAdminProps {
  children: React.ReactNode
}

// À utiliser à l'intérieur de ProtectedRoute (qui gère déjà l'attente de
// checkAuth() et la redirection si non authentifié) — ne vérifie que le rôle.
export function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const role = useAuthStore(state => state.user?.role)

  if (role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
