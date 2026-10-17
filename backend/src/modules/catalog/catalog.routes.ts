import {
    Router,
} from 'express';

import type {
    CatalogService,
} from './catalog.service.js';

export function createCatalogRouter(
    catalogService: CatalogService,
): Router {
    const router = Router();

    router.get(
        '/',
        async (req, res) => {
            const search =
                typeof req.query.search ===
                    'string'
                    ? req.query.search.trim()
                    : '';

            const rawPage =
                typeof req.query.page ===
                    'string'
                    ? Number(req.query.page)
                    : 1;

            if (
                !Number.isInteger(rawPage) ||
                rawPage < 1
            ) {
                return res.status(400).json({
                    error:
                        'Le numéro de page doit être un entier supérieur ou égal à 1',
                });
            }

            if (search) {
                const result =
                    await catalogService.search(
                        search,
                        rawPage,
                    );

                return res.json(result);
            }

            const result =
                await catalogService.getAll(
                    rawPage,
                );

            return res.json(result);
        },
    );

    return router;
}