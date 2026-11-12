import { useState, useEffect } from 'react'
import { getResources } from '@/services/resourceService'
import type { Resource } from '@/types'

export function useResources(category?: string) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getResources(category)
      .then(setResources)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [category])

  return { resources, loading, error }
}
