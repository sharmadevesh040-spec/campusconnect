const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:1234@localhost:5432/campusconnect'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database campusconnect.');

  const eventData = {
    id: 'evt-game-on-night-2026',
    title: "Month's Brief — Game On Night : Imagine The Impossible",
    description: 'Official Monthly Ambassador Briefing & Community Gathering. Theme: Game On Night : Imagine The Impossible. Join the interactive session to discuss upcoming campus initiatives, interactive workshops, and Google Gemini challenges.',
    date: '2026-11-20',
    time: '8:00 PM',
    venue: 'Google Meet (Virtual)',
    meeting_link: 'https://meet.google.com/uur-rgbb-fgi',
    max_participants: 500,
    banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
    organizer: 'Campus Ambassador Lead',
    registration_deadline: '2026-11-20 19:30:00+05:30',
    status: 'Open'
  };

  await client.query(`
    INSERT INTO events (id, title, description, date, time, venue, meeting_link, max_participants, banner_url, organizer, registration_deadline, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      date = EXCLUDED.date,
      time = EXCLUDED.time,
      venue = EXCLUDED.venue,
      meeting_link = EXCLUDED.meeting_link,
      max_participants = EXCLUDED.max_participants,
      banner_url = EXCLUDED.banner_url,
      organizer = EXCLUDED.organizer,
      registration_deadline = EXCLUDED.registration_deadline,
      status = EXCLUDED.status;
  `, [
    eventData.id,
    eventData.title,
    eventData.description,
    eventData.date,
    eventData.time,
    eventData.venue,
    eventData.meeting_link,
    eventData.max_participants,
    eventData.banner_url,
    eventData.organizer,
    eventData.registration_deadline,
    eventData.status
  ]);

  const res = await client.query('SELECT * FROM events WHERE id = $1', [eventData.id]);
  console.log('EVENT INSERTED IN DATABASE campusconnect:', res.rows[0]);

  await client.end();
}

main().catch(err => {
  console.error('Failed to insert event:', err);
  process.exit(1);
});
