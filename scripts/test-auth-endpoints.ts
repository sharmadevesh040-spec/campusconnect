import express from 'express'
import http from 'http'
import authRoutes from '../server/routes/auth'
import { seedDatabase } from '../server/db'

async function runEndpointTests() {
  console.log('--- Testing Auth HTTP API Endpoints ---')
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
    // 1. Valid Member Login
    const r1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khushi.kanu123@gmail.com', password: 'Ambassador@123' })
    })
    const b1 = await r1.json() as any
    if (r1.status !== 200 || !b1.token || b1.redirectTo !== '/student/dashboard') {
      throw new Error(`FAILED Test 1: Expected 200 and /student/dashboard, got ${r1.status}: ${JSON.stringify(b1)}`)
    }
    console.log('✓ Valid Member Login: Status 200, Token issued, Redirect to /student/dashboard')
    const studentToken = b1.token

    // 2. Invalid Password
    const r2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khushi.kanu123@gmail.com', password: 'WrongPassword!@#' })
    })
    const b2 = await r2.json() as any
    if (r2.status !== 401 || b2.error !== 'Invalid email or password.') {
      throw new Error(`FAILED Test 2: Expected 401 and 'Invalid email or password.', got ${r2.status}: ${JSON.stringify(b2)}`)
    }
    console.log('✓ Invalid Password: Status 401, Exact error message "Invalid email or password."')

    // 3. Nonexistent User
    const r3 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'Ambassador@123' })
    })
    const b3 = await r3.json() as any
    if (r3.status !== 401 || b3.error !== 'Invalid email or password.') {
      throw new Error(`FAILED Test 3: Expected 401 and 'Invalid email or password.', got ${r3.status}: ${JSON.stringify(b3)}`)
    }
    console.log('✓ Nonexistent User: Status 401, Exact error message "Invalid email or password."')

    // 4. Valid Admin Login
    const r4 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sharmadevesh040@gmail.com', password: 'Ambassador@123' })
    })
    const b4 = await r4.json() as any
    if (r4.status !== 200 || !b4.token || b4.redirectTo !== '/admin/dashboard') {
      throw new Error(`FAILED Test 4: Expected 200 and /admin/dashboard, got ${r4.status}: ${JSON.stringify(b4)}`)
    }
    console.log('✓ Valid Admin Login: Status 200, Token issued, Redirect to /admin/dashboard')

    // 5. GET /api/auth/me with Bearer Token
    const r5 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    })
    const b5 = await r5.json() as any
    if (r5.status !== 200 || b5.user.email !== 'khushi.kanu123@gmail.com') {
      throw new Error(`FAILED Test 5: Expected 200 and session user, got ${r5.status}: ${JSON.stringify(b5)}`)
    }
    console.log('✓ Session Verification (/me): Status 200, Returned valid student session')

    // 6. POST /api/auth/logout
    const r6 = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' })
    const b6 = await r6.json() as any
    if (r6.status !== 200 || !b6.success) {
      throw new Error(`FAILED Test 6: Expected 200 from logout, got ${r6.status}`)
    }
    console.log('✓ Logout endpoint: Status 200, Success confirmation')

    console.log('--- ALL AUTH HTTP ENDPOINTS PASSED SUCCESSFULLY ---')
    process.exit(0)
  } catch (err) {
    console.error('Endpoint Test Suite Failed:', err)
    process.exit(1)
  }
}

runEndpointTests().catch(err => {
  console.error('Fatal Test Suite Error:', err)
  process.exit(1)
})
