import { apiRequest } from './api'
import type { Certificate } from '@/types'
import { CertificateStatus } from '@/types/certificate'

const CACHE_KEY = 'campusconnect_certificates_cache'

function mapCert(item: any): Certificate {
  return {
    id: item.id,
    certificateId: item.certificate_id || item.certificateId,
    studentId: item.student_id || item.studentId,
    studentName: item.studentName || item.student_name || 'Student',
    programName: item.program || item.programName || 'CampusConnect Ambassador',
    issueDate: new Date(item.issue_date || item.issueDate),
    pdfURL: item.file_url || item.pdfURL || `/api/certificates/${item.certificate_id || item.id}/download`,
    thumbnailURL: item.qr_code || item.thumbnailURL || '',
    status: (item.status as CertificateStatus) || CertificateStatus.ACTIVE,
    verificationURL: `/verify/${item.certificate_id || item.certificateId}`,
    issuedBy: 'CampusConnect Executive Board',
    description: 'Awarded for extraordinary community outreach, inclusive tech workshops, and student mentorship.',
    createdAt: new Date(item.created_at || Date.now()),
    updatedAt: new Date(item.updated_at || Date.now())
  }
}

export async function getCertificates(studentId?: string): Promise<Certificate[]> {
  try {
    const list = await apiRequest<any[]>('/api/student/certificates')
    const mapped = list.map(mapCert)
    localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
    return mapped
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
    return []
  }
}

export async function getCertificatesByStudent(studentId: string): Promise<Certificate[]> {
  return getCertificates(studentId)
}

export async function getAllCertificates(): Promise<Certificate[]> {
  try {
    const list = await apiRequest<any[]>('/api/admin/certificates')
    return list.map(mapCert)
  } catch {
    return []
  }
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  const all = await getAllCertificates()
  return all.find(c => c.id === id || c.certificateId === id) || null
}

export async function getCertificateByCertId(certId: string): Promise<Certificate | null> {
  const res = await verifyCertificate(certId)
  return res.certificate
}

export async function verifyCertificate(certificateId: string): Promise<{
  verified: boolean
  certificate: Certificate | null
  status?: string
  studentName?: string
  program?: string
  issueDate?: string
  qrCode?: string
}> {
  try {
    const data = await apiRequest<any>(`/api/verify/${certificateId}`)
    return {
      verified: data.verified,
      status: data.status,
      studentName: data.studentName,
      program: data.program,
      issueDate: data.issueDate,
      qrCode: data.qrCode,
      certificate: {
        id: certificateId,
        certificateId: data.certificateId,
        studentId: data.studentCode,
        studentName: data.studentName,
        programName: data.program,
        issueDate: new Date(data.issueDate),
        pdfURL: `/api/certificates/${certificateId}/download`,
        thumbnailURL: data.qrCode || '',
        status: data.status as CertificateStatus,
        verificationURL: `/verify/${data.certificateId}`,
        issuedBy: 'CampusConnect',
        description: 'Verified Credential Record',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  } catch {
    return { verified: false, certificate: null }
  }
}

export async function createCertificate(data: {
  certificateId: string
  studentId: string
  studentName: string
  programName: string
  issueDate: Date
  pdfURL: string
  thumbnailURL: string
  status: CertificateStatus
  verificationURL: string
  issuedBy: string
  description: string
  file?: File
}): Promise<string> {
  let body: any

  if (data.file) {
    const fd = new FormData()
    fd.append('file', data.file)
    fd.append('studentId', data.studentId)
    fd.append('certificateName', data.programName + ' Certificate')
    fd.append('program', data.programName)
    fd.append('issueDate', data.issueDate.toISOString().split('T')[0])
    body = fd
  } else {
    body = JSON.stringify({
      studentId: data.studentId,
      certificateName: data.programName + ' Certificate',
      program: data.programName,
      issueDate: data.issueDate.toISOString().split('T')[0]
    })
  }

  const res = await apiRequest<any>('/api/admin/certificates', {
    method: 'POST',
    body
  })
  localStorage.removeItem(CACHE_KEY)
  return res.id
}

export async function revokeCertificate(id: string): Promise<void> {
  await apiRequest(`/api/admin/certificates/${id}/revoke`, { method: 'PATCH' })
}

export async function downloadCertificate(id: string, studentName?: string, programName?: string): Promise<void> {
  const url = `/api/certificates/${id}/download`
  const sName = studentName || 'Student'
  const pName = programName || 'Certificate'
  const a = document.createElement('a')
  a.href = url
  a.download = `${sName.replace(/[^a-zA-Z0-9]/g, '_')}_${pName.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
