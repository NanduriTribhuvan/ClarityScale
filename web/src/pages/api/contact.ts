import type { APIRoute } from 'astro';
import { handleContactSubmission } from '../../lib/contact/handler';
import { rateLimiter, getEmailConfig, getEmailSender } from '../../lib/contact/runtime';
import type { EmailConfig, EmailSender } from '../../lib/contact/email';

/**
 * Contact API endpoint (Requirement 8).
 *
 * Thin HTTP adapter over the framework-agnostic core in `lib/contact`.
 * Implements the agreed contract:
 *   POST /api/contact  -> 200 | 400 | 429 | 502
 *   any other method   -> 405
 *
 * This endpoint is server-rendered; the project must use SSR (Node adapter).
 */
export const prerender = false;

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** Best-effort client identifier for rate limiting. */
function resolveClientId(request: Request, clientAddress: string | undefined): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // First hop is the originating client.
    return forwarded.split(',')[0]!.trim();
  }
  return clientAddress ?? 'unknown';
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Resolve the email transport lazily. A missing configuration must NOT
  // short-circuit honeypot/validation/rate-limit handling — it should only
  // fail the actual send step (yielding 502). The config error is logged so
  // the developer is alerted rather than it failing silently (Req 10.4).
  let emailConfig: EmailConfig;
  let sendEmail: EmailSender;
  try {
    emailConfig = getEmailConfig();
    sendEmail = getEmailSender();
  } catch (error) {
    console.error('[contact] email is not configured; submissions cannot be delivered:', error);
    emailConfig = { apiKey: '', from: '', recipient: '' };
    sendEmail = () => Promise.reject(new Error('Email service is not configured'));
  }

  const result = await handleContactSubmission(rawBody, {
    clientId: resolveClientId(request, clientAddress),
    rateLimiter,
    emailConfig,
    sendEmail,
  });

  const headers: Record<string, string> = {};
  if (result.retryAfterSeconds !== undefined) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }
  return json(result.body, result.status, headers);
};

/** Any non-POST method is rejected with 405 (Req 8.5). */
const methodNotAllowed: APIRoute = () =>
  json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
