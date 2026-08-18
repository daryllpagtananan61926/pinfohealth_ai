import { useState } from 'react';
import ChatWindow from './components/ChatWindow.jsx';

function Landing({ onStart }) {
  return (
    <div style={styles.landing}>
      <h1 style={styles.title}>PinfoHealth AI</h1>
      <p style={styles.pitch}>
        A Socratic AI wellness companion for university students. No medical advice,
        no diagnosis — just thoughtful questions to help you figure out what you
        actually need right now, and one small step you can take in the next two minutes.
      </p>
      <p style={styles.disclaimer}>
        I am an AI wellness companion, not a doctor. In a medical emergency, please
        seek professional help.
      </p>
      <button style={styles.startButton} onClick={onStart}>
        Start
      </button>
    </div>
  );
}

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const handleStart = () => {
    const id = crypto.randomUUID();
    setSessionId(id);
    setShowChat(true);
  };

  if (!showChat) {
    return <Landing onStart={handleStart} />;
  }

  return <ChatWindow sessionId={sessionId} />;
}

const styles = {
  landing: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    textAlign: 'center',
    fontFamily: 'system-ui, sans-serif',
    background: '#fafafa',
  },
  title: {
    margin: '0 0 16px',
    fontSize: '2rem',
    color: '#1a1a1a',
  },
  pitch: {
    maxWidth: '560px',
    margin: '0 0 24px',
    fontSize: '1.1rem',
    lineHeight: 1.6,
    color: '#333',
  },
  disclaimer: {
    maxWidth: '560px',
    margin: '0 0 32px',
    fontSize: '0.9rem',
    color: '#666',
    fontStyle: 'italic',
  },
  startButton: {
    padding: '12px 32px',
    fontSize: '1rem',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default App;