import type {
    CatalogFilters,
    CatalogItem,
    CatalogPageResult,
    CatalogPort,
} from '../../modules/catalog/catalog.types.js';

export class FakeCatalogAdapter
    implements CatalogPort {
    private readonly items: CatalogItem[] = [
        {
            id: 1,
            title: 'Frieren',
            type: 'anime',
            genres: [
                'Adventure',
                'Drama',
                'Fantasy',
            ],
        },
        {
            id: 2,
            title: 'One Piece',
            type: 'anime',
            genres: [
                'Action',
                'Adventure',
                'Comedy',
            ],
        },
        {
            id: 3,
            title: 'Jujutsu Kaisen',
            type: 'manga',
            genres: [
                'Action',
                'Supernatural',
            ],
        },
    ];

    async getAll(
        page = 1,
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        if (page !== 1) {
            return {
                items: [],
                page,
                hasNextPage: false,
            };
        }

        let items =
            [...this.items];

        if (filters.type) {
            items =
                items.filter(
                    (item) =>
                        item.type ===
                        filters.type,
                );
        }

        if (filters.genre) {
            items =
                items.filter(
                    (item) =>
                        item.genres.includes(
                            filters.genre!,
                        ),
                );
        }

        return {
            items,
            page,
            hasNextPage: false,
        };
    }

    async search(
        query: string,
        page = 1,
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        const result =
            await this.getAll(
                page,
                filters,
            );

        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        return {
            ...result,

            items:
                result.items.filter(
                    (item) =>
                        item.title
                            .toLowerCase()
                            .includes(
                                normalizedQuery,
                            ),
                ),
        };
    }
}