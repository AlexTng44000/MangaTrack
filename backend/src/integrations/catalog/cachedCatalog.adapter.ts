import type {
    CalendarRelease,
    CatalogDetails,
    CatalogFilters,
    CatalogItem,
    CatalogPageResult,
    CatalogPort,
} from '../../modules/catalog/catalog.types.js';

import type {
    Redis,
} from 'ioredis';

export class CachedCatalogAdapter
    implements CatalogPort {

    private readonly freshTtl =
        15 * 60;

    private readonly staleTtl =
        24 * 60 * 60;

    private readonly calendarFreshTtl =
        5 * 60;

    private readonly calendarStaleTtl =
        6 * 60 * 60;

    private readonly inFlight =
        new Map<
            string,
            Promise<unknown>
        >();

    constructor(
        private readonly source:
            CatalogPort,

        private readonly redis:
            Redis,
    ) { }

    async getAll(
        page = 1,
        filters:
            CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        return this.getWithCache(
            undefined,
            page,
            filters,
        );
    }

    async search(
        query: string,
        page = 1,
        filters:
            CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        return this.getWithCache(
            query,
            page,
            filters,
        );
    }

    private async getWithCache(
        search:
            string | undefined,
        page: number,
        filters:
            CatalogFilters,
    ): Promise<CatalogPageResult> {
        const baseKey =
            this.buildKey(
                search,
                page,
                filters,
            );

        return this.readThroughCache(
            baseKey,
            () =>
                search
                    ? this.source.search(
                        search,
                        page,
                        filters,
                    )
                    : this.source.getAll(
                        page,
                        filters,
                    ),
        );
    }

    private async readThroughCache<T>(
        baseKey: string,
        sourceCall:
            () => Promise<T>,
        freshTtl =
            this.freshTtl,
        staleTtl =
            this.staleTtl,
    ): Promise<T> {
        const freshKey =
            `${baseKey}:fresh`;

        const staleKey =
            `${baseKey}:stale`;

        const fresh =
            await this.redis.get(
                freshKey,
            );

        if (fresh) {
            return JSON.parse(
                fresh,
            ) as T;
        }

        const existing =
            this.inFlight.get(
                baseKey,
            );

        if (existing) {
            return existing as
                Promise<T>;
        }

        const pending =
            (async () => {
                try {
                    const result =
                        await this.with429Retry(
                            sourceCall,
                        );

                    const serialized =
                        JSON.stringify(
                            result,
                        );

                    await Promise.all([
                        this.redis.set(
                            freshKey,
                            serialized,
                            'EX',
                            freshTtl,
                        ),

                        this.redis.set(
                            staleKey,
                            serialized,
                            'EX',
                            staleTtl,
                        ),
                    ]);

                    return result;
                } catch (error) {
                    const stale =
                        await this.redis.get(
                            staleKey,
                        );

                    if (stale) {
                        console.warn(
                            `AniList indisponible : cache de secours utilisé pour ${baseKey}`,
                        );

                        return JSON.parse(
                            stale,
                        ) as T;
                    }

                    throw error;
                } finally {
                    this.inFlight.delete(
                        baseKey,
                    );
                }
            })();

        this.inFlight.set(
            baseKey,
            pending,
        );

        return pending;
    }

    private async with429Retry<T>(
        operation:
            () => Promise<T>,
    ): Promise<T> {
        const delays =
            [1200, 2500];

        let lastError:
            unknown;

        for (
            let attempt = 0;
            attempt <= delays.length;
            attempt += 1
        ) {
            try {
                return await operation();
            } catch (error) {
                lastError =
                    error;

                const message =
                    error instanceof Error
                        ? error.message
                        : String(
                            error,
                        );

                const isRateLimit =
                    message.includes(
                        '429',
                    );

                if (
                    !isRateLimit ||
                    attempt ===
                    delays.length
                ) {
                    throw error;
                }

                await new Promise<void>(
                    (resolve) => {
                        setTimeout(
                            resolve,
                            delays[
                            attempt
                            ],
                        );
                    },
                );
            }
        }

        throw lastError;
    }

    private buildKey(
        search:
            string | undefined,
        page: number,
        filters:
            CatalogFilters,
    ): string {
        const normalizedSearch =
            search
                ?.trim()
                .toLowerCase() ||
            'all';

        const type =
            filters.type ||
            'all';

        const genre =
            filters.genre
                ?.trim()
                .toLowerCase() ||
            'all';

        const sort =
            filters.sort ||
            'popularity';

        return [
            'catalog',
            'anilist',
            `page:${page}`,

            `search:${encodeURIComponent(
                normalizedSearch,
            )}`,

            `type:${type}`,

            `genre:${encodeURIComponent(
                genre,
            )}`,

            `sort:${sort}`,
        ].join(':');
    }

    async getByIds(
        ids: number[],
    ): Promise<CatalogItem[]> {
        if (
            ids.length === 0
        ) {
            return [];
        }

        const normalizedIds =
            [...new Set(ids)]
                .sort(
                    (
                        first,
                        second,
                    ) =>
                        first -
                        second,
                );

        const baseKey = [
            'catalog',
            'anilist',
            'by-ids',
            normalizedIds.join(
                ',',
            ),
        ].join(':');

        return this.readThroughCache(
            baseKey,
            () =>
                this.source.getByIds(
                    normalizedIds,
                ),
        );
    }

    async getDetails(
        id: number,
    ): Promise<CatalogDetails | null> {
        const baseKey =
            [
                'catalog',
                'anilist',
                'details',
                id,
            ].join(':');

        return this.readThroughCache(
            baseKey,
            () =>
                this.source.getDetails(
                    id,
                ),
            60 * 60,
            24 * 60 * 60,
        );
    }

    async getUpcomingReleases(
        from: Date,
        to: Date,
    ): Promise<CalendarRelease[]> {
        const bucketSize =
            10 *
            60 *
            1000;

        const fromBucket =
            Math.floor(
                from.getTime() /
                bucketSize,
            );

        const toBucket =
            Math.floor(
                to.getTime() /
                bucketSize,
            );

        const baseKey =
            [
                'catalog',
                'anilist',
                'calendar',
                fromBucket,
                toBucket,
            ].join(':');

        return this.readThroughCache(
            baseKey,
            () =>
                this.source
                    .getUpcomingReleases(
                        from,
                        to,
                    ),
            this.calendarFreshTtl,
            this.calendarStaleTtl,
        );
    }
}
