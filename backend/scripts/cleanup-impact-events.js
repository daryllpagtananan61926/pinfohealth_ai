#!/usr/bin/env node
// Cleanup script for impact_events retention (90 days)
// Run manually or via cron: node backend/scripts/cleanup-impact-events.js
// Or use pg_cron on Neon (paid tier) for automated cleanup

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const RETENTION_DAYS = 90;

async function cleanup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const cutoffISO = cutoff.toISOString();

    console.log(`Cleaning up impact_events older than ${cutoffISO} (${RETENTION_DAYS} days)...`);

    const result = await pool.query(
      'DELETE FROM impact_events WHERE created_at < $1',
      [cutoffISO]
    );

    console.log(`Deleted ${result.rowCount} rows.`);
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanup();