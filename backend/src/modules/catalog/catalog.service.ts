import type {
    CatalogItem,
    CatalogPort,
} from './catalog.types.js';

export class CatalogService {
    constructor(
        private readonly catalogPort: CatalogPort,
    ) { }

    async getAll(): Promise<CatalogItem[]> {
        return this.catalogPort.getAll();
    }
}