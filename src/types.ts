export type Qualification = "level3" | "level2" | "none";

export type Position = {
  id: string;
  nurseryId: string;
  title: string;
  room: string;
  hours: string;
  requiresLevel3: boolean;
  postedAt: number;
};

export type ApplicationStatus = "new" | "replied" | "hired" | "rejected";

// Which status changes the manager may make. Anything not listed is refused.
// Rejecting after a call has been scheduled is allowed; un-rejecting is not.
export const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  new: ["replied", "rejected"],
  replied: ["rejected"],
  rejected: [],
  hired: [],
};

export const statusLabel: Record<ApplicationStatus, string> = {
  new: "Awaiting reply",
  replied: "Call scheduled",
  rejected: "Rejected",
  hired: "Hired",
};

export type Application = {
  id: string;
  positionId: string;
  name: string;
  phone: string;
  qualification: Qualification;
  note: string;
  submittedAt: number;
  status: ApplicationStatus;
  // Set when the manager first opens the application. Independent of status:
  // reading an application is not the same as replying to it.
  readAt?: number;
  // Set on the first move out of "new", whether to a call or a rejection.
  // submittedAt → firstReplyAt is the time-to-first-reply metric.
  firstReplyAt?: number;
  // The 30-minute slot the hiring call is booked in, e.g. "2026-10-06T13:30".
  // Set when moving to "replied"; kept after a rejection for the record, but a
  // rejected application no longer holds the slot.
  callSlot?: string;
};

export const qualificationLabel: Record<Qualification, string> = {
  level3: "Level 3",
  level2: "Level 2",
  none: "No qualification yet",
};
