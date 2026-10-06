import { useState } from "react";

// Per-viewer UI preferences (collapsed sections, last seen time). They live in
// this browser's localStorage only and are never shared with other viewers.
// If storage is unavailable the value just isn't remembered.
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const set = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Not remembering the choice is fine.
    }
  };

  return [value, set] as const;
}
