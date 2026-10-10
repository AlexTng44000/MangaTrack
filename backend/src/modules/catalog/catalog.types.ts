export type MediaType = 'anime' | 'manga';

export interface CatalogItem {
    id: number;
    title: string;
    type: MediaType;
    genres: string[];
}

export interface CatalogPort {
    getAll(): Promise<CatalogItem[]>;
}