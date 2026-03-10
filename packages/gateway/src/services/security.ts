import { StorageService } from './storage';

/**
 * Security service for pairing code operations
 */
export class SecurityService {
  private storage: StorageService;
  private failedAttempts: Map<string, { count: number; lockedUntil: number }>;

  constructor(storage: StorageService) {
    this.storage = storage;
    this.failedAttempts = new Map();
  }

  /**
   * Check if an IP is locked out due to too many failed attempts
   */
  isLocked(ip: string): boolean {
    const attempts = this.failedAttempts.get(ip);
    if (!attempts) return false;

    if (Date.now() < attempts.lockedUntil) {
      return true;
    }

    // Lock expired, clear it
    this.failedAttempts.delete(ip);
    return false;
  }

  /**
   * Get remaining lock time in seconds
   */
  getRemainingLockTime(ip: string): number {
    const attempts = this.failedAttempts.get(ip);
    if (!attempts) return 0;

    const remaining = Math.max(0, Math.ceil((attempts.lockedUntil - Date.now()) / 1000));
    return remaining;
  }

  /**
   * Record a failed pairing attempt
   * Returns true if this failure triggered a lockout
   */
  recordFailedAttempt(ip: string): boolean {
    const MAX_ATTEMPTS = 3;
    const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes

    let attempts = this.failedAttempts.get(ip);
    if (!attempts) {
      attempts = { count: 0, lockedUntil: 0 };
    }

    attempts.count++;

    // Lock out after MAX_ATTEMPTS failures
    if (attempts.count >= MAX_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + LOCK_DURATION;
      this.failedAttempts.set(ip, attempts);
      return true;
    }

    this.failedAttempts.set(ip, attempts);
    return false;
  }

  /**
   * Clear failed attempts for an IP (on successful pairing)
   */
  clearFailedAttempts(ip: string): void {
    this.failedAttempts.delete(ip);
  }

  /**
   * Clean up expired lockouts (call periodically)
   */
  cleanupExpiredLockouts(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [ip, attempts] of this.failedAttempts.entries()) {
      if (now >= attempts.lockedUntil) {
        this.failedAttempts.delete(ip);
        cleaned++;
      }
    }

    return cleaned;
  }
}
