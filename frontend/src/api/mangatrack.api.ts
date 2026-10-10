import type {
    CatalogItem,
} from '../types/catalog';

import type {
    LibraryEntry,
} from '../types/library';

const API_URL = 'http://localhost:3000';

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
    const response = await fetch(
        `${API_URL}/library`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: 1,
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
        await fetch(`${API_URL}/library`);

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
    const response = await fetch(
        `${API_URL}/progress/${libraryEntryId}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
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