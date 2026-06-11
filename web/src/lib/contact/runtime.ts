import { RateLimiter } from './rate-limit';
import { loadEmailConfig, createResendSender, type EmailConfig, type EmailSender } from './email';

/**
 * Process-level singletons for the contact endpoint.
 *
 * The rate limiter holds per-client windows in memory for the life of the
 * Node process. Email configuration is resolved lazily on first use so that a
 * misconfiguration throws at request time (and is logged) rather than crashing
 * module import.
 */

/** Allow 5 submissions per client per 10 minutes. Tune via env if desired. */
const RATE_LIMIT = {
  limit: Number(process.env.CONTACT_RATE_LIMIT ?? 5),
  windowMs: Number(process.env.CONTACT_RATE_WINDOW_MS ?? 10 * 60 * 1000),
};

export const rateLimiter = new RateLimiter(RATE_LIMIT);

let cachedConfig: EmailConfig | undefined;
let cachedSender: EmailSender | undefined;

/** Resolve (and memoise) the email config from the environment. */
export function getEmailConfig(): EmailConfig {
  if (!cachedConfig) {
    cachedConfig = loadEmailConfig(process.env as Record<string, string | undefined>);
  }
  return cachedConfig;
}

/** Resolve (and memoise) the Resend-backed email sender. */
export function getEmailSender(): EmailSender {
  if (!cachedSender) {
    cachedSender = createResendSender(getEmailConfig());
  }
  return cachedSender;
}
