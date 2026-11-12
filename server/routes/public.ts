import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import { query } from '../db'
import { getFilePath, verifySignedDownload } from '../storage'
import { generateCertificatePdfBuffer } from '../storage/pdfGenerator'
import type { AuthenticatedUser } from '../middleware/auth'

const router = Router()
const JWT_SECRET = process.env.AUTH_SECRET || 'campusconnect-jwt-secret-key-2026'

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'CampusConnect API', timestamp: new Date().toISOString() })
})

// GET /api/verify/:certificateId (Public Certificate Verification — Real PostgreSQL DB)
router.get('/verify/:certificateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const certCode = req.params.certificateId.trim()
    const result = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as student_name, 
              p.university as student_university, 
              p.student_id as student_code
       FROM certificates c
       LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
       WHERE LOWER(c.certificate_id) = LOWER($1)`,
      [certCode]
    )

    if (result.rows.length === 0) {
      res.status(404).json({
        verified: false,
        error: 'Certificate not found',
        message: 'No record matching this Certificate ID was found in the official registry.'
      })
      return
    }

    const cert = result.rows[0]

    res.json({
      verified: cert.status === 'Valid',
      status: cert.status, // Valid, Revoked, Expired
      certificateId: cert.certificate_id,
      title: cert.title || cert.certificate_name,
      certificateName: cert.certificate_name || cert.title,
      type: cert.type || 'Ambassador Credential',
      program: cert.program,
      description: cert.description,
      issueDate: cert.issue_date,
      studentName: cert.student_name || 'Authorized Recipient',
      studentUniversity: cert.student_university || 'CampusConnect Ambassador Network',
      studentCode: cert.student_code || 'VERIFIED-AMBASSADOR',
      qrCode: cert.qr_code,
      verifiedAt: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('[Verify Certificate Error]', err)
    res.status(500).json({ verified: false, error: err.message || 'Verification check failed' })
  }
})

// GET /api/storage/download (Secure signed URL file access)
router.get('/storage/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, expires, sig, user } = req.query as { key?: string; expires?: string; sig?: string; user?: string }
    if (!key || !expires || !sig || !user) {
      res.status(400).json({ error: 'Missing required signed URL parameters' })
      return
    }

    const isValid = verifySignedDownload(key, user, Number(expires), sig)
    if (!isValid) {
      res.status(403).json({ error: 'Signed download link has expired or is invalid' })
      return
    }

    const physicalPath = getFilePath(key)
    if (!physicalPath || !fs.existsSync(physicalPath)) {
      res.status(404).json({ error: 'File not found in storage' })
      return
    }

    const filename = path.basename(physicalPath)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    fs.createReadStream(physicalPath).pipe(res)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/certificates/:id/download (Secure authenticated download with ownership verification)
router.get('/certificates/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const certId = req.params.id.trim()

    // 1. Authenticate user from header or query token
    let user: AuthenticatedUser | null = null
    const authHeader = req.headers.authorization
    const queryToken = req.query.token as string

    const tokenToVerify = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : queryToken
    if (tokenToVerify) {
      try {
        user = jwt.verify(tokenToVerify, JWT_SECRET) as AuthenticatedUser
      } catch (e) {
        // invalid token
      }
    }

    // 2. Fetch certificate
    const result = await query(
      `SELECT c.*, 
              COALESCE(c.title, c.certificate_name) as title,
              COALESCE(c.type, 'Participation') as type,
              p.full_name as student_name,
              p.university as student_university,
              p.student_id as student_code,
              u.email as student_email
       FROM certificates c
       LEFT JOIN profiles p ON (c.student_id = p.user_id OR c.student_id = p.student_id)
       LEFT JOIN users u ON (c.student_id = u.id::text OR LOWER(c.student_id) = LOWER(u.email))
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [certId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }

    const cert = result.rows[0]

    // 3. If user is authenticated, verify ownership or admin role
    if (user) {
      const isPrivileged = user.role === 'admin' || user.role === 'super_admin'
      const ownsCert =
        cert.student_id === user.id ||
        cert.student_code === user.studentId ||
        cert.student_email?.toLowerCase() === user.email.toLowerCase()

      if (!isPrivileged && !ownsCert) {
        res.status(403).json({ error: 'Forbidden: You cannot access another student certificate' })
        return
      }
    } else {
      // Check if signed URL query parameters are present
      const { expires, sig, user: signedUser } = req.query as { expires?: string; sig?: string; user?: string }
      if (expires && sig && signedUser && cert.file_key) {
        const isValid = verifySignedDownload(cert.file_key, signedUser, Number(expires), sig)
        if (!isValid) {
          res.status(403).json({ error: 'Signed download link has expired or is invalid' })
          return
        }
      } else {
        // Neither valid session nor signed URL
        res.status(401).json({
          error: 'Unauthorized: Authentication required to download certificate. Please sign in or use an authorized link.'
        })
        return
      }
    }

    const sanitizedStudentName = (cert.student_name || 'Student').replace(/[^a-zA-Z0-9]/g, '_')
    const sanitizedTitle = (cert.title || cert.certificate_name || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${sanitizedStudentName}_${sanitizedTitle}_Certificate.pdf`

    // Check if physical file exists in storage
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key)
      if (physicalPath && fs.existsSync(physicalPath)) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        const stream = fs.createReadStream(physicalPath)
        stream.pipe(res)
        return
      }
    }

    // Stream generated certificate PDF
    const pdfBuffer = generateCertificatePdfBuffer({
      studentName: cert.student_name,
      title: cert.title || cert.certificate_name,
      type: cert.type,
      certificate_id: cert.certificate_id,
      program: cert.program,
      issue_date: cert.issue_date,
      studentUniversity: cert.student_university
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(pdfBuffer)
  } catch (err: any) {
    console.error('[Download Certificate Error]', err)
    res.status(500).json({ error: err.message || 'Download failed' })
  }
})

// GET /api/events/public (Upcoming events for public landing)
router.get('/events/public', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, title, type, date, time, location, max_capacity,
              (SELECT count(*)::int FROM event_registrations r WHERE r.event_id = events.id AND r.status = 'Registered') as attendee_count
       FROM events
       WHERE date >= CURRENT_DATE - INTERVAL '1 day'
       ORDER BY date ASC LIMIT 6`
    )
    res.json(result.rows)
  } catch (err: any) {
    console.error('[Public Events Error]', err)
    res.status(500).json({ error: 'Failed to fetch public events' })
  }
})

export default router
