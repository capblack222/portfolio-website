/**
 * Contact form handler.
 *
 * Runtime: Node.js 22 (ESM). Uses the AWS SDK v3, which is preinstalled in the
 * Lambda Node runtime — so this function has no dependencies to bundle and can
 * be pasted straight into the console editor.
 *
 * Environment variables:
 *   CONTACT_TO_EMAIL    verified SES address that receives the message
 *   CONTACT_FROM_EMAIL  verified SES address messages are sent from
 *   ALLOWED_ORIGIN      your site origin, e.g. https://gupnish.dev
 */

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      // Locked to your own origin. "*" would let any site post through your
      // Lambda and spend your SES quota.
      "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  const method =
    event.requestContext?.http?.method ?? event.httpMethod ?? "POST";

  if (method === "OPTIONS") return respond(204, {});
  if (method !== "POST") return respond(405, { error: "Method not allowed." });

  let payload;
  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return respond(400, { error: "Invalid request." });
  }

  // Honeypot: a filled hidden field means a bot. Return 200 so it does not
  // learn anything, but send nothing.
  if (payload.company) return respond(200, { ok: true });

  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const message = (payload.message ?? "").trim();

  if (!name || !email || !message) {
    return respond(400, { error: "All fields are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return respond(400, { error: "That email looks off." });
  }
  if (message.length > 4000 || name.length > 200) {
    return respond(400, { error: "That message is too long." });
  }

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: process.env.CONTACT_FROM_EMAIL,
        Destination: { ToAddresses: [process.env.CONTACT_TO_EMAIL] },
        // Lets you hit reply and answer the sender directly.
        ReplyToAddresses: [email],
        Content: {
          Simple: {
            Subject: { Data: `Portfolio message from ${name}` },
            Body: {
              Text: { Data: `${name} <${email}>\n\n${message}` },
            },
          },
        },
      })
    );

    return respond(200, { ok: true });
  } catch (error) {
    console.error("SES send failed", error);
    return respond(502, { error: "Could not send that." });
  }
};
