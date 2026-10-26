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

            return res.json(
                users,
            );
        },
    );

    router.delete(
        '/users/:id',
        requireAuth,
        requireAdmin,
        async (req, res) => {
            const userId =
                Number(
                    req.params.id,
                );

            if (
                !Number.isInteger(
                    userId,
                ) ||
                userId < 1
            ) {
                return res
                    .status(
                        400,
                    )
                    .json({
                        error:
                            'INVALID_USER_ID',
                    });
            }

            const result =
                await adminService.deleteUser(
                    userId,
                );

            if (
                result ===
                'not_found'
            ) {
                return res
                    .status(
                        404,
                    )
                    .json({
                        error:
                            'USER_NOT_FOUND',
                    });
            }

            if (
                result ===
                'protected'
            ) {
                return res
                    .status(
                        403,
                    )
                    .json({
                        error:
                            'ADMIN_USER_PROTECTED',
                    });
            }

            return res
                .status(
                    204,
                )
                .send();
        },
    );

    return router;
}
