import express from 'express';
import cors from 'cors';

import { catalogRouter } from './modules/catalog/catalog.routes.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        application: 'MangaTrack',
    });
});

app.use('/catalog', catalogRouter);

app.listen(PORT, () => {
    console.log(`MangaTrack API started on http://localhost:${PORT}`);
});