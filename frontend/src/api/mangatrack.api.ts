import type {
    CatalogItem,
} from '../types/catalog';

import type {
    LibraryEntry,
} from '../types/library';

import {
    getToken,
} from '../auth/auth';

const API_URL =
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000';
async function authenticatedFetch(
    url: string,
    options: RequestInit = {},
): Promise<Response> {
    const token = getToken();

    if (!token) {
        throw new Error(
            'Authentification requise',
        );
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization:
                `Bearer ${token}`,
        },
    });
}

export async function getCatalog():
    Promise<CatalogItem[]> {
    const response =
        await fetch(`${API_URL}/catalog`);

    if (!response.ok) {
        throw new Error(
            'Impossible de charger le catalogue',
        );
    }

    return response.json();
}

export async function addToLibrary(
    catalogItemId: number,
) {
    const response =
        await authenticatedFetch(
            `${API_URL}/library`,
            {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json',
                },
                body: JSON.stringify({
                    catalogItemId,
                    status: 'a_commencer',
                }),
            },
        );

    if (response.status === 409) {
        throw new Error(
            'Cette œuvre est déjà dans votre bibliothèque.',
        );
    }

    if (!response.ok) {
        throw new Error(
            'Impossible d’ajouter cette œuvre.',
        );
    }

    return response.json();
}

export async function getLibrary():
    Promise<LibraryEntry[]> {
    const response =
        await authenticatedFetch(
            `${API_URL}/library`,
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de charger la bibliothèque',
        );
    }

    return response.json();
}

export async function updateProgress(
    libraryEntryId: number,
    progress: number,
): Promise<LibraryEntry> {
    const response =
        await authenticatedFetch(
            `${API_URL}/progress/${libraryEntryId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type':
                        'application/json',
                },
                body: JSON.stringify({
                    progress,
                }),
            },
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de modifier la progression',
        );
    }

    return response.json();
}
export interface CreateReminderInput {
    message: string;
    scheduledAt?: string;
}

export interface CreateReminderResult {
    jobId: string | null;
    status: 'queued' | 'scheduled';
    scheduledAt: string | null;
}

export async function createReminder(
    input: CreateReminderInput,
): Promise<CreateReminderResult> {
    const response =
        await authenticatedFetch(
            `${API_URL}/notifications`,
            {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json',
                },
                body:
                    JSON.stringify(input),
            },
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ??
            'Impossible de programmer le rappel',
        );
    }

    return data;
}

export interface AdminUser {
    id: number;
    email: string;
    role: 'user' | 'admin';
}

export async function getAdminUsers():
    Promise<AdminUser[]> {
    const response =
        await authenticatedFetch(
            `${API_URL}/admin/users`,
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de charger les utilisateurs',
        );
    }

    return response.json();
}