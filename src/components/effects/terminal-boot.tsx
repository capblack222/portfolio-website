"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Total time the overlay holds the screen, including the fade out.
 *
 * Tune this here and nowhere else. Shorter is almost always better: this is
 * time a visitor spends not reading the site. 2000–3000 is the range worth
 * trying if 5000 starts to feel long.
 */
const BOOT_MS = 3000;

const FADE_MS = 450;
const HINT_AFTER_MS = 600;

const LINES = [
  "> initializing portfolio... ",
  "> loading profile: nishtha_gupta ",
  "> role: Software Engineer ",
  // "> stack: [ python, aws, terraform ] ",
  "> region: us-east-1 ",
  // "> status: open to opportunities ",
  "> render() ",
];

const TOTAL_CHARS = LINES.reduce((sum, line) => sum + line.length, 0);
const TYPING_WINDOW = BOOT_MS - FADE_MS - 700;
const CHAR_MS = TYPING_WINDOW / TOTAL_CHARS;

/**
 * Terminal boot overlay, shown as a loading screen.
 *
 * The overlay markup is in the server HTML and covered by CSS from the first
 * paint — see #boot-overlay in globals.css. A pre-paint script in <head>
 * decides whether it plays. This component only drives the typing and the
 * exit; it never decides whether the screen is covered, which is what keeps
 * the no-flash guarantee out of React's hands.
 *
 * Constraints that are load-bearing:
 * - Hard cap at BOOT_MS, enforced by a timer independent of the typing loop.
 * - Skippable by key, click, or scroll, with a visible hint after 600ms.
 * - Once per session, not once per load.
 * - Skipped on reduced motion and on narrow viewports.
 * - aria-hidden, with the real page already rendered underneath.
 */
export function TerminalBoot() {
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [typed, setTyped] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const timers = useRef<number[]>([]);
  const done = useRef(false);

  const dismiss = useCallback(() => {
    if (done.current) return;
    done.current = true;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setLeaving(true);
    window.setTimeout(() => {
      document.documentElement.classList.add("boot-skip");
      document.body.style.overflow = "";
      setMounted(false);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    // The pre-paint script already made this decision; honour it rather than
    // re-deriving it, so the two can never disagree. No state change needed —
    // the .boot-skip class already hides the overlay via CSS, and bailing here
    // means the typing loop and listeners are never attached.
    if (document.documentElement.classList.contains("boot-skip")) return;

    let line = 0;
    let char = 0;

    const step = () => {
      if (line >= LINES.length) return;

      char++;
      const current = LINES[line]!.slice(0, char);

      setTyped((prev) => {
        const next = prev.slice(0, line);
        next[line] = current;
        return next;
      });

      if (char >= LINES[line]!.length) {
        line++;
        char = 0;
        timers.current.push(window.setTimeout(step, CHAR_MS * 4));
      } else {
        // Jitter: constant-speed typing reads as fake.
        timers.current.push(
          window.setTimeout(step, CHAR_MS * (0.6 + Math.random() * 0.8)),
        );
      }
    };

    timers.current.push(window.setTimeout(step, 120));
    timers.current.push(window.setTimeout(() => setShowHint(true), HINT_AFTER_MS));
    timers.current.push(window.setTimeout(dismiss, BOOT_MS - FADE_MS));

    const skip = () => dismiss();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("wheel", skip, { passive: true });

    const cleanupTimers = timers.current;

    return () => {
      cleanupTimers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
    };
  }, [dismiss]);

  if (!mounted) return null;

  return (
    <div
      id="boot-overlay"
      aria-hidden="true"
      className="flex flex-col justify-center px-6 sm:px-12"
      style={{
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      <pre className="font-mono text-[13px] leading-[2] text-terminal sm:text-sm">
        {typed.join("\n")}
        <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] bg-terminal" />
      </pre>

      <div className="mt-10 h-2 w-full max-w-[280px] bg-raised">
        <div
          className="h-full bg-accent"
          style={{
            animation: `boot-progress ${BOOT_MS - FADE_MS}ms linear forwards`,
          }}
        />
      </div>

      <p
        className="mt-5 font-mono text-[11px] text-mute"
        style={{
          opacity: showHint ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      >
        [ press any key to skip ]
      </p>
    </div>
  );
}
