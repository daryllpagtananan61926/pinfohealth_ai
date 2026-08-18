import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-top">
        <ThemeToggle />
      </div>
      <div className="not-found-inner">
        <Logo size={68} className="not-found-badge" />
        <h1 className="not-found-code">404</h1>
        <p className="not-found-message">This path doesn&apos;t exist.</p>
        <Link to="/" className="not-found-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to PinfoHealth</span>
        </Link>
      </div>
    </div>
  );
}

export default NotFound;