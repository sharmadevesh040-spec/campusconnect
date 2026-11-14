import { query } from '../server/db/index'
import bcrypt from 'bcryptjs'
import { generateToken } from '../server/middleware/auth'

async function testLogin() {
  const email = 'khushi.kanu123@gmail.com'
  const pass = 'PAPA@123'
  const res = await query(
    'SELECT u.id, u.email, u.password_hash, u.role, u.is_verified, p.full_name, p.student_id FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE LOWER(u.email) = LOWER($1)',
    [email]
  )
  const user = res.rows[0]
  const match = await bcrypt.compare(pass, user.password_hash)
  console.log('User:', user.email, '| Name:', user.full_name, '| Verified:', user.is_verified, '| Match:', match)
  const token = generateToken({ id: user.id, email: user.email, role: user.role, studentId: user.student_id })
  console.log('Token generated successfully:', !!token)
  process.exit(0)
}
testLogin()
