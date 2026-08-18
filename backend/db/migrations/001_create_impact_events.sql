CREATE TABLE IF NOT EXISTS impact_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('session_started','message_sent','feedback_yes','feedback_no')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
