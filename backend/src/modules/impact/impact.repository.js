import { pool } from '../../db.js';

export async function logEvent(eventType) {
  await pool.query('INSERT INTO impact_events (event_type) VALUES ($1)', [eventType]);
}
