import {
    rateLimit,
} from 'express-rate-limit';

export const globalRateLimit =
    rateLimit({
        windowMs: 60 * 1000,
        limit: 120,

        standardHeaders: 'draft-8',
        legacyHeaders: false,

        message: {
            error:
                'Trop de requêtes. Réessaie dans quelques instants.',
        },
    });

export const authRateLimit =
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,

        standardHeaders: 'draft-8',
        legacyHeaders: false,

        message: {
            error:
                'Trop de tentatives de connexion. Réessaie plus tard.',
        },
    });

export const catalogRateLimit =
    rateLimit({
        windowMs: 60 * 1000,
        limit: 30,

        standardHeaders: 'draft-8',
        legacyHeaders: false,

        message: {
            error:
                'Trop de recherches. Réessaie dans quelques instants.',
        },
    });