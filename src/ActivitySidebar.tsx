import { Fragment, useState } from "react";
import { buildBursts, countBy, type Burst } from "./activity";
import { formatClock, formatDay, formatTime, isSameDay, positionTitle } from "./format";
import { qualificationLabel, type Application } from "./types";
import { usePersistentState } from "./usePersistentState";

export function ActivitySidebar({
  applications,
  onOpenApplication,
  onShowUnread,
}: {
  applications: Application[];
  onOpenApplication: (application: Application) => void;
  onShowUnread: () => void;
}) {
  const [open, setOpen] = usePersistentState("famly-recruitment:activity-open", true);
  const [lastSeen, setLastSeen] = usePersistentState("famly-recruitment:last-seen", 0);

  const unseen = applications.filter((a) => a.submittedAt > lastSeen);
  const bursts = buildBursts(applications, lastSeen);

  if (!open) {
    return (
      <aside className="activity collapsed" aria-label="Activity">
        <button
          className="activity-toggle"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          title="Show activity"
        >
          <BellIcon />
          {unseen.length > 0 && <span className="badge">{unseen.length}</span>}
        </button>
      </aside>
    );
  }

  return (
    <aside className="activity" aria-label="Activity">
      <header className="activity-header">
        <h2>Activity</h2>
        <button
          className="activity-toggle"
          onClick={() => setOpen(false)}
          aria-expanded={true}
          title="Hide activity"
        >
          <span aria-hidden="true">→</span>
        </button>
      </header>

      {unseen.length > 0 && (
        <AwaySummary
          unseen={unseen}
          lastSeen={lastSeen}
          onShowUnread={onShowUnread}
          onMarkSeen={() => setLastSeen(Date.now())}
        />
      )}

      {bursts.length === 0 ? (
        <p className="muted activity-empty">No applications yet.</p>
      ) : (
        <ol className="feed">
          {bursts.map((burst, i) => {
            const prev = bursts[i - 1];
            const newDay = !prev || !isSameDay(prev.end, burst.end);
            const seenDivider = prev?.unseen && !burst.unseen;
            return (
              <Fragment key={burst.id}>
                {seenDivider && (
                  <li className="feed-divider" aria-hidden="true">
                    Before you last looked
                  </li>
                )}
                {newDay && <li className="feed-day">{formatDay(burst.end)}</li>}
                <BurstEntry burst={burst} onOpenApplication={onOpenApplication} />
              </Fragment>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

function AwaySummary({
  unseen,
  lastSeen,
  onShowUnread,
  onMarkSeen,
}: {
  unseen: Application[];
  lastSeen: number;
  onShowUnread: () => void;
  onMarkSeen: () => void;
}) {
  const byPosition = countBy(unseen, (a) => positionTitle(a.positionId));
  const level3 = unseen.filter((a) => a.qualification === "level3").length;

  return (
    <section className="away-summary">
      <p className="away-title">
        <strong>
          {unseen.length} new {unseen.length === 1 ? "application" : "applications"}
        </strong>
        {lastSeen > 0 && <> since {formatTime(lastSeen)}</>}
      </p>
      <ul className="away-breakdown">
        {byPosition.map(([title, count]) => (
          <li key={title}>
            {count} {title}
          </li>
        ))}
        <li>{level3} with Level 3</li>
      </ul>
      <div className="away-actions">
        <button className="primary" onClick={onShowUnread}>
          Show unread
        </button>
        <button onClick={onMarkSeen}>Mark as seen</button>
      </div>
    </section>
  );
}

function BurstEntry({
  burst,
  onOpenApplication,
}: {
  burst: Burst;
  onOpenApplication: (application: Application) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { applications } = burst;
  const className = `feed-entry${burst.unseen ? " unseen" : ""}`;

  if (applications.length === 1) {
    const [a] = applications;
    return (
      <li className={className}>
        <button className="feed-item" onClick={() => onOpenApplication(a)}>
          <span className="feed-title">
            <strong>{a.name}</strong> applied
          </span>
          <span className="feed-meta">
            {positionTitle(a.positionId)} · {qualificationLabel[a.qualification]}
          </span>
          <time className="feed-time">{formatClock(a.submittedAt)}</time>
        </button>
      </li>
    );
  }

  const byPosition = countBy(applications, (a) => positionTitle(a.positionId));

  return (
    <li className={className}>
      <button
        className="feed-item"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="feed-title">
          <strong>{applications.length} applications</strong>
        </span>
        <span className="feed-meta">
          {byPosition.map(([title, count]) => `${count} ${title}`).join(" · ")}
        </span>
        <time className="feed-time">
          {formatClock(burst.start)}–{formatClock(burst.end)}
        </time>
      </button>
      {expanded && (
        <ul className="burst-names">
          {applications.map((a) => (
            <li key={a.id}>
              <button className={a.readAt ? "" : "unread"} onClick={() => onOpenApplication(a)}>
                <span>{a.name}</span>
                <span className="muted">{formatClock(a.submittedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
