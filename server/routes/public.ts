import { Router, Request, Response } from 'express'
import { fallbackStore } from '../db'
import { getFilePath } from '../storage'
import fs from 'fs'

const router = Router()

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'CampusConnect API', timestamp: new Date().toISOString() })
})

// GET /api/verify/:certificateId (Public Certificate Verification — NO LOGIN REQUIRED)
router.get('/verify/:certificateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const certCode = req.params.certificateId.trim()
    const cert = fallbackStore.data.certificates.find(
      c => c.certificate_id.toLowerCase() === certCode.toLowerCase()
    )

    if (!cert) {
      res.status(404).json({
        verified: false,
        error: 'Certificate not found',
        message: 'No record matching this Certificate ID was found in the official registry.'
      })
      return
    }

    const studentProfile = fallbackStore.data.profiles.find(p => p.user_id === cert.student_id)
    const studentUser = fallbackStore.data.users.find(u => u.id === cert.student_id)

    res.json({
      verified: cert.status === 'Valid',
      status: cert.status, // Valid, Revoked, Expired
      certificateId: cert.certificate_id,
      certificateName: cert.certificate_name,
      program: cert.program,
      issueDate: cert.issue_date,
      studentName: studentProfile?.full_name || 'Authorized Recipient',
      studentUniversity: studentProfile?.university || 'CampusConnect Ambassador Network',
      studentCode: studentProfile?.student_id || 'VERIFIED-AMBASSADOR',
      qrCode: cert.qr_code,
      verifiedAt: new Date().toISOString()
    })
  } catch (err: any) {
    res.status(500).json({ verified: false, error: err.message || 'Verification check failed' })
  }
})

// GET /api/certificates/:id/download (Secure PDF download)
router.get('/certificates/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const certId = req.params.id
    const cert = fallbackStore.data.certificates.find(
      c => c.id === certId || c.certificate_id.toLowerCase() === certId.toLowerCase()
    )

    if (!cert) {
      res.status(404).json({ error: 'Certificate not found' })
      return
    }

    const studentProfile = fallbackStore.data.profiles.find(p => p.user_id === cert.student_id)
    const sanitizedStudentName = (studentProfile?.full_name || 'Student').replace(/[^a-zA-Z0-9]/g, '_')
    const sanitizedProgram = cert.program.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${sanitizedStudentName}_${sanitizedProgram}_Certificate.pdf`

    // Check if physical file exists in storage
    if (cert.file_key) {
      const diskPath = getFilePath(cert.file_key)
      if (diskPath && fs.existsSync(diskPath)) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        fs.createReadStream(diskPath).pipe(res)
        return
      }
    }

    // Generate valid downloadable PDF document on the fly
    const samplePdfHeader = `%PDF-1.4
1 0 obj
<< /Title (${cert.certificate_name}) /Author (CampusConnect) /Creator (CampusConnect System) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>
endobj
5 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
100 700 Td
(CampusConnect Official Certificate) Tj
/F1 14 Tf
0 -40 Td
(Recipient: ${studentProfile?.full_name || 'Student'}) Tj
0 -30 Td
(Program: ${cert.program}) Tj
0 -30 Td
(Certificate ID: ${cert.certificate_id}) Tj
0 -30 Td
(Status: ${cert.status}) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000109 00000 n 
0000000158 00000 n 
0000000215 00000 n 
0000000329 00000 n 
0000000582 00000 n 
trailer
<< /Size 7 /Root 2 0 R /Info 1 0 R >>
startxref
654
%%EOF`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(Buffer.from(samplePdfHeader))
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Download failed' })
  }
})

export default router
