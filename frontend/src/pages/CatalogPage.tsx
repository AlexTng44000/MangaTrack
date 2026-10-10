import {
    useEffect,
    useState,
} from 'react';

import {
    addToLibrary,
    getCatalog,
    getLibrary,
} from '../api/mangatrack.api';

import type {
    CatalogItem,
} from '../types/catalog';

export function CatalogPage() {
    const [items, setItems] =
        useState<CatalogItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [addedItems, setAddedItems] =
        useState<number[]>([]);

    useEffect(() => {
        Promise.all([
            getCatalog(),
            getLibrary(),
        ])
            .then(([catalogData, libraryData]) => {
                setItems(catalogData);

                setAddedItems(
                    libraryData.map(
                        (entry) => entry.catalogItemId,
                    ),
                );
            })
            .catch(() => {
                setError(
                    'Impossible de charger le catalogue.',
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    async function handleAdd(
        catalogItemId: number,
    ) {
        try {
            await addToLibrary(catalogItemId);

            setAddedItems((current) => [
                ...current,
                catalogItemId,
            ]);
        } catch {
            alert(
                'Impossible d’ajouter cette œuvre.',
            );
        }
    }

    if (loading) {
        return <p>Chargement...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <main>

            <h2>Catalogue</h2>

            <div className="catalog">
                {items.map((item) => {
                    const isAdded =
                        addedItems.includes(item.id);

                    return (
                        <article
                            key={item.id}
                            className="catalog-card"
                        >
                            <span className="media-type">
                                {item.type}
                            </span>

                            <h3>{item.title}</h3>

                            <p>
                                {item.genres.join(' • ')}
                            </p>

                            <button
                                onClick={() =>
                                    handleAdd(item.id)
                                }
                                disabled={isAdded}
                            >
                                {isAdded
                                    ? 'Ajouté ✓'
                                    : 'Ajouter à ma bibliothèque'}
                            </button>
                        </article>
                    );
                })}
            </div>
        </main>
    );
}