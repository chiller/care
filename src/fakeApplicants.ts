import { positions, submitApplication } from "./store";
import type { Application, Qualification } from "./types";

const firstNames = [
  "Amira", "Ben", "Chloe", "Daniel", "Ella", "Fatima", "George", "Hannah", "Isaac", "Jade",
  "Kai", "Leah", "Mohammed", "Niamh", "Olu", "Priya", "Rosie", "Sam", "Tegan", "Zara",
];

const lastNames = [
  "Ahmed", "Brown", "Clarke", "Davies", "Evans", "Green", "Hughes", "Khan", "Lewis", "Murphy",
  "Nowak", "Okafor", "Patel", "Roberts", "Singh", "Taylor", "Walker", "Wilson", "Wright", "Young",
];

const notes = [
  "",
  "",
  "",
  "Can start next week.",
  "Currently working at another nursery, looking for something closer to home.",
  "Five years in a baby room.",
  "Finishing my Level 3 this summer.",
  "Available weekdays only.",
  "Paediatric first aid certified.",
  "Returning to childcare after a career break.",
];

// Weighted to roughly match a real applicant pool: qualified staff are scarce.
const qualifications: Qualification[] = ["level3", "level3", "level2", "level2", "level2", "none"];

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

function randomPhone() {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `07${digits.slice(0, 3)} ${digits.slice(3)}`;
}

export function submitRandomApplication(): Application {
  return submitApplication({
    positionId: pick(positions).id,
    name: `${pick(firstNames)} ${pick(lastNames)}`,
    phone: randomPhone(),
    qualification: pick(qualifications),
    note: pick(notes),
  });
}

// Exponentially distributed gaps (a Poisson process), so arrivals bunch up
// and go quiet like real ones do, averaging one every `meanSeconds`.
export function nextDelayMs(meanSeconds: number) {
  const delay = -Math.log(1 - Math.random()) * meanSeconds * 1000;
  return Math.max(300, delay);
}
