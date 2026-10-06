import { useEffect } from "react";

export type SnackbarMessage = {
  id: number;
  tone: "info" | "error";
  text: string;
  action?: { label: string; href: string };
};

const INFO_TIMEOUT_MS = 5000;

// Info messages dismiss themselves. Errors stay until closed: they ask the
// manager to do something. `inline` renders it in the page flow instead of
// floating at the bottom of the screen.
export function Snackbar({
  message,
  onDismiss,
  inline = false,
}: {
  message: SnackbarMessage | null;
  onDismiss: () => void;
  inline?: boolean;
}) {
  useEffect(() => {
    if (!message || message.tone === "error") return;
    const timer = setTimeout(onDismiss, INFO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      key={message.id}
      className={`snackbar snackbar-${message.tone}${inline ? " inline" : ""}`}
      role={message.tone === "error" ? "alert" : "status"}
    >
      <span>{message.text}</span>
      {message.action && (
        <a className="snackbar-action" href={message.action.href}>
          {message.action.label}
        </a>
      )}
      <button className="snackbar-close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
