import type {
    CatalogPageResult,
    CatalogPort,
} from './catalog.types.js';

export class CatalogService {
    constructor(
        private readonly catalogPort:
            CatalogPort,
    ) { }

    async getAll(
        page = 1,
    ): Promise<CatalogPageResult> {
        return this.catalogPort.getAll(
            page,
        );
    }

    async search(
        query: string,
        page = 1,
    ): Promise<CatalogPageResult> {
        return this.catalogPort.search(
            query,
            page,
        );
    }
}