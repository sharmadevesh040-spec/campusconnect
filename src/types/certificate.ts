export enum CertificateStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired'
}

export interface Certificate {
  id: string
  certificateId: string
  studentId: string
  studentName: string
  programName: string
  issueDate: Date
  expiryDate?: Date
  pdfURL: string
  thumbnailURL: string
  status: CertificateStatus
  verificationURL: string
  issuedBy: string
  description: string
  createdAt: Date
  updatedAt: Date
}
