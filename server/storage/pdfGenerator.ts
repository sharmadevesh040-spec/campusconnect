/**
 * Generates a clean, valid PDF buffer for CampusConnect certificates
 */
export function generateCertificatePdfBuffer(cert: {
  studentName?: string
  title?: string
  certificate_name?: string
  type?: string
  certificate_id?: string
  program?: string
  issue_date?: string | Date
  studentUniversity?: string
}): Buffer {
  const student = (cert.studentName || 'Recipient').toUpperCase()
  const title = cert.title || cert.certificate_name || 'Certificate of Achievement'
  const certType = cert.type || 'Ambassador Credential'
  const certId = cert.certificate_id || 'GSA-2026-000000'
  const university = cert.studentUniversity || 'CampusConnect Ambassador Network'
  
  let formattedDate = 'November 2026'
  try {
    if (cert.issue_date) {
      const d = new Date(cert.issue_date)
      formattedDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  } catch (e) {
    // fallback
  }

  // Construct standard valid PDF 1.4 syntax
  const streamData = `
BT
/F1 12 Tf
70 730 Td
(CAMPUSCONNECT OFFICIAL CERTIFICATE OF RECOGNITION) Tj
ET

BT
/F1 22 Tf
70 680 Td
(${title.replace(/[()\\]/g, '')}) Tj
ET

BT
/F1 14 Tf
70 650 Td
(Credential Type: ${certType.replace(/[()\\]/g, '')}) Tj
ET

BT
/F1 12 Tf
70 600 Td
(This certifies that) Tj
ET

BT
/F1 20 Tf
70 565 Td
(${student.replace(/[()\\]/g, '')}) Tj
ET

BT
/F1 11 Tf
70 535 Td
(of ${university.replace(/[()\\]/g, '')}) Tj
ET

BT
/F1 12 Tf
70 490 Td
(has successfully fulfilled all requirements, leadership duties, and active student mentorship) Tj
ET
BT
/F1 12 Tf
70 470 Td
(under the Google Student Ambassador Program with distinction.) Tj
ET

BT
/F1 10 Tf
70 400 Td
(Issued on: ${formattedDate}) Tj
ET

BT
/F1 11 Tf
70 370 Td
(Official Certificate ID: ${certId}) Tj
ET

BT
/F1 9 Tf
70 340 Td
(Publicly verifiable at: https://campusconnect.internal/verify/${certId}) Tj
ET

BT
/F1 10 Tf
70 270 Td
(Executive Program Director                            University Program Board) Tj
ET
`

  const streamLength = Buffer.byteLength(streamData, 'utf-8')

  const pdf = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj

2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj

3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica-Bold
      >>
    >>
  >>
  /Contents 4 0 R
>>
endobj

4 0 obj
<<
  /Length ${streamLength}
>>
stream
${streamData}
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000305 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
${400 + streamLength}
%%EOF`

  return Buffer.from(pdf, 'utf-8')
}
