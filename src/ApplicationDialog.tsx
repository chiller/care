import { useEffect, useRef } from "react";
import { formatDuration, formatSlot, formatTime, isUnderqualified, positionTitle } from "./format";
import { freeSlots } from "./schedule";
import { scheduleCall, transition, useApplications, useAvailability } from "./store";
import { qualificationLabel, statusLabel, transitions, type Application } from "./types";

// How many of the earliest free slots the dialog offers. Earliest first: the
// sooner the call, the less chance the candidate takes another job meanwhile.
const SLOTS_OFFERED = 6;

export function ApplicationDialog({
  application: a,
  onClose,
}: {
  application: Application;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const availability = useAvailability();
  const applications = useApplications();
  const canSchedule = transitions[a.status].includes("replied");
  const canReject = transitions[a.status].includes("rejected");
  const slots = canSchedule ? freeSlots(availability, applications).slice(0, SLOTS_OFFERED) : [];

  return (
    <dialog
      ref={ref}
      className="application-dialog"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      <div className="dialog-body">
        <header>
          <h2>{a.name}</h2>
          <span className={`status status-${a.status}`}>{statusLabel[a.status]}</span>
        </header>

        <dl>
          <dt>Position</dt>
          <dd>{positionTitle(a.positionId)}</dd>
          <dt>Phone</dt>
          <dd>
            <a href={`tel:${a.phone.replace(/\s/g, "")}`}>{a.phone}</a>
          </dd>
          <dt>Qualification</dt>
          <dd>
            {qualificationLabel[a.qualification]}
            {isUnderqualified(a) && <span className="tag warn">Below requirement</span>}
          </dd>
          {a.status === "replied" && a.callSlot && (
            <>
              <dt>Call</dt>
              <dd>
                <strong>{formatSlot(a.callSlot)}</strong>
              </dd>
            </>
          )}
          <dt>Applied</dt>
          <dd>{formatTime(a.submittedAt)}</dd>
          {a.firstReplyAt && (
            <>
              <dt>First reply</dt>
              <dd>
                {formatTime(a.firstReplyAt)}{" "}
                <span className="muted">
                  ({formatDuration(a.firstReplyAt - a.submittedAt)} after applying)
                </span>
              </dd>
            </>
          )}
          {a.note && (
            <>
              <dt>Note</dt>
              <dd className="note">“{a.note}”</dd>
            </>
          )}
        </dl>

        {canSchedule && (
          <section className="slot-picker" aria-label="Schedule a call">
            <h3>Schedule a 30-minute call</h3>
            {slots.length > 0 ? (
              <div className="slots">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    className="slot"
                    onClick={() => {
                      scheduleCall(a.id, slot);
                      ref.current?.close();
                    }}
                  >
                    {formatSlot(slot)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted no-slots">
                No free call slots in the next week.{" "}
                <a href="#/schedule">Add availability</a>
              </p>
            )}
          </section>
        )}

        <footer>
          <button onClick={() => ref.current?.close()}>Close</button>
          {canReject && (
            <button
              className="danger"
              onClick={() => {
                transition(a.id, "rejected");
                ref.current?.close();
              }}
            >
              Reject
            </button>
          )}
        </footer>
      </div>
    </dialog>
  );
}
