import { z } from 'zod';

/**
 * Field length bounds (Requirement 8.6 — bound payload size).
 * Kept generous enough for real inquiries but small enough to reject abuse.
 */
export const FIELD_LIMITS = {
  name: { min: 1, max: 100 },
  email: { min: 3, max: 254 }, // 254 = max length of an email address per RFC 5321
  message: { min: 1, max: 5000 },
} as const;

/**
 * Server-side validation schema for a contact submission (Requirement 8.2).
 * `.trim()` runs before length checks so whitespace-only values are rejected.
 *
 * Note: the honeypot field (`company`) is intentionally NOT part of this schema.
 * It is inspected separately by the spam filter before validation runs.
 */
export const contactSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.', invalid_type_error: 'Name is required.' })
    .trim()
    .min(FIELD_LIMITS.name.min, 'Name is required.')
    .max(FIELD_LIMITS.name.max, `Name must be ${FIELD_LIMITS.name.max} characters or fewer.`),
  email: z
    .string({ required_error: 'Email is required.', invalid_type_error: 'Email is required.' })
    .trim()
    .min(FIELD_LIMITS.email.min, 'Email is required.')
    .max(FIELD_LIMITS.email.max, `Email must be ${FIELD_LIMITS.email.max} characters or fewer.`)
    .email('Enter a valid email address.'),
  message: z
    .string({ required_error: 'Message is required.', invalid_type_error: 'Message is required.' })
    .trim()
    .min(FIELD_LIMITS.message.min, 'Message is required.')
    .max(
      FIELD_LIMITS.message.max,
      `Message must be ${FIELD_LIMITS.message.max} characters or fewer.`,
    ),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Per-field error map returned to the client on a 400 response. */
export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

export interface ValidationResult {
  success: boolean;
  data?: ContactInput;
  errors?: FieldErrors;
}

/**
 * Validate an untrusted payload against {@link contactSchema}.
 * Returns the first error per field, keyed by field name, for a clean client response.
 */
export function validateContact(raw: unknown): ValidationResult {
  const parsed = contactSchema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (
      (field === 'name' || field === 'email' || field === 'message') &&
      errors[field] === undefined
    ) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
