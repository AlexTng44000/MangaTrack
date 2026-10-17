import { Router } from 'express';

import {
    loginSchema,
    registerSchema,
} from './auth.schema.js';

import type {
    AuthService,
} from './auth.service.js';

import type {
    RequestHandler,
} from 'express';

export function createAuthRouter(
    authService: AuthService,
    requireAuth: RequestHandler,
): Router {
    const router = Router();

    router.post(
        '/register',
        async (req, res) => {
            const validation =
                registerSchema.safeParse(
                    req.body,
                );

            if (!validation.success) {
                return res.status(400).json({
                    error:
                        'Données invalides',
                    details:
                        validation.error.flatten(),
                });
            }

            try {
                const result =
                    await authService.register(
                        validation.data.email,
                        validation.data.password,
                    );

                return res
                    .status(201)
                    .json(result);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                    'EMAIL_ALREADY_EXISTS'
                ) {
                    return res.status(409).json({
                        error:
                            'Cet email est déjà utilisé',
                    });
                }

                return res.status(500).json({
                    error:
                        'Erreur interne',
                });
            }
        },
    );

    router.post(
        '/login',
        async (req, res) => {
            const validation =
                loginSchema.safeParse(
                    req.body,
                );

            if (!validation.success) {
                return res.status(400).json({
                    error:
                        'Données invalides',
                    details:
                        validation.error.flatten(),
                });
            }

            try {
                const result =
                    await authService.login(
                        validation.data.email,
                        validation.data.password,
                    );

                return res.json(result);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                    'INVALID_CREDENTIALS'
                ) {
                    return res.status(401).json({
                        error:
                            'Email ou mot de passe incorrect',
                    });
                }

                return res.status(500).json({
                    error:
                        'Erreur interne',
                });
            }
        },
    );

    router.get(
        '/me',
        requireAuth,
        async (req, res) => {
            return res.json({
                userId: req.auth?.userId,
                role: req.auth?.role,
            });
        },
    );

    return router;
}