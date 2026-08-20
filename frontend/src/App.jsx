import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ChatWindow from './components/ChatWindow.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Logo from './components/Logo.jsx';
import NotFound from './components/NotFound.jsx';
import { reportSessionStarted } from './lib/api.js';

function Landing({ onStart }) {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
      ),
      title: 'Socratic, not prescriptive',
      desc: 'We ask one focused question at a time — no advice dumps, no labels, just clarity that emerges from your own words.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      title: 'One micro-step, under 2 minutes',
      desc: 'When the picture is clear, you get exactly one concrete action you can do right now — phrased in your language.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Anonymous & ephemeral',
      desc: 'No accounts, no message history stored. Your chat lives only in this browser session and disappears when you close it.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Safety-first by default',
      desc: 'Crisis language is intercepted before the AI sees it — you get immediate helpline numbers, no delays.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      title: 'Always free, no upsells',
      desc: 'Core experience is completely free. No paywalls, no premium tiers locking the conversation. Built for impact, not revenue.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v2"/><path d="M12 21v2"/>
          <path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/>
          <path d="M1 12h2"/><path d="M21 12h2"/>
          <path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/>
        </svg>
      ),
      title: 'Works on any device',
      desc: 'Fully responsive — phone, tablet, desktop. Dark mode respects system preference. No app install needed.'
    }
  ];

  const steps = [
    { num: '01', title: 'Start a session', desc: 'Tap "Start a conversation" — a fresh, anonymous session begins instantly.' },
    { num: '02', title: 'Share what\'s on your mind', desc: 'Type naturally. No forms, no categories — just tell it like you would a friend.' },
    { num: '03', title: 'Get a question back', desc: 'PinfoHealth replies with one specific question to narrow down what you need.' },
    { num: '04', title: 'Clarity emerges', desc: 'After 2–4 exchanges, the picture sharpens. You know what\'s actually going on.' },
    { num: '05', title: 'One tiny action', desc: 'You receive a single, concrete step you can take in under 2 minutes — in your words.' },
    { num: '06', title: 'Close or continue', desc: 'End whenever you want. No history saved. Come back anytime for a fresh start.' }
  ];

  const audiences = [
    { label: 'Students', desc: 'Exam pressure, burnout, balancing work & study' },
    { label: 'Professionals', desc: 'Deadline anxiety, impostor feelings, career uncertainty' },
    { label: 'Parents', desc: 'Overwhelm, sleep deprivation, identity shifts' },
    { label: 'Anyone', desc: 'Having a rough week and need a grounded ear' }
  ];

  const safetyItems = [
    { title: 'Crisis interception', desc: 'Keywords triggering self-harm or immediate danger are caught before the AI sees them — you get helpline numbers instantly.' },
    { title: 'No message storage', desc: 'Conversations exist only in your browser session. Nothing is logged to databases, files, or analytics.' },
    { title: 'No tracking', desc: 'No cookies, no fingerprinting, no third-party scripts. Just an anonymous session counter for impact measurement.' },
    { title: 'Rate limited', desc: 'Server-enforced limits prevent abuse and keep the service sustainable for everyone.' }
  ];

  const faqs = [
    { q: 'Is this therapy?', a: 'No. PinfoHealth is a wellness companion, not a licensed therapist. It uses Socratic questioning to help you clarify your own thoughts and find one small next step.' },
    { q: 'Is my data private?', a: 'Yes. No accounts, no message persistence, no tracking. The only data stored is an anonymous event counter (session started, message sent, feedback given) — no content, no identifiers.' },
    { q: 'What if I\'m in crisis?', a: 'If you type something indicating immediate danger or self-harm, PinfoHealth intercepts it before the AI responds and shows you crisis helpline numbers (NCMH: 1553 / 1800-1888-1553 / 0917-899-8727).' },
    { q: 'How long is a session?', a: 'As long or short as you need. Most conversations resolve in 5–10 exchanges. Close the tab anytime — the session ends.' },
    { q: 'Is it really free?', a: 'Yes. No subscriptions, no hidden costs. Built for real positive impact.' }
  ];

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
          minute — university students, working adults, parents, and everyone in between.
          No medical advice, no diagnosis — just thoughtful questions to help you figure out
          what you actually need right now, and one small step you can take in the next
          two minutes.
        </p>
        <button className="landing-start" onClick={onStart}>
          Start a conversation
        </button>

        {/* Conversation preview - moved up after CTA */}
        <div className="preview-card" aria-hidden="true">
          <p className="preview-heading">A conversation with PinfoHealth</p>
          <div className="preview-bubbles">
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
          </div>
          <p className="preview-note">No advice on the first reply. No labels. Just clarity.</p>
        </div>

        {/* How it helps */}
        <section className="landing-section" aria-labelledby="features-heading">
          <h2 id="features-heading" className="landing-section-title">How it helps</h2>
          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works - step by step */}
        <section className="landing-section" aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="landing-section-title">How it works</h2>
          <div className="steps-timeline">
            {steps.map((step, i) => (
              <div key={i} className="step-card">
                <span className="step-number">{step.num}</span>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
                {i < steps.length - 1 && <span className="step-connector" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="landing-section" aria-labelledby="audiences-heading">
          <h2 id="audiences-heading" className="landing-section-title">Made for real life</h2>
          <div className="audiences-grid">
            {audiences.map((audience, i) => (
              <div key={i} className="audience-card">
                <span className="audience-label">{audience.label}</span>
                <p className="audience-desc">{audience.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety & Privacy */}
        <section className="landing-section" aria-labelledby="safety-heading">
          <h2 id="safety-heading" className="landing-section-title">Safety & privacy first</h2>
          <div className="safety-grid">
            {safetyItems.map((item, i) => (
              <div key={i} className="safety-card">
                <h3 className="safety-title">{item.title}</h3>
                <p className="safety-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="landing-section" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="landing-section-title">Common questions</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">{faq.q}</summary>
                <p className="faq-answer">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="landing-disclaimer">
          I am an AI wellness companion, not a doctor. In a medical emergency, please seek
          professional help.
        </p>
      </div>
    </div>
  );
}

function LandingPage({ navigate }) {
  const handleStart = () => {
    const id = crypto.randomUUID();
    navigate(`/chat`, { replace: true });
    reportSessionStarted(id).catch((err) => {
      console.error('Failed to record session start:', err);
    });
  };

  return <Landing onStart={handleStart} />;
}

function ChatPage() {
  return <ChatWindow />;
}

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage navigate={navigate} />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;