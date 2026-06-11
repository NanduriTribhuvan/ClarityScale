import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rate-limit';

describe('RateLimiter', () => {
  it('allows up to the limit within a window', () => {
    const rl = new RateLimiter({ limit: 3, windowMs: 1000 });
    expect(rl.check('ip', 0).allowed).toBe(true);
    expect(rl.check('ip', 100).allowed).toBe(true);
    expect(rl.check('ip', 200).allowed).toBe(true);
  });

  it('blocks once the limit is exceeded within the window', () => {
    const rl = new RateLimiter({ limit: 2, windowMs: 1000 });
    rl.check('ip', 0);
    rl.check('ip', 10);
    const blocked = rl.check('ip', 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(980);
  });

  it('resets after the window elapses', () => {
    const rl = new RateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check('ip', 0).allowed).toBe(true);
    expect(rl.check('ip', 500).allowed).toBe(false);
    expect(rl.check('ip', 1000).allowed).toBe(true);
  });

  it('tracks each key independently', () => {
    const rl = new RateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check('a', 0).allowed).toBe(true);
    expect(rl.check('b', 0).allowed).toBe(true);
    expect(rl.check('a', 0).allowed).toBe(false);
  });

  it('does not extend the window when blocked', () => {
    const rl = new RateLimiter({ limit: 1, windowMs: 1000 });
    rl.check('ip', 0);
    rl.check('ip', 900); // blocked, must not push the window forward
    expect(rl.check('ip', 1000).allowed).toBe(true);
  });

  it('prunes elapsed windows', () => {
    const rl = new RateLimiter({ limit: 1, windowMs: 1000 });
    rl.check('ip', 0);
    rl.prune(2000);
    // After pruning, the key starts fresh.
    expect(rl.check('ip', 2100).remaining).toBe(0);
  });
});
