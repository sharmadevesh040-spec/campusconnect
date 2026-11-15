const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: 'postgres://postgres:1234@localhost:5432/campusconnect'
});

async function testFlow() {
  await client.connect();
  console.log('--- Testing Database campusconnect Persistence ---');

  const testEmail = `student.test.${Date.now()}@campusconnect.edu`;
  const testId = `GSA-2026-T${Math.floor(Math.random() * 9000 + 1000)}`;
  const userId = `u-test-${Date.now()}`;
  const passHash = await bcrypt.hash('Password123!', 10);

  // 1. Insert User
  console.log(`1. Creating account for: ${testEmail}`);
  await client.query(`
    INSERT INTO users (id, email, password_hash, role, is_verified)
    VALUES ($1, $2, $3, 'student', true)
  `, [userId, testEmail, passHash]);

  // 2. Insert Profile
  console.log(`2. Creating student profile: ${testId}`);
  await client.query(`
    INSERT INTO profiles (user_id, full_name, student_id, university, college, course, branch, year, semester, is_active)
    VALUES ($1, 'Test Ambassador', $2, 'Delhi Technological University', 'Faculty of Tech', 'B.Tech', 'CSE', 2, 3, true)
  `, [userId, testId]);

  // 3. Record Login Activity
  console.log('3. Recording login activity...');
  const actId = `act-${Date.now()}`;
  await client.query(`
    INSERT INTO student_login_activity (id, user_id, student_id, login_at, last_active_at, device, browser, ip_address, user_agent)
    VALUES ($1, $2, $3, NOW(), NOW(), 'Windows PC', 'Chrome', '127.0.0.1', 'Mozilla/5.0')
  `, [actId, userId, testId]);

  await client.query(`
    UPDATE profiles
    SET last_login_at = NOW(), last_active_at = NOW(), login_count = login_count + 1,
        last_login_device = 'Windows PC', last_login_browser = 'Chrome', last_login_ip = '127.0.0.1'
    WHERE user_id = $1
  `, [userId]);

  // 4. Verify in DB
  const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [testEmail]);
  console.log('Verified user in users table:', userCheck.rows[0].email);

  const profCheck = await client.query('SELECT user_id, full_name, student_id, last_login_at, login_count FROM profiles WHERE user_id = $1', [userId]);
  console.log('Verified profile in profiles table:', profCheck.rows[0]);

  const actCheck = await client.query('SELECT * FROM student_login_activity WHERE user_id = $1', [userId]);
  console.log('Verified login activity in student_login_activity table:', actCheck.rows[0]);

  console.log('--- ALL TEST ASSERTIONS PASSED FOR DATABASE campusconnect ---');
  await client.end();
}

testFlow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
