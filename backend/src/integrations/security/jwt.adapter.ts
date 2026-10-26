import jwt, {
    type SignOptions,
} from 'jsonwebtoken';

import {
    env,
} from '../../config/env.js';

import type {
    TokenPayload,
    TokenPort,
} from '../../modules/users/token.port.js';

export class JwtAdapter
    implements TokenPort {
    sign(
        payload: TokenPayload,
    ): string {
        const options: SignOptions = {
            expiresIn:
                env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
        };

        return jwt.sign(
            payload,
            env.JWT_SECRET,
            options,
        );
    }

    verify(
        token: string,
    ): TokenPayload {
        const payload = jwt.verify(
            token,
            env.JWT_SECRET,
        );

        if (
            typeof payload !== 'object' ||
            payload === null ||
            typeof payload.userId !== 'number' ||
            (
                payload.role !== 'user' &&
                payload.role !== 'admin'
            )
        ) {
            throw new Error(
                'TOKEN_INVALID',
            );
        }

        return {
            userId: payload.userId,
            role: payload.role,
        };
    }
}