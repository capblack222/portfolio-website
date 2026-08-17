"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/profile";

const LINKS = [
  { id: "about", label: "about" },
  { id: "projects", label: "projects" },
  { id: "skills", label: "skills" },
  { id: "experience", label: "experience" },
  { id: "contact", label: "contact" },
];

/**
 * Sticky nav that appears once the hero has scrolled away.
 *
 * Visibility is driven by an IntersectionObserver on a sentinel placed at the
 * end of the hero, not by a scroll listener. A scroll handler would fire on
 * every frame of every scroll for one boolean; the observer fires twice.
 *
 * The active link is tracked the same way, watching the sections themselves.
 */
export function SiteNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sentinel = document.getElementById("hero-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const onScreen = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (onScreen[0]) setActive(onScreen[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 border-b border-line bg-void/80 backdrop-blur"
      style={{
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        transition: "transform 320ms ease, opacity 320ms ease",
        pointerEvents: visible ? "auto" : "none",
      }}
      // Hidden from assistive tech while off-screen, so the links are not
      // announced twice. The in-page nav in the hero remains available.
      aria-hidden={!visible}
    >
      <nav
        aria-label="Sections"
        className="mx-auto flex w-full max-w-[1120px] items-center gap-6 px-6 py-3 sm:px-8"
      >
        <a
          href="#main"
          className="shrink-0 font-mono text-xs text-hi transition-colors hover:text-accent-soft"
          tabIndex={visible ? 0 : -1}
        >
          {profile.name.toLowerCase().replace(" ", "_")}
        </a>

        <ul className="flex flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                tabIndex={visible ? 0 : -1}
                aria-current={active === link.id ? "true" : undefined}
                className={`block whitespace-nowrap rounded-md px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
                  active === link.id
                    ? "bg-raised text-hi"
                    : "text-mute hover:text-body"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={`mailto:${profile.email}`}
          tabIndex={visible ? 0 : -1}
          className="hidden shrink-0 rounded-md bg-accent px-3.5 py-1.5 font-mono text-[11px] text-void transition-opacity hover:opacity-90 sm:block"
        >
          email
        </a>
      </nav>
    </div>
  );
}
