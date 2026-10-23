import Link from 'next/link';
import { Icon, type IconName } from './icons';
import type { SortKey } from '@/lib/types';

const TABS: { key: SortKey; icon: IconName; label: string }[] = [
  { key: 'hot', icon: 'trend', label: 'Tendances' },
  { key: 'recent', icon: 'clock', label: 'Récentes' },
  { key: 'unanswered', icon: 'help', label: 'Sans réponse' },
];

function hrefFor(sort: SortKey, category?: string): string {
  const params = new URLSearchParams();
  if (category) params.set('espace', category);
  if (sort !== 'hot') params.set('tri', sort);
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

/**
 * Sorting controls (mockup tabs): Tendances / Récentes / Sans réponse, with
 * the unanswered counter badge. Rendered as links (`aria-current`) so sorting
 * is a plain, accessible URL navigation backed by the data layer.
 */
export function SortTabs({
  sort,
  unansweredCount,
  category,
}: {
  sort: SortKey;
  unansweredCount: number;
  category?: string;
}) {
  return (
    <nav className="tabs" aria-label="Trier les discussions">
      {TABS.map((t) => {
        const on = t.key === sort;
        return (
          <Link
            key={t.key}
            className={`tab${on ? ' on' : ''}`}
            href={hrefFor(t.key, category)}
            aria-current={on ? 'true' : undefined}
          >
            <Icon name={t.icon} />
            {t.label}
            {t.key === 'unanswered' && unansweredCount > 0 ? (
              <span className="cnt num">{unansweredCount}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
