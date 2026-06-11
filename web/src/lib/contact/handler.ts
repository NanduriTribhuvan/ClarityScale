import { validateContact, type FieldErrors } from './schema';
import { buildContactEmail, type EmailConfig, type EmailSender } from './email';
import type { RateLimiter } from './rate-limit';

/**
 * Framework-agnostic core of the contact endpoint.
 *
 * Implements the agreed API contract and Requirements 8, 9, and 10. It returns
 * a plain status + body so it can be wrapped by an Astro endpoint (or tested
 * directly) without any HTTP framework coupling.
 *
 * Processing order:
 *   1. Honeypot   -> silent success, no email      (Req 9.1, 9.2, 9.4)
 *   2. Rate limit -> 429                            (Req 9.3)
 *   3. Validation -> 400 with per-field errors      (Req 8.2, 8.3)
 *   4. Send email -> 200 on success / 502 on failure (Req 10.1, 10.3)
 */

/** Honeypot field name shared with the client form. */
export const HONEYPOT_FIELD = 'company';

export type ContactResponseBody =
  | { ok: true }
  | { ok: false; errors: FieldErrors }
  | { ok: false; error: 'rate_limited' }
  | { ok: false; error: 'send_failed' }
  | { ok: false; error: 'bad_request' };

export interface ContactResult {
  status: number;
  body: ContactResponseBody;
  /** Seconds to advertise in a Retry-After header when rate limited. */
  retryAfterSeconds?: number;
}

export interface ContactDeps {
  /** Stable identifier for the caller (e.g. client IP) used for rate limiting. */
  clientId: string;
  rateLimiter: RateLimiter;
  emailConfig: EmailConfig;
  sendEmail: EmailSender;
  /** Current time in ms; injectable for deterministic tests. */
  now?: number;
  /** Failure logger; defaults to console.error. */
  logError?: (message: string, error: unknown) => void;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function handleContactSubmission(
  rawBody: unknown,
  deps: ContactDeps,
): Promise<ContactResult> {
  const now = deps.now ?? Date.now();
  const logError = deps.logError ?? ((m, e) => console.error(m, e));

  if (!isPlainObject(rawBody)) {
    return { status: 400, body: { ok: false, error: 'bad_request' } };
  }

  // 1. Honeypot: a populated hidden field means a bot. Respond as success so the
  //    bot gets no signal, but never send an email (Req 9.2, 9.4).
  const honeypot = rawBody[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    return { status: 200, body: { ok: true } };
  }

  // 2. Rate limit per client identifier (Req 9.3).
  const limit = deps.rateLimiter.check(deps.clientId, now);
  if (!limit.allowed) {
    return {
      status: 429,
      body: { ok: false, error: 'rate_limited' },
      retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
    };
  }

  // 3. Server-side validation (Req 8.2, 8.3).
  const validation = validateContact(rawBody);
  if (!validation.success || !validation.data) {
    return { status: 400, body: { ok: false, errors: validation.errors ?? {} } };
  }

  // 4. Deliver the email (Req 10.1). Failure -> 502 + log (Req 10.3).
  try {
    const email = buildContactEmail(validation.data, deps.emailConfig);
    await deps.sendEmail(email);
    return { status: 200, body: { ok: true } };
  } catch (error) {
    logError('Contact email delivery failed', error);
    return { status: 502, body: { ok: false, error: 'send_failed' } };
  }
}
