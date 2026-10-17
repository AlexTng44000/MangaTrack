import type {
    PasswordHasherPort,
} from './passwordHasher.port.js';

import type {
    TokenPort,
} from './token.port.js';

import type {
    UserRepository,
} from './user.repository.js';

export class AuthService {
    constructor(
        private readonly users:
            UserRepository,
        private readonly passwordHasher:
            PasswordHasherPort,
        private readonly tokenService:
            TokenPort,
    ) { }

    async register(
        email: string,
        password: string,
    ) {
        const existing =
            await this.users.findByEmail(
                email,
            );

        if (existing) {
            throw new Error(
                'EMAIL_ALREADY_EXISTS',
            );
        }

        const passwordHash =
            await this.passwordHasher.hash(
                password,
            );

        const user =
            await this.users.create({
                email,
                passwordHash,
                role: 'user',
            });

        const token =
            this.tokenService.sign({
                userId: user.id,
                role: user.role,
            });

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            token,
        };
    }

    async login(
        email: string,
        password: string,
    ) {
        const user =
            await this.users.findByEmail(
                email,
            );

        if (!user) {
            throw new Error(
                'INVALID_CREDENTIALS',
            );
        }

        const validPassword =
            await this.passwordHasher.compare(
                password,
                user.passwordHash,
            );

        if (!validPassword) {
            throw new Error(
                'INVALID_CREDENTIALS',
            );
        }

        const token =
            this.tokenService.sign({
                userId: user.id,
                role: user.role,
            });

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            token,
        };
    }
}