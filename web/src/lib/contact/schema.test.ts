import { describe, it, expect } from 'vitest';
import { validateContact, FIELD_LIMITS } from './schema';

const valid = { name: 'Ada Lovelace', email: 'ada@example.com', message: 'I need a website.' };

describe('validateContact', () => {
  it('accepts a well-formed submission', () => {
    const result = validateContact(valid);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(valid);
  });

  it('trims surrounding whitespace from accepted values', () => {
    const result = validateContact({ name: '  Ada  ', email: ' ada@example.com ', message: ' hi ' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'Ada', email: 'ada@example.com', message: 'hi' });
  });

  it('rejects an empty name', () => {
    const result = validateContact({ ...valid, name: '   ' });
    expect(result.success).toBe(false);
    expect(result.errors?.name).toBeDefined();
  });

  it('rejects a missing message', () => {
    const result = validateContact({ name: valid.name, email: valid.email });
    expect(result.success).toBe(false);
    expect(result.errors?.message).toBeDefined();
  });

  it('rejects a syntactically invalid email', () => {
    const result = validateContact({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.errors?.email).toBeDefined();
  });

  it('reports errors for every invalid field at once', () => {
    const result = validateContact({ name: '', email: 'bad', message: '' });
    expect(result.success).toBe(false);
    expect(result.errors?.name).toBeDefined();
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.message).toBeDefined();
  });

  it('enforces the maximum field lengths', () => {
    const result = validateContact({
      name: 'a'.repeat(FIELD_LIMITS.name.max + 1),
      email: `${'a'.repeat(FIELD_LIMITS.email.max)}@x.com`,
      message: 'm'.repeat(FIELD_LIMITS.message.max + 1),
    });
    expect(result.success).toBe(false);
    expect(result.errors?.name).toBeDefined();
    expect(result.errors?.message).toBeDefined();
  });

  it('rejects non-object payloads', () => {
    expect(validateContact(null).success).toBe(false);
    expect(validateContact('string').success).toBe(false);
    expect(validateContact(42).success).toBe(false);
  });
});
