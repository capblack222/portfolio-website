"use client";

import {
  setTrailEnabled,
  useTrailEnabled,
  useTrailSupported,
} from "@/lib/trail-preference";

/**
 * Floating control for the cursor trail.
 *
 * Renders nothing at all on devices where the trail cannot run, so it never
 * offers to toggle something that was never going to appear.
 */
export function TrailToggle() {
  const enabled = useTrailEnabled();
  const supported = useTrailSupported();

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => setTrailEnabled(!enabled)}
      aria-pressed={enabled}
      aria-label="Cursor trail"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full border border-line bg-surface/90 px-4 py-2.5 font-mono text-[11px] text-body backdrop-blur transition-colors hover:border-line-glow hover:text-hi"
    >
      <span
        aria-hidden="true"
        className={`inline-block size-2 transition-colors ${
          enabled ? "bg-terminal" : "bg-mute"
        }`}
      />
      {enabled ? "trail on" : "trail off"}
    </button>
  );
}
