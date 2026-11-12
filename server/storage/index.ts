import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
const CERT_DIR = path.join(UPLOAD_DIR, 'certificates')
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars')
const DOCS_DIR = path.join(UPLOAD_DIR, 'documents')

// Ensure local directories exist
for (const dir of [UPLOAD_DIR, CERT_DIR, AVATAR_DIR, DOCS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export interface StoredFile {
  fileKey: string
  fileName: string
  mimeType: string
  size: number
  fileUrl: string
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

  // Ensure category folder exists
  const targetDir = path.dirname(targetPath)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  fs.writeFileSync(targetPath, buffer)

  return {
    fileKey,
    fileName: originalName,
    mimeType: ext === '.pdf' ? 'application/pdf' : 'application/octet-stream',
    size: buffer.length,
    fileUrl: `/api/storage/files/${fileKey}`
  }
}

/**
 * Retrieves file path from storage
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
