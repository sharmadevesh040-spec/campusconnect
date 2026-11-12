import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { getInterviewsByStudent } from '@/services/interviewService'
import type { Interview } from '@/types'

export function useInterviews() {
  const { currentUser } = useAuth()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) { setLoading(false); return }
    getInterviewsByStudent(currentUser.uid)
      .then(setInterviews)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [currentUser])

  return { interviews, loading, error, refetch: () => { if (currentUser) getInterviewsByStudent(currentUser.uid).then(setInterviews) } }
}
