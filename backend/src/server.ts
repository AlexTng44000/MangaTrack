import express from 'express';
import cors from 'cors';

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

app.listen(PORT, () => {
    console.log(`MangaTrack API démarrée sur http://localhost:${PORT}`);
});