import { useEffect, useState } from "react";
import { nextDelayMs, submitRandomApplication } from "./fakeApplicants";

export function Simulator() {
  const [running, setRunning] = useState(false);
  const [meanSeconds, setMeanSeconds] = useState(10);
  const [sent, setSent] = useState(0);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const application = submitRandomApplication();
        setSent((n) => n + 1);
        setLast(application.name);
        schedule();
      }, nextDelayMs(meanSeconds));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [running, meanSeconds]);

  return (
    <section className="simulator" aria-label="Applicant simulator">
      <div className="simulator-row">
        <button
          className={running ? "sim-toggle running" : "sim-toggle"}
          onClick={() => setRunning((r) => !r)}
          aria-pressed={running}
        >
          {running ? "❚❚ Pause" : "▶ Simulate applicants"}
        </button>
        <span className="sim-status">
          {sent} sent{last && ` · last: ${last}`}
        </span>
      </div>
      <label className="simulator-row">
        <span>
          One every ~<strong>{meanSeconds}s</strong>
        </span>
        <input
          type="range"
          min={1}
          max={60}
          value={meanSeconds}
          onChange={(e) => setMeanSeconds(Number(e.target.value))}
        />
      </label>
    </section>
  );
}
