import type {
    NextFunction,
    Request,
    Response,
} from 'express';

import type {
    TokenPort,
} from './token.port.js';

export function createRequireAuth(
    tokenService: TokenPort,
) {
    return (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const authorization =
            req.headers.authorization;

        if (
            !authorization ||
            !authorization.startsWith(
                'Bearer ',
            )
        ) {
            return res.status(401).json({
                error:
                    'Authentification requise',
            });
        }

        const token =
            authorization.slice(
                'Bearer '.length,
            );

        try {
            req.auth =
                tokenService.verify(token);

            return next();
        } catch {
            return res.status(401).json({
                error:
                    'Token invalide ou expiré',
            });
        }
    };
}

export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (!req.auth) {
        return res.status(401).json({
            error:
                'Authentification requise',
        });
    }

    if (req.auth.role !== 'admin') {
        return res.status(403).json({
            error:
                'Accès réservé aux administrateurs',
        });
    }

    return next();
}