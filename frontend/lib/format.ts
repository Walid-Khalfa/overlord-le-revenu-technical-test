/**
 * Formatting helpers for community dates and counters (real Strapi data
 * since Phase 4). Relative dates are computed against the render-time clock.
 */

const MINUTE = 60_000;

/** French relative time (“à l'instant”, “il y a 3 h”, “hier”…). */
export function ago(iso: string, now: Date | string = new Date()): string {
  const at = typeof now === 'string' ? new Date(now) : now;
  const min = Math.max(0, (at.getTime() - new Date(iso).getTime()) / MINUTE);
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
