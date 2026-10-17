const API_URL =
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000';

const TOKEN_KEY = 'mangatrack_token';

export interface AuthUser {
    id: number;
    email: string;
    role: 'user' | 'admin';
}

export interface AuthResponse {
    user: AuthUser;
    token: string;
}

export function getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function saveToken(
    token: string,
): void {
    sessionStorage.setItem(
        TOKEN_KEY,
        token,
    );
}

export function removeToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

async function authRequest(
    endpoint: 'login' | 'register',
    email: string,
    password: string,
): Promise<AuthResponse> {
    const response = await fetch(
        `${API_URL}/auth/${endpoint}`,
        {
            method: 'POST',
            headers: {
                'Content-Type':
                    'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        },
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ??
            'Erreur d’authentification',
        );
    }

    return data;
}

export async function login(
    email: string,
    password: string,
): Promise<AuthResponse> {
    const result =
        await authRequest(
            'login',
            email,
            password,
        );

    saveToken(result.token);

    return result;
}

export async function register(
    email: string,
    password: string,
): Promise<AuthResponse> {
    const result =
        await authRequest(
            'register',
            email,
            password,
        );

    saveToken(result.token);

    return result;
}

export function logout(): void {
    removeToken();
}