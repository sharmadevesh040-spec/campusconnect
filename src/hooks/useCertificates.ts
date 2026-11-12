import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getCertificatesByStudent, downloadCertificate as downloadCertService } from '@/services/certificateService'
import type { Certificate } from '@/types'

export function useCertificates() {
  const { currentUser } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCertificates = useCallback(async () => {
    if (!currentUser) { setLoading(false); return }
    try {
      setLoading(true)
      const data = await getCertificatesByStudent(currentUser.uid)
      setCertificates(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchCertificates()
  }, [fetchCertificates])

  const downloadCertificate = async (certId: string, studentName?: string, programName?: string) => {
    await downloadCertService(certId, studentName, programName)
  }

  return { certificates, loading, error, downloadCertificate, refetch: fetchCertificates }
}
