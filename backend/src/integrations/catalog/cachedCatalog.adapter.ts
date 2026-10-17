import type {
    CatalogItem,
    CatalogPort,
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

    async getAll():
        Promise<CatalogItem[]> {
        const fresh =
            await this.redis.get(
                this.freshKey,
            );

        if (fresh) {
            return JSON.parse(
                fresh,
            ) as CatalogItem[];
        }

        try {
            const items =
                await this.source.getAll();

            const serialized =
                JSON.stringify(items);

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

            return items;
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
                ) as CatalogItem[];
            }

            throw error;
        }
    }
}