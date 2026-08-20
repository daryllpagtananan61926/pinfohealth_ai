import { pool } from '../../db.js';

export async function logEvent(eventType) {
  await pool.query('INSERT INTO impact_events (event_type) VALUES ($1)', [eventType]);
}

export async function logUIEvent(eventType, metadata) {
  await pool.query(
    'INSERT INTO impact_events (event_type, metadata) VALUES ($1, $2)',
    [eventType, JSON.stringify(metadata)]
  );
}
