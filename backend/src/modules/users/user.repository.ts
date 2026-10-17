import type {
    CreateUserInput,
    User,
} from './user.types.js';

export interface UserRepository {
    findByEmail(
        email: string,
    ): Promise<User | undefined>;

    findById(
        id: number,
    ): Promise<User | undefined>;

    getAll(): Promise<User[]>;

    create(
        input: CreateUserInput,
    ): Promise<User>;

    deleteById(
        id: number,
    ): Promise<boolean>;
}
