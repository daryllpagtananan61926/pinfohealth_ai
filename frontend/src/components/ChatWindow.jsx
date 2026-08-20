import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble.jsx';
import FeedbackPrompt from './FeedbackPrompt.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';
import TakeawayCard from './TakeawayCard.jsx';
import { renderUIComponent } from './ui/ComponentRegistry.jsx';
import { sendChatMessage, logUIEvent } from '../lib/api.js';

const MAX_HISTORY_MESSAGES = 6;

function ChatWindow() {
  const sessionIdRef = useRef(crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTakeaway, setShowTakeaway] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const wakingTimerRef = useRef(null);
  const gotFirstTokenRef = useRef(false);
  const currentAssistantIndexRef = useRef(-1);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLastAssistantMessage = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].content.trim()) {
        return messages[i].content.trim();
      }
    }
    return null;
  };

  const isCrisisSession = () => {
    return messages.some(m => m.role === 'assistant' && m.content.includes('NCMH Crisis Hotline'));
  };

  const handleFeedbackComplete = () => {
    if (isCrisisSession()) return;
    const habit = getLastAssistantMessage();
    if (habit) setShowTakeaway(true);
  };

  const handleUIAction = (componentName, action, payload) => {
    const eventMap = {
      'breathing-exercise': 'ui_breathing_complete',
      'micro-habit-card': 'ui_habit_done',
      'mood-button': 'ui_mood_select',
      'quick-poll': 'ui_poll_vote',
      'grounding-54321': 'ui_grounding_done',
    };
    const eventType = eventMap[componentName];
    if (eventType) {
      logUIEvent(sessionIdRef.current, eventType, { component: componentName, action, payload });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage].slice(-MAX_HISTORY_MESSAGES);
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    setIsWakingUp(false);
    gotFirstTokenRef.current = false;
    clearTimeout(wakingTimerRef.current);
    wakingTimerRef.current = setTimeout(() => {
      if (!gotFirstTokenRef.current) {
        setIsWakingUp(true);
      }
    }, 5000);

    let assistantText = '';
    let assistantUI = [];
    let assistantMessageIndex = -1;

    try {
      const result = await sendChatMessage(
        sessionIdRef.current,
        newMessages,
        (delta) => {
          if (!gotFirstTokenRef.current) {
            gotFirstTokenRef.current = true;
            clearTimeout(wakingTimerRef.current);
            setIsWakingUp(false);
          }
          assistantText += delta;
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + delta, ui: assistantUI }];
            }
            assistantMessageIndex = prev.length;
            return [...prev, { role: 'assistant', content: delta, ui: assistantUI }];
          });
        },
        (component, props) => {
          assistantUI.push({ component, props });
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              return [...prev.slice(0, -1), { ...lastMsg, ui: assistantUI }];
            }
            return [...prev, { role: 'assistant', content: '', ui: assistantUI }];
          });
        }
      );
      if (result === 'normal' && assistantText.trim()) {
        setShowFeedback(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      clearTimeout(wakingTimerRef.current);
      setIsWakingUp(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat-header">
        <div className="chat-brand">
          <Logo size={34} />
          <h2 className="chat-title">PinfoHealth AI</h2>
        </div>
        <ThemeToggle />
      </div>
      <div className="chat-messages-wrap">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              ui={msg.ui}
              renderUIComponent={renderUIComponent}
              onUIAction={handleUIAction}
            />
          ))}
          {isLoading &&
            (isWakingUp ? (
              <div className="waking" role="status">
                Waking up the AI, this can take up to a minute on the first message
              </div>
            ) : (
              <div className="typing" role="status" aria-label="PinfoHealth is thinking">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            ))}
          {showFeedback && <FeedbackPrompt sessionId={sessionIdRef.current} onComplete={handleFeedbackComplete} />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {error && <div className="error-bar">{error}</div>}
      <div className="chat-footer">
        <span className="chat-disclaimer">I am an AI, not a doctor.</span>
      </div>
      <div className="chat-composer-wrap">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            aria-label="Message"
          />
          <button className="chat-send" type="submit" disabled={isLoading || !input.trim()}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </form>
      </div>
      {showTakeaway && (
        <TakeawayCard
          microHabit={getLastAssistantMessage()}
          onClose={() => setShowTakeaway(false)}
        />
      )}
    </div>
  );
}

export default ChatWindow;