"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the cursor trail is running, as a tiny module-level store.
 *
 * A store rather than React context because the canvas and the toggle button
 * are mounted in different parts of the tree and share nothing else. Wrapping
 * the app in a provider to pass one boolean would be more plumbing than the
 * feature is worth.
 *
 * The choice persists in localStorage: someone who turns the trail off has
 * told you something, and asking again on every page load ignores it.
 */

const STORAGE_KEY = "trail-enabled";

let cached: boolean | null = null;
const listeners = new Set<() => void>();

function read(): boolean {
  if (cached === null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      cached = stored === null ? true : stored === "1";
    } catch {
      // Private modes can throw on storage access. Default to on.
      cached = true;
    }
  }
  return cached;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  return read();
}

function getServerSnapshot() {
  return true;
}

export function setTrailEnabled(next: boolean) {
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Preference just won't persist. Not worth surfacing.
  }
  listeners.forEach((listener) => listener());
}

export function useTrailEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Whether this device can run the trail at all.
 *
 * Kept separate from the preference so the toggle can hide itself rather than
 * offering to turn on something that was never going to run. A control that
 * does nothing is worse than no control.
 */
export function canRunTrail(): boolean {
  if (typeof window === "undefined") return false;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;

  return !reducedMotion && !coarsePointer && !lowPower;
}

const CAPABILITY_QUERIES = [
  "(prefers-reduced-motion: reduce)",
  "(pointer: coarse)",
];

function subscribeCapability(onChange: () => void) {
  const queries = CAPABILITY_QUERIES.map((q) => window.matchMedia(q));
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => {
    queries.forEach((query) => query.removeEventListener("change", onChange));
  };
}

/**
 * Re-evaluates if the user changes their motion preference or switches input
 * device mid-session, so the toggle appears and disappears accordingly.
 */
export function useTrailSupported(): boolean {
  return useSyncExternalStore(subscribeCapability, canRunTrail, () => false);
}
