export interface CatalogItem {
    id: number;
    title: string;
    type: 'anime' | 'manga';
    genres: string[];
}