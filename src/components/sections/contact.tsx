"use client";

import { useState } from "react";
import { profile } from "@/data/profile";
import { Section } from "@/components/ui/section";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-lg border border-line bg-void px-3.5 py-2.5 text-[15px] text-hi placeholder:text-mute focus:border-accent focus:outline-none";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }

      setStatus("sent");
      event.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <Section id="contact" index="06" label="contact" title="Get in touch">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="hidden" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="font-mono text-[11px] text-mute">
                name
              </label>
              <input id="name" name="name" required className={`mt-2 ${field}`} />
            </div>
            <div>
              <label htmlFor="email" className="font-mono text-[11px] text-mute">
                email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`mt-2 ${field}`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="font-mono text-[11px] text-mute">
              message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className={`mt-2 resize-y ${field}`}
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-void transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send message"}
          </button>

          <p aria-live="polite" className="min-h-6 font-mono text-xs">
            {status === "sent" ? (
              <span className="text-terminal">
                Sent. I will get back to you.
              </span>
            ) : null}
            {status === "error" ? (
              <span className="text-spark">
                {message} You can email me directly instead.
              </span>
            ) : null}
          </p>
        </form>

        <aside className="space-y-6">
          <div>
            <p className="font-mono text-[11px] tracking-[0.08em] text-mute">
              or just email me
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-2 block break-all text-lg text-accent-soft underline underline-offset-4 hover:text-accent"
            >
              {profile.email}
            </a>
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.08em] text-mute">
              elsewhere
            </p>
            <ul className="mt-3 space-y-2">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-body underline underline-offset-4 hover:text-hi"
                  >
                    {s.label} — {s.handle} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Section>
  );
}
