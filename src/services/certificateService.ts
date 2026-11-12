import { apiRequest, apiBlobRequest } from './api'
import type { Certificate } from '@/types'
import { CertificateStatus } from '@/types/certificate'

const CACHE_KEY = 'campusconnect_certificates_cache'

function mapCert(item: any): Certificate {
  const title = item.title || item.certificate_name || item.certificateName || 'Ambassador Credential'
  const type = item.type || 'Participation'
  return {
    id: item.id,
    certificateId: item.certificate_id || item.certificateId,
    studentId: item.student_id || item.studentId,
    studentName: item.studentName || item.student_name || 'Student',
    title,
    type,
    studentEmail: item.studentEmail || item.student_email,
    studentCode: item.studentCode || item.student_code,
    studentUniversity: item.studentUniversity || item.student_university,
    programName: item.program || item.programName || title,
    issueDate: new Date(item.issue_date || item.issueDate),
    pdfURL: item.file_url || item.pdfURL || `/api/student/certificates/${item.certificate_id || item.id}/download`,
    thumbnailURL: item.qr_code || item.thumbnailURL || '',
    status: (item.status as CertificateStatus) || CertificateStatus.VALID,
    verificationURL: `/verify/${item.certificate_id || item.certificateId}`,
    issuedBy: 'CampusConnect Executive Board',
    description: item.description || 'Awarded for extraordinary community outreach, inclusive tech workshops, and student mentorship.',
    fileKey: item.file_key,
    createdAt: new Date(item.created_at || Date.now()),
    updatedAt: new Date(item.updated_at || Date.now())
  }
}

/**
 * Fetch authenticated student's own certificates (PostgreSQL)
 */
export async function getCertificates(_studentId?: string): Promise<Certificate[]> {
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

/**
 * Admin: Get all certificates with optional search filter query
 */
export async function getAllCertificates(search?: string): Promise<Certificate[]> {
  try {
    const qParam = search ? `?q=${encodeURIComponent(search.trim())}` : ''
    const list = await apiRequest<any[]>(`/api/admin/certificates${qParam}`)
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

/**
 * Public Verification Endpoint
 */
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
        title: data.title || data.certificateName,
        type: data.type || 'Participation',
        programName: data.program,
        issueDate: new Date(data.issueDate),
        pdfURL: `/api/student/certificates/${certificateId}/download`,
        thumbnailURL: data.qrCode || '',
        status: data.status as CertificateStatus,
        verificationURL: `/verify/${data.certificateId}`,
        issuedBy: 'CampusConnect',
        description: data.description || 'Verified Credential Record',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  } catch {
    return { verified: false, certificate: null }
  }
}

/**
 * Admin: Issue / Upload Certificate
 */
export async function createCertificate(data: {
  certificateId?: string
  studentId: string
  studentName?: string
  title?: string
  certificateName?: string
  type?: string
  programName?: string
  program?: string
  issueDate?: Date | string
  pdfURL?: string
  thumbnailURL?: string
  status?: CertificateStatus | string
  verificationURL?: string
  issuedBy?: string
  description?: string
  file?: File
}): Promise<string> {
  const title = data.title || data.certificateName || 'Google Student Ambassador Certificate'
  const type = data.type || 'Participation'
  const program = data.programName || data.program || title
  const issueDateStr = data.issueDate
    ? (data.issueDate instanceof Date ? data.issueDate.toISOString().split('T')[0] : data.issueDate)
    : new Date().toISOString().split('T')[0]

  let body: any

  if (data.file) {
    const fd = new FormData()
    fd.append('file', data.file)
    fd.append('studentId', data.studentId)
    fd.append('title', title)
    fd.append('certificateName', title)
    fd.append('type', type)
    fd.append('program', program)
    fd.append('issueDate', issueDateStr)
    if (data.description) fd.append('description', data.description)
    body = fd
  } else {
    body = JSON.stringify({
      studentId: data.studentId,
      title,
      certificateName: title,
      type,
      program,
      issueDate: issueDateStr,
      description: data.description
    })
  }

  const res = await apiRequest<any>('/api/admin/certificates', {
    method: 'POST',
    body
  })
  localStorage.removeItem(CACHE_KEY)
  return res.id || res.certificate_id
}

/**
 * Admin: Edit Certificate Metadata
 */
export async function updateCertificate(
  id: string,
  data: {
    title?: string
    type?: string
    program?: string
    issueDate?: string
    description?: string
    status?: string
  }
): Promise<any> {
  const res = await apiRequest(`/api/admin/certificates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
  localStorage.removeItem(CACHE_KEY)
  return res
}

/**
 * Admin: Replace Certificate PDF File
 */
export async function replaceCertificatePdf(id: string, file: File): Promise<any> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await apiRequest(`/api/admin/certificates/${id}/replace`, {
    method: 'PUT',
    body: fd
  })
  localStorage.removeItem(CACHE_KEY)
  return res
}

/**
 * Admin: Delete Certificate
 */
export async function deleteCertificate(id: string): Promise<void> {
  await apiRequest(`/api/admin/certificates/${id}`, { method: 'DELETE' })
  localStorage.removeItem(CACHE_KEY)
}

/**
 * Admin: Revoke Certificate
 */
export async function revokeCertificate(id: string): Promise<void> {
  await apiRequest(`/api/admin/certificates/${id}/revoke`, { method: 'PATCH' })
  localStorage.removeItem(CACHE_KEY)
}

/**
 * Securely fetch and preview certificate PDF blob
 */
export async function getCertificateViewBlobUrl(id: string): Promise<string> {
  const blob = await apiBlobRequest(`/api/student/certificates/${id}/view`)
  return URL.createObjectURL(blob)
}

/**
 * Securely download certificate PDF via authenticated blob
 */
export async function downloadCertificate(id: string, studentName?: string, programName?: string): Promise<void> {
  const blob = await apiBlobRequest(`/api/student/certificates/${id}/download`)
  const sName = (studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_')
  const pName = (programName || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_')
  const filename = `${sName}_${pName}_Certificate.pdf`

  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}
