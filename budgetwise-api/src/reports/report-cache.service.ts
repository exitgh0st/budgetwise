import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

/**
 * Thin wrapper around NestJS CacheManager that tracks which cache keys belong to
 * each user so `invalidateUser` can bust only that user's entries without
 * scanning the entire cache store.
 */
@Injectable()
export class ReportCacheService {
  // In-memory index: userId → Set of cache keys. Cleared on invalidation.
  private readonly userKeys = new Map<string, Set<string>>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Cache-aside read: returns the cached value if present, otherwise calls
   * `loader`, stores the result, and returns it.
   *
   * @param ttl Cache TTL in milliseconds (default: 5 minutes)
   */
  async remember<T>(
    userId: string,
    scope: string,
    parts: Array<string | number>,
    loader: () => Promise<T>,
    ttl = 300000,
  ): Promise<T> {
    const key = this.buildKey(userId, scope, parts);
    const cached = await this.cache.get<T>(key);

    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const result = await loader();
    await this.cache.set(key, result, ttl);
    this.trackKey(userId, key);

    return result;
  }

  /** Deletes all cached report entries for a user. Called after any write that changes their report data. */
  async invalidateUser(userId: string): Promise<void> {
    const keys = this.userKeys.get(userId);

    if (!keys?.size) {
      return;
    }

    await Promise.all([...keys].map((key) => this.cache.del(key)));
    this.userKeys.delete(userId);
  }

  private buildKey(
    userId: string,
    scope: string,
    parts: Array<string | number>,
  ): string {
    const suffix = parts.map((part) => String(part)).join(':');
    return ['reports', scope, userId, suffix].filter(Boolean).join(':');
  }

  private trackKey(userId: string, key: string): void {
    const keys = this.userKeys.get(userId) ?? new Set<string>();
    keys.add(key);
    this.userKeys.set(userId, keys);
  }
}
