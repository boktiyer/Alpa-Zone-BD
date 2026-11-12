import { useId } from 'react';

/**
 * Alpa Zone BD logo, drawn as vector so it stays sharp at any size:
 * red "A" with a white hanger, a red swoosh, the name and the "BD" badge.
 * Made for dark backgrounds (header, footer, admin bar).
 */
export function Logo({ className = '' }: { className?: string }) {
  const id = useId();
  const body = `${id}-body`;
  const swoosh = `${id}-swoosh`;

  return (
    <svg
      viewBox="0 0 570 336"
      role="img"
      aria-label="Alpa Zone BD"
      className={className}
      style={{ filter: 'drop-shadow(0 0 7px rgba(255, 30, 30, 0.55))' }}
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d40a0a" />
          <stop offset="1" stopColor="#8f0000" />
        </linearGradient>
        <linearGradient id={swoosh} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#b00000" />
          <stop offset="0.6" stopColor="#f01414" />
          <stop offset="1" stopColor="#c00000" />
        </linearGradient>
      </defs>

      {/* Letter A */}
      <path
        d="M262 14h76l122 222h-88l-72-92-72 92h-88z"
        fill={`url(#${body})`}
        stroke="#ff3b3b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Hanger */}
      <g fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M300 74c0-11 15-13 15-26a15 15 0 1 0-30 0" />
        <path d="M300 74l-70 40c-9 6-5 14 5 14h130c10 0 14-8 5-14z" />
      </g>

      {/* Swoosh */}
      <path
        d="M96 262C160 192 318 166 420 140c56-14 86-42 44-58 78 6 70 70-34 96-120 30-246 28-334 84z"
        fill={`url(#${swoosh})`}
      />
      <path
        d="M104 254C170 194 322 170 424 144c40-10 66-28 58-46"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.92"
      />

      {/* Name + BD badge */}
      <text
        x="8"
        y="318"
        textLength="388"
        lengthAdjust="spacingAndGlyphs"
        fontSize="70"
        fontWeight="700"
        fill="#ff2a2a"
        style={{ fontFamily: 'var(--font-hind), Arial, sans-serif' }}
      >
        Alpa Zone
      </text>
      <rect x="414" y="258" width="148" height="70" rx="13" fill="#d40a0a" />
      <text
        x="488"
        y="313"
        textAnchor="middle"
        fontSize="58"
        fontWeight="700"
        fill="#fff"
        style={{ fontFamily: 'var(--font-hind), Arial, sans-serif' }}
      >
        BD
      </text>
    </svg>
  );
}
