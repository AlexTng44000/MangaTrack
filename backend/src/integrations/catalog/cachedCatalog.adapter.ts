import type {
    CatalogFilters,
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

    constructor(
        private readonly source:
            CatalogPort,

        private readonly redis:
            Redis,
    ) { }

    async getAll(
        page = 1,
        filters: CatalogFilters = {},
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
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        return this.getWithCache(
            query,
            page,
            filters,
        );
    }

    private async getWithCache(
        search: string | undefined,
        page: number,
        filters: CatalogFilters,
    ): Promise<CatalogPageResult> {
        const baseKey =
            this.buildKey(
                search,
                page,
                filters,
            );

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
            ) as CatalogPageResult;
        }

        try {
            const result =
                search
                    ? await this.source.search(
                        search,
                        page,
                        filters,
                    )
                    : await this.source.getAll(
                        page,
                        filters,
                    );

            const serialized =
                JSON.stringify(result);

            await Promise.all([
                this.redis.set(
                    freshKey,
                    serialized,
                    'EX',
                    this.freshTtl,
                ),

                this.redis.set(
                    staleKey,
                    serialized,
                    'EX',
                    this.staleTtl,
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
                ) as CatalogPageResult;
            }

            throw error;
        }
    }

    private buildKey(
        search: string | undefined,
        page: number,
        filters: CatalogFilters,
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
        ].join(':');
    }
}