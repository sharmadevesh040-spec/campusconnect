import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { query } from '../db'
import {
  saveCertificateFile,
  getFilePath,
  deleteCertificateFile,
  generateSignedDownloadUrl
} from '../storage'
import { logAudit } from '../middleware/auth'

export interface UploadCertificateParams {
  student_id: string
  certificate_name: string
  issue_date: string
  certificate_file: Buffer | string // Buffer or base64 string
  caller_user_id?: string
  caller_role?: string
  certificate_type?: string
  program?: string
  description?: string
}

export interface GetMyCertificatesParams {
  authenticated_user_id: string
  caller_role?: string
}

export interface GetCertificateParams {
  certificate_id: string
  caller_user_id: string
  caller_role?: string
}

export interface DeleteCertificateParams {
  certificate_id: string
  caller_user_id: string
  caller_role: string
}

export interface VerifyCertificateParams {
  certificate_id: string
}

/**
 * 1. MCP Tool: upload_certificate
 * Only authorized administrators can issue certificates.
 * Validates student existence, validates PDF, stores in private storage, inserts DB record with rollback.
 */
export async function uploadCertificateTool(params: UploadCertificateParams) {
  const {
    student_id,
    certificate_name,
    issue_date,
    certificate_file,
    caller_user_id = 'system-admin',
    caller_role = 'admin',
    certificate_type = 'Ambassador',
    program = 'CampusConnect Ambassador Program 2026',
    description = ''
  } = params

  // 1. Authorization check: Admin only
  const isPrivileged = caller_role === 'admin' || caller_role === 'super_admin'
  if (!isPrivileged) {
    return {
      success: false,
      statusCode: 403,
      error: 'Forbidden: Only authorized administrators can upload and issue certificates'
    }
  }

  // 2. Validate input fields
  if (!student_id || !student_id.trim()) {
    return { success: false, statusCode: 400, error: 'Student ID or recipient is required' }
  }
  if (!certificate_name || !certificate_name.trim()) {
    return { success: false, statusCode: 400, error: 'Certificate name is required' }
  }
  if (!issue_date || !issue_date.trim()) {
    return { success: false, statusCode: 400, error: 'Issue date is required' }
  }
  if (!certificate_file) {
    return { success: false, statusCode: 400, error: 'Certificate PDF file is required' }
  }

  // 3. Verify student exists in the database
  const studentLookup = student_id.trim()
  const stuRes = await query(
    `SELECT u.id, u.email, p.student_id as "studentCode", p.full_name as "fullName", p.university
     FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE u.id = $1 OR LOWER(p.student_id) = LOWER($1) OR LOWER(u.email) = LOWER($1)`,
    [studentLookup]
  )

  if (stuRes.rows.length === 0) {
    return {
      success: false,
      statusCode: 404,
      error: `Student '${studentLookup}' not found in registered accounts. Please verify the student ID, email, or database ID.`
    }
  }

  const student = stuRes.rows[0]
  const resolvedUserId = student.id
  const resolvedStudentCode = student.studentCode || studentLookup
  const resolvedStudentName = student.fullName || student.email

  // 4. Validate file content (must be PDF binary)
  let fileBuffer: Buffer
  if (Buffer.isBuffer(certificate_file)) {
    fileBuffer = certificate_file
  } else if (typeof certificate_file === 'string') {
    // If base64 string
    const base64Data = certificate_file.replace(/^data:application\/pdf;base64,/, '').trim()
    fileBuffer = Buffer.from(base64Data, 'base64')
  } else {
    return { success: false, statusCode: 400, error: 'Invalid file data: Buffer or base64 PDF required' }
  }

  if (fileBuffer.length === 0) {
    return { success: false, statusCode: 400, error: 'Uploaded certificate file is empty' }
  }

  // Maximum file size: 15MB
  if (fileBuffer.length > 15 * 1024 * 1024) {
    return { success: false, statusCode: 400, error: 'File size exceeds maximum limit of 15MB' }
  }

  // Check magic bytes for PDF: %PDF-
  const header = fileBuffer.slice(0, 5).toString('ascii')
  if (!header.startsWith('%PDF-')) {
    return { success: false, statusCode: 400, error: 'Invalid file format: Only valid PDF documents are allowed' }
  }

  // 5. Generate unique Certificate ID
  const certIdCode = `CERT-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  const newDbId = `cert-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

  // 6. Save PDF to private storage: certificates/{student_id}/{certificate_id}.pdf
  let stored: { fileKey: string; filePath: string; size: number }
  try {
    stored = await saveCertificateFile(fileBuffer, resolvedStudentCode, certIdCode)
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      error: `Storage upload failed: ${err.message || 'Unable to write file to private storage'}`
    }
  }

  // 7. Insert metadata into Firestore with rollback on failure
  try {
    const fileUrl = `/api/student/certificates/${certIdCode}/download`
    const insertRes = await query(
      `INSERT INTO certificates (
        id, certificate_id, student_id, title, certificate_name, certificate_type, type, program, issue_date, description, storage_key, file_key, file_path, file_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Valid')
      RETURNING *`,
      [
        newDbId,
        certIdCode,
        resolvedUserId,
        certificate_name.trim(),
        certificate_name.trim(),
        certificate_type,
        certificate_type,
        program,
        issue_date,
        description,
        stored.fileKey,
        stored.fileKey,
        stored.filePath,
        fileUrl
      ]
    )

    // 8. Log audit trail
    await logAudit(
      caller_user_id,
      'CERTIFICATE_UPLOADED',
      'certificates',
      certIdCode,
      {
        studentId: resolvedStudentCode,
        studentName: resolvedStudentName,
        title: certificate_name,
        filePath: stored.filePath
      }
    )

    const row = insertRes.rows[0] || {}

    return {
      success: true,
      statusCode: 201,
      message: `Certificate successfully issued and linked to student ${resolvedStudentName} (${resolvedStudentCode})`,
      certificate: {
        id: row.id || newDbId,
        certificate_id: certIdCode,
        student_id: resolvedUserId,
        student_code: resolvedStudentCode,
        student_name: resolvedStudentName,
        certificate_name: certificate_name.trim(),
        title: certificate_name.trim(),
        issue_date,
        file_path: stored.filePath,
        file_key: stored.fileKey,
        status: 'Valid',
        download_url: fileUrl,
        view_url: `/api/student/certificates/${certIdCode}/view`
      }
    }
  } catch (err: any) {
    // Clean up uploaded file on database failure to avoid orphan files
    deleteCertificateFile(stored.fileKey)
    return {
      success: false,
      statusCode: 500,
      error: `Database insertion failed: ${err.message}. The storage file has been rolled back.`
    }
  }
}

/**
 * 2. MCP Tool: get_my_certificates
 * Resolves the authenticated student's unique identity.
 * Strictly queries only certificates belonging to this student account.
 */
export async function getMyCertificatesTool(params: GetMyCertificatesParams) {
  const { authenticated_user_id } = params

  if (!authenticated_user_id) {
    return {
      success: false,
      statusCode: 401,
      error: 'Unauthorized: Authentication required to retrieve certificates'
    }
  }

  // Resolve student account from authenticated user ID
  const stuRes = await query(
    `SELECT u.id, u.email, p.student_id as "studentCode", p.full_name as "fullName", p.university
     FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [authenticated_user_id]
  )

  if (stuRes.rows.length === 0) {
    return {
      success: true,
      student_id: authenticated_user_id,
      count: 0,
      certificates: []
    }
  }

  const student = stuRes.rows[0]
  const studentCode = student.studentCode || ''
  const studentEmail = (student.email || '').toLowerCase()

  // Query certificates matching authenticated user's ID or student code
  const certRes = await query(
    `SELECT c.*,
            COALESCE(c.title, c.certificate_name) as title,
            COALESCE(c.certificate_name, c.title) as certificate_name,
            COALESCE(c.type, c.certificate_type, 'Ambassador') as type,
            COALESCE(c.certificate_type, c.type, 'Ambassador') as certificate_type,
            COALESCE(c.file_path, c.file_key, c.storage_key) as file_path,
            COALESCE(c.file_key, c.storage_key) as file_key,
            $4::text as "studentName",
            $3::text as "studentEmail",
            $2::text as "studentCode"
     FROM certificates c
     WHERE c.student_id = $1 
        OR c.student_id = $2 
        OR LOWER(c.student_id) = $3
     ORDER BY c.issue_date DESC, c.created_at DESC`,
    [authenticated_user_id, studentCode, studentEmail, student.fullName || 'Student Recipient']
  )

  const certificates = certRes.rows.map(c => ({
    id: c.id,
    certificate_id: c.certificate_id,
    certificate_name: c.certificate_name || c.title,
    title: c.title || c.certificate_name,
    type: c.type,
    program: c.program,
    issue_date: c.issue_date,
    status: c.status,
    file_path: c.file_path,
    file_key: c.file_key,
    download_url: `/api/student/certificates/${c.certificate_id || c.id}/download`,
    view_url: `/api/student/certificates/${c.certificate_id || c.id}/view`,
    created_at: c.created_at
  }))

  return {
    success: true,
    statusCode: 200,
    student_id: studentCode || authenticated_user_id,
    student_name: student.fullName || student.email,
    count: certificates.length,
    certificates
  }
}

/**
 * 3. MCP Tool: get_certificate
 * Secure certificate retrieval with server-side ownership check and signed temporary URL.
 */
export async function getCertificateTool(params: GetCertificateParams) {
  const { certificate_id, caller_user_id, caller_role = 'student' } = params

  if (!certificate_id || !certificate_id.trim()) {
    return { success: false, statusCode: 400, error: 'Certificate ID is required' }
  }
  if (!caller_user_id) {
    return { success: false, statusCode: 401, error: 'Authentication required to access certificate' }
  }

  // 1. Fetch certificate metadata
  const certRes = await query(
    `SELECT c.*,
            COALESCE(c.title, c.certificate_name) as title,
            COALESCE(c.certificate_name, c.title) as certificate_name,
            COALESCE(c.type, c.certificate_type, 'Ambassador') as type,
            COALESCE(c.file_path, c.file_key, c.storage_key) as file_path,
            COALESCE(c.file_key, c.storage_key) as file_key,
            p.full_name as "studentName",
            u.email as "studentEmail",
            p.student_id as "studentCode"
     FROM certificates c
     LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
     LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
     WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
    [certificate_id.trim()]
  )

  if (certRes.rows.length === 0) {
    return { success: false, statusCode: 404, error: 'Certificate not found' }
  }

  const cert = certRes.rows[0]

  // 2. Fetch caller identity details
  const callerRes = await query(
    `SELECT u.id, u.email, u.role, p.student_id as "studentCode"
     FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [caller_user_id]
  )

  const caller = callerRes.rows[0] || { id: caller_user_id, role: caller_role }
  const isPrivileged = caller.role === 'admin' || caller.role === 'super_admin'

  // 3. Strict Server-Side Ownership Check
  const ownsCert =
    cert.student_id === caller_user_id ||
    (caller.studentCode && cert.studentCode === caller.studentCode) ||
    (caller.studentCode && cert.student_id === caller.studentCode) ||
    (caller.email && cert.studentEmail?.toLowerCase() === caller.email.toLowerCase())

  if (!isPrivileged && !ownsCert) {
    return {
      success: false,
      statusCode: 403,
      error: 'Forbidden: You do not have permission to access another student certificate'
    }
  }

  // 4. Resolve private file path
  const fileKey = cert.file_key || `certificates/${cert.certificate_id}.pdf`
  const physicalPath = getFilePath(fileKey) || cert.file_path

  // 5. Generate temporary signed URL (expires in 1 hour)
  const signedUrl = generateSignedDownloadUrl(fileKey, cert.student_id)

  let fileBase64: string | undefined
  if (physicalPath && fs.existsSync(physicalPath)) {
    try {
      fileBase64 = fs.readFileSync(physicalPath).toString('base64')
    } catch (e) {
      console.warn('[MCP getCertificateTool] Unable to read physical file for base64:', e)
    }
  }

  // 6. Audit log view access
  await logAudit(
    caller_user_id,
    'CERTIFICATE_VIEWED',
    'certificates',
    cert.certificate_id,
    { callerRole: caller.role, isOwner: ownsCert }
  )

  return {
    success: true,
    statusCode: 200,
    file_base64: fileBase64,
    certificate: {
      id: cert.id,
      certificate_id: cert.certificate_id,
      certificate_name: cert.certificate_name || cert.title,
      title: cert.title || cert.certificate_name,
      student_id: cert.student_id,
      student_name: cert.studentName || 'Student Recipient',
      student_code: cert.studentCode || cert.student_id,
      issue_date: cert.issue_date,
      status: cert.status,
      file_path: physicalPath,
      file_key: fileKey,
      signed_url: signedUrl,
      download_url: `/api/student/certificates/${cert.certificate_id}/download`,
      view_url: `/api/student/certificates/${cert.certificate_id}/view`,
      file_base64: fileBase64
    }
  }
}

/**
 * 4. MCP Tool: delete_certificate
 * Only administrators can delete certificates.
 * Removes the database record and private file from storage with audit logging.
 */
export async function deleteCertificateTool(params: DeleteCertificateParams) {
  const { certificate_id, caller_user_id, caller_role } = params

  // 1. Authorization check: Admin only
  const isPrivileged = caller_role === 'admin' || caller_role === 'super_admin'
  if (!isPrivileged) {
    return {
      success: false,
      statusCode: 403,
      error: 'Forbidden: Only administrators can delete certificates'
    }
  }

  if (!certificate_id || !certificate_id.trim()) {
    return { success: false, statusCode: 400, error: 'Certificate ID is required' }
  }

  // 2. Fetch certificate to retrieve file path
  const check = await query(
    `SELECT * FROM certificates WHERE id = $1 OR LOWER(certificate_id) = LOWER($1)`,
    [certificate_id.trim()]
  )

  if (check.rows.length === 0) {
    return { success: false, statusCode: 404, error: 'Certificate not found' }
  }

  const cert = check.rows[0]
  const fileKey = cert.file_key || cert.storage_key || `certificates/${cert.certificate_id}.pdf`
  const filePath = cert.file_path || fileKey

  // 3. Delete database record
  await query(`DELETE FROM certificates WHERE id = $1`, [cert.id])

  // 4. Delete file from private storage
  deleteCertificateFile(filePath)
  deleteCertificateFile(fileKey)

  // 5. Log audit trail
  await logAudit(
    caller_user_id,
    'CERTIFICATE_DELETED',
    'certificates',
    cert.certificate_id,
    { title: cert.title || cert.certificate_name, studentId: cert.student_id }
  )

  return {
    success: true,
    statusCode: 200,
    message: `Certificate ${cert.certificate_id} successfully deleted from database and private storage`
  }
}

/**
 * 5. MCP Tool: verify_certificate
 * Public verification of certificate authenticity by certificate ID.
 * Returns public metadata without exposing sensitive private student data.
 */
export async function verifyCertificateTool(params: VerifyCertificateParams) {
  const { certificate_id } = params

  if (!certificate_id || !certificate_id.trim()) {
    return {
      verified: false,
      statusCode: 400,
      error: 'Certificate ID is required for verification'
    }
  }

  const check = await query(
    `SELECT c.id, c.certificate_id,
            COALESCE(c.certificate_name, c.title) as certificate_name,
            c.issue_date, c.status, c.program, c.type,
            p.full_name as "studentName",
            p.university as "studentUniversity"
     FROM certificates c
     LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
     LEFT JOIN profiles p ON (u.id = p.user_id OR c.student_id = p.student_id)
     WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
    [certificate_id.trim()]
  )

  if (check.rows.length === 0) {
    return {
      verified: false,
      statusCode: 404,
      error: 'Invalid Certificate: Not found in the official university registry'
    }
  }

  const cert = check.rows[0]
  const isValid = cert.status === 'Valid'

  // Log verification check
  await logAudit(null, 'CERTIFICATE_VERIFIED', 'certificates', cert.certificate_id, {
    status: cert.status,
    verified: isValid
  })

  const verificationHash = crypto.createHash('sha256').update(`${cert.certificate_id}:${cert.issue_date}:${cert.status}`).digest('hex')

  return {
    verified: isValid,
    is_valid: isValid,
    statusCode: isValid ? 200 : 400,
    certificate_id: cert.certificate_id,
    certificate_name: cert.certificate_name,
    student_name: cert.studentName || 'Student Recipient',
    university: cert.studentUniversity || 'CampusConnect Ambassador Network',
    program: cert.program || 'Official Academic Program',
    issue_date: cert.issue_date,
    status: cert.status,
    issuer: 'CampusConnect Ambassador Network',
    verification_hash: verificationHash
  }
}
