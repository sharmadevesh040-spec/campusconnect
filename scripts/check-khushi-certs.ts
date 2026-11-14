import { query } from '../server/db/index'

async function checkCerts() {
  const userId = 'e20de924-4da7-4d30-9aed-cf9e4388e343'
  const studentCode = 'GSA-2026-915963'
  const email = 'khushi.kanu123@gmail.com'

  const res = await query(
    `SELECT * FROM certificates 
     WHERE student_id = $1 OR student_id = $2 OR LOWER(student_id) = LOWER($3)`,
    [userId, studentCode, email]
  )
  console.log('Certificates for Khushi:', res.rows.length)
  if (res.rows.length === 0) {
    console.log('No certificates yet. Issuing a verified certificate for Khushi so she can test viewing and downloading...')
    const certId = 'CERT-2026-KK' + Math.floor(100 + Math.random() * 900)
    const fileUrl = `/api/student/certificates/${certId}/download`
    const filePath = `uploads/certificates/GSA-2026-915963/${certId}.pdf`
    await query(
      `INSERT INTO certificates (
        id, certificate_id, student_id, title, certificate_name, certificate_type, type, program, issue_date, description, file_url, file_key, file_path, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9, $10, $11, $12, 'Valid')`,
      [
        'cert-khushi-' + Date.now(),
        certId,
        userId,
        'Google Student Ambassador Certificate',
        'Google Student Ambassador Certificate',
        'Ambassador',
        'Ambassador',
        'Google Student Ambassador Program 2026',
        'Awarded for outstanding leadership, active campus engagement, and peer mentorship in the student ambassador community.',
        fileUrl,
        `certificates/GSA-2026-915963/${certId}.pdf`,
        filePath
      ]
    )
    console.log(`Issued certificate ${certId} for Khushi!`)
  } else {
    console.log('Certificates found:', res.rows.map(r => ({ id: r.certificate_id, title: r.title || r.certificate_name })))
  }
  process.exit(0)
}

checkCerts().catch(err => {
  console.error(err)
  process.exit(1)
})
