import type {
    CalendarRelease,
    CatalogDetails,
    CatalogFilters,
    CatalogItem,
    CatalogPageResult,
    CatalogPort,
    CatalogRelation,
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

interface AniListAiringSchedule {
    airingAt: number;
    episode: number;

    media: {
        id: number;

        title: {
            english: string | null;
            romaji: string;
        };

        coverImage: {
            large: string | null;
        };

        format: string | null;

        type:
        | 'ANIME'
        | 'MANGA';

        isAdult: boolean;
    };
}

interface AniListAiringPage {
    pageInfo: {
        hasNextPage: boolean;
    };

    airingSchedules:
    AniListAiringSchedule[];
}

interface AniListAiringResponse {
    data?: {
        Page: AniListAiringPage;
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
                                filters.genre ||
                                null,
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

        let media:
            AniListMedia[];

        if (
            filters.type ===
            'anime'
        ) {
            media =
                result.data
                    .anime
                    .media;
        } else if (
            filters.type ===
            'manga'
        ) {
            media =
                result.data
                    .manga
                    .media;
        } else {
            media = [
                ...result.data
                    .anime
                    .media,

                ...result.data
                    .manga
                    .media,
            ];
        }

        const items =
            media.map(
                (
                    item,
                ): CatalogItem => ({
                    id: item.id,

                    title:
                        item.title
                            .english ??
                        item.title
                            .romaji,

                    type:
                        item.type ===
                            'ANIME'
                            ? 'anime'
                            : 'manga',

                    genres:
                        item.genres ??
                        [],
                }),
            );

        let hasNextPage:
            boolean;

        if (
            filters.type ===
            'anime'
        ) {
            hasNextPage =
                result.data
                    .anime
                    .pageInfo
                    .hasNextPage;
        } else if (
            filters.type ===
            'manga'
        ) {
            hasNextPage =
                result.data
                    .manga
                    .pageInfo
                    .hasNextPage;
        } else {
            hasNextPage =
                result.data
                    .anime
                    .pageInfo
                    .hasNextPage ||

                result.data
                    .manga
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
        if (
            ids.length ===
            0
        ) {
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
                    message:
                    string;
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

        return result.data
            .Page
            .media
            .map(
                (
                    item,
                ): CatalogItem => ({
                    id: item.id,

                    title:
                        item.title
                            .english ??
                        item.title
                            .romaji,

                    type:
                        item.type ===
                            'ANIME'
                            ? 'anime'
                            : 'manga',

                    genres:
                        item.genres ??
                        [],

                    total:
                        item.type ===
                            'ANIME'
                            ? item.episodes
                            : item.chapters,
                }),
            );
    }

    async getDetails(
        id: number,
    ): Promise<CatalogDetails | null> {
        const query = `
            query ($id: Int!) {
                Media(
                    id: $id
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

                    description(
                        asHtml: false
                    )

                    coverImage {
                        large
                    }

                    status
                    format
                    seasonYear
                    averageScore

                    relations {
                        edges {
                            relationType

                            node {
                                id

                                title {
                                    english
                                    romaji
                                }

                                type

                                coverImage {
                                    large
                                }

                                format
                                isAdult
                            }
                        }
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
                            id,
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
                    Media: {
                        id: number;

                        title: {
                            english:
                            string | null;

                            romaji:
                            string;
                        };

                        type:
                        | 'ANIME'
                        | 'MANGA';

                        genres:
                        string[];

                        episodes:
                        number | null;

                        chapters:
                        number | null;

                        description:
                        string | null;

                        coverImage: {
                            large:
                            string | null;
                        };

                        status:
                        string | null;

                        format:
                        string | null;

                        seasonYear:
                        number | null;

                        averageScore:
                        number | null;

                        relations: {
                            edges: Array<{
                                relationType:
                                string;

                                node: {
                                    id: number;

                                    title: {
                                        english:
                                        string | null;

                                        romaji:
                                        string;
                                    };

                                    type:
                                    | 'ANIME'
                                    | 'MANGA';

                                    coverImage: {
                                        large:
                                        string | null;
                                    };

                                    format:
                                    string | null;

                                    isAdult:
                                    boolean;
                                } | null;
                            }>;
                        };
                    } | null;
                };

                errors?: Array<{
                    message:
                    string;
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

        const item =
            result.data.Media;

        if (!item) {
            return null;
        }

        const relations =
            item.relations.edges
                .filter(
                    (edge) =>
                        edge.node !== null &&
                        !edge.node.isAdult,
                )
                .map(
                    (
                        edge,
                    ): CatalogRelation => {
                        const node =
                            edge.node!;

                        return {
                            id:
                                node.id,

                            title:
                                node.title
                                    .english ??
                                node.title
                                    .romaji,

                            type:
                                node.type ===
                                    'ANIME'
                                    ? 'anime'
                                    : 'manga',

                            relationType:
                                edge.relationType,

                            imageUrl:
                                node.coverImage
                                    .large,

                            format:
                                node.format,
                        };
                    },
                );

        return {
            id: item.id,

            title:
                item.title
                    .english ??
                item.title
                    .romaji,

            type:
                item.type ===
                    'ANIME'
                    ? 'anime'
                    : 'manga',

            genres:
                item.genres ??
                [],

            total:
                item.type ===
                    'ANIME'
                    ? item.episodes
                    : item.chapters,

            description:
                item.description,

            imageUrl:
                item.coverImage
                    .large,

            status:
                item.status,

            format:
                item.format,

            seasonYear:
                item.seasonYear,

            averageScore:
                item.averageScore,

            relations,
        };
    }

    async getUpcomingReleases(
        from: Date,
        to: Date,
    ): Promise<CalendarRelease[]> {
        const query = `
            query (
                $page: Int!
                $perPage: Int!
                $airingAtGreater: Int!
                $airingAtLesser: Int!
            ) {
                Page(
                    page: $page
                    perPage: $perPage
                ) {
                    pageInfo {
                        hasNextPage
                    }

                    airingSchedules(
                        airingAt_greater:
                            $airingAtGreater

                        airingAt_lesser:
                            $airingAtLesser

                        sort: TIME
                    ) {
                        airingAt
                        episode

                        media {
                            id

                            title {
                                english
                                romaji
                            }

                            coverImage {
                                large
                            }

                            format
                            type
                            isAdult
                        }
                    }
                }
            }
        `;

        const fromTimestamp =
            Math.floor(
                from.getTime() /
                1000,
            );

        const toTimestamp =
            Math.floor(
                to.getTime() /
                1000,
            );

        const releases:
            CalendarRelease[] = [];

        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            const response =
                await fetch(
                    this.apiUrl,
                    {
                        method:
                            'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Accept:
                                'application/json',
                        },

                        body:
                            JSON.stringify({
                                query,

                                variables: {
                                    page,

                                    perPage:
                                        50,

                                    airingAtGreater:
                                        fromTimestamp,

                                    airingAtLesser:
                                        toTimestamp,
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
                rawResult as
                AniListAiringResponse;

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

            for (
                const schedule
                of result.data
                    .Page
                    .airingSchedules
            ) {
                if (
                    schedule.media
                        .isAdult ||
                    schedule.media
                        .type !==
                    'ANIME'
                ) {
                    continue;
                }

                releases.push({
                    mediaId:
                        schedule.media.id,

                    title:
                        schedule.media
                            .title
                            .english ??
                        schedule.media
                            .title
                            .romaji,

                    episode:
                        schedule.episode,

                    airingAt:
                        new Date(
                            schedule.airingAt *
                            1000,
                        ).toISOString(),

                    imageUrl:
                        schedule.media
                            .coverImage
                            .large,

                    format:
                        schedule.media
                            .format,
                });
            }

            hasNextPage =
                result.data
                    .Page
                    .pageInfo
                    .hasNextPage;

            page += 1;
        }

        return releases.sort(
            (first, second) =>
                new Date(
                    first.airingAt,
                ).getTime() -
                new Date(
                    second.airingAt,
                ).getTime(),
        );
    }
}