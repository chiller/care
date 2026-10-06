import { useState } from "react";
import { ApplicationDialog } from "../ApplicationDialog";
import { formatDay } from "../format";
import {
  availableOnDay,
  BOOKING_HORIZON_DAYS,
  bookableDays,
  bookings,
  freeSlots,
  MAX_CALLS_PER_DAY,
  SLOT_MINUTES,
  slotKey,
  slotStart,
  slotTimes,
} from "../schedule";
import {
  fillEmptyDaysWithDefaults,
  markRead,
  setSlotAvailable,
  useApplications,
  useAvailability,
} from "../store";

export function Schedule() {
  const availability = useAvailability();
  const applications = useApplications();
  const [openId, setOpenId] = useState<string | null>(null);
  const openApplication = applications.find((a) => a.id === openId);
  const now = Date.now();
  const days = bookableDays(now);
  const booked = bookings(applications);
  const free = freeSlots(availability, applications, now);
  const bookedInHorizon = days.flatMap((day) =>
    availableOnDay(availability, day).filter((slot) => booked.has(slot)),
  );

  return (
    <main className="schedule">
      <header className="manager-header">
        <div>
          <h1>Call availability</h1>
          <p className="muted">
            Pick the {SLOT_MINUTES}-minute slots you can take a hiring call in, up to{" "}
            {MAX_CALLS_PER_DAY} a day, for the next {BOOKING_HORIZON_DAYS} days.
          </p>
          <p className="muted">
            <strong>{free.length}</strong> free · <strong>{bookedInHorizon.length}</strong> booked
          </p>
        </div>
        <div className="header-actions">
          <button onClick={fillEmptyDaysWithDefaults}>Fill empty days with nap-time slots</button>
        </div>
      </header>

      <div className="schedule-scroll">
        <table className="schedule-grid">
          <thead>
            <tr>
              <th aria-label="Time" />
              {days.map((day) => {
                const count = availableOnDay(availability, day).length;
                return (
                  <th key={day.getTime()} scope="col">
                    <div>{formatDay(day.getTime())}</div>
                    <div className={count >= MAX_CALLS_PER_DAY ? "day-count full" : "day-count"}>
                      {count}/{MAX_CALLS_PER_DAY}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slotTimes.map((time) => (
              <tr key={time}>
                <th scope="row">{time}</th>
                {days.map((day) => {
                  const slot = slotKey(day, time);
                  const available = availability.includes(slot);
                  const booking = booked.get(slot);
                  const past = slotStart(slot) <= now;
                  const dayFull = availableOnDay(availability, day).length >= MAX_CALLS_PER_DAY;

                  // A booked slot opens the candidate's application, so the manager
                  // can decide whether this call should keep its place.
                  if (booking) {
                    return (
                      <td key={slot}>
                        <button
                          className="cell booked"
                          title={`Call with ${booking.name}`}
                          aria-label={`${formatDay(day.getTime())} ${time}: call with ${booking.name}`}
                          onClick={() => {
                            setOpenId(booking.id);
                            markRead(booking.id);
                          }}
                        >
                          {booking.name.split(" ")[0]}
                        </button>
                      </td>
                    );
                  }

                  return (
                    <td key={slot}>
                      <button
                        className={`cell${available ? " available" : ""}`}
                        aria-pressed={available}
                        aria-label={`${formatDay(day.getTime())} ${time}`}
                        disabled={past || (!available && dayFull)}
                        onClick={() => setSlotAvailable(slot, !available)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="schedule-legend muted">
        <li>
          <span className="cell available" /> Available for a call
        </li>
        <li>
          <span className="cell booked" /> Call booked (click to open the application)
        </li>
        <li>
          <span className="cell" /> Not available
        </li>
      </ul>

      {openApplication && (
        <ApplicationDialog application={openApplication} onClose={() => setOpenId(null)} />
      )}
    </main>
  );
}
