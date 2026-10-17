import type {
    CatalogFilters,
    CatalogItem,
    CatalogPageResult,
    CatalogPort,
    CatalogDetails,
} from './catalog.types.js';

export class CatalogService {
    constructor(
        private readonly catalogPort:
            CatalogPort,
    ) { }

    async getAll(
        page = 1,
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        return this.catalogPort.getAll(
            page,
            filters,
        );
    }

    async search(
        query: string,
        page = 1,
        filters: CatalogFilters = {},
    ): Promise<CatalogPageResult> {
        return this.catalogPort.search(
            query,
            page,
            filters,
        );
    }
    async getByIds(
        ids: number[],
    ): Promise<CatalogItem[]> {
        return this.catalogPort.getByIds(
            ids,
        );
    }
    async getDetails(
        id: number,
    ): Promise<CatalogDetails | null> {
        return this.catalogPort
            .getDetails(id);
    }
}