import type { Application } from "./types";

// The hiring manager's time is the scarce resource. They mark which 30-minute
// slots they can take a hiring call in, capped per day, and only within a short
// horizon: a call two weeks out is too slow to win a candidate, so slots are
// allowed to run out rather than pushing calls further away.

export const SLOT_MINUTES = 30;
export const MAX_CALLS_PER_DAY = 6;
export const BOOKING_HORIZON_DAYS = 7;
// The grid the manager picks from: 08:00 to 17:30 (last slot ends 18:00).
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 18;
// A slot must start at least this far ahead to be offered: the candidate needs
// notice, and the manager needs to see it coming.
export const MIN_NOTICE_MS = 60 * 60 * 1000;
// Babies nap around lunchtime, which is when a manager can step out of the room.
export const DEFAULT_SLOT_TIMES = ["13:00", "13:30", "14:00", "14:30"];

// A slot is identified by its local start time, e.g. "2026-10-06T13:30".
export type SlotKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function slotKey(day: Date, time: string): SlotKey {
  return `${dayKey(day)}T${time}`;
}

export function slotStart(slot: SlotKey) {
  const [date, time] = slot.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

export const slotDay = (slot: SlotKey) => slot.split("T")[0];

// "08:00", "08:30", … "17:30"
export const slotTimes: string[] = Array.from(
  { length: ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES },
  (_, i) => {
    const minutes = DAY_START_HOUR * 60 + i * SLOT_MINUTES;
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  },
);

// Weekdays from today through the end of the horizon. Nurseries run Mon–Fri.
export function bookableDays(now = Date.now()): Date[] {
  const days: Date[] = [];
  const today = new Date(now);
  for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const weekday = day.getDay();
    if (weekday !== 0 && weekday !== 6) days.push(day);
  }
  return days;
}

// Slot → the application whose call is booked in it. A call that was later
// rejected no longer holds its slot.
export function bookings(applications: Application[]) {
  const booked = new Map<SlotKey, Application>();
  for (const a of applications) {
    if (a.status === "replied" && a.callSlot) booked.set(a.callSlot, a);
  }
  return booked;
}

// Slots a call can be booked into right now, earliest first.
export function freeSlots(
  availability: SlotKey[],
  applications: Application[],
  now = Date.now(),
): SlotKey[] {
  const booked = bookings(applications);
  const days = new Set(bookableDays(now).map(dayKey));
  return availability
    .filter(
      (slot) =>
        days.has(slotDay(slot)) && slotStart(slot) >= now + MIN_NOTICE_MS && !booked.has(slot),
    )
    .sort((a, b) => slotStart(a) - slotStart(b));
}

export function isBookable(
  slot: SlotKey,
  availability: SlotKey[],
  applications: Application[],
  now = Date.now(),
) {
  return freeSlots(availability, applications, now).includes(slot);
}

export function availableOnDay(availability: SlotKey[], day: Date) {
  const key = dayKey(day);
  return availability.filter((slot) => slotDay(slot) === key);
}

// Nap-time slots for every bookable day that has none yet.
export function withDefaultSlots(availability: SlotKey[], now = Date.now()): SlotKey[] {
  const added = bookableDays(now)
    .filter((day) => availableOnDay(availability, day).length === 0)
    .flatMap((day) => DEFAULT_SLOT_TIMES.map((time) => slotKey(day, time)));
  return [...availability, ...added];
}
