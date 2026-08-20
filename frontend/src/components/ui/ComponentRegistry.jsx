import { useState, useEffect, useRef } from 'react';

export const ALLOWED_UI_COMPONENTS = new Set([
  'breathing-exercise',
  'micro-habit-card',
  'mood-button',
  'quick-poll',
  'grounding-54321',
]);

function BreathingExercise({ cycles = 4, inhale = 4, hold = 4, exhale = 6, onComplete }) {
  const [phase, setPhase] = useState('inhale');
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const phaseDurations = { inhale, hold, exhale };
  const phaseLabels = { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' };
  const phaseColors = { inhale: 'var(--accent)', hold: 'var(--warm)', exhale: 'var(--text-secondary)' };

  const reset = () => {
    clearInterval(timerRef.current);
    setPhase('inhale');
    setCurrentCycle(1);
    setIsRunning(false);
    setProgress(0);
  };

  const nextPhase = () => {
    if (phase === 'inhale') setPhase('hold');
    else if (phase === 'hold') setPhase('exhale');
    else {
      if (currentCycle >= cycles) {
        clearInterval(timerRef.current);
        setIsRunning(false);
        onComplete?.();
        return;
      }
      setCurrentCycle(c => c + 1);
      setPhase('inhale');
    }
    setProgress(0);
  };

  const tick = () => {
    const duration = phaseDurations[phase] * 1000;
    setProgress(p => {
      const next = p + 100 / (duration / 50);
      if (next >= 100) {
        nextPhase();
        return 0;
      }
      return next;
    });
  };

  const toggle = () => {
    if (isRunning) {
      clearInterval(timerRef.current);
      setIsRunning(false);
    } else {
      setIsRunning(true);
      timerRef.current = setInterval(tick, 50);
    }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div className="ui-component breathing-exercise">
      <div className="ui-header">
        <span className="ui-title">Box Breathing</span>
        <span className="ui-cycle">Cycle {currentCycle} of {cycles}</span>
      </div>
      <div className="breathing-circle-wrap">
        <svg className="breathing-svg" viewBox="0 0 120 120">
          <circle
            className="breathing-track"
            cx="60" cy="60" r="50"
            stroke="var(--border)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            className="breathing-progress"
            cx="60" cy="60" r="50"
            stroke="var(--accent)"
            strokeWidth="8"
            fill="none"
            strokeDasharray="314"
            strokeDashoffset={314 * (1 - progress / 100)}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 8px var(--accent))` }}
          />
        </svg>
        <div className="breathing-label" style={{ color: phaseColors[phase] }}>
          {phaseLabels[phase]}
        </div>
        <div className="breathing-count">{phaseDurations[phase] - Math.floor((progress / 100) * phaseDurations[phase])}</div>
      </div>
      <button
        className={`ui-btn ui-btn-primary ${isRunning ? 'running' : ''}`}
        onClick={toggle}
        disabled={currentCycle > cycles}
      >
        {isRunning ? 'Pause' : currentCycle > cycles ? 'Complete' : 'Start'}
      </button>
      <button className="ui-btn ui-btn-secondary" onClick={reset} disabled={!isRunning && currentCycle === 1}>
        Reset
      </button>
      <p className="ui-hint">Inhale {inhale}s → Hold {hold}s → Exhale {exhale}s × {cycles}</p>
    </div>
  );
}

function MicroHabitCard({ title, description = '', duration = '', onComplete }) {
  const [done, setDone] = useState(false);

  const handleDone = () => {
    setDone(true);
    onComplete?.();
  };

  return (
    <div className={`ui-component micro-habit-card ${done ? 'done' : ''}`}>
      <div className="ui-header">
        <span className="ui-title">Your Micro-Step</span>
        {duration && <span className="ui-duration">{duration}</span>}
      </div>
      <h3 className="habit-title">{title}</h3>
      {description && <p className="habit-desc">{description}</p>}
      <button
        className={`ui-btn ui-btn-primary ${done ? 'done' : ''}`}
        onClick={handleDone}
        disabled={done}
      >
        {done ? '✓ Done' : 'Mark Done'}
      </button>
      {done && <p className="habit-complete">Nice. One small step counts.</p>}
    </div>
  );
}

function MoodButton({ options = ['😊', '😐', '😔', '😤', '😰'], onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (mood) => {
    setSelected(mood);
    onSelect?.(mood);
  };

  return (
    <div className="ui-component mood-button">
      <div className="ui-header">
        <span className="ui-title">How are you feeling?</span>
      </div>
      <div className="mood-options" role="group" aria-label="Mood selection">
        {options.map((mood, i) => (
          <button
            key={i}
            className={`mood-btn ${selected === mood ? 'selected' : ''}`}
            onClick={() => handleSelect(mood)}
            aria-pressed={selected === mood}
          >
            {mood}
          </button>
        ))}
      </div>
      {selected && <p className="mood-confirmed">Logged: {selected}</p>}
    </div>
  );
}

function QuickPoll({ question, options = ['Yes', 'No'], onVote }) {
  const [voted, setVoted] = useState(null);

  const handleVote = (option) => {
    setVoted(option);
    onVote?.(option);
  };

  return (
    <div className="ui-component quick-poll">
      <div className="ui-header">
        <span className="ui-title">Quick question</span>
      </div>
      <p className="poll-question">{question}</p>
      <div className="poll-options" role="group" aria-label="Poll options">
        {options.map((option, i) => (
          <button
            key={i}
            className={`ui-btn ${voted === option ? 'ui-btn-primary' : 'ui-btn-secondary'} ${voted ? 'voted' : ''}`}
            onClick={() => handleVote(option)}
            disabled={!!voted}
          >
            {option}
          </button>
        ))}
      </div>
      {voted && <p className="poll-confirmed">You voted: {voted}</p>}
    </div>
  );
}

function Grounding54321({ autoStart = true, onComplete }) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const steps = [
    { sense: 'sight', count: 5, label: 'Name 5 things you can see' },
    { sense: 'touch', count: 4, label: 'Name 4 things you can feel' },
    { sense: 'hearing', count: 3, label: 'Name 3 things you can hear' },
    { sense: 'smell', count: 2, label: 'Name 2 things you can smell' },
    { sense: 'taste', count: 1, label: 'Name 1 thing you can taste' },
  ];

  useEffect(() => {
    if (autoStart && !completed) setStep(0);
  }, [autoStart, completed]);

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else {
      setCompleted(true);
      onComplete?.();
    }
  };

  const reset = () => {
    setStep(0);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="ui-component grounding-54321 complete">
        <div className="ui-header">
          <span className="ui-title">Grounding Complete</span>
        </div>
        <p className="grounding-done">You're back in the present. Good work.</p>
        <button className="ui-btn ui-btn-secondary" onClick={reset}>Again</button>
      </div>
    );
  }

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="ui-component grounding-54321">
      <div className="ui-header">
        <span className="ui-title">5-4-3-2-1 Grounding</span>
        <span className="ui-step">Step {step + 1} of {steps.length}</span>
      </div>
      <div className="grounding-progress-bar">
        <div className="grounding-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="grounding-sense">{current.sense.toUpperCase()}</div>
      <p className="grounding-instruction">{current.label}</p>
      <div className="grounding-count">
        {Array.from({ length: current.count }, (_, i) => i + 1).map(n => (
          <span key={n} className="grounding-number">{n}</span>
        ))}
      </div>
      <button className="ui-btn ui-btn-primary" onClick={next}>
        {step < steps.length - 1 ? 'Next' : 'Finish'}
      </button>
    </div>
  );
}

export const UI_COMPONENTS = {
  'breathing-exercise': BreathingExercise,
  'micro-habit-card': MicroHabitCard,
  'mood-button': MoodButton,
  'quick-poll': QuickPoll,
  'grounding-54321': Grounding54321,
};

export function renderUIComponent(componentName, props, onAction) {
  const Component = UI_COMPONENTS[componentName];
  if (!Component) return null;
  return <Component {...props} onComplete={onAction} onSelect={onAction} onVote={onAction} />;
}