import { useState } from 'react';
import { sendFeedback } from '../lib/api.js';

function FeedbackPrompt({ sessionId }) {
  const [answered, setAnswered] = useState(false);

  const handleChoice = (helpful) => {
    setAnswered(true);
    sendFeedback(sessionId, helpful).catch((error) => {
      console.error('Failed to record feedback:', error);
    });
  };

  if (answered) {
    return <div style={styles.acknowledgment}>Thanks for letting me know.</div>;
  }

  return (
    <div style={styles.container}>
      <span style={styles.question}>Did this help you reset today?</span>
      <div style={styles.buttons}>
        <button style={styles.button} onClick={() => handleChoice(true)}>
          Yes
        </button>
        <button style={styles.button} onClick={() => handleChoice(false)}>
          No
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
    marginTop: '16px',
    padding: '14px 16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    fontFamily: 'system-ui, sans-serif',
  },
  question: {
    fontSize: '0.95rem',
    color: '#166534',
    fontWeight: 500,
  },
  buttons: {
    display: 'flex',
    gap: '8px',
  },
  button: {
    padding: '8px 24px',
    fontSize: '0.95rem',
    fontWeight: 500,
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  acknowledgment: {
    marginTop: '16px',
    padding: '14px 16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.95rem',
    color: '#166534',
  },
};

export default FeedbackPrompt;
