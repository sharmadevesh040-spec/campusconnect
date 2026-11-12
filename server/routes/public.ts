import { Router, Request, Response } from 'express'
import { query } from '../db'
import { getFilePath } from '../storage'
import fs from 'fs'

const router = Router()

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'CampusConnect API', timestamp: new Date().toISOString() })
})

// GET /api/verify/:certificateId (Public Certificate Verification — Real PostgreSQL DB)
router.get('/verify/:certificateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const certCode = req.params.certificateId.trim()
    const result = await query(
      `SELECT c.*, p.full_name as student_name, p.university as student_university, p.student_id as student_code
       FROM certificates c
       LEFT JOIN profiles p ON c.student_id = p.user_id
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
      certificateName: cert.certificate_name,
      program: cert.program,
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

// GET /api/certificates/:id/download (Secure PDF download from real PostgreSQL DB)
router.get('/certificates/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const certId = req.params.id.trim()
    const result = await query(
      `SELECT c.*, p.full_name as student_name
       FROM certificates c
       LEFT JOIN profiles p ON c.student_id = p.user_id
       WHERE c.id = $1 OR LOWER(c.certificate_id) = LOWER($1)`,
      [certId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }

    const cert = result.rows[0]
    const sanitizedStudentName = (cert.student_name || 'Student').replace(/[^a-zA-Z0-9]/g, '_')
    const sanitizedProgram = (cert.program || 'Program').replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${sanitizedStudentName}_${sanitizedProgram}_Certificate.pdf`

    // Check if physical file exists in storage
    if (cert.file_key) {
      const physicalPath = getFilePath(cert.file_key)
      if (fs.existsSync(physicalPath)) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        const stream = fs.createReadStream(physicalPath)
        stream.pipe(res)
        return
      }
    }

    // Generate dynamic mock PDF bytes if physical PDF hasn't been uploaded yet
    const placeholderContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 120 >> stream
BT /F1 24 Tf 100 700 Td (${cert.certificate_name}) Tj ET
BT /F1 16 Tf 100 650 Td (Presented to: ${cert.student_name || 'Recipient'}) Tj ET
BT /F1 12 Tf 100 600 Td (Certificate ID: ${cert.certificate_id}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000213 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
385
%%EOF`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(Buffer.from(placeholderContent, 'utf-8'))
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
