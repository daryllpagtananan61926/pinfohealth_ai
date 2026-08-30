import { pool } from '../../db.js';

function hourBucket() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())).toISOString();
}

export async function logEvent(eventType) {
  await pool.query('INSERT INTO impact_events (event_type) VALUES ($1)', [eventType]);
}

export async function logUIEvent(eventType, metadata) {
  const safeMetadata = metadata ? { ...metadata } : {};
  delete safeMetadata.sessionId;
  safeMetadata.hour_bucket = hourBucket();
  await pool.query(
    'INSERT INTO impact_events (event_type, metadata) VALUES ($1, $2)',
    [eventType, JSON.stringify(safeMetadata)]
  );
}

export async function getImpactSummary() {
  const { rows } = await pool.query(
    'SELECT event_type, COUNT(*)::int AS count FROM impact_events GROUP BY event_type'
  );
  return rows.reduce((acc, row) => ({ ...acc, [row.event_type]: row.count }), {});
}
