"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LINES = [
  "> initializing portfolio...",
  "> loading profile: nishtha_gupta",
  "> stack: [ python, aws, terraform ]",
  "> status: open to opportunities",
  "> render()",
];

const HARD_CAP_MS = 2200;
const HINT_AFTER_MS = 400;
const SESSION_KEY = "boot-played";

/**
 * Terminal boot overlay.
 *
 * The riskiest element on the site, so every constraint here is load-bearing:
 *
 * - Hard 2.2s cap, enforced by a timer independent of the typing loop. If
 *   typing stalls for any reason, the overlay still leaves.
 * - Skippable by key, click, or scroll, with a visible hint after 400ms.
 * - Once per session, not once per load, so navigating back is not punished.
 * - Skipped entirely on reduced-motion and on narrow viewports.
 * - aria-hidden, and the real page is already rendered underneath, so this
 *   never blocks LCP and never reaches a screen reader.
 */
export function TerminalBoot() {
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [typed, setTyped] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLeaving(true);
    window.setTimeout(() => setActive(false), 450);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 639px)").matches;
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === "1";

    if (reduced || narrow || alreadyPlayed) return;

    sessionStorage.setItem(SESSION_KEY, "1");

    let line = 0;
    let char = 0;

    const step = () => {
      if (line >= LINES.length) {
        timers.current.push(window.setTimeout(dismiss, 260));
        return;
      }

      char++;
      const current = LINES[line].slice(0, char);

      setTyped((prev) => {
        const next = prev.slice(0, line);
        next[line] = current;
        return next;
      });

      if (char >= LINES[line]!.length) {
        line++;
        char = 0;
        timers.current.push(window.setTimeout(step, 90));
      } else {
        // Jitter: constant-speed typing reads as fake.
        timers.current.push(window.setTimeout(step, 14 + Math.random() * 16));
      }
    };

    // Mounting the overlay from a timer rather than synchronously here means
    // the page has already painted underneath before it appears, so the
    // overlay can never be what delays LCP.
    timers.current.push(
      window.setTimeout(() => {
        setActive(true);
        step();
      }, 0),
    );

    timers.current.push(window.setTimeout(() => setShowHint(true), HINT_AFTER_MS));
    timers.current.push(window.setTimeout(dismiss, HARD_CAP_MS));

    const onKey = () => dismiss();
    const onClick = () => dismiss();
    const onScroll = () => dismiss();

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    window.addEventListener("wheel", onScroll, { passive: true });

    const cleanupTimers = timers.current;

    return () => {
      cleanupTimers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onClick);
      window.removeEventListener("wheel", onScroll);
    };
  }, [dismiss]);

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 bg-void px-6 py-16 sm:px-12 sm:py-24"
      style={{
        opacity: leaving ? 0 : 1,
        transition: "opacity 420ms ease",
      }}
    >
      <pre className="font-mono text-[13px] leading-[1.9] text-terminal sm:text-sm">
        {typed.join("\n")}
        <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] bg-terminal" />
      </pre>

      {showHint ? (
        <p className="mt-8 font-mono text-[11px] text-mute">
          [ press any key to skip ]
        </p>
      ) : null}
    </div>
  );
}
