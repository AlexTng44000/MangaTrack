import {
    Router,
} from 'express';

import type {
    RequestHandler,
} from 'express';

import type {
    AdminService,
} from './admin.service.js';

export function createAdminRouter(
    adminService: AdminService,
    requireAuth: RequestHandler,
    requireAdmin: RequestHandler,
): Router {
    const router = Router();

    router.get(
        '/users',
        requireAuth,
        requireAdmin,
        async (_req, res) => {
            const users =
                await adminService.getUsers();

            return res.json(users);
        },
    );

    return router;
}