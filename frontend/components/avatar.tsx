import type { CSSProperties } from 'react';
import type { Author } from '@/lib/types';

/** First letters of the display name, uppercase (mockup `initials()`). */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Gradient monogram avatar — same rendering as the mockup
 * (colour carried by `--c`, initials in white).
 * Decorative by default: the author's name is always rendered next to it.
 */
export function Avatar({
  author,
  size = 'sm',
  decorative = true,
}: {
  author: Author;
  size?: 'xs' | 'sm' | 'md';
  decorative?: boolean;
}) {
  const text = size === 'xs' ? initialsOf(author.displayName).slice(0, 1) : initialsOf(author.displayName);
  return (
    <span
      className={`av av-${size}`}
      style={{ '--c': author.color } as CSSProperties}
      title={author.displayName}
      aria-hidden={decorative || undefined}
    >
      {text}
    </span>
  );
}
