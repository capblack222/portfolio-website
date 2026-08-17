import { profile } from "@/data/profile";
import { Reveal } from "@/components/effects/reveal";

export function Hero() {
  return (
    <Reveal>
      <header className="relative flex min-h-[88vh] flex-col justify-center py-24">
      <p className="font-mono text-[11px] tracking-[0.08em] text-mute">
        {"// 01 — hero"}
      </p>

      <h1 className="mt-6 max-w-[18ch] text-[clamp(2.25rem,7vw,4.25rem)]">
        {profile.headline}
      </h1>

      <p className="mt-6 max-w-[46ch] text-lg text-body">
        {profile.subline}
      </p>

      <p className="mt-3 max-w-[52ch] text-body">
        {profile.name} — {profile.role}, {profile.location}.
      </p>

      {profile.status.active ? (
        <p className="mt-6 inline-flex w-fit items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-xs text-terminal">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 rounded-full bg-terminal"
          />
          {profile.status.label}
        </p>
      ) : null}

      <nav aria-label="Primary" className="mt-10 flex flex-wrap gap-3">
        <a
          href="#projects"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-void transition-opacity hover:opacity-90"
        >
          View projects
        </a>
        <a
          href="#contact"
          className="rounded-lg border border-line px-5 py-2.5 text-sm text-body transition-colors hover:border-line-glow hover:text-hi"
        >
          Get in touch
        </a>
        {profile.socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-lg border border-line px-5 py-2.5 text-sm text-body transition-colors hover:border-line-glow hover:text-hi"
          >
            {s.label}
          </a>
        ))}
        </nav>
      </header>
    </Reveal>
  );
}
