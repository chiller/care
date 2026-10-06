# Recruitment portal — prototype spec

A clickable proof of concept for the Famly recruitment portal. It has three pages:
a public **portal** where job seekers apply, a **manager** view where applications
appear in realtime, and the manager's **call availability**. Everything runs in the
browser, with no backend.

## Goal

Show that a manager can see a new application within seconds of it being sent,
and reply to it from the same place by booking a call into one of their own free
slots. This is the first step towards testing the hypothesis that *the speed of the
first reply matters more than anything about the shortlist*.

## Running it

```sh
npm install
npm run dev
```

Then open two tabs in the same browser:

| Tab | URL | Role |
| --- | --- | --- |
| 1 | http://localhost:5173/#/manager | Nursery manager |
| 2 | http://localhost:5173/#/portal | Job seeker |
| (optional) | http://localhost:5173/#/schedule | Manager's call availability |

The dark bar at the top of every page switches between the three. It's a prototype
aid, not part of the product.

1. In the manager tab, click **Enable notifications**.
2. In the portal tab, pick a position, fill in the form and click **Send application**.
3. The application appears at the bottom of the **Unread** group in the manager tab,
   highlighted, with an OS notification.
4. Click the row to open it (it moves to **Read, awaiting reply**), then pick one of
   the offered call slots, or **Reject**. Picking a slot books it and moves the
   application to **Call scheduled**.
5. The **Activity** sidebar on the right shows arrivals newest first, with bursts
   merged into one entry and a "while you were away" summary.

**Reset demo** on the manager page clears all applications in every open tab, which
also frees every booked call slot. It doesn't change the manager's availability or
the per-browser preferences (collapsed groups, sidebar open, last seen).

To see the manager view under load without typing, use the applicant simulator
on the portal page (below). To see what happens when the manager's call slots run
out, click **Simulate auto booking** on the manager page.

## Pages

### Portal — `#/portal`

Built for a phone first. The visitor has no account.

- Shows one nursery and its open positions (title, room, hours, and whether Level 3 is required).
- **Apply** opens a one-screen form:
  - Full name (required)
  - Mobile number (required)
  - Childcare qualification: Level 3 / Level 2 / No qualification yet
  - Note (optional)
- After sending, the visitor sees a confirmation screen.

### Applicant simulator (on the portal page)

A demo control above the portal, in a dashed box so it's clearly not part of the
product. It sends fake applications through the same `submitApplication()` path as
the real form, so the manager tab receives them exactly as it would real ones.

- **▶ Simulate applicants** starts sending; **❚❚ Pause** stops.
- The slider sets the average gap between applications, from 1s to 60s (default 10s).
  Changing it while running takes effect immediately.
- Gaps are random, drawn from an exponential distribution around that average (a
  Poisson process), with a 300ms floor. Applications bunch up and go quiet the way
  real ones do, rather than ticking at a fixed rate.
- Each fake applicant gets a random name, UK mobile number, position and note.
  Qualifications are weighted 2 Level 3 : 3 Level 2 : 1 none, since qualified
  staff are the scarce part of the pool.
- Shows how many have been sent and the last applicant's name.
- It runs only while the portal page is open in that tab. Switching that tab to
  another page stops it, so keep the portal in its own tab.

### Manager — `#/manager`

- A table of every application: applicant, position, qualification, status, applied time.
- **Groups.** The list is split vertically into four groups, each with a heading and a
  count. Empty groups are hidden.

  | Group | Contains | Order | Starts |
  | --- | --- | --- | --- |
  | Unread | status `new`, never opened | Oldest first | Expanded |
  | Read, awaiting reply | status `new`, opened | Oldest first | Expanded |
  | Call scheduled | status `replied` | Next call first | Collapsed |
  | Closed | everything else (`rejected`, `hired`) | Newest first | Collapsed |

- **Collapsible.** Clicking a group heading (or Enter/Space on it) collapses or
  expands that group. The count stays visible when collapsed.
  - **Unread** and **Read, awaiting reply** start expanded: that's the work to do.
  - **Call scheduled** and **Closed** start collapsed: they're already handled and
    would otherwise push the queue off screen.
  - The choice is remembered per browser in `localStorage`, separate from the
    application data. It is a viewer preference, not shared state.
- **Fairness.** The two awaiting-reply groups are queues: a new application joins at
  the bottom of Unread instead of jumping ahead of people who applied earlier. The
  person who has waited longest is always at the top, which is also what helps
  time-to-first-reply.
- **Call scheduled** rows show the call time under the status ("Tomorrow 13:30").
- **Unread rows** have a tinted background, an accent bar on the left and a dot before
  the name. Read rows are plain with muted text.
- The header counts all applications, unread ones, and those awaiting a reply.
- **Out of call slots banner.** A red bar between the page header and the
  applications list: *"No free call slots in the next 7 days. 14 applicants still
  waiting."*, with an **Open call availability** link. It sits right above the
  people it's about.
  - It's worked out from the current data, not triggered by an action: it shows
    whenever someone is awaiting a reply and no slot can be booked. So it appears
    however that state is reached: booking the last slot by hand, auto booking,
    another tab taking it, or the last slot's 1-hour notice window passing (checked
    once a minute). It disappears by itself once a slot frees up or nobody is
    waiting.
  - It stays until dismissed, because it asks the manager to act: open more slots,
    or decide which booked calls should give up their place.
  - Dismissing hides it for the people waiting at that moment. A new applicant
    arriving while still out of slots brings it back.
- **Simulate auto booking** (demo control, next to **Reset demo**) books everyone
  awaiting a reply into the free call slots, first come first served: the oldest
  application gets the earliest slot. It books until the slots run out; anyone left
  stays in their group, still waiting. It's a single write, so the other tabs see
  the bookings at once.
  - A floating message at the bottom of the screen reports what it did, and
    disappears after 5 seconds: *"Booked 5 calls. Everyone waiting now has a
    call."*, *"Booked 20 calls."* (with the banner explaining the rest), or
    *"Nobody is awaiting a reply."*
  - If it runs out of slots, the banner appears. Clicking it also un-dismisses the
    banner, so the button always gives visible feedback.
- **Below requirement** flags an applicant without Level 3 on a Level 3 position.
- New applications from other tabs are highlighted for 4 seconds and trigger a
  browser notification if permission is granted.
- **Applied** is a fixed timestamp ("14:32" today, "3 Oct, 14:32" otherwise). There is
  deliberately no running clock: a ticking timer on every row adds pressure and noise
  for a manager who is also covering a room. The oldest-first order already puts the
  longest wait at the top.

#### Application dialog

Clicking a row (or focusing it and pressing Enter/Space), an applicant in the
activity sidebar, or a booked slot on the call availability page opens a dialog with the applicant's details: position, phone (a
`tel:` link), qualification, when they applied, their note, and — once replied —
when the first reply happened and how long after applying. A booked call shows as
**Call: Tomorrow 13:30**.

- Opening the dialog marks the application as **read**.
- **Schedule a 30-minute call** (status `new` only): up to 6 of the manager's
  earliest free slots, as buttons ("Today 14:30", "Tomorrow 13:00", "Wed 8 Oct
  13:30"). Earliest first, because a sooner call gives the candidate less time to
  take another job. Clicking a slot books it and moves the application to `replied`.
  There is no separate "Schedule call" button.
- If no slots are free in the booking window, it says so and links to
  **Call availability**.
- **Reject** → status `rejected`. Shown for `new` and `replied`.
- Taking an action closes the dialog. **Close**, Escape, or clicking the backdrop
  closes it without changing anything.

#### Activity sidebar

A collapsible panel on the right of the manager page (open by default), for
catching up after time away. It answers *what happened while I was gone*, while the
table answers *who do I reply to next*.

- **Newest at the top**, the opposite of the reply queue. The table is a fair queue
  (oldest first); the sidebar is a news feed.
- **"While you were away" card.** Shown when there are applications newer than the
  viewer's *last seen* time: *"14 new applications since 09:12"*, a count per
  position, and how many have Level 3. On a first visit there is no last-seen time
  yet, so every application counts as new and the "since" part is left out.
  - **Show unread** expands the Unread group and scrolls to it.
  - **Mark as seen** sets *last seen* to now and clears the card.
- **Bursts, not one line per application.** Arrivals 10 minutes or less apart
  (`BURST_GAP_MS`) are merged into one entry: *"8 applications · 5 Early Years
  Practitioner · 3 Nursery Assistant · 10:02–10:47"*. Clicking it lists the names,
  newest first, with unread ones in bold; clicking a name opens the application
  dialog. A lone arrival is shown as *"Sam Patel applied"* and opens the dialog
  directly.
- **Day headings** (Today, Yesterday, Fri 3 Oct) and a **"Before you last looked"**
  divider. Bursts are split at midnight and at the last-seen time, so these
  markers always fall between entries.
- New-since-last-seen entries have a tinted outline.
- **Collapsed** it becomes a narrow strip with a bell icon and a badge counting
  applications since last seen.
- Open/collapsed and *last seen* are per-browser preferences in `localStorage`.
  Opening the sidebar doesn't mark anything as seen or read; only *Mark as seen*
  and opening an application do.
- Only arrivals are shown. The manager's own actions (scheduling a call, rejecting)
  are left out: in a single-manager inbox they'd be noise about your own clicks.
- No new application data is stored: entries are worked out from `submittedAt` on
  the existing applications. The only new values saved are the two per-browser
  preferences above.
- On narrow screens the sidebar moves below the list.

### Call availability — `#/schedule`

The hiring manager's time is the scarce resource. This page is where they say when
they can take a hiring call; the dialog only offers those slots.

- A grid: one column per bookable day, one row per 30-minute slot from 08:00 to
  17:30. Click a cell to make it available or unavailable.
- **Booking window: the next 7 days, weekdays only.** A call two weeks out is too
  slow to win a candidate, so the window stays short and slots are allowed to run
  out rather than pushing calls further away.
- **At most 6 slots per day** (3 hours of calls). Each day's heading shows the count
  ("4/6"); once a day is full, its empty cells are disabled.
- **Booked** slots show the candidate's first name and can't be made unavailable.
  Clicking one opens that candidate's application dialog (and marks it read). This
  is where the hard decisions happen once slots run out: the manager sees who holds
  each call and can **Reject** to free the slot for someone else.
- Past slots are disabled.
- The header shows how many slots are booked in the window, and how many are free:
  open, unbooked, and starting at least 1 hour from now (so exactly the ones the
  dialog can offer).
- **Fill empty days with nap-time slots** adds 13:00, 13:30, 14:00 and 14:30 to every
  bookable day that has none: babies nap after lunch, which is when a manager can step
  out of the room. The same slots are seeded on first run so the demo has something to
  book.
- A slot is only offered in the dialog if it starts at least 1 hour from now, so the
  candidate gets notice.
- Changes reach the other tabs in realtime, like applications do.

## Data model

```ts
Position    { id, nurseryId, title, room, hours, requiresLevel3, postedAt }
Application { id, positionId, name, phone, qualification, note, submittedAt, status,
              readAt?, firstReplyAt?, callSlot? }
Availability  SlotKey[]          // e.g. ["2026-10-06T13:00", "2026-10-06T13:30"]

qualification: "level3" | "level2" | "none"
status:        "new" | "replied" | "hired" | "rejected"
```

**Read/unread** is the `readAt` timestamp, kept separate from `status`. Reading an
application is not the same as replying to it: a manager can open one, get pulled into
the baby room, and come back to it still awaiting a reply.

**Call slots.** A slot is identified by its local start time (`SlotKey`,
`"YYYY-MM-DDTHH:MM"`). Availability is the shared list of slots the manager has
opened. A slot is *booked* when an application with status `replied` has it as its
`callSlot`; bookings aren't stored separately. If a candidate with a call is later
rejected, their slot becomes free again (the `callSlot` stays on the application as a
record). The rules — window, daily cap, notice, slot length — live in
`src/schedule.ts`.

**Status transitions** (`transitions` in `src/types.ts`). Anything not listed is refused
by the store:

| From | Allowed to | Dialog action |
| --- | --- | --- |
| `new` | `replied`, `rejected` | A call slot, Reject |
| `replied` | `rejected` | Reject |
| `rejected` | — | — |
| `hired` | — | — (not reachable yet) |

**Time to first reply** is `firstReplyAt − submittedAt`. It is recorded for measuring the
hypothesis, not shown to the manager as a live counter. `firstReplyAt` is set on the first
move out of `new`, so a rejection counts as a reply: the candidate heard back either way.
Any transition also marks the application read. `replied` can only be reached through
`scheduleCall()`, which re-checks the slot is still free before booking it, or
`autoBookCalls()` (demo).

The nursery and its positions are hardcoded in `src/store.ts`. Applications are created
by the portal.

## Realtime

| Concern | Prototype | Production equivalent |
| --- | --- | --- |
| Storage | `localStorage` (applications, availability) | Database |
| Push to manager | `BroadcastChannel` events | WebSocket / web push |
| Alert | Browser Notifications API | Push notification / SMS |

Events:

- `application.created` — carries the new application
- `application.updated` — carries the application after it was read or changed status
- `applications.reset` — demo data cleared
- `availability.updated` — the manager's call slots changed

`BroadcastChannel` doesn't deliver to the tab that sent the message, so only *other*
tabs react to an event.

## Limitations

- Realtime only works between tabs of one browser on one machine.
- One nursery with fixed positions. Managers can't create or close positions.
- No login. The manager page is just a URL.
- Booking a call doesn't send the candidate anything, and there's no calendar
  invite for the manager.
- Availability is set day by day. There's no recurring weekly pattern, so days
  that come into the window later start empty (use **Fill empty days**).
- One manager's schedule per nursery. No way to share calls between colleagues.
- No way to hire yet, and nothing becomes a Famly staff record.
- **Simulate auto booking** is a demo shortcut, not a feature. It marks the booked
  applications read and sets their `firstReplyAt` to the moment of the click, which
  would skew a real time-to-first-reply measurement.
- The only way to take a call slot back is to **Reject** the candidate. There is no
  "cancel call, keep the application" or "move call" yet.
- *Last seen* only moves when the manager clicks **Mark as seen**. It doesn't detect
  that the manager has been looking at the page.
- Two tabs writing at the same moment can overwrite each other, since every write
  reads and rewrites the whole list in `localStorage`.

## Next steps

1. A candidate status page that updates when the manager acts.
2. Booking a call texts the candidate the time, with a link to move or cancel it.
3. A recurring weekly availability pattern, with per-day overrides.
4. Cancel or move a booked call without rejecting the candidate.
5. *Hire* action that creates a staff record.
6. Header stat: rolling median time-to-first-reply.

## Code map

```
src/
  main.tsx               hash routing + demo nav
  store.ts               seed data, localStorage, BroadcastChannel, useApplications(),
                         useAvailability(), submitApplication(), markRead(),
                         transition(), scheduleCall(), autoBookCalls(),
                         setSlotAvailable()
  schedule.ts            call slot rules: window, daily cap, notice, free slots
  types.ts               Position, Application, allowed status transitions, labels
  format.ts              position title, Level 3 check, time/day/slot/duration formatting
  usePersistentState.ts  per-browser UI preferences in localStorage
  activity.ts            groups arrivals into bursts
  ActivitySidebar.tsx    activity feed, "while you were away" card, collapsed strip
  fakeApplicants.ts      random applicant data + random arrival delays
  Simulator.tsx          play/pause + frequency slider on the portal
  pages/Portal.tsx       public positions list + apply form
  ApplicationDialog.tsx  applicant details, slot picker, reject; used by both
                         manager pages
  Snackbar.tsx           message bar: floating info, or the inline out-of-slots
                         banner
  pages/Manager.tsx      layout, grouped applications table, out-of-slots banner,
                         auto booking, notifications
  pages/Schedule.tsx     call availability grid; booked slots open the dialog
  styles.css
  vite-env.d.ts          Vite type declarations
```
