import { SideNav } from './side-nav';
import type { Category } from '@/lib/types';

/**
 * Two-column community layout (sidebar + main), the mockup's `no-right`
 * variant: the mockup's right-hand widgets (progression, sondages, agenda…)
 * all belong to features outside the assessment scope, so the supported
 * two-column layout of the mockup is used on every page.
 */
export function Shell({
  categories,
  activeCategory,
  children,
}: {
  categories: Category[];
  activeCategory?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wrap">
      <div className="layout">
        <SideNav categories={categories} activeCategory={activeCategory} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
