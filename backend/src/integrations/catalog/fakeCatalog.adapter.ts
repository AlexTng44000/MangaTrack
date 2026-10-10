import type {
    CatalogItem,
    CatalogPort,
} from '../../modules/catalog/catalog.types.js';

export class FakeCatalogAdapter implements CatalogPort {
    async getAll(): Promise<CatalogItem[]> {
        return [
            {
                id: 1,
                title: 'One Piece',
                type: 'manga',
                genres: ['Action', 'Aventure'],
            },
            {
                id: 2,
                title: 'Frieren',
                type: 'anime',
                genres: ['Fantasy', 'Aventure'],
            },
            {
                id: 3,
                title: 'Chainsaw Man',
                type: 'anime',
                genres: ['Action', 'Surnaturel'],
            },
        ];
    }
}