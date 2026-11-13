'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fades its content up into place the first time it scrolls into view.
 *
 * Safe by design: the content is rendered visible. Only after the page has
 * loaded, and only if the block is still below the screen, is it hidden and
 * then revealed on scroll — so nothing stays invisible if scripts fail.
 * Add className="stagger" (or put a .stagger grid inside) to bring children
 * in one after another.
 */
export function Reveal({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'ul';
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle');

  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Already on screen when the page opened: leave it alone.
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setState('hidden');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState('shown');
        observer.disconnect(); // once only
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const motion = state === 'hidden' ? 'reveal-hidden' : state === 'shown' ? 'reveal-shown' : '';
  const Component = Tag as 'div';
  return (
    <Component ref={ref as React.RefObject<HTMLDivElement>} className={`${className} ${motion}`}>
      {children}
    </Component>
  );
}
