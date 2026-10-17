export type UserRole =
    | 'user'
    | 'admin';

export interface User {
    id: number;
    email: string;
    passwordHash: string;
    role: UserRole;
}

export interface CreateUserInput {
    email: string;
    passwordHash: string;
    role?: UserRole;
}

export interface PublicUser {
    id: number;
    email: string;
    role: UserRole;
}