import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble.jsx';
import { sendChatMessage } from '../lib/api.js';

const MAX_HISTORY_MESSAGES = 6;

function ChatWindow({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage].slice(-MAX_HISTORY_MESSAGES);
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      await sendChatMessage(sessionId, newMessages, (delta) => {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + delta }];
          }
          return [...prev, { role: 'assistant', content: delta }];
        });
      });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>PinfoHealth AI</h2>
      </div>
      <div style={styles.messagesWrapper}>
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
            <div style={styles.typing}>
              <span>PinfoHealth is thinking</span>
              <span className="dots">...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.footer}>
        <span style={styles.disclaimer}>I am an AI, not a doctor.</span>
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          ref={inputRef}
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          aria-label="Message"
        />
        <button style={styles.sendButton} type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
      {/* TODO: FeedbackPrompt component will go here (depends on /api/feedback backend route) */}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '720px',
    margin: '0 auto',
    fontFamily: 'system-ui, sans-serif',
    background: 'white',
    borderLeft: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fafafa',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  messagesWrapper: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  typing: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#666',
    fontSize: '0.9rem',
    padding: '8px 0',
  },
  error: {
    padding: '12px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: '0.9rem',
    borderTop: '1px solid #fecaca',
  },
  footer: {
    padding: '8px 16px',
    borderTop: '1px solid #e5e7eb',
    background: '#fafafa',
  },
  disclaimer: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  form: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    background: 'white',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
  },
  sendButton: {
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: 500,
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default ChatWindow;