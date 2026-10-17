import type {
    CatalogFilters,
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

    episodes: number | null;
    chapters: number | null;
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
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        return this.fetchPage(
            page,
            undefined,
            filters,
        );
    }

    async search(
        search: string,
        page = 1,
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        return this.fetchPage(
            page,
            search,
            filters,
        );
    }

    private async fetchPage(
        page: number,
        search?: string,
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        const perPage =
            search ? 25 : 50;

        const query = `
        query (
            $page: Int!
            $perPage: Int!
            $search: String
            $genre: String
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
                        genre: $genre
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
                        genre: $genre
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
                            genre:
                                filters.genre || null,
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

        let media: AniListMedia[];

        if (filters.type === 'anime') {
            media =
                result.data.anime.media;
        } else if (
            filters.type === 'manga'
        ) {
            media =
                result.data.manga.media;
        } else {
            media = [
                ...result.data.anime.media,
                ...result.data.manga.media,
            ];
        }

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

        let hasNextPage: boolean;

        if (filters.type === 'anime') {
            hasNextPage =
                result.data.anime
                    .pageInfo
                    .hasNextPage;
        } else if (
            filters.type === 'manga'
        ) {
            hasNextPage =
                result.data.manga
                    .pageInfo
                    .hasNextPage;
        } else {
            hasNextPage =
                result.data.anime
                    .pageInfo
                    .hasNextPage ||
                result.data.manga
                    .pageInfo
                    .hasNextPage;
        }

        return {
            items,
            page,
            hasNextPage,
        };
    }
    async getByIds(
        ids: number[],
    ): Promise<CatalogItem[]> {
        if (ids.length === 0) {
            return [];
        }

        const query = `
            query ($ids: [Int]) {
                Page(
                    page: 1
                    perPage: 50
                ) {
                    media(
                        id_in: $ids
                        isAdult: false
                    ) {
                        id
    
                        title {
                            english
                            romaji
                        }
    
                        type
                        genres
                        episodes
                        chapters
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
                            ids,
                        },
                    }),
                },
            );

        if (!response.ok) {
            const errorBody =
                await response.text();

            throw new Error(
                `AniList API error: ${response.status} - ${errorBody}`,
            );
        }

        const rawResult =
            await response.json();

        const result =
            rawResult as {
                data?: {
                    Page: {
                        media:
                        AniListMedia[];
                    };
                };

                errors?: Array<{
                    message: string;
                }>;
            };

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

        return result.data.Page.media.map(
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

                total:
                    item.type === 'ANIME'
                        ? item.episodes
                        : item.chapters,
            }),
        );
    }
}