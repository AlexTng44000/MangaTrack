import {
    useEffect,
    useState,
} from 'react';

import {
    deleteLibraryEntry,
    getLibrary,
    updateLibraryFavorite,
    updateLibraryStatus,
    updateProgress,
    getCatalogByIds,
} from '../api/mangatrack.api';

import type {
    LibraryStatus,
    LibraryEntry,
} from '../types/library';

import type {
    CatalogItem,
} from '../types/catalog';


export function LibraryPage() {
    const [library, setLibrary] =
        useState<LibraryEntry[]>([]);

    const [catalog, setCatalog] =
        useState<CatalogItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        async function loadLibrary() {
            try {
                const libraryData =
                    await getLibrary();

                const catalogIds =
                    libraryData.map(
                        (entry) =>
                            entry.catalogItemId,
                    );

                const catalogData =
                    await getCatalogByIds(
                        catalogIds,
                    );

                setLibrary(
                    libraryData,
                );

                setCatalog(
                    catalogData,
                );
            } finally {
                setLoading(false);
            }
        }

        loadLibrary();
    }, []);

    async function changeProgress(
        entry: LibraryEntry,
        work: CatalogItem | undefined,
        value: number,
    ) {
        let newProgress =
            Math.max(
                0,
                entry.progress + value,
            );

        if (work?.total != null) {
            newProgress =
                Math.min(
                    newProgress,
                    work.total,
                );
        }

        try {
            let updated =
                await updateProgress(
                    entry.id,
                    newProgress,
                );

            let newStatus =
                entry.status;

            // On ne modifie pas automatiquement
            // un statut "abandonné".
            if (
                entry.status !==
                'abandonne'
            ) {
                if (
                    work?.total != null &&
                    newProgress ===
                    work.total
                ) {
                    newStatus =
                        'termine';
                } else if (
                    newProgress === 0
                ) {
                    newStatus =
                        'a_commencer';
                } else {
                    newStatus =
                        'en_cours';
                }
            }

            if (
                newStatus !==
                entry.status
            ) {
                updated =
                    await updateLibraryStatus(
                        entry.id,
                        newStatus,
                    );
            }

            setLibrary(
                (current) =>
                    current.map(
                        (item) =>
                            item.id ===
                                updated.id
                                ? updated
                                : item,
                    ),
            );
        } catch {
            alert(
                'Impossible de modifier la progression.',
            );
        }
    }

    if (loading) {
        return <p>Chargement...</p>;
    }
    async function handleFavoriteToggle(
        entry: LibraryEntry,
    ) {
        try {
            const updatedEntry =
                await updateLibraryFavorite(
                    entry.id,
                    !entry.isFavorite,
                );

            setLibrary(
                (currentLibrary) =>
                    currentLibrary.map(
                        (item) =>
                            item.id === entry.id
                                ? updatedEntry
                                : item,
                    ),
            );
        } catch {
            alert(
                'Impossible de modifier le favori.',
            );
        }
    }
    return (
        <main>
            <h2>Ma bibliothèque</h2>

            <div className="catalog">
                {library.map((entry) => {
                    const work = catalog.find(
                        (item) =>
                            item.id ===
                            entry.catalogItemId,
                    );

                    return (
                        <article
                            key={entry.id}
                            className="catalog-card"
                        >
                            <span className="media-type">
                                {work?.type ?? 'Œuvre'}
                            </span>

                            <h3>
                                {work?.title ??
                                    `Œuvre #${entry.catalogItemId}`}
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    handleFavoriteToggle(entry)
                                }
                                aria-label={
                                    entry.isFavorite
                                        ? 'Retirer des favoris'
                                        : 'Ajouter aux favoris'
                                }
                            >
                                {entry.isFavorite
                                    ? '♥ Favori'
                                    : '♡ Ajouter aux favoris'}
                            </button>
                            <label>
                                Statut :{' '}
                                <select
                                    value={entry.status}
                                    onChange={(event) =>
                                        handleStatusChange(
                                            entry.id,
                                            event.target
                                                .value as LibraryStatus,
                                        )
                                    }
                                >
                                    <option value="a_commencer">
                                        À commencer
                                    </option>

                                    <option value="en_cours">
                                        En cours
                                    </option>

                                    <option value="termine">
                                        Terminé
                                    </option>

                                    <option value="abandonne">
                                        Abandonné
                                    </option>
                                </select>
                            </label>

                            <p>
                                {work?.type === 'anime'
                                    ? 'Épisodes vus'
                                    : work?.type === 'manga'
                                        ? 'Chapitres lus'
                                        : 'Progression'}
                                {' : '}
                                {entry.progress}

                                {work?.total != null &&
                                    ` / ${work.total}`}
                            </p>

                            <div className="progress-actions">
                                <button
                                    onClick={() =>
                                        changeProgress(
                                            entry,
                                            work,
                                            -1,
                                        )
                                    }
                                    disabled={
                                        entry.progress === 0
                                    }
                                >
                                    −
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(entry.id)
                                    }
                                >
                                    Supprimer
                                </button>
                                <strong>
                                    {entry.progress}
                                </strong>

                                <button
                                    onClick={() =>
                                        changeProgress(
                                            entry,
                                            work,
                                            1,
                                        )
                                    }
                                    disabled={
                                        work?.total != null &&
                                        entry.progress >=
                                        work.total
                                    }
                                >
                                    +
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </main>
    );
    async function handleDelete(
        id: number,
    ) {
        try {
            await deleteLibraryEntry(id);

            setLibrary(
                (currentLibrary) =>
                    currentLibrary.filter(
                        (entry) =>
                            entry.id !== id,
                    ),
            );
        } catch {
            alert(
                'Impossible de supprimer cette œuvre.',
            );
        }
    }

    async function handleStatusChange(
        id: number,
        status: LibraryStatus,
    ) {
        try {
            const updatedEntry =
                await updateLibraryStatus(
                    id,
                    status,
                );

            setLibrary(
                (currentLibrary) =>
                    currentLibrary.map(
                        (entry) =>
                            entry.id === id
                                ? updatedEntry
                                : entry,
                    ),
            );
        } catch {
            alert(
                'Impossible de modifier le statut.',
            );
        }
    }
}