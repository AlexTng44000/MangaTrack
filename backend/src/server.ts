import express from 'express';
import cors from 'cors';

import { catalogRouter } from './modules/catalog/catalog.routes.js';

import { LibraryService } from './modules/library/library.service.js';
import { createLibraryRouter } from './modules/library/library.routes.js';

import { ProgressService } from './modules/progress/progress.service.js';
import { createProgressRouter } from './modules/progress/progress.routes.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const libraryService = new LibraryService();
const progressService = new ProgressService(libraryService);

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        application: 'MangaTrack',
    });
});

app.use('/catalog', catalogRouter);

app.use(
    '/library',
    createLibraryRouter(libraryService),
);

app.use(
    '/progress',
    createProgressRouter(progressService),
);

app.listen(PORT, () => {
    console.log(
        `MangaTrack API started on http://localhost:${PORT}`,
    );
});