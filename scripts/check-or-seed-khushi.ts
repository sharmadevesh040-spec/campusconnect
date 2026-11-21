import { query } from '../server/db/index'
import bcrypt from 'bcryptjs'

async function checkOrSeedKhushi() {
  const email = 'khushi.kanu123@gmail.com'
  const password = 'PAPA@123'
  
  const res = await query(
    `SELECT u.id, u.email, u.password_hash, u.role, u.is_verified, p.full_name, p.student_id 
     FROM users u 
     LEFT JOIN profiles p ON u.id = p.user_id 
     WHERE LOWER(u.email) = LOWER($1)`,
    [email]
  )
  
  console.log('Existing rows:', res.rows.length)
  if (res.rows.length > 0) {
    console.log('User found:', res.rows[0])
    // Update password to ensure PAPA@123 works
    const newHash = await bcrypt.hash(password, 10)
    await query('UPDATE users SET password_hash = $1, is_verified = true WHERE id = $2', [newHash, res.rows[0].id])
    await query('UPDATE profiles SET full_name = $1 WHERE user_id = $2', ['Khushi Kanu', res.rows[0].id])
    console.log('Password updated, verified, and profile name set to Khushi Kanu.')
  } else {
    console.log('User not found. Registering Khushi...')
    const newHash = await bcrypt.hash(password, 10)
    const userId = 'user-khushi-' + Date.now()
    const profileId = 'prof-khushi-' + Date.now()
    const studentId = 'GU2026' + Math.floor(1000 + Math.random() * 9000)
    
    await query(
      `INSERT INTO users (id, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'student', true)`,
      [userId, email.toLowerCase(), newHash]
    )
    
    await query(
      `INSERT INTO profiles (id, user_id, full_name, student_id, phone, university, college, course, branch, year, semester, skills, bio, avatar_url, completion_pct, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)`,
      [
        profileId,
        userId,
        'Khushi Kanu',
        studentId,
        '+91 9876543210',
        'Galgotias University',
        'School of Computing Science and Engineering',
        'B.Tech',
        'Computer Science',
        2,
        4,
        ['Python', 'Web Development', 'Community Leadership'],
        'Student Ambassador & Tech Enthusiast',
        `https://api.dicebear.com/7.x/initials/svg?seed=Khushi%20Kanu`,
        90
      ]
    )
    console.log('Successfully registered Khushi in Firebase Firestore:', { userId, studentId, email })
  }
  process.exit(0)
}

checkOrSeedKhushi().catch(err => {
  console.error(err)
  process.exit(1)
})
