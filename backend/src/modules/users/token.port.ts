import type {
    UserRole,
} from './user.types.js';

export interface TokenPayload {
    userId: number;
    role: UserRole;
}

export interface TokenPort {
    sign(
        payload: TokenPayload,
    ): string;

    verify(
        token: string,
    ): TokenPayload;
}