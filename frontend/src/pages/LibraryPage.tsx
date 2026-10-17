import {
    useEffect,
    useState,
} from 'react';

import {
    getCatalog,
    getLibrary,
    updateProgress,
} from '../api/mangatrack.api';

import type {
    CatalogItem,
} from '../types/catalog';

import type {
    LibraryEntry,
} from '../types/library';

export function LibraryPage() {
    const [library, setLibrary] =
        useState<LibraryEntry[]>([]);

    const [catalog, setCatalog] =
        useState<CatalogItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const statusLabels = {
        a_commencer: 'À commencer',
        en_cours: 'En cours',
        termine: 'Terminé',
        abandonne: 'Abandonné',
    };

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

                            <p>
                                Statut : {statusLabels[entry.status]}
                            </p>

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
}