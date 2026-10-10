import express from 'express';
import cors from 'cors';

import { catalogRouter } from './modules/catalog/catalog.routes.js';

import { LibraryService } from './modules/library/library.service.js';
import { createLibraryRouter } from './modules/library/library.routes.js';

import { ProgressService } from './modules/progress/progress.service.js';
import { createProgressRouter } from './modules/progress/progress.routes.js';

import { db } from './infrastructure/database/database.js';
import {
    PostgresLibraryRepository,
} from './infrastructure/database/postgresLibrary.repository.js';

import {
    NotificationService,
} from './modules/notifications/notification.service.js';

import {
    createNotificationRouter,
} from './modules/notifications/notification.routes.js';

import {
    BullMqNotificationQueueAdapter,
} from './infrastructure/queue/bullMqNotificationQueue.adapter.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const libraryRepository =
    new PostgresLibraryRepository(db);

const libraryService =
    new LibraryService(libraryRepository);

const progressService =
    new ProgressService(libraryService);

const notificationQueue =
    new BullMqNotificationQueueAdapter();

const notificationService =
    new NotificationService(
        notificationQueue,
    );

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

app.use(
    '/notifications',
    createNotificationRouter(notificationService),
);

app.listen(PORT, () => {
    console.log(
        `MangaTrack API started on http://localhost:${PORT}`,
    );
});