/**
 * Formatting helpers for mock data.
 *
 * Everything here is deterministic (no `Date.now()`): the mock layer uses a
 * frozen clock so server and client render identical strings — no hydration
 * warnings. Phase 4 will replace this with real dates from Strapi.
 */

/** Frozen reference time of the fictional dataset. */
export const MOCK_NOW = new Date('2026-10-23T15:00:00.000Z');

const MINUTE = 60_000;

/** French relative time (“à l'instant”, “il y a 3 h”, “hier”…). */
export function ago(iso: string, now: Date = MOCK_NOW): string {
  const min = Math.max(0, (now.getTime() - new Date(iso).getTime()) / MINUTE);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${Math.round(min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'hier' : `il y a ${d} j`;
}

/** Absolute publication date, timezone-independent (UTC formatting). */
export function fullDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

/** Grouped number for stats (1 210). */
export function fmtNum(n: number): string {
  return n.toLocaleString('fr-FR');
}

/** “3 réponses” / “1 réponse” / “Aucune réponse”. */
export function replyCountLabel(n: number): string {
  if (n === 0) return 'Aucune réponse';
  return `${n} réponse${n > 1 ? 's' : ''}`;
}
