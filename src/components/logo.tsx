import { useId } from 'react';

/**
 * Alpa Zone BD logo, drawn as vector so it stays sharp at any size:
 * maroon "A" with a white hanger, a swoosh, the name and the "BD" badge.
 *
 * tone="light" — light backgrounds (store header): deep maroon A and name,
 *                maroon swoosh with a champagne-gold highlight.
 * tone="dark"  — the deep burgundy footer / admin bar (default): a brighter
 *                maroon A edged in gold, a gold swoosh, ivory name, gold BD badge,
 *                so the logo stays readable on the dark background.
 */
export function Logo({
  className = '',
  tone = 'dark',
}: {
  className?: string;
  tone?: 'dark' | 'light';
}) {
  const light = tone === 'light';
  const id = useId();
  const body = `${id}-body`;
  const swoosh = `${id}-swoosh`;

  const c = light
    ? {
        bodyTop: '#8e1b3f',
        bodyBottom: '#35101c',
        bodyEdge: '#6d0f2b',
        swooshStops: ['#4a0d20', '#8e1b3f', '#6d0f2b'],
        highlight: '#d3b17b',
        name: '#6d0f2b',
        badge: '#6d0f2b',
        badgeText: '#ffffff',
      }
    : {
        bodyTop: '#a3264c',
        bodyBottom: '#6d0f2b',
        bodyEdge: '#d3b17b',
        swooshStops: ['#b8925a', '#e6cc98', '#c9a66b'],
        highlight: '#f8f5f0',
        name: '#f8f5f0',
        badge: '#d3b17b',
        badgeText: '#35101c',
      };

  return (
    <svg viewBox="0 0 570 336" role="img" aria-label="Alpa Zone BD" className={className}>
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.bodyTop} />
          <stop offset="1" stopColor={c.bodyBottom} />
        </linearGradient>
        <linearGradient id={swoosh} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={c.swooshStops[0]} />
          <stop offset="0.6" stopColor={c.swooshStops[1]} />
          <stop offset="1" stopColor={c.swooshStops[2]} />
        </linearGradient>
      </defs>

      {/* Letter A */}
      <path
        d="M262 14h76l122 222h-88l-72-92-72 92h-88z"
        fill={`url(#${body})`}
        stroke={c.bodyEdge}
        strokeWidth={light ? 1.5 : 3}
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
        stroke={c.highlight}
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
        fill={c.name}
        style={{ fontFamily: 'var(--font-hind), Arial, sans-serif' }}
      >
        Alpa Zone
      </text>
      <rect x="414" y="258" width="148" height="70" rx="13" fill={c.badge} />
      <text
        x="488"
        y="313"
        textAnchor="middle"
        fontSize="58"
        fontWeight="700"
        fill={c.badgeText}
        style={{ fontFamily: 'var(--font-hind), Arial, sans-serif' }}
      >
        BD
      </text>
    </svg>
  );
}
