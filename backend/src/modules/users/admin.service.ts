import type {
    UserRepository,
} from './user.repository.js';

import type {
    PublicUser,
} from './user.types.js';

export class AdminService {
    constructor(
        private readonly users:
            UserRepository,
    ) { }

    async getUsers():
        Promise<PublicUser[]> {
        const users =
            await this.users.getAll();

        return users.map((user) => ({
            id: user.id,
            email: user.email,
            role: user.role,
        }));
    }
}