import { useAuth as useAuthFromContext } from '@/contexts/AuthContext'
export function useAuth() {
  return useAuthFromContext()
}
