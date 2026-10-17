import type {
    CatalogItem,
    CatalogPageResult,
    CatalogPort,
} from '../../modules/catalog/catalog.types.js';

interface AniListMedia {
    id: number;

    title: {
        english: string | null;
        romaji: string;
    };

    type: 'ANIME' | 'MANGA';
    genres: string[];
}

interface AniListPage {
    pageInfo: {
        hasNextPage: boolean;
    };

    media: AniListMedia[];
}

interface AniListResponse {
    data?: {
        anime: AniListPage;
        manga: AniListPage;
    };

    errors?: Array<{
        message: string;
    }>;
}

export class AniListCatalogAdapter
    implements CatalogPort {
    constructor(
        private readonly apiUrl: string,
    ) { }

    async getAll(
        page = 1,
    ): Promise<CatalogPageResult> {
        return this.fetchPage(
            page,
        );
    }

    async search(
        search: string,
        page = 1,
    ): Promise<CatalogPageResult> {
        return this.fetchPage(
            page,
            search,
        );
    }

    private async fetchPage(
        page: number,
        search?: string,
    ): Promise<CatalogPageResult> {
        const perPage =
            search ? 25 : 50;

        const query = `
            query (
                $page: Int!
                $perPage: Int!
                $search: String
            ) {
                anime: Page(
                    page: $page
                    perPage: $perPage
                ) {
                    pageInfo {
                        hasNextPage
                    }

                    media(
                        type: ANIME
                        isAdult: false
                        search: $search
                        sort: [POPULARITY_DESC]
                    ) {
                        id

                        title {
                            english
                            romaji
                        }

                        type
                        genres
                    }
                }

                manga: Page(
                    page: $page
                    perPage: $perPage
                ) {
                    pageInfo {
                        hasNextPage
                    }

                    media(
                        type: MANGA
                        isAdult: false
                        search: $search
                        sort: [POPULARITY_DESC]
                    ) {
                        id

                        title {
                            english
                            romaji
                        }

                        type
                        genres
                    }
                }
            }
        `;

        const response =
            await fetch(
                this.apiUrl,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',
                    },

                    body: JSON.stringify({
                        query,

                        variables: {
                            page,
                            perPage,
                            search:
                                search || null,
                        },
                    }),
                },
            );

        if (!response.ok) {
            throw new Error(
                `AniList API error: ${response.status}`,
            );
        }

        const rawResult =
            await response.json();

        const result =
            rawResult as AniListResponse;

        if (
            result.errors ||
            !result.data
        ) {
            throw new Error(
                result.errors?.[0]
                    ?.message ??
                'Réponse AniList invalide',
            );
        }

        const media = [
            ...result.data.anime.media,
            ...result.data.manga.media,
        ];

        const items =
            media.map(
                (item): CatalogItem => ({
                    id: item.id,

                    title:
                        item.title.english ??
                        item.title.romaji,

                    type:
                        item.type === 'ANIME'
                            ? 'anime'
                            : 'manga',

                    genres:
                        item.genres ?? [],
                }),
            );

        return {
            items,
            page,

            hasNextPage:
                result.data.anime
                    .pageInfo
                    .hasNextPage ||
                result.data.manga
                    .pageInfo
                    .hasNextPage,
        };
    }
}