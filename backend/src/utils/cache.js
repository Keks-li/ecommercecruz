/**
 * Fast in-memory cache with TTL and pattern invalidation.
 * Eliminates cross-continent round-trip latency to the cloud database.
 */
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const record = this.store.get(key);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return record.value;
  }

  del(key) {
    this.store.delete(key);
  }

  invalidate(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }
}

const cache = new MemoryCache();
export default cache;
