import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import Logo from './Logo.jsx';

function TakeawayCard({ microHabit, onClose }) {
  const cardRef = useRef(null);
  const [toast, setToast] = useState(null);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim();
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: bgColor || '#fffcf6',
      scale: 2,
      logging: false,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = `pinfohealth-takeaway-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const copyText = async () => {
    const text = `My micro-step for today:\n\n"${microHabit}"\n\n— PinfoHealth AI`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Copied to clipboard');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="takeaway-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="takeaway-title">
      <div className="takeaway-modal" ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <button className="takeaway-close" onClick={onClose} aria-label="Close takeaway card">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <Logo size={32} className="takeaway-logo" />
        <h3 id="takeaway-title" className="takeaway-heading">My micro-step for today</h3>
        <p className="takeaway-quote">"{microHabit}"</p>
        <div className="takeaway-actions">
          <button className="takeaway-btn takeaway-btn-primary" onClick={downloadImage}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Image
          </button>
          <button className="takeaway-btn takeaway-btn-secondary" onClick={copyText}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Text
          </button>
        </div>
        <p className="takeaway-footer">Generated from your PinfoHealth session</p>
      </div>
      {toast && <div className="takeaway-toast">{toast}</div>}
    </div>
  );
}

export default TakeawayCard;