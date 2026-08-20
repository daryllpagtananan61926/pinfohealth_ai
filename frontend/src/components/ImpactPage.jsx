import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';
import { fetchImpactSummary } from '../lib/api.js';

const METRIC_DEFINITIONS = [
  { key: 'session_started', label: 'Conversations started', icon: '💬', note: 'Anonymous sessions begun' },
  { key: 'message_sent', label: 'Exchanges with the AI', icon: '🤝', note: 'Completed peer replies' },
  { key: 'ui_breathing_complete', label: 'Breathing exercises finished', icon: '🌬️', note: 'Guided box breathing, completed to the end' },
  { key: 'ui_habit_done', label: 'Micro-steps marked done', icon: '✅', note: 'A concrete action actually completed' },
  { key: 'ui_grounding_done', label: 'Grounding sessions finished', icon: '🧘', note: '5-4-3-2-1 sensory grounding completed' },
  { key: 'feedback_yes', label: 'Sessions that helped', icon: '🙂', note: '"Did this help you reset today?" — Yes' },
  { key: 'ui_mood_select', label: 'Mood check-ins logged', icon: '💭', note: 'Quick emotional check-ins' },
  { key: 'ui_poll_vote', label: 'Quick choices answered', icon: '🗳️', note: 'Preference polls' },
];

function ImpactPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImpactSummary()
      .then(setSummary)
      .catch((err) => setError(err.message || 'Could not load impact data.'));
  }, []);

  const metrics = METRIC_DEFINITIONS
    .map((m) => ({ ...m, value: summary?.[m.key] ?? 0 }))
    .filter((m) => m.value > 0);

  const total = Object.values(summary || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="impact">
      <div className="impact-top">
        <ThemeToggle />
      </div>
      <div className="impact-inner">
        <Logo size={60} className="impact-badge" />
        <h1 className="impact-title">Our impact so far</h1>
        <p className="impact-pitch">
          Every number below is an anonymous event — no names, no messages, no tracking.
          Just proof that a $5 seed can multiply into real moments of calm.
        </p>

        {error && <div className="error-bar impact-error">{error}</div>}

        {summary && metrics.length > 0 ? (
          <>
            <div className="impact-total-card">
              <span className="impact-total-label">Total anonymous moments</span>
              <span className="impact-total-value">{total.toLocaleString()}</span>
            </div>
            <div className="impact-grid">
              {metrics.map((m, i) => (
                <div key={m.key} className="impact-card">
                  <span className="impact-icon">{m.icon}</span>
                  <span className="impact-value">{m.value.toLocaleString()}</span>
                  <span className="impact-label">{m.label}</span>
                  <span className="impact-note">{m.note}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          !error && (
            <p className="impact-empty">
              {summary === null ? 'Loading…' : 'No activity yet — be the first to start a conversation.'}
            </p>
          )
        )}

        <a className="impact-back" href="/">
          ← Back to PinfoHealth
        </a>
        <p className="impact-footer">
          Anonymous by design. Conversations are never stored — these counters are all we keep.
        </p>
      </div>
    </div>
  );
}

export default ImpactPage;