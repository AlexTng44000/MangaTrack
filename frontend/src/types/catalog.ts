export interface CatalogItem {
    id: number;
    title: string;
    type: 'anime' | 'manga';
    genres: string[];
}

export interface CatalogPageResult {
    items: CatalogItem[];
    page: number;
    hasNextPage: boolean;
}

export interface CatalogItem {
    id: number;
    title: string;
    type: 'anime' | 'manga';
    genres: string[];
    total?: number | null;
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