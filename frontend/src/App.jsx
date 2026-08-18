import { useState } from 'react';
import ChatWindow from './components/ChatWindow.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Logo from './components/Logo.jsx';
import { reportSessionStarted } from './lib/api.js';

function Landing({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-top">
        <ThemeToggle />
      </div>
      <div className="landing-inner">
        <Logo size={68} className="landing-badge" />
        <h1 className="landing-title">One calm question at a time.</h1>
        <p className="landing-pitch">
          PinfoHealth is a Socratic AI companion for anyone who could use a calmer
          minute — university students, working adults, and everyone in between. No
          medical advice, no diagnosis — just thoughtful questions to help you figure out
          what you actually need right now, and one small step you can take in the next
          two minutes.
        </p>
        <button className="landing-start" onClick={onStart}>
          Start a conversation
        </button>
        <div className="preview-card" aria-hidden="true">
          <p className="preview-heading">A conversation with PinfoHealth</p>
          <div className="bubble preview-bubble preview-user">
            I&apos;ve been wiped out after classes lately.
          </div>
          <div className="bubble preview-bubble preview-assistant">
            That sounds heavy. Is it more physical exhaustion, the mental pressure, or
            something specific that happened?
          </div>
          <div className="bubble preview-bubble preview-assistant">
            If it&apos;s mostly the pressure — here&apos;s one small step: pause for 60
            seconds and write down the one deadline that&apos;s actually due first.
          </div>
          <p className="preview-note">No advice on the first reply. No labels. Just clarity.</p>
        </div>
        <p className="landing-disclaimer">
          I am an AI wellness companion, not a doctor. In a medical emergency, please seek
          professional help.
        </p>
      </div>
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
    reportSessionStarted(id).catch((err) => {
      console.error('Failed to record session start:', err);
    });
  };

  if (!showChat) {
    return <Landing onStart={handleStart} />;
  }

  return <ChatWindow sessionId={sessionId} />;
}

export default App;