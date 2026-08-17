"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type RevealProps = {
  children: React.ReactNode;
  /** Stagger delay in ms. Keep under 400 — longer reads as lag, not polish. */
  delay?: number;
  className?: string;
};

/**
 * Fades and lifts children into view once, then stops observing.
 *
 * Renders visible on the server, so the content is in the HTML for crawlers
 * and for anyone without JS. The hidden state only ever applies on the client
 * and only when motion is welcome.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduced || typeof IntersectionObserver === "undefined") return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.unobserve(entry.target);
      },
      { rootMargin: "-12% 0px -12% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const hidden = !reduced && !shown;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(16px)" : "none",
        transition: "opacity 520ms ease-out, transform 520ms ease-out",
        transitionDelay: `${delay}ms`,
        willChange: hidden ? "opacity, transform" : undefined,
      }}
    >
      {children}
    </div>
  );
}
