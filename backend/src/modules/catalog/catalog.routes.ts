import { Router } from 'express';

import { FakeCatalogAdapter } from '../../integrations/catalog/fakeCatalog.adapter.js';
import { CatalogService } from './catalog.service.js';

export const catalogRouter = Router();

const catalogAdapter = new FakeCatalogAdapter();
const catalogService = new CatalogService(catalogAdapter);

catalogRouter.get('/', async (_req, res) => {
    const catalog = await catalogService.getCatalog();

    res.json(catalog);
});