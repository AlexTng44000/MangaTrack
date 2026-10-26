import type {
    UserRepository,
} from './user.repository.js';

import type {
    PublicUser,
} from './user.types.js';

export type DeleteUserResult =
    | 'deleted'
    | 'not_found'
    | 'protected';

export class AdminService {
    constructor(
        private readonly users:
            UserRepository,
    ) { }

    async getUsers():
        Promise<PublicUser[]> {
        const users =
            await this.users.getAll();

        return users.map(
            (user) => ({
                id: user.id,
                email: user.email,
                role: user.role,
            }),
        );
    }

    async deleteUser(
        id: number,
    ): Promise<DeleteUserResult> {
        const user =
            await this.users.findById(
                id,
            );

        if (!user) {
            return 'not_found';
        }

        if (
            user.role ===
            'admin'
        ) {
            return 'protected';
        }

        const deleted =
            await this.users.deleteById(
                id,
            );

        return deleted
            ? 'deleted'
            : 'not_found';
    }
}
