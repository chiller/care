import { slotStart, type SlotKey } from "./schedule";
import { positions } from "./store";
import type { Application } from "./types";

export const positionTitle = (id: string) => positions.find((p) => p.id === id)?.title ?? id;

export function isUnderqualified(a: Application) {
  const position = positions.find((p) => p.id === a.positionId);
  return Boolean(position?.requiresLevel3 && a.qualification !== "level3");
}

export function isSameDay(a: number, b: number) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// A fixed timestamp rather than a running clock: "14:32" today, "3 Oct, 14:32" otherwise.
export function formatTime(ms: number) {
  const date = new Date(ms);
  const time = formatClock(ms);
  if (isSameDay(ms, Date.now())) return time;
  return `${date.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
}

export function formatClock(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// "Today", "Yesterday", "Tomorrow", or "Fri 3 Oct".
export function formatDay(ms: number) {
  const DAY = 24 * 60 * 60 * 1000;
  if (isSameDay(ms, Date.now())) return "Today";
  if (isSameDay(ms, Date.now() - DAY)) return "Yesterday";
  if (isSameDay(ms, Date.now() + DAY)) return "Tomorrow";
  return new Date(ms).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

// "Today 13:00", "Tomorrow 13:30", "Wed 8 Oct 14:00"
export function formatSlot(slot: SlotKey) {
  const start = slotStart(slot);
  return `${formatDay(start)} ${formatClock(start)}`;
}
