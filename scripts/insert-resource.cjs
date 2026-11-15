const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:1234@localhost:5432/campusconnect'
});

async function main() {
  await client.connect();
  await client.query(`
    INSERT INTO resources (id, title, description, category, type, url, created_at)
    VALUES (
      'res-interview-questions',
      'Interview questions',
      'Campus Ambassador discovery questions for syllabus, notes, and Google Gemini Study Notebooks.',
      'Interview Preparation',
      'Document',
      '#interview-questions',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      type = EXCLUDED.type,
      url = EXCLUDED.url;
  `);

  const res = await client.query('SELECT * FROM resources');
  console.log('RESOURCES IN campusconnect:', res.rows);
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
