import { useCallback, useEffect, useState } from "react";
import {
  autoBookCalls,
  markRead,
  onRemoteEvent,
  resetApplications,
  useApplications,
  useAvailability,
  type AutoBookResult,
} from "../store";
import { BOOKING_HORIZON_DAYS, freeSlots, slotStart } from "../schedule";
import { Snackbar, type SnackbarMessage } from "../Snackbar";
import { qualificationLabel, statusLabel, type Application } from "../types";
import { ActivitySidebar } from "../ActivitySidebar";
import { ApplicationDialog } from "../ApplicationDialog";
import { formatSlot, formatTime, isUnderqualified, positionTitle } from "../format";
import { usePersistentState } from "../usePersistentState";

const oldestFirst = (a: Application, b: Application) => a.submittedAt - b.submittedAt;
const newestFirst = (a: Application, b: Application) => b.submittedAt - a.submittedAt;
const callTime = (a: Application) => (a.callSlot ? slotStart(a.callSlot) : Infinity);
const nextCallFirst = (a: Application, b: Application) => callTime(a) - callTime(b);

// The list is split into groups, top to bottom. Applications still awaiting a
// reply are a queue: oldest first, so a new arrival joins at the back instead of
// jumping ahead of people who have waited longer.
const groups: {
  key: string;
  label: string;
  includes: (a: Application) => boolean;
  order: (a: Application, b: Application) => number;
  collapsedByDefault: boolean;
}[] = [
  {
    key: "unread",
    label: "Unread",
    includes: (a) => a.status === "new" && !a.readAt,
    order: oldestFirst,
    collapsedByDefault: false,
  },
  {
    key: "read",
    label: "Read, awaiting reply",
    includes: (a) => a.status === "new" && Boolean(a.readAt),
    order: oldestFirst,
    collapsedByDefault: false,
  },
  {
    key: "replied",
    label: "Call scheduled",
    includes: (a) => a.status === "replied",
    order: nextCallFirst,
    collapsedByDefault: true,
  },
  {
    key: "closed",
    label: "Closed",
    includes: (a) => a.status !== "new" && a.status !== "replied",
    order: newestFirst,
    collapsedByDefault: true,
  },
];

// Which groups are collapsed is a per-viewer preference, kept apart from the
// shared application data.
function useCollapsedGroups() {
  const [collapsed, setCollapsed] = usePersistentState<Record<string, boolean>>(
    "famly-recruitment:collapsed-groups",
    {},
  );

  const isCollapsed = (key: string) =>
    collapsed[key] ?? groups.find((g) => g.key === key)?.collapsedByDefault ?? false;

  const toggle = (key: string) => setCollapsed({ ...collapsed, [key]: !isCollapsed(key) });
  const expand = (key: string) => setCollapsed({ ...collapsed, [key]: false });

  return { isCollapsed, toggle, expand };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Slots stop being bookable as time passes (past, or inside the notice window)
// without any data changing, so re-render quietly once a minute. Nothing on
// screen ticks; this only keeps the out-of-slots banner honest.
function useRecheckEveryMinute() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

// Only the outcome of the click. Running out of slots is reported by the
// out-of-slots banner, which also covers every other way of getting there.
function autoBookMessage({ booked, stillWaiting }: AutoBookResult): string | null {
  if (booked > 0) {
    return `Booked ${plural(booked, "call")}.${stillWaiting === 0 ? " Everyone waiting now has a call." : ""}`;
  }
  return stillWaiting === 0 ? "Nobody is awaiting a reply." : null;
}

export function Manager() {
  const applications = useApplications();
  const { isCollapsed, toggle, expand } = useCollapsedGroups();
  const [openId, setOpenId] = useState<string | null>(null);
  const availability = useAvailability();
  useRecheckEveryMinute();
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const dismissSnackbar = useCallback(() => setSnackbar(null), []);

  // Out of slots is a state, not an event: someone is waiting and no slot can
  // be booked, however that came about (a manual booking, auto booking, another
  // tab, or the last slot's notice window passing). Dismissing it hides it for
  // the people waiting right now; a new arrival brings it back.
  const waiting = applications.filter((a) => a.status === "new");
  const outOfSlots = waiting.length > 0 && freeSlots(availability, applications).length === 0;
  const [dismissedFor, setDismissedFor] = useState<string[]>([]);
  const showOutOfSlots = outOfSlots && waiting.some((a) => !dismissedFor.includes(a.id));
  const outOfSlotsMessage: SnackbarMessage = {
    id: 0,
    tone: "error",
    text: `No free call slots in the next ${BOOKING_HORIZON_DAYS} days. ${plural(waiting.length, "applicant")} still waiting.`,
    action: { label: "Open call availability", href: "#/schedule" },
  };
  const [justArrived, setJustArrived] = useState<Set<string>>(new Set());
  const [permission, setPermission] = useState(
    typeof Notification === "undefined" ? "denied" : Notification.permission,
  );

  useEffect(
    () =>
      onRemoteEvent((event) => {
        if (event.type !== "application.created") return;
        const { application } = event;

        setJustArrived((prev) => new Set(prev).add(application.id));
        setTimeout(() => {
          setJustArrived((prev) => {
            const next = new Set(prev);
            next.delete(application.id);
            return next;
          });
        }, 4000);

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`New applicant: ${application.name}`, {
            body: `${positionTitle(application.positionId)} · ${qualificationLabel[application.qualification]}`,
            tag: application.id,
          });
        }
      }),
    [],
  );

  const unreadCount = applications.filter((a) => !a.readAt).length;
  const awaitingCount = applications.filter((a) => a.status === "new").length;
  const openApplication = applications.find((a) => a.id === openId);

  function open(application: Application) {
    setOpenId(application.id);
    markRead(application.id);
  }

  function showUnread() {
    expand("unread");
    // Wait for the expanded group to render before scrolling to it.
    requestAnimationFrame(() =>
      document.getElementById("group-unread")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  return (
    <div className="manager-layout">
      <main className="manager">
        <header className="manager-header">
          <div>
            <h1>Applications</h1>
            <p className="muted">
              {applications.length} total · {unreadCount} unread · {awaitingCount} awaiting a reply
            </p>
          </div>
          <div className="header-actions">
            {permission !== "granted" && (
              <button
                onClick={async () => setPermission(await Notification.requestPermission())}
                disabled={permission === "denied"}
              >
                {permission === "denied" ? "Notifications blocked" : "Enable notifications"}
              </button>
            )}
            <button
              onClick={() => {
                setDismissedFor([]);
                const text = autoBookMessage(autoBookCalls());
                setSnackbar(text ? { id: Date.now(), tone: "info", text } : null);
              }}
            >
              Simulate auto booking
            </button>
            <button onClick={resetApplications}>Reset demo</button>
          </div>
        </header>

        {/* Sits right above the list it's about. */}
        {showOutOfSlots && (
          <Snackbar
            inline
            message={outOfSlotsMessage}
            onDismiss={() => setDismissedFor(waiting.map((a) => a.id))}
          />
        )}

        {applications.length === 0 ? (
          <p className="empty">
            No applications yet. Open the <a href="#/portal" target="_blank">portal</a> in another
            tab and apply — it will appear here instantly.
          </p>
        ) : (
          <table className="applications">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Position</th>
                <th>Qualification</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            {groups.map((group) => {
              const rows = applications.filter(group.includes).sort(group.order);
              if (rows.length === 0) return null;
              const collapsed = isCollapsed(group.key);
              return (
                <tbody
                  key={group.key}
                  id={`group-${group.key}`}
                  className={`group group-${group.key}${collapsed ? " collapsed" : ""}`}
                >
                  <tr className="group-heading">
                    <th colSpan={5} scope="rowgroup">
                      <button
                        className="group-toggle"
                        aria-expanded={!collapsed}
                        onClick={() => toggle(group.key)}
                      >
                        <span className="chevron" aria-hidden="true" />
                        {group.label} <span className="count">{rows.length}</span>
                      </button>
                    </th>
                  </tr>
                  {!collapsed && rows.map((a) => (
                    <ApplicationRow
                      key={a.id}
                      application={a}
                      highlight={justArrived.has(a.id)}
                      onOpen={() => open(a)}
                    />
                  ))}
                </tbody>
              );
            })}
          </table>
        )}

        {openApplication && (
          <ApplicationDialog
            application={openApplication}
            onClose={() => setOpenId(null)}
          />
        )}
      </main>
      <Snackbar message={snackbar} onDismiss={dismissSnackbar} />
      <ActivitySidebar
        applications={applications}
        onOpenApplication={open}
        onShowUnread={showUnread}
      />
    </div>
  );
}

function ApplicationRow({
  application: a,
  highlight,
  onOpen,
}: {
  application: Application;
  highlight: boolean;
  onOpen: () => void;
}) {
  const classes = [a.readAt ? "read" : "unread", highlight && "arrived"].filter(Boolean).join(" ");

  return (
    <tr
      className={classes}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${a.readAt ? "" : "Unread: "}${a.name}, ${positionTitle(a.positionId)}`}
    >
      <td>
        <strong className="applicant-name">{a.name}</strong>
        <div className="muted">{a.phone}</div>
      </td>
      <td>{positionTitle(a.positionId)}</td>
      <td>
        {qualificationLabel[a.qualification]}
        {isUnderqualified(a) && <span className="tag warn">Below requirement</span>}
      </td>
      <td>
        <span className={`status status-${a.status}`}>{statusLabel[a.status]}</span>
        {a.status === "replied" && a.callSlot && (
          <div className="muted call-time">{formatSlot(a.callSlot)}</div>
        )}
      </td>
      <td className="applied">{formatTime(a.submittedAt)}</td>
    </tr>
  );
}
