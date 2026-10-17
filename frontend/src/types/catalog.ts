export interface CatalogItem {
    id: number;
    title: string;
    type: 'anime' | 'manga';
    genres: string[];
    total?: number | null;
}

export interface CatalogPageResult {
    items: CatalogItem[];
    page: number;
    hasNextPage: boolean;
}

export interface CatalogDetails
    extends CatalogItem {
    description: string | null;
    imageUrl: string | null;
    status: string | null;
    format: string | null;
    seasonYear: number | null;
    averageScore: number | null;
}

export interface CalendarRelease {
    mediaId: number;
    title: string;
    episode: number;
    airingAt: string;
    imageUrl: string | null;
    format: string | null;
}