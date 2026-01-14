// Client-side rate limiter for authentication endpoints
// Prevents spam attacks on login/signup

class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.blocked = new Set();
  }

  // Check if action is allowed
  isAllowed(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    
    // Check if blocked
    if (this.blocked.has(key)) {
      const blockUntil = this.blocked.get(key);
      if (now < blockUntil) {
        const remainingSeconds = Math.ceil((blockUntil - now) / 1000);
        return { allowed: false, remainingSeconds };
      }
      this.blocked.delete(key);
    }

    // Get attempt history
    const attemptHistory = this.attempts.get(key) || [];
    
    // Remove old attempts outside window
    const recentAttempts = attemptHistory.filter(time => now - time < windowMs);
    
    // Check if exceeded limit
    if (recentAttempts.length >= maxAttempts) {
      // Block for 5 minutes
      const blockUntil = now + 300000;
      this.blocked.set(key, blockUntil);
      return { allowed: false, remainingSeconds: 300 };
    }

    return { allowed: true };
  }

  // Record an attempt
  recordAttempt(key) {
    const now = Date.now();
    const attemptHistory = this.attempts.get(key) || [];
    attemptHistory.push(now);
    this.attempts.set(key, attemptHistory);
  }

  // Reset attempts for a key (on successful login)
  reset(key) {
    this.attempts.delete(key);
    this.blocked.delete(key);
  }

  // Clear old data periodically
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    // Clean attempts
    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(time => now - time < maxAge);
      if (recentAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, recentAttempts);
      }
    }

    // Clean blocks
    for (const [key, blockUntil] of this.blocked.entries()) {
      if (now >= blockUntil) {
        this.blocked.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 300000);

export default rateLimiter;
