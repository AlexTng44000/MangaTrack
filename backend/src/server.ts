import express from 'express';
import cors from 'cors';

import {
    env,
} from './config/env.js';

import {
    AniListCatalogAdapter,
} from './integrations/catalog/anilistCatalog.adapter.js';

import {
    CatalogService,
} from './modules/catalog/catalog.service.js';

import {
    createCatalogRouter,
} from './modules/catalog/catalog.routes.js';

import {
    LibraryService,
} from './modules/library/library.service.js';

import {
    createLibraryRouter,
} from './modules/library/library.routes.js';

import {
    ProgressService,
} from './modules/progress/progress.service.js';

import {
    createProgressRouter,
} from './modules/progress/progress.routes.js';

import {
    db,
} from './infrastructure/database/database.js';

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

import {
    PostgresUserRepository,
} from './infrastructure/database/postgresUser.repository.js';

import {
    BcryptAdapter,
} from './integrations/security/bcrypt.adapter.js';

import {
    JwtAdapter,
} from './integrations/security/jwt.adapter.js';

import {
    AuthService,
} from './modules/users/auth.service.js';

import {
    createAuthRouter,
} from './modules/users/auth.routes.js';

import {
    createRequireAuth,
    requireAdmin,
} from './modules/users/auth.middleware.js';

import {
    AdminService,
} from './modules/users/admin.service.js';

import {
    createAdminRouter,
} from './modules/users/admin.routes.js';

import {
    CachedCatalogAdapter,
} from './integrations/catalog/cachedCatalog.adapter.js';

import {
    redis,
} from './infrastructure/redis/redis.client.js';

import {
    PostgresReminderRepository,
} from './infrastructure/database/postgresReminder.repository.js';

import {
    ReminderService,
} from './modules/reminders/reminder.service.js';

import {
    createReminderRouter,
} from './modules/reminders/reminder.routes.js';

import {
    globalRateLimit,
    authRateLimit,
    catalogRateLimit,
} from './infrastructure/security/rateLimit.middleware.js';


const app = express();

// Production exposes the API only through its single Caddy proxy.
app.set('trust proxy', env.TRUST_PROXY_HOPS);

const PORT =
    env.PORT;

app.use(
    cors({
        origin:
            env.CORS_ORIGIN,
    }),
);

/*
 * Healthcheck volontairement placé avant le rate limiter.
 * Docker / un hébergeur doit toujours pouvoir vérifier
 * si l'API est disponible.
 */
app.get(
    '/health',
    (_req, res) => {
        res.json({
            status: 'ok',
            application: 'MangaTrack',
        });
    },
);

/*
 * Protection globale de l'API.
 */
app.use(globalRateLimit);

app.use(express.json());


const libraryRepository =
    new PostgresLibraryRepository(
        db,
    );

const libraryService =
    new LibraryService(
        libraryRepository,
    );

const progressService =
    new ProgressService(
        libraryService,
    );

const notificationQueue =
    new BullMqNotificationQueueAdapter();

const userRepository =
    new PostgresUserRepository(
        db,
    );

const notificationService =
    new NotificationService(
        notificationQueue,
        userRepository,
    );

const aniListCatalog =
    new AniListCatalogAdapter(
        env.ANILIST_API_URL,
    );

const catalogAdapter =
    new CachedCatalogAdapter(
        aniListCatalog,
        redis,
    );

const catalogService =
    new CatalogService(
        catalogAdapter,
    );

const passwordHasher =
    new BcryptAdapter();

const tokenService =
    new JwtAdapter();

const requireAuth =
    createRequireAuth(
        tokenService,
    );

const authService =
    new AuthService(
        userRepository,
        passwordHasher,
        tokenService,
    );

const adminService =
    new AdminService(
        userRepository,
    );

const reminderRepository =
    new PostgresReminderRepository(
        db,
    );

const reminderService =
    new ReminderService(
        reminderRepository,
        notificationService,
    );


/*
 * Catalogue :
 * protection plus stricte pour limiter les appels
 * susceptibles d'atteindre AniList.
 */
app.use(
    '/catalog',
    catalogRateLimit,
    createCatalogRouter(
        catalogService,
    ),
);

app.use(
    '/library',
    createLibraryRouter(
        libraryService,
        requireAuth,
    ),
);

app.use(
    '/progress',
    createProgressRouter(
        progressService,
        requireAuth,
    ),
);

app.use(
    '/notifications',
    createNotificationRouter(
        notificationService,
        requireAuth,
    ),
);

/*
 * Authentification :
 * protection plus stricte contre les tentatives répétées.
 */
app.use(
    '/auth',
    authRateLimit,
    createAuthRouter(
        authService,
        requireAuth,
    ),
);

app.use(
    '/admin',
    createAdminRouter(
        adminService,
        requireAuth,
        requireAdmin,
    ),
);

app.use(
    '/reminders',
    createReminderRouter(
        reminderService,
        requireAuth,
    ),
);


app.listen(
    PORT,
    () => {
        console.log(
            `MangaTrack API started on http://localhost:${PORT}`,
        );
    },
);