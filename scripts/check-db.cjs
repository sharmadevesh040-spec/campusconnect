const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:1234@localhost:5432/campusconnect'
});

async function main() {
  await client.connect();
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Tables in campusconnect:', tablesRes.rows.map(r => r.table_name));

  for (const table of ['users', 'profiles', 'student_login_activity', 'certificates']) {
    try {
      const countRes = await client.query(`SELECT count(*)::int as count FROM ${table}`);
      console.log(`Count in ${table}:`, countRes.rows[0].count);
    } catch (err) {
      console.log(`Table ${table} error:`, err.message);
    }
  }

  const usersRes = await client.query('SELECT id, email, role, is_verified, created_at FROM users');
  console.log('Users in DB:', usersRes.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
