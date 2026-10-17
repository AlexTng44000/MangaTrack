export type MediaType =
    | 'anime'
    | 'manga';

export interface CatalogItem {
    id: number;
    title: string;
    type: MediaType;
    genres: string[];
}

export interface CatalogPageResult {
    items: CatalogItem[];
    page: number;
    hasNextPage: boolean;
}

export interface CatalogFilters {
    type?: MediaType;
    genre?: string;
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
}