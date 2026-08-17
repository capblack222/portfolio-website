import { NextResponse } from "next/server";

/**
 * Contact endpoint.
 *
 * Set RESEND_API_KEY and CONTACT_TO_EMAIL in the environment to enable
 * delivery. Without them the route returns 503 and the form tells the
 * visitor to use the mailto link instead — a visible fallback rather
 * than a form that silently swallows messages.
 */

type Payload = {
  name?: string;
  email?: string;
  message?: string;
  company?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Payload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real people leave this hidden field empty.
  if (body.company) {
    return NextResponse.json({ ok: true });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "That email looks off." }, { status: 400 });
  }

  if (message.length > 4000) {
    return NextResponse.json({ error: "That message is too long." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "The form is not wired up yet." },
      { status: 503 },
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Portfolio <onboarding@resend.dev>",
      to: [to],
      reply_to: email,
      subject: `Portfolio message from ${name}`,
      text: `${name} <${email}>\n\n${message}`,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not send that." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
