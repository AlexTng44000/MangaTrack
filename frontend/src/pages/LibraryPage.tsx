import {
    useEffect,
    useState,
} from 'react';

import {
    deleteLibraryEntry,
    getCatalog,
    getLibrary,
    updateLibraryStatus,
    updateProgress,
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
        Promise.all([
            getLibrary(),
            getCatalog(),
        ])
            .then(([libraryData, catalogData]) => {
                setLibrary(libraryData);
                setCatalog(catalogData.items);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    async function changeProgress(
        entry: LibraryEntry,
        value: number,
    ) {
        const newProgress =
            Math.max(0, entry.progress + value);

        try {
            const updated =
                await updateProgress(
                    entry.id,
                    newProgress,
                );

            setLibrary((current) =>
                current.map((item) =>
                    item.id === updated.id
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
                                Progression : {entry.progress}
                            </p>

                            <div className="progress-actions">
                                <button
                                    onClick={() =>
                                        changeProgress(entry, -1)
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
                                        changeProgress(entry, 1)
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