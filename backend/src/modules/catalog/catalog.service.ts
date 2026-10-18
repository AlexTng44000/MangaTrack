import type {
    CalendarRelease,
    CatalogDetails,
    CatalogFilters,
    CatalogItem,
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
        return this.catalogPort.getDetails(
            id,
        );
    }

    async getUpcomingReleases(
        from: Date,
        to: Date,
    ): Promise<CalendarRelease[]> {
        return this.catalogPort
            .getUpcomingReleases(
                from,
                to,
            );
    }
}