/**
 * Treat all submitted values as untrusted (Requirement 8.7).
 * These helpers neutralise control characters and HTML before submitted
 * content is placed into an outgoing email.
 */

/** Remove ASCII control characters except tab/newline/carriage-return. */
export function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/** Escape the five HTML-significant characters so values are safe in an HTML email body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Collapse line breaks to prevent header injection when a value is used in a
 * single-line context such as an email subject or the Reply-To address.
 */
export function toSingleLine(value: string): string {
  return stripControlChars(value).replace(/[\r\n]+/g, ' ').trim();
}
