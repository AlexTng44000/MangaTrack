import type {
    CatalogItem,
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

interface AniListResponse {
    data?: {
        anime: {
            media: AniListMedia[];
        };

        manga: {
            media: AniListMedia[];
        };
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

    async getAll():
        Promise<CatalogItem[]> {
        const query = `
            query {
                anime: Page(
                    page: 1
                    perPage: 10
                ) {
                    media(
                        type: ANIME
                        isAdult: false
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
                    page: 1
                    perPage: 10
                ) {
                    media(
                        type: MANGA
                        isAdult: false
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
                    }),
                },
            );

        if (!response.ok) {
            throw new Error(
                `AniList API error: ${response.status}`,
            );
        }

        const result =
            (await response.json()) as AniListResponse;

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

        return media.map(
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
    }
}