const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgres://postgres:1234@localhost:5432/campusconnect'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database campusconnect.');

  const schemaSqlPath = path.join(__dirname, '..', 'server', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');

  console.log('Executing schema.sql...');
  await client.query(schemaSql);
  console.log('schema.sql executed successfully.');

  console.log('Applying column migrations to profiles and certificates...');
  await client.query(`
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_type VARCHAR(100) DEFAULT 'Ambassador';
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS storage_key VARCHAR(255);
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS file_path VARCHAR(255);
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_name VARCHAR(255);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INT NOT NULL DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_device VARCHAR(100);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_browser VARCHAR(100);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(100);
  `);
  console.log('Column migrations applied.');

  // Create student_login_activity table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_login_activity (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      student_id VARCHAR(255),
      login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      logout_at TIMESTAMP WITH TIME ZONE,
      last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      device VARCHAR(100),
      browser VARCHAR(100),
      ip_address VARCHAR(100),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_student_activity_user_id ON student_login_activity(user_id);
    CREATE INDEX IF NOT EXISTS idx_student_activity_login_at ON student_login_activity(login_at);
  `);
  console.log('student_login_activity table verified.');

  // Insert seed activity for Khushi Kanu if empty
  const countActivity = await client.query('SELECT count(*)::int as count FROM student_login_activity');
  if (countActivity.rows[0].count === 0) {
    const khushiUser = await client.query("SELECT id FROM users WHERE email = 'khushi.kanu123@gmail.com'");
    if (khushiUser.rows.length > 0) {
      const uid = khushiUser.rows[0].id;
      await client.query(`
        INSERT INTO student_login_activity (id, user_id, student_id, login_at, last_active_at, device, browser, ip_address, user_agent)
        VALUES ('act-init-01', $1, 'GSA-2026-KK670', NOW(), NOW(), 'Windows PC', 'Chrome', '127.0.0.1', 'Mozilla/5.0')
      `, [uid]);
      await client.query(`
        UPDATE profiles
        SET last_login_at = NOW(), last_active_at = NOW(), login_count = GREATEST(login_count, 1),
            last_login_device = 'Windows PC', last_login_browser = 'Chrome', last_login_ip = '127.0.0.1'
        WHERE user_id = $1
      `, [uid]);
      console.log('Seeded initial activity for Khushi Kanu.');
    }
  }

  const finalTables = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
  `);
  console.log('All public tables in campusconnect:', finalTables.rows.map(r => r.table_name));

  await client.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
