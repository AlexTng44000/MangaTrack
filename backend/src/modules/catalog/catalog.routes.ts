import { Router } from 'express';

import type {
    CatalogService,
} from './catalog.service.js';

export function createCatalogRouter(
    catalogService: CatalogService,
): Router {
    const router = Router();

    router.get('/', async (_req, res) => {
        const items =
            await catalogService.getAll();

        return res.json(items);
    });

    return router;
}