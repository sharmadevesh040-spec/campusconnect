export enum CertificateStatus {
  ACTIVE = 'active',
  VALID = 'Valid',
  REVOKED = 'Revoked',
  EXPIRED = 'Expired'
}

export interface Certificate {
  id: string
  certificateId: string
  studentId: string
  studentName: string
  title?: string
  type?: string
  studentEmail?: string
  studentCode?: string
  studentUniversity?: string
  programName: string
  issueDate: Date
  expiryDate?: Date
  pdfURL: string
  thumbnailURL: string
  status: CertificateStatus
  verificationURL: string
  issuedBy: string
  description?: string
  fileKey?: string
  createdAt: Date
  updatedAt: Date
}
