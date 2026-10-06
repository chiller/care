import { useSyncExternalStore } from "react";
import {
  availableOnDay,
  bookings,
  freeSlots,
  isBookable,
  MAX_CALLS_PER_DAY,
  slotStart,
  withDefaultSlots,
  type SlotKey,
} from "./schedule";
import { transitions, type Application, type ApplicationStatus, type Position } from "./types";

// No backend: localStorage is the "database" and a BroadcastChannel is the
// "push" channel. Every tab on the same origin shares both, so a submission in
// the portal tab shows up in the manager tab without a refresh. In production
// the channel would be a WebSocket / web push from the server.

const STORAGE_KEY = "famly-recruitment:applications";
const AVAILABILITY_KEY = "famly-recruitment:availability";
const channel = new BroadcastChannel("famly-recruitment");

export type StoreEvent =
  | { type: "application.created"; application: Application }
  | { type: "application.updated"; application: Application }
  | { type: "applications.reset" }
  | { type: "availability.updated" };

export const nursery = {
  id: "sunflower-hackney",
  name: "Sunflower Nursery",
  area: "Hackney, London",
};

export const positions: Position[] = [
  {
    id: "toddler-practitioner",
    nurseryId: nursery.id,
    title: "Early Years Practitioner",
    room: "Toddler room (2–3 yrs)",
    hours: "Full time, 40h/week",
    requiresLevel3: true,
    postedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "baby-room-assistant",
    nurseryId: nursery.id,
    title: "Nursery Assistant",
    room: "Baby room (0–2 yrs)",
    hours: "Part time, 25h/week",
    requiresLevel3: false,
    postedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
];

let cache: Application[] = read();
let availabilityCache: SlotKey[] = readAvailability();
const listeners = new Set<() => void>();
const eventListeners = new Set<(event: StoreEvent) => void>();

function read(): Application[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Application[]) : [];
  } catch {
    return [];
  }
}

// The hiring manager's available call slots. Shared data like applications, not a
// per-viewer preference. Seeded with nap-time slots on first run so the demo
// has something to book.
function readAvailability(): SlotKey[] {
  try {
    const raw = localStorage.getItem(AVAILABILITY_KEY);
    if (raw) return JSON.parse(raw) as SlotKey[];
  } catch {
    // Fall through to the seed.
  }
  const seeded = withDefaultSlots([]);
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(seeded));
  return seeded;
}

function writeAvailability(availability: SlotKey[]) {
  availabilityCache = availability;
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(availability));
  listeners.forEach((l) => l());
  channel.postMessage({ type: "availability.updated" } satisfies StoreEvent);
}

function write(applications: Application[]) {
  cache = applications;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  listeners.forEach((l) => l());
}

channel.onmessage = (message: MessageEvent<StoreEvent>) => {
  cache = read();
  availabilityCache = readAvailability();
  listeners.forEach((l) => l());
  eventListeners.forEach((l) => l(message.data));
};

export function submitApplication(
  input: Omit<Application, "id" | "submittedAt" | "status" | "readAt" | "firstReplyAt">,
): Application {
  const application: Application = {
    ...input,
    id: crypto.randomUUID(),
    submittedAt: Date.now(),
    status: "new",
  };
  write([application, ...read()]);
  channel.postMessage({ type: "application.created", application } satisfies StoreEvent);
  return application;
}

function update(id: string, change: (a: Application) => Application) {
  let updated: Application | undefined;
  write(
    read().map((a) => {
      if (a.id !== id) return a;
      updated = change(a);
      return updated;
    }),
  );
  if (updated) {
    channel.postMessage({ type: "application.updated", application: updated } satisfies StoreEvent);
  }
}

export function markRead(id: string) {
  update(id, (a) => (a.readAt ? a : { ...a, readAt: Date.now() }));
}

function moveTo(a: Application, to: ApplicationStatus, change: Partial<Application> = {}) {
  if (!transitions[a.status].includes(to)) return a;
  const now = Date.now();
  return {
    ...a,
    ...change,
    status: to,
    readAt: a.readAt ?? now,
    firstReplyAt: a.firstReplyAt ?? now,
  };
}

// "replied" is only reachable through scheduleCall: a call needs a slot.
export function transition(id: string, to: Exclude<ApplicationStatus, "replied">) {
  update(id, (a) => moveTo(a, to));
}

export function scheduleCall(id: string, slot: SlotKey) {
  // Check against storage, not the cache: another tab may have just taken it.
  if (!isBookable(slot, readAvailability(), read())) return;
  update(id, (a) => moveTo(a, "replied", { callSlot: slot }));
}

export type AutoBookResult = { booked: number; stillWaiting: number };

// Demo: book every application awaiting a reply into the earliest free slots,
// first come first served (oldest application gets the earliest slot). Stops
// when the slots run out; whoever is left keeps waiting.
export function autoBookCalls(): AutoBookResult {
  const applications = read();
  const slots = freeSlots(readAvailability(), applications);
  const queue = applications
    .filter((a) => a.status === "new")
    .sort((a, b) => a.submittedAt - b.submittedAt);

  const assigned = new Map<string, SlotKey>();
  queue.slice(0, slots.length).forEach((a, i) => assigned.set(a.id, slots[i]));
  if (assigned.size === 0) return { booked: 0, stillWaiting: queue.length };

  const updated = applications.map((a) => {
    const slot = assigned.get(a.id);
    return slot ? moveTo(a, "replied", { callSlot: slot }) : a;
  });
  write(updated);
  for (const a of updated) {
    if (assigned.has(a.id)) {
      channel.postMessage({ type: "application.updated", application: a } satisfies StoreEvent);
    }
  }
  return { booked: assigned.size, stillWaiting: queue.length - assigned.size };
}

// Turn a slot on or off in the manager's schedule. Refused if it would exceed
// the daily cap, or would remove a slot that already has a call booked in it.
export function setSlotAvailable(slot: SlotKey, available: boolean) {
  const current = readAvailability();
  if (available === current.includes(slot)) return;
  if (available) {
    const day = new Date(slotStart(slot));
    if (availableOnDay(current, day).length >= MAX_CALLS_PER_DAY) return;
    writeAvailability([...current, slot]);
  } else {
    if (bookings(read()).has(slot)) return;
    writeAvailability(current.filter((s) => s !== slot));
  }
}

export function fillEmptyDaysWithDefaults() {
  writeAvailability(withDefaultSlots(readAvailability()));
}

export function resetApplications() {
  write([]);
  channel.postMessage({ type: "applications.reset" } satisfies StoreEvent);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useApplications(): Application[] {
  return useSyncExternalStore(subscribe, () => cache);
}

export function useAvailability(): SlotKey[] {
  return useSyncExternalStore(subscribe, () => availabilityCache);
}

// Events from *other* tabs only — BroadcastChannel doesn't echo to the sender.
export function onRemoteEvent(listener: (event: StoreEvent) => void) {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}
