import type {
    Pool,
} from 'pg';

import type {
    UserRepository,
} from '../../modules/users/user.repository.js';

import type {
    CreateUserInput,
    User,
} from '../../modules/users/user.types.js';

export class PostgresUserRepository
    implements UserRepository {
    constructor(
        private readonly db: Pool,
    ) { }

    async findByEmail(
        email: string,
    ): Promise<User | undefined> {
        const result =
            await this.db.query<User>(
                `
                SELECT
                    id,
                    email,
                    password_hash AS "passwordHash",
                    role
                FROM users
                WHERE email = $1
                `,
                [email],
            );

        return result.rows[0];
    }

    async findById(
        id: number,
    ): Promise<User | undefined> {
        const result =
            await this.db.query<User>(
                `
                SELECT
                    id,
                    email,
                    password_hash AS "passwordHash",
                    role
                FROM users
                WHERE id = $1
                `,
                [id],
            );

        return result.rows[0];
    }

    async create(
        input: CreateUserInput,
    ): Promise<User> {
        const result =
            await this.db.query<User>(
                `
                INSERT INTO users (
                    email,
                    password_hash,
                    role
                )
                VALUES ($1, $2, $3)
                RETURNING
                    id,
                    email,
                    password_hash AS "passwordHash",
                    role
                `,
                [
                    input.email,
                    input.passwordHash,
                    input.role ?? 'user',
                ],
            );

        return result.rows[0];
    }
    async getAll(): Promise<User[]> {
        const result =
            await this.db.query<User>(
                `
                SELECT
                    id,
                    email,
                    password_hash AS "passwordHash",
                    role
                FROM users
                ORDER BY id
                `,
            );

        return result.rows;
    }
}