/** @jsxImportSource preact */
import { useState, useRef } from 'preact/hooks';

/**
 * Contact form island (Requirement 7).
 *
 * Hydrated on its own (client:visible) so the rest of the page stays static.
 * Posts JSON to the contact API per the agreed contract:
 *   POST /api/contact  { name, email, message, company }
 *   200 { ok:true }                          -> success confirmation
 *   400 { ok:false, errors:{...} }           -> per-field errors
 *   429 { ok:false, error:'rate_limited' }   -> friendly retry message
 *   502 { ok:false, error:'send_failed' }    -> generic error, allow resubmit
 *
 * `company` is a hidden honeypot — must stay empty for real visitors.
 * Works fully without the animation island (Requirement 7.7).
 */

type FieldName = 'name' | 'email' | 'message';
type FieldErrors = Partial<Record<FieldName, string>>;
type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>('');
  const honeypotRef = useRef<HTMLInputElement>(null);

  /** Lightweight client-side checks for UX; the server is the source of truth. */
  function clientValidate(values: Record<FieldName, string>): FieldErrors {
    const next: FieldErrors = {};
    if (!values.name.trim()) next.name = 'Name is required.';
    if (!values.email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (!values.message.trim()) next.message = 'Message is required.';
    return next;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (status === 'submitting') return;

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const values: Record<FieldName, string> = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    const company = String(data.get('company') ?? '');

    const clientErrors = clientValidate(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setStatus('error');
      setFormError('Please fix the highlighted fields.');
      return;
    }

    setErrors({});
    setFormError('');
    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, company }),
      });

      if (res.ok) {
        setStatus('success');
        form.reset();
        return;
      }

      let body: { errors?: FieldErrors; error?: string } = {};
      try {
        body = await res.json();
      } catch {
        /* non-JSON error body */
      }

      if (res.status === 400 && body.errors) {
        setErrors(body.errors);
        setFormError('Please fix the highlighted fields.');
      } else if (res.status === 429) {
        setFormError('You have sent a few messages already. Please try again in a little while.');
      } else {
        setFormError("Something went wrong sending your message. Please try again, or email us directly.");
      }
      setStatus('error');
    } catch {
      setFormError('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  }

  return (
    <div class="contact-band" id="contact-form">
      <div class="contact-band-head">
        <h3>Tell us about your project</h3>
        <p>Fill in the form and we'll get back to you within 24 hours.</p>
      </div>

      {status === 'success' ? (
        <div class="form-status success" role="status" aria-live="polite">
          Thanks for reaching out — your message is on its way. We'll reply within 24 hours.
        </div>
      ) : (
        <form class="contact-form" onSubmit={handleSubmit} noValidate>
          <div class={`field${errors.name ? ' invalid' : ''}`}>
            <label for="cf-name">
              Name<span class="req" aria-hidden="true">*</span>
            </label>
            <input
              id="cf-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'cf-name-error' : undefined}
              placeholder="Your name"
            />
            <span class="field-error" id="cf-name-error">
              {errors.name ?? ''}
            </span>
          </div>

          <div class={`field${errors.email ? ' invalid' : ''}`}>
            <label for="cf-email">
              Email<span class="req" aria-hidden="true">*</span>
            </label>
            <input
              id="cf-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'cf-email-error' : undefined}
              placeholder="you@company.com"
            />
            <span class="field-error" id="cf-email-error">
              {errors.email ?? ''}
            </span>
          </div>

          <div class={`field${errors.message ? ' invalid' : ''}`}>
            <label for="cf-message">
              Message<span class="req" aria-hidden="true">*</span>
            </label>
            <textarea
              id="cf-message"
              name="message"
              required
              aria-required="true"
              aria-invalid={errors.message ? 'true' : 'false'}
              aria-describedby={errors.message ? 'cf-message-error' : undefined}
              placeholder="Tell us what you're looking to build..."
            />
            <span class="field-error" id="cf-message-error">
              {errors.message ?? ''}
            </span>
          </div>

          {/* Honeypot — hidden from humans + assistive tech, attractive to bots. */}
          <div class="hp-field" aria-hidden="true">
            <label for="cf-company">Company (leave blank)</label>
            <input
              id="cf-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              ref={honeypotRef}
            />
          </div>

          {formError && status === 'error' ? (
            <div class="form-status error" role="alert" aria-live="assertive">
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            class="btn btn-primary btn-lg btn-full contact-submit"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <span class="spinner" aria-hidden="true" /> Sending…
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
