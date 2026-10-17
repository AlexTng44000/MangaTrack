import type {
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
    ): Promise<CatalogPageResult> {
        return {
            items:
                page === 1
                    ? this.items
                    : [],

            page,

            hasNextPage: false,
        };
    }

    async search(
        query: string,
        page = 1,
    ): Promise<CatalogPageResult> {
        if (page !== 1) {
            return {
                items: [],
                page,
                hasNextPage: false,
            };
        }

        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        const items =
            this.items.filter(
                (item) =>
                    item.title
                        .toLowerCase()
                        .includes(
                            normalizedQuery,
                        ),
            );

        return {
            items,
            page,
            hasNextPage: false,
        };
    }
}