function Logo({ size = 40, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="36" height="36" rx="13" fill="var(--accent)" />
      <g stroke="var(--accent-ink)" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M20 29.5 C20 25.5 20 21.5 20 17.5" />
      </g>
      <path
        d="M20 18.2 C16.4 16.6 13.2 17.2 11.4 13.6 C15 13.4 18.4 15.2 20 18.2 Z"
        fill="var(--accent-ink)"
      />
      <path
        d="M20 14.6 C23.6 13 26.8 13.6 28.6 10 C25 9.8 21.6 11.6 20 14.6 Z"
        fill="var(--accent-ink)"
      />
    </svg>
  );
}

export default Logo;