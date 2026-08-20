CREATE TABLE IF NOT EXISTS impact_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'session_started','message_sent','feedback_yes','feedback_no',
      'ui_breathing_complete','ui_habit_done','ui_mood_select',
      'ui_poll_vote','ui_grounding_done'
    )
  ),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
