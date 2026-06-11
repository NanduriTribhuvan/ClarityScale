import type { ContactInput } from './schema';
import { escapeHtml, toSingleLine, stripControlChars } from './sanitize';

/**
 * Email delivery layer (Requirement 10).
 *
 * Configuration is read from the environment, never from source (10.2), and a
 * missing configuration surfaces as a thrown error rather than silently
 * disabling delivery (10.4).
 */

export interface EmailConfig {
  /** Provider API key (e.g. Resend). */
  apiKey: string;
  /** Verified sender address, e.g. "ClarityScale <hello@clarityscale.io>". */
  from: string;
  /** Inbox that receives inquiries. */
  recipient: string;
}

/** A transport-agnostic email message. */
export interface OutgoingEmail {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}

/** Anything that can deliver an {@link OutgoingEmail}. Enables test doubles. */
export type EmailSender = (email: OutgoingEmail) => Promise<void>;

const ENV_KEYS = {
  apiKey: 'RESEND_API_KEY',
  from: 'CONTACT_FROM',
  recipient: 'CONTACT_RECIPIENT',
} as const;

type EnvLike = Record<string, string | undefined>;

/**
 * Load and validate email configuration from an environment-like object.
 * @throws Error listing every missing variable (Requirement 10.4).
 */
export function loadEmailConfig(env: EnvLike): EmailConfig {
  const missing: string[] = [];
  const apiKey = env[ENV_KEYS.apiKey];
  const from = env[ENV_KEYS.from];
  const recipient = env[ENV_KEYS.recipient];

  if (!apiKey) missing.push(ENV_KEYS.apiKey);
  if (!from) missing.push(ENV_KEYS.from);
  if (!recipient) missing.push(ENV_KEYS.recipient);

  if (missing.length > 0) {
    throw new Error(
      `Contact email is misconfigured. Missing environment variable(s): ${missing.join(', ')}.`,
    );
  }

  return { apiKey: apiKey!, from: from!, recipient: recipient! };
}

/**
 * Build a sanitised {@link OutgoingEmail} from a validated submission.
 * All visitor-supplied values are neutralised before composition (Requirement 8.7).
 */
export function buildContactEmail(input: ContactInput, config: EmailConfig): OutgoingEmail {
  const name = toSingleLine(input.name);
  const email = toSingleLine(input.email);
  const message = stripControlChars(input.message);

  const subject = `New ClarityScale inquiry from ${name}`;

  const text = [
    'New project inquiry via ClarityScale contact form',
    '',
    `Name:    ${name}`,
    `Email:   ${email}`,
    '',
    'Message:',
    message,
  ].join('\n');

  const html = [
    '<h2>New project inquiry</h2>',
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    '<p><strong>Message:</strong></p>',
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  ].join('\n');

  return {
    to: config.recipient,
    from: config.from,
    // Lets the owner reply straight to the visitor; single-lined to prevent header injection.
    replyTo: email,
    subject,
    text,
    html,
  };
}

/**
 * Create an {@link EmailSender} backed by Resend.
 * The SDK is imported dynamically so unit tests and non-sending code paths
 * never need the dependency installed.
 */
export function createResendSender(config: EmailConfig): EmailSender {
  return async (email: OutgoingEmail) => {
    const { Resend } = await import('resend');
    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: email.from,
      to: email.to,
      replyTo: email.replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    if (error) {
      throw new Error(`Resend failed to send: ${error.message ?? 'unknown error'}`);
    }
  };
}
