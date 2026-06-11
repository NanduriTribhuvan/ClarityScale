import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleContactSubmission, HONEYPOT_FIELD, type ContactDeps } from './handler';
import { RateLimiter } from './rate-limit';
import type { EmailConfig, OutgoingEmail } from './email';

const emailConfig: EmailConfig = {
  apiKey: 'test-key',
  from: 'ClarityScale <hello@clarityscale.io>',
  recipient: 'owner@clarityscale.io',
};

const validBody = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like a new website.',
  [HONEYPOT_FIELD]: '',
};

function makeDeps(overrides: Partial<ContactDeps> = {}): {
  deps: ContactDeps;
  sent: OutgoingEmail[];
  sendEmail: ReturnType<typeof vi.fn>;
} {
  const sent: OutgoingEmail[] = [];
  const sendEmail = vi.fn(async (email: OutgoingEmail) => {
    sent.push(email);
  });
  const deps: ContactDeps = {
    clientId: '203.0.113.5',
    rateLimiter: new RateLimiter({ limit: 5, windowMs: 60_000 }),
    emailConfig,
    sendEmail,
    now: 0,
    logError: vi.fn(),
    ...overrides,
  };
  return { deps, sent, sendEmail };
}

describe('handleContactSubmission', () => {
  let deps: ContactDeps;
  let sendEmail: ReturnType<typeof vi.fn>;
  let sent: OutgoingEmail[];

  beforeEach(() => {
    ({ deps, sendEmail, sent } = makeDeps());
  });

  it('returns 200 and sends an email for a valid submission', async () => {
    const result = await handleContactSubmission(validBody, deps);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true });
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sent[0].to).toBe(emailConfig.recipient);
    expect(sent[0].replyTo).toBe('ada@example.com');
    expect(sent[0].text).toContain('Ada Lovelace');
  });

  it('silently succeeds without emailing when the honeypot is filled', async () => {
    const result = await handleContactSubmission(
      { ...validBody, [HONEYPOT_FIELD]: 'spam-bot-co' },
      deps,
    );
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 400 with field errors for invalid input', async () => {
    const result = await handleContactSubmission(
      { name: '', email: 'nope', message: '' },
      deps,
    );
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ ok: false });
    if ('errors' in result.body) {
      expect(result.body.errors.name).toBeDefined();
      expect(result.body.errors.email).toBeDefined();
      expect(result.body.errors.message).toBeDefined();
    }
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 400 for a non-object body', async () => {
    const result = await handleContactSubmission('not json', deps);
    expect(result.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 429 once the rate limit is exceeded', async () => {
    const limited = makeDeps({
      rateLimiter: new RateLimiter({ limit: 2, windowMs: 60_000 }),
    });
    await handleContactSubmission(validBody, limited.deps);
    await handleContactSubmission(validBody, limited.deps);
    const third = await handleContactSubmission(validBody, limited.deps);
    expect(third.status).toBe(429);
    expect(third.body).toEqual({ ok: false, error: 'rate_limited' });
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
    expect(limited.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('returns 502 and logs when email delivery fails', async () => {
    const logError = vi.fn();
    const failing = makeDeps({
      sendEmail: vi.fn(async () => {
        throw new Error('provider down');
      }),
      logError,
    });
    const result = await handleContactSubmission(validBody, failing.deps);
    expect(result.status).toBe(502);
    expect(result.body).toEqual({ ok: false, error: 'send_failed' });
    expect(logError).toHaveBeenCalledOnce();
  });

  it('does not leak honeypot rejection as a separate status (anti-fingerprinting)', async () => {
    const result = await handleContactSubmission(
      { ...validBody, [HONEYPOT_FIELD]: 'x' },
      deps,
    );
    // Identical shape to a real success so bots cannot distinguish.
    expect(result).toMatchObject({ status: 200, body: { ok: true } });
    expect(sent).toHaveLength(0);
  });
});
