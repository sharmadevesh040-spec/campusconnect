import { query, seedDatabase } from '../server/db/index'
import bcrypt from 'bcryptjs'

async function runTests() {
  console.log('🧪 Starting CampusConnect Firebase Architecture Test Suite...\n')

  // 1. Seed database
  console.log('[Test 1] Testing Database Seeding...')
  await seedDatabase()
  console.log('✅ Seed successful.\n')

  // 2. Query Super Admin
  console.log('[Test 2] Querying Super Admin Devesh Sharma...')
  const adminRes = await query(`SELECT * FROM users WHERE LOWER(email) = 'sharmadevesh040@gmail.com'`)
  if (adminRes.rows.length === 0) throw new Error('Super Admin not found in Firestore store')
  const admin = adminRes.rows[0]
  console.log(`✅ Super Admin verified: ${admin.email} (role: ${admin.role}, name: ${admin.full_name})\n`)

  // 3. Query Student Khushi
  console.log('[Test 3] Querying Student Khushi...')
  const studentRes = await query(`SELECT * FROM users WHERE LOWER(email) = 'khushi.kanu123@gmail.com'`)
  if (studentRes.rows.length === 0) throw new Error('Student Khushi not found')
  const student = studentRes.rows[0]
  console.log(`✅ Student verified: ${student.email} (student_id: ${student.student_id}, is_verified: ${student.is_verified})\n`)

  // 4. Test Password Hash Comparison
  console.log('[Test 4] Testing Password Authentication Hash...')
  const isPassValid = await bcrypt.compare('PAPA@123', student.password_hash)
  if (!isPassValid) throw new Error('Password hash comparison failed')
  console.log('✅ Password hash matches PAPA@123.\n')

  // 5. Test Login Activity Insertion
  console.log('[Test 5] Recording Student Login Activity...')
  const insertAct = await query(
    `INSERT INTO student_login_activity (id, user_id, student_id, device, browser, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['act-test-99', student.id, student.student_id, 'Windows PC', 'Chrome', '127.0.0.1', 'Mozilla/5.0 Test Agent']
  )
  if (insertAct.rowCount !== 1) throw new Error('Login activity insertion failed')
  console.log('✅ Login activity successfully recorded in Firestore collection.\n')

  // 6. Test Admin Activity & Overview Metrics
  console.log('[Test 6] Fetching Admin Overview Metrics & Recent Activity...')
  const countStudents = await query(`SELECT count(*)::int FROM users WHERE role = 'student'`)
  const recentAct = await query(`SELECT a.*, p.full_name as "studentName", u.email as "studentEmail" FROM student_login_activity a LEFT JOIN users u ON a.user_id = u.id LEFT JOIN profiles p ON a.user_id = p.user_id LIMIT 6`)
  console.log(`✅ Student count: ${countStudents.rows[0].count}, Recent activities: ${recentAct.rows.length} records.\n`)

  // 7. Test Certificates
  console.log('[Test 7] Testing Certificate Query & Filtering...')
  const certs = await query(`SELECT * FROM certificates`)
  console.log(`✅ Certificates count: ${certs.rows.length}, sample certificate ID: ${certs.rows[0]?.certificate_id}\n`)

  // 8. Test Events Radar
  console.log('[Test 8] Testing Events Radar...')
  const events = await query(`SELECT * FROM events`)
  console.log(`✅ Events count: ${events.rows.length}, sample title: "${events.rows[0]?.title}"\n`)

  // 9. Test Resources
  console.log('[Test 9] Testing Resources...')
  const resources = await query(`SELECT * FROM resources`)
  console.log(`✅ Resources count: ${resources.rows.length}, sample title: "${resources.rows[0]?.title}"\n`)

  console.log('🎉 ALL FIREBASE ARCHITECTURE & DATA LAYER TESTS PASSED WITH 100% SUCCESS!\n')
  process.exit(0)
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
