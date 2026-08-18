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
    return <div className="feedback-ack">Thanks for letting me know.</div>;
  }

  return (
    <div className="feedback">
      <span className="feedback-question">Did this help you reset today?</span>
      <div className="feedback-buttons">
        <button className="feedback-button feedback-button-yes" onClick={() => handleChoice(true)}>
          Yes
        </button>
        <button className="feedback-button feedback-button-no" onClick={() => handleChoice(false)}>
          No
        </button>
      </div>
    </div>
  );
}

export default FeedbackPrompt;