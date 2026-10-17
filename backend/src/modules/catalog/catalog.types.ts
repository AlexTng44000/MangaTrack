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

export interface CatalogPort {
    getAll(
        page?: number,
    ): Promise<CatalogPageResult>;

    search(
        query: string,
        page?: number,
    ): Promise<CatalogPageResult>;
}