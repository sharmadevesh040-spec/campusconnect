import express from 'express'
import http from 'http'
import authRoutes from '../server/routes/auth'
import { seedDatabase } from '../server/db'
import { firestoreStore } from '../server/db/firestore'

async function runEndpointTests() {
  console.log('--- Testing Any-Email Direct Login with Ambassador@123 ---')
  await seedDatabase()

  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)

  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 3000
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    // 1. Existing Pre-created Member (Khushi)
    const r1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khushi.kanu123@gmail.com', password: 'Ambassador@123' })
    })
    const b1 = await r1.json() as any
    if (r1.status !== 200 || !b1.token || b1.redirectTo !== '/student/dashboard') {
      throw new Error(`FAILED Test 1: Expected 200 and /student/dashboard, got ${r1.status}: ${JSON.stringify(b1)}`)
    }
    console.log('✓ Pre-created Member Login (Khushi): 200 OK, token issued, redirected to /student/dashboard')

    // 2. ANY Brand-New Email without creating account (e.g. rohit.sharma@gmail.com)
    const newRandomEmail = `student.${Date.now()}@university.edu`
    const r2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newRandomEmail, password: 'Ambassador@123' })
    })
    const b2 = await r2.json() as any
    if (r2.status !== 200 || !b2.token || b2.redirectTo !== '/student/dashboard') {
      throw new Error(`FAILED Test 2: Expected 200 and /student/dashboard for brand-new email, got ${r2.status}: ${JSON.stringify(b2)}`)
    }
    console.log('✓ Brand-new Email Login without creating account:', newRandomEmail, '-> 200 OK')

    // Verify user was automatically registered in members and students
    const autoMember = firestoreStore.collections.members.find(m => m.email.toLowerCase() === newRandomEmail.toLowerCase())
    if (!autoMember) {
      throw new Error(`FAILED Test 2: Auto-created member was not found in members collection`)
    }
    console.log('✓ Auto-provisioned in members collection:', autoMember.name, autoMember.email, 'status:', autoMember.status)

    const autoStudent = firestoreStore.collections.students.find(s => s.user_id === autoMember.id)
    if (!autoStudent) {
      throw new Error(`FAILED Test 2: Auto-created student profile was not found in students collection`)
    }
    console.log('✓ Auto-provisioned student profile:', autoStudent.full_name, autoStudent.student_id)

    // 3. Subsequent login with the same newly created email
    const r3 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newRandomEmail, password: 'Ambassador@123' })
    })
    const b3 = await r3.json() as any
    if (r3.status !== 200 || b3.user.id !== autoMember.id) {
      throw new Error(`FAILED Test 3: Subsequent login did not reuse existing profile`)
    }
    console.log('✓ Subsequent login with auto-created email recognized existing profile seamlessly')

    // 4. Invalid Password Rejection (Any email with wrong password)
    const r4 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'random.unregistered@test.com', password: 'IncorrectPassword!@#' })
    })
    const b4 = await r4.json() as any
    if (r4.status !== 401 || b4.error !== 'Invalid email or password.') {
      throw new Error(`FAILED Test 4: Expected 401 and 'Invalid email or password.', got ${r4.status}: ${JSON.stringify(b4)}`)
    }
    console.log('✓ Invalid Password Rejection: Status 401, Exact error message "Invalid email or password."')

    // 5. Admin Login (sharmadevesh040@gmail.com with Ambassador@123)
    const r5 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sharmadevesh040@gmail.com', password: 'Ambassador@123' })
    })
    const b5 = await r5.json() as any
    if (r5.status !== 200 || b5.redirectTo !== '/admin/dashboard') {
      throw new Error(`FAILED Test 5: Admin login failed or wrong redirect: ${JSON.stringify(b5)}`)
    }
    console.log('✓ Admin Login (Devesh Sharma): Status 200, Redirect to /admin/dashboard')

    // 6. Session Verification (/api/auth/me) with token of auto-created member
    const r6 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${b2.token}` }
    })
    const b6 = await r6.json() as any
    if (r6.status !== 200 || b6.user.email !== newRandomEmail) {
      throw new Error(`FAILED Test 6: Session verification failed: ${JSON.stringify(b6)}`)
    }
    console.log('✓ Session Verification (/me): Status 200, Valid session maintained across requests')

    console.log('--- ALL ANY-EMAIL LOGIN TESTS PASSED SUCCESSFULLY ---')
    process.exit(0)
  } catch (err) {
    console.error('Test Suite Failed:', err)
    process.exit(1)
  }
}

runEndpointTests().catch(err => {
  console.error('Fatal Test Suite Error:', err)
  process.exit(1)
})
