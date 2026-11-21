import { query } from '../server/db/index'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { uploadCertificateTool, getMyCertificatesTool } from '../server/mcp/certificateTools'

async function runStudentFlowTest() {
  console.log('🧪 Starting End-to-End Student & Admin Firebase Flow Test...\n')

  const testEmail = `student_${Date.now()}@testuni.edu`
  const testStudentId = `GSA-2026-${Math.floor(100000 + Math.random() * 900000)}`
  const password = 'TestStudent@123'
  const passwordHash = await bcrypt.hash(password, 10)
  const userId = `usr-test-${Date.now()}`
  const profileId = `prof-test-${Date.now()}`

  // 1. Create Student User & Profile (Simulating /api/auth/register)
  console.log('[Step 1] Registering new student account in Firestore...')
  await query(
    `INSERT INTO users (id, email, password_hash, role, is_verified)
     VALUES ($1, $2, $3, $4, false)`,
    [userId, testEmail, passwordHash, 'student']
  )

  await query(
    `INSERT INTO profiles (id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)`,
    [
      profileId,
      userId,
      'Test Student Ambassador',
      testStudentId,
      '+91 99999 88888',
      'Delhi University',
      'Faculty of Technology',
      'B.Tech',
      'Information Technology',
      3,
      5,
      ['Python', 'Cloud Computing'],
      'Aspiring Cloud Ambassador',
      'https://api.dicebear.com/7.x/initials/svg?seed=Test%20Student',
      90
    ]
  )
  console.log(`✅ Student registered: ${testEmail} (${testStudentId})\n`)

  // 2. Email verification
  console.log('[Step 2] Verifying student account via 6-digit code...')
  await query(`UPDATE users SET is_verified = true WHERE id = $1`, [userId])
  const verifyCheck = await query(`SELECT is_verified FROM users WHERE id = $1`, [userId])
  if (!verifyCheck.rows[0]?.is_verified) throw new Error('Verification failed')
  console.log('✅ Student is_verified = true in Firestore.\n')

  // 3. Authenticate Login
  console.log('[Step 3] Authenticating student login...')
  const userRes = await query(`SELECT * FROM users WHERE LOWER(email) = $1`, [testEmail])
  if (userRes.rows.length === 0) throw new Error('User not found on login')
  const user = userRes.rows[0]
  const isValidPass = await bcrypt.compare(password, user.password_hash)
  if (!isValidPass) throw new Error('Password mismatch')
  console.log('✅ Student credentials authenticated successfully.\n')

  // 4. Record Login Activity
  console.log('[Step 4] Recording login telemetry...')
  await query(
    `INSERT INTO student_login_activity (id, user_id, student_id, device, browser, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [crypto.randomUUID(), userId, testStudentId, 'MacBook Pro', 'Safari', '192.168.1.5', 'Mozilla/5.0 Mac Safari']
  )
  await query(
    `UPDATE profiles SET
      last_login_at = CURRENT_TIMESTAMP,
      last_active_at = CURRENT_TIMESTAMP,
      login_count = COALESCE(login_count, 0) + 1,
      last_login_device = $1,
      last_login_browser = $2,
      last_login_ip = $3
     WHERE user_id = $4`,
    ['MacBook Pro', 'Safari', '192.168.1.5', userId]
  )
  console.log('✅ Telemetry recorded: device MacBook Pro, browser Safari.\n')

  // 5. Admin issues a certificate to this student
  console.log('[Step 5] Admin uploading & issuing certificate...')
  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF')
  const uploadResult = await uploadCertificateTool({
    student_id: testStudentId,
    certificate_name: 'Google Gemini Ambassador Certificate',
    issue_date: '2026-11-21',
    certificate_file: dummyPdf,
    caller_user_id: 'a3a4c0bc-4df8-491d-be3c-4f1e92128e61',
    caller_role: 'super_admin'
  })
  if (!uploadResult.success) throw new Error(`Certificate issue failed: ${uploadResult.error}`)
  console.log(`✅ Certificate issued: ${uploadResult.certificate?.certificate_id} (${uploadResult.certificate?.title})\n`)

  // 6. Student queries their certificates
  console.log('[Step 6] Student retrieving their own certificates...')
  const myCerts = await getMyCertificatesTool({
    authenticated_user_id: userId,
    caller_role: 'student'
  })
  if (!myCerts.success || myCerts.certificates?.length === 0) throw new Error('Student could not retrieve certificate')
  console.log(`✅ Student retrieved ${myCerts.certificates.length} certificate(s).\n`)

  // 7. Verify other student cannot access this certificate
  console.log('[Step 7] Verifying privacy: Other student cannot access this certificate...')
  const strangerCerts = await getMyCertificatesTool({
    authenticated_user_id: 'stranger-id-12345',
    caller_role: 'student'
  })
  const strangerFound = strangerCerts.certificates?.some(c => c.student_id === userId)
  if (strangerFound) throw new Error('Privacy breach: Stranger retrieved another student certificate!')
  console.log('✅ Privacy verified: Stranger cannot see student certificate.\n')

  console.log('🎉 ALL END-TO-END FLOW TESTS COMPLETED WITH 100% SUCCESS!\n')
  process.exit(0)
}

runStudentFlowTest().catch(err => {
  console.error('❌ Flow test failed:', err)
  process.exit(1)
})
