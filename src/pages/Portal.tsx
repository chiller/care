import { useState, type FormEvent } from "react";
import { Simulator } from "../Simulator";
import { nursery, positions, submitApplication } from "../store";
import { qualificationLabel, type Position, type Qualification } from "../types";

export function Portal() {
  return (
    <>
      <Simulator />
      <PortalContent />
    </>
  );
}

function PortalContent() {
  const [selected, setSelected] = useState<Position | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  if (submittedName && selected) {
    return (
      <main className="portal">
        <div className="card confirmation">
          <h2>Thanks, {submittedName.split(" ")[0]}!</h2>
          <p>
            Your application for <strong>{selected.title}</strong> at {nursery.name} has
            been sent. The nursery manager has been notified.
          </p>
          <button
            className="link"
            onClick={() => {
              setSelected(null);
              setSubmittedName(null);
            }}
          >
            ← Back to open positions
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="portal">
      <header className="portal-header">
        <h1>{nursery.name}</h1>
        <p className="muted">{nursery.area} · We're hiring</p>
      </header>

      {selected ? (
        <ApplyForm
          position={selected}
          onCancel={() => setSelected(null)}
          onSubmitted={setSubmittedName}
        />
      ) : (
        <ul className="positions">
          {positions.map((position) => (
            <li key={position.id} className="card">
              <h2>{position.title}</h2>
              <p className="muted">
                {position.room} · {position.hours}
              </p>
              {position.requiresLevel3 && <span className="tag">Level 3 required</span>}
              <button className="primary" onClick={() => setSelected(position)}>
                Apply
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ApplyForm({
  position,
  onCancel,
  onSubmitted,
}: {
  position: Position;
  onCancel: () => void;
  onSubmitted: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState<Qualification>("level3");
  const [note, setNote] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitApplication({
      positionId: position.id,
      name: name.trim(),
      phone: phone.trim(),
      qualification,
      note: note.trim(),
    });
    onSubmitted(name.trim());
  }

  return (
    <form className="card apply-form" onSubmit={handleSubmit}>
      <button type="button" className="link" onClick={onCancel}>
        ← All positions
      </button>
      <h2>{position.title}</h2>
      <p className="muted">{position.room}</p>

      <label>
        Full name
        <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label>
        Mobile number
        <input
          required
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <fieldset>
        <legend>Childcare qualification</legend>
        {(Object.keys(qualificationLabel) as Qualification[]).map((q) => (
          <label key={q} className="radio">
            <input
              type="radio"
              name="qualification"
              checked={qualification === q}
              onChange={() => setQualification(q)}
            />
            {qualificationLabel[q]}
          </label>
        ))}
      </fieldset>

      <label>
        Anything you'd like us to know? <span className="muted">(optional)</span>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      <button type="submit" className="primary">
        Send application
      </button>
    </form>
  );
}
