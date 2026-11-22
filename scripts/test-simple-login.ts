import { query, seedDatabase } from '../server/db'
import { firestoreStore } from '../server/db/firestore'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

async function runTests() {
  console.log('--- Starting Simple Direct Login Test Suite ---')

  // 1. Ensure seed data is populated
  await seedDatabase()

  // 2. Test Member Search in Firestore members collection
  const khushi = firestoreStore.collections.members.find(m => m.email === 'khushi.kanu123@gmail.com')
  if (!khushi) {
    throw new Error('FAILED: Khushi not found in members collection')
  }
  console.log('✓ Found initial member:', khushi.name, khushi.email, 'status:', khushi.status)

  // 3. Test Password Comparison
  if (khushi.password !== 'Ambassador@123') {
    throw new Error(`FAILED: Khushi password mismatch. Expected Ambassador@123, got: ${khushi.password}`)
  }
  console.log('✓ Initial member password matches Ambassador@123 exactly')

  // 4. Test Query Universal Adapter for members
  const memberRes = await query(`SELECT * FROM members WHERE LOWER(email) = LOWER($1)`, ['khushi.kanu123@gmail.com'])
  if (memberRes.rows.length === 0) {
    throw new Error('FAILED: Query adapter failed to return member from members collection')
  }
  console.log('✓ Universal query adapter successfully retrieved member from members collection')

  // 5. Test Admin Member
  const admin = firestoreStore.collections.members.find(m => m.email === 'sharmadevesh040@gmail.com')
  if (!admin) {
    throw new Error('FAILED: Admin not found in members collection')
  }
  console.log('✓ Found admin member:', admin.name, admin.email, 'role:', admin.role)

  // 6. Test Member Creation
  const newMemberEmail = `member.${Date.now()}@university.edu`
  const insertRes = await query(`INSERT INTO members (id, name, email, password, role, status) VALUES ($1, $2, $3, $4, $5, $6)`, [
    `mem-test-${Date.now()}`,
    'Test Member',
    newMemberEmail,
    'Ambassador@123',
    'member',
    'active'
  ])
  if (insertRes.rows.length === 0) {
    throw new Error('FAILED: Could not insert new member into members collection')
  }
  console.log('✓ Successfully inserted new member into members collection:', newMemberEmail)

  // 7. Verify New Member can be queried
  const queryNew = await query(`SELECT * FROM members WHERE LOWER(email) = LOWER($1)`, [newMemberEmail])
  if (queryNew.rows.length === 0) {
    throw new Error('FAILED: Query adapter could not retrieve newly inserted member')
  }
  console.log('✓ Successfully queried newly inserted member')

  // 8. Test Member Disabling
  await query(`UPDATE members SET status = 'disabled' WHERE id = $1`, [queryNew.rows[0].id])
  const queryDisabled = await query(`SELECT * FROM members WHERE LOWER(email) = LOWER($1)`, [newMemberEmail])
  if (queryDisabled.rows[0].status !== 'disabled') {
    throw new Error('FAILED: Member status was not updated to disabled')
  }
  console.log('✓ Successfully updated member status to disabled')

  console.log('--- ALL SIMPLE LOGIN TESTS PASSED SUCCESSFULLY ---')
  process.exit(0)
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err)
  process.exit(1)
})
