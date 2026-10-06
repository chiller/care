import { isSameDay } from "./format";
import type { Application } from "./types";

// Arrivals closer together than this are one burst: an advert going live reads as
// one event, not forty.
export const BURST_GAP_MS = 10 * 60 * 1000;

export type Burst = {
  id: string;
  start: number;
  end: number;
  applications: Application[]; // newest first
  unseen: boolean; // arrived after the viewer last marked the feed as seen
};

// Groups arrivals into bursts, newest burst first. A burst never spans the
// last-seen time or midnight, so "since you last looked" and day headings fall
// between entries rather than inside one.
export function buildBursts(applications: Application[], lastSeen: number): Burst[] {
  const sorted = [...applications].sort((a, b) => a.submittedAt - b.submittedAt);
  const bursts: Burst[] = [];
  let current: Application[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const start = current[0].submittedAt;
    bursts.push({
      id: current[0].id,
      start,
      end: current[current.length - 1].submittedAt,
      applications: [...current].reverse(),
      unseen: start > lastSeen,
    });
    current = [];
  };

  for (const a of sorted) {
    const prev = current[current.length - 1];
    if (
      prev &&
      (a.submittedAt - prev.submittedAt > BURST_GAP_MS ||
        prev.submittedAt > lastSeen !== a.submittedAt > lastSeen ||
        !isSameDay(prev.submittedAt, a.submittedAt))
    ) {
      flush();
    }
    current.push(a);
  }
  flush();

  return bursts.reverse();
}

// "5 Early Years Practitioner, 3 Nursery Assistant", largest first.
export function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
