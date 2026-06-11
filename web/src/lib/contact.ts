/**
 * Shared contact-form contract types.
 *
 * This is the agreed seam between the frontend (this file's consumers) and the
 * backend owner (Kiro). Both sides import these types so the request/response
 * shapes stay in lock-step. Do NOT add server logic here.
 *
 * Endpoint: POST /api/contact  (application/json)
 */

/** Request body sent to POST /api/contact. `company` is the honeypot. */
export interface ContactRequest {
  name: string;
  email: string;
  message: string;
  /** Honeypot — must be empty for real users; rendered visually hidden. */
  company: string;
}

/** 200 */
export interface ContactSuccess {
  ok: true;
}

/** 400 — per-field validation errors from the server. */
export interface ContactFieldErrors {
  ok: false;
  errors: {
    name?: string;
    email?: string;
    message?: string;
  };
}

/** 429 (rate_limited) / 502 (send_failed) and other generic errors. */
export interface ContactGenericError {
  ok: false;
  error: string;
}

export type ContactResponse = ContactSuccess | ContactFieldErrors | ContactGenericError;

/** Keys of the user-facing fields that can carry a server validation error. */
export type ContactFieldName = 'name' | 'email' | 'message';
