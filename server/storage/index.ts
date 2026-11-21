import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { firebaseApp, isFirebaseConfigured } from '../db/firestore'

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.VERCEL_ENV)
const UPLOAD_DIR = isServerless ? path.join(os.tmpdir(), 'uploads') : path.resolve(process.cwd(), 'uploads')
const CERT_DIR = path.join(UPLOAD_DIR, 'certificates')
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars')
const DOCS_DIR = path.join(UPLOAD_DIR, 'documents')

// Ensure local directories exist safely without throwing on read-only serverless filesystems
try {
  for (const dir of [UPLOAD_DIR, CERT_DIR, AVATAR_DIR, DOCS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
} catch (err) {
  // Non-fatal: filesystem is read-only or in serverless sandbox
}

export interface StoredFile {
  fileKey: string
  fileName: string
  mimeType: string
  size: number
  fileUrl: string
}

/**
 * Saves a certificate PDF buffer to Firebase Storage and local cache:
 * certificates/{student_id}/{certificate_id}.pdf
 */
export async function saveCertificateFile(
  buffer: Buffer,
  studentId: string,
  certificateId: string
): Promise<{ fileKey: string; filePath: string; fileUrl?: string; size: number }> {
  // Sanitize studentId and certificateId for safe storage path
  const safeStudentId = String(studentId).replace(/[^a-zA-Z0-9_-]/g, '_')
  const safeCertId = String(certificateId).replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileKey = `certificates/${safeStudentId}/${safeCertId}.pdf`
  const targetPath = path.join(UPLOAD_DIR, fileKey)

  // Ensure local folder exists
  try {
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    fs.writeFileSync(targetPath, buffer)
  } catch (err: any) {
    console.warn('[Storage] Local write notice:', err.message)
  }

  let fileUrl = `/api/certificates/${safeCertId}/download`

  // Sync to Firebase Storage if configured
  if (isFirebaseConfigured && firebaseApp) {
    try {
      const storageInstance = getStorage(firebaseApp)
      const storageRef = ref(storageInstance, fileKey)
      const snapshot = await uploadBytes(storageRef, buffer, {
        contentType: 'application/pdf',
        customMetadata: {
          studentId: safeStudentId,
          certificateId: safeCertId,
          uploadedAt: new Date().toISOString()
        }
      })
      fileUrl = await getDownloadURL(snapshot.ref)
      console.log(`[Firebase Storage] Uploaded certificate ${certificateId} to ${fileKey}`)
    } catch (err: any) {
      console.warn('[Firebase Storage] Upload notice (using resilient access):', err.message)
    }
  }

  return {
    fileKey,
    filePath: targetPath,
    fileUrl,
    size: buffer.length
  }
}

/**
 * Safely deletes a certificate file from Firebase Storage & local cache
 */
export async function deleteCertificateFile(fileKeyOrPath: string): Promise<boolean> {
  // Delete from Firebase Storage if configured
  if (isFirebaseConfigured && firebaseApp) {
    try {
      const storageInstance = getStorage(firebaseApp)
      const cleanKey = fileKeyOrPath.startsWith(UPLOAD_DIR)
        ? path.relative(UPLOAD_DIR, fileKeyOrPath).replace(/\\/g, '/')
        : fileKeyOrPath
      const storageRef = ref(storageInstance, cleanKey)
      await deleteObject(storageRef)
    } catch (err: any) {
      console.warn('[Firebase Storage] Delete notice:', err.message)
    }
  }

  try {
    const fullPath = fileKeyOrPath.startsWith(UPLOAD_DIR)
      ? fileKeyOrPath
      : path.join(UPLOAD_DIR, fileKeyOrPath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
  } catch (err) {
    console.warn('[Storage] Failed to delete local certificate file:', err)
  }
  return false
}

/**
 * Saves a binary file buffer to storage and returns file key & access URL
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  category: 'certificates' | 'avatars' | 'documents' = 'documents'
): Promise<StoredFile> {
  const ext = path.extname(originalName) || '.pdf'
  const fileKey = `${category}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
  const targetPath = path.join(UPLOAD_DIR, fileKey)

  try {
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    fs.writeFileSync(targetPath, buffer)
  } catch (err: any) {
    console.warn('[Storage] Local write notice:', err.message)
  }

  let fileUrl = `/api/storage/files/${fileKey}`

  if (isFirebaseConfigured && firebaseApp) {
    try {
      const storageInstance = getStorage(firebaseApp)
      const storageRef = ref(storageInstance, fileKey)
      const mime = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream'
      const snapshot = await uploadBytes(storageRef, buffer, { contentType: mime })
      fileUrl = await getDownloadURL(snapshot.ref)
    } catch (err: any) {
      console.warn('[Firebase Storage] Upload notice:', err.message)
    }
  }

  return {
    fileKey,
    fileName: originalName,
    mimeType: ext === '.pdf' ? 'application/pdf' : 'application/octet-stream',
    size: buffer.length,
    fileUrl
  }
}

/**
 * Retrieves file path from local storage cache
 */
export function getFilePath(fileKey: string): string | null {
  const fullPath = path.join(UPLOAD_DIR, fileKey)
  if (fs.existsSync(fullPath)) {
    return fullPath
  }
  return null
}

/**
 * Generates an authorized download token or secure URL
 */
export function generateSignedDownloadUrl(fileKey: string, studentId: string): string {
  const expires = Date.now() + 1000 * 60 * 60 // 1 hour
  const secret = process.env.AUTH_SECRET || 'campusconnect-secure-secret-key-2026'
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(`${fileKey}:${studentId}:${expires}`)
  const signature = hmac.digest('hex')

  return `/api/storage/download?key=${encodeURIComponent(fileKey)}&expires=${expires}&sig=${signature}&user=${encodeURIComponent(studentId)}`
}

/**
 * Verifies signed download token
 */
export function verifySignedDownload(fileKey: string, studentId: string, expires: number, sig: string): boolean {
  if (Date.now() > expires) return false
  const secret = process.env.AUTH_SECRET || 'campusconnect-secure-secret-key-2026'
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(`${fileKey}:${studentId}:${expires}`)
  const expectedSig = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))
}
