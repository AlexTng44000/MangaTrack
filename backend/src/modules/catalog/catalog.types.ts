export type MediaType =
    | 'anime'
    | 'manga';

export type CatalogSort =
    | 'popularity'
    | 'trending'
    | 'score'
    | 'recent'
    | 'title';

export interface CatalogItem {
    id: number;
    title: string;
    type: MediaType;
    genres: string[];
    total?: number | null;
}

export interface CatalogPageResult {
    items: CatalogItem[];
    page: number;
    hasNextPage: boolean;
}

export interface CatalogFilters {
    type?: MediaType;
    genre?: string;
    sort?: CatalogSort;
}

export interface CatalogRelation {
    id: number;
    title: string;
    type: MediaType;
    relationType: string;
    imageUrl: string | null;
    format: string | null;
}

export interface CatalogStreamingEpisode {
    title: string;
    thumbnail: string | null;
    url: string;
    site: string;
}

export interface CatalogExternalLink {
    site: string;
    url: string;
    type: string | null;
    language: string | null;
    icon: string | null;
    isDisabled: boolean | null;
}

export interface CatalogDetails
    extends CatalogItem {
    description: string | null;
    imageUrl: string | null;
    status: string | null;
    format: string | null;
    seasonYear: number | null;
    averageScore: number | null;
    relations: CatalogRelation[];
    streamingEpisodes:
    CatalogStreamingEpisode[];
    externalLinks:
    CatalogExternalLink[];
}

export interface CalendarRelease {
    mediaId: number;
    title: string;
    episode: number;
    airingAt: string;
    imageUrl: string | null;
    format: string | null;
}

export interface CatalogPort {
    getAll(
        page?: number,
        filters?: CatalogFilters,
    ): Promise<CatalogPageResult>;

    search(
        query: string,
        page?: number,
        filters?: CatalogFilters,
    ): Promise<CatalogPageResult>;

    getByIds(
        ids: number[],
    ): Promise<CatalogItem[]>;

    getDetails(
        id: number,
    ): Promise<CatalogDetails | null>;

    getUpcomingReleases(
        from: Date,
        to: Date,
    ): Promise<CalendarRelease[]>;
}
