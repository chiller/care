# How to run the prototype

> AI-generated. For the reasoning behind the prototype see [README.md](README.md); for
> the full behaviour see [spec.md](spec.md).

A clickable prototype of a nursery recruitment portal. It runs entirely in the browser:
there is no backend, and all data lives in your browser's `localStorage`.

## Requirements

- **Node.js** 20.19+ or 22.12+ (Vite 8 needs one of these), with npm
- A modern browser: Chrome, Edge, Firefox or Safari

## Install

```sh
git clone https://github.com/chiller/care.git
cd care
npm install
```

## Run

```sh
npm run dev
```

Then open http://localhost:5173.

To try a production build instead:

```sh
npm run build     # type-checks, then builds into dist/
npm run preview   # serves dist/ at http://localhost:4173
```

## Pages

Open each page in its **own tab of the same browser**. The tabs talk to each other
in realtime, which is how an application sent from the portal appears on the manager
page. The dark bar at the top of every page switches between them.

| Page | URL | Who it's for |
| --- | --- | --- |
| Public portal | http://localhost:5173/#/portal | A job seeker, on a phone |
| Manager | http://localhost:5173/#/manager | The nursery manager |
| Call availability | http://localhost:5173/#/schedule | The manager's call slots |

## A five-minute walkthrough

1. **Manager tab:** open `#/manager` and click **Enable notifications**.
2. **Portal tab:** open `#/portal`, pick a position, fill in the form and click
   **Send application**. It appears on the manager page at the bottom of **Unread**,
   highlighted, with an OS notification.
3. **Reply:** on the manager page, click the row. It moves to **Read, awaiting
   reply**. Pick one of the offered call slots: the application moves to **Call
   scheduled**.
4. **Make it busy:** back in the portal tab, click **▶ Simulate applicants** and drag
   the slider to a short gap (a few seconds). Watch applications stream into the
   manager page, and the **Activity** sidebar merge them into bursts.
5. **Run out of time:** on the manager page, click **Simulate auto booking**. Everyone
   waiting is booked into the free slots, oldest first, until the slots run out. A red
   **out of call slots** banner appears above the list.
6. **Make the hard decisions:** open **Call availability** (`#/schedule`). Booked
   slots show the candidate's first name; click one to open their application and
   **Reject** to free the slot. Or click empty cells to open more slots (up to 6 a
   day).

## Features

### Public portal (`#/portal`)

- One nursery's open positions, built for a phone first.
- A one-screen application: name, mobile, qualification (Level 3 / Level 2 / none)
  and an optional note. No account.
- **Applicant simulator** (the dashed box at the top, a demo tool): sends fake
  applications at random intervals; the slider sets the average gap, 1–60 seconds.
  It only runs while the portal page is open in that tab.

### Manager (`#/manager`)

- Applications in four collapsible groups: **Unread** and **Read, awaiting reply**
  (oldest first, so nobody gets pushed back by newer arrivals), **Call scheduled**
  (next call first) and **Closed**.
- Unread rows stand out; opening an application marks it read.
- No live timers on rows: a fixed "applied at" time instead.
- **Application dialog:** contact details, qualification (flagged if below the role's
  requirement), up to 6 of the earliest free call slots as buttons, and **Reject**.
- **Activity sidebar:** newest first, a "while you were away" summary, and bursts of
  applications merged into one entry. Collapses to a bell with a badge.
- **Out of call slots banner:** shown whenever someone is waiting and no slot can be
  booked, however that happened.
- Demo controls: **Simulate auto booking** and **Reset demo** (clears all
  applications in every tab).

### Call availability (`#/schedule`)

- A grid of 30-minute slots, 08:00–17:30, for the weekdays in the next 7 days.
- Click a cell to open or close a slot; at most 6 per day.
- Booked slots show the candidate and open their application when clicked.
- **Fill empty days with nap-time slots** adds 13:00–14:30 to empty days. These are
  also set up automatically the first time you run the prototype.

## Starting over

- **Reset demo** on the manager page clears all applications. It keeps the call
  availability and your view settings (collapsed groups, sidebar, last seen).
- To clear everything, clear the site data for `localhost:5173` in your browser's
  settings (all keys start with `famly-recruitment:`).

## Things to know

- Realtime only works between tabs of **one browser on one machine**. Two browsers,
  or two devices, don't see each other's data.
- OS notifications only appear for applications sent from **another** tab, and only
  after you allow them.
- Use made-up details when applying by hand: whatever you type is saved in your
  browser.

See [spec.md](spec.md) for the full behaviour, data model and known limitations.
