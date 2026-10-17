import type {
    CatalogPageResult,
    CatalogPort,
    CatalogFilters
} from '../../modules/catalog/catalog.types.js';

import type {
    Redis,
} from 'ioredis';


export class CachedCatalogAdapter

    implements CatalogPort {
    private readonly freshKey =
        'catalog:anilist:fresh';

    private readonly staleKey =
        'catalog:anilist:stale';

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
        // Pour le moment les pages suivantes
        // vont directement vers AniList.
        if (
            page !== 1 ||
            filters.type ||
            filters.genre
        ) {
            return this.source.getAll(
                page,
                filters,
            );
        }

        const fresh =
            await this.redis.get(
                this.freshKey,
            );

        if (fresh) {
            return JSON.parse(
                fresh,
            ) as CatalogPageResult;
        }

        try {
            const result =
                await this.source.getAll(
                    1,
                );

            const serialized =
                JSON.stringify(result);

            await this.redis.set(
                this.freshKey,
                serialized,
                'EX',
                15 * 60,
            );

            await this.redis.set(
                this.staleKey,
                serialized,
                'EX',
                24 * 60 * 60,
            );

            return result;
        } catch (error) {
            const stale =
                await this.redis.get(
                    this.staleKey,
                );

            if (stale) {
                console.warn(
                    'AniList indisponible : utilisation du cache de secours',
                );

                return JSON.parse(
                    stale,
                ) as CatalogPageResult;
            }

            throw error;
        }
    }

    async search(
        query: string,
        page = 1,
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        return this.source.search(
            query,
            page,
            filters,
        );
    }
}