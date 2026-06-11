/**
 * Fixed-window in-memory rate limiter (Requirement 9.3).
 *
 * Deterministic by design: the caller passes `now` so the limiter can be tested
 * without manipulating the system clock. Suitable for a single Node instance;
 * for multi-instance deployments swap the store for a shared backend (e.g. Redis)
 * behind the same interface.
 */

export interface RateLimitResult {
  /** Whether this request is permitted. */
  allowed: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Milliseconds until the window resets (only meaningful when blocked). */
  retryAfterMs: number;
}

interface WindowEntry {
  count: number;
  windowStart: number;
}

export interface RateLimiterOptions {
  /** Maximum allowed requests per key within a window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export class RateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly store = new Map<string, WindowEntry>();

  constructor(options: RateLimiterOptions) {
    if (options.limit < 1) throw new Error('RateLimiter limit must be >= 1');
    if (options.windowMs < 1) throw new Error('RateLimiter windowMs must be >= 1');
    this.limit = options.limit;
    this.windowMs = options.windowMs;
  }

  /**
   * Register an attempt for `key` at time `now` and report whether it is allowed.
   * A blocked attempt does NOT extend the window (fixed-window semantics).
   */
  check(key: string, now: number = Date.now()): RateLimitResult {
    const entry = this.store.get(key);

    if (entry === undefined || now - entry.windowStart >= this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: this.limit - 1, retryAfterMs: 0 };
    }

    if (entry.count < this.limit) {
      entry.count += 1;
      return { allowed: true, remaining: this.limit - entry.count, retryAfterMs: 0 };
    }

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.windowStart + this.windowMs - now,
    };
  }

  /** Remove windows that have fully elapsed to bound memory use. */
  prune(now: number = Date.now()): void {
    for (const [key, entry] of this.store) {
      if (now - entry.windowStart >= this.windowMs) {
        this.store.delete(key);
      }
    }
  }

  /** Test/maintenance helper. */
  reset(): void {
    this.store.clear();
  }
}
