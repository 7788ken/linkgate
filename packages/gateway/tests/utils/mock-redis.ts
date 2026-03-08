/**
 * Mock Redis client for testing
 */
export class MockRedis {
  private store: Map<string, { value: string; expireAt?: number }>;

  constructor() {
    this.store = new Map();
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;

    // Check if expired
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expireAt = Date.now() + seconds * 1000;
    this.store.set(key, { value, expireAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  // Helper methods for testing
  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  has(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;

    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }
}
