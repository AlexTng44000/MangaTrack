import type {
    CatalogPageResult,
    CatalogItem,
    CatalogDetails,
} from '../types/catalog';

import type {
    LibraryEntry,
    LibraryStatus,
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

export async function getCatalog(
    search?: string,
    page = 1,
    type?: 'anime' | 'manga',
    genre?: string,
): Promise<CatalogPageResult> {
    const params =
        new URLSearchParams();

    params.set(
        'page',
        String(page),
    );

    if (
        search &&
        search.trim()
    ) {
        params.set(
            'search',
            search.trim(),
        );
    }

    if (type) {
        params.set(
            'type',
            type,
        );
    }

    if (
        genre &&
        genre.trim()
    ) {
        params.set(
            'genre',
            genre.trim(),
        );
    }

    const response =
        await fetch(
            `${API_URL}/catalog?${params.toString()}`,
        );

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

export async function deleteLibraryEntry(
    id: number,
): Promise<void> {
    const response =
        await authenticatedFetch(
            `${API_URL}/library/${id}`,
            {
                method: 'DELETE',
            },
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de supprimer cette œuvre',
        );
    }
}

export async function updateLibraryStatus(
    id: number,
    status: LibraryStatus,
): Promise<LibraryEntry> {
    const response =
        await authenticatedFetch(
            `${API_URL}/library/${id}/status`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type':
                        'application/json',
                },
                body: JSON.stringify({
                    status,
                }),
            },
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de modifier le statut',
        );
    }

    return response.json();
}

export async function updateLibraryFavorite(
    id: number,
    isFavorite: boolean,
): Promise<LibraryEntry> {
    const response =
        await authenticatedFetch(
            `${API_URL}/library/${id}/favorite`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type':
                        'application/json',
                },
                body: JSON.stringify({
                    isFavorite,
                }),
            },
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de modifier le favori',
        );
    }

    return response.json();
}

export async function getCatalogByIds(
    ids: number[],
): Promise<CatalogItem[]> {
    if (ids.length === 0) {
        return [];
    }

    const response =
        await fetch(
            `${API_URL}/catalog/by-ids?ids=${ids.join(',')}`,
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de charger les œuvres',
        );
    }

    return response.json();
}

export async function updateLibraryRating(
    id: number,
    rating: number | null,
): Promise<LibraryEntry> {
    const response =
        await authenticatedFetch(
            `${API_URL}/library/${id}/rating`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type':
                        'application/json',
                },
                body: JSON.stringify({
                    rating,
                }),
            },
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de modifier la note',
        );
    }

    return response.json();
}

export async function getCatalogDetails(
    id: number,
): Promise<CatalogDetails> {
    const response =
        await fetch(
            `${API_URL}/catalog/${id}`,
        );

    if (!response.ok) {
        throw new Error(
            'Impossible de charger la fiche',
        );
    }

    return response.json();
}