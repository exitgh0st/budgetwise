import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class ReportCacheService {
  private readonly userKeys = new Map<string, Set<string>>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

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
