import bcrypt from 'bcryptjs';

import type {
    PasswordHasherPort,
} from '../../modules/users/passwordHasher.port.js';

export class BcryptAdapter
    implements PasswordHasherPort {
    async hash(
        password: string,
    ): Promise<string> {
        return bcrypt.hash(password, 12);
    }

    async compare(
        password: string,
        hash: string,
    ): Promise<boolean> {
        return bcrypt.compare(
            password,
            hash,
        );
    }
}