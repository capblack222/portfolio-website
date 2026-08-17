"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * The server cannot know the preference, so it assumes "reduce".
 * Anything gated on this stays off until the client says otherwise —
 * motion that flashes on before the check resolves defeats the check.
 */
function getServerSnapshot() {
  return true;
}

/**
 * Tracks prefers-reduced-motion, including changes made while the page is open.
 *
 * useSyncExternalStore rather than useState + useEffect: the value is read
 * during render instead of after mount, so there is no extra render pass and
 * no window where motion is briefly enabled for someone who asked for none.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
