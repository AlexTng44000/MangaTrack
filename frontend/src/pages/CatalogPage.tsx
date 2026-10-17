import {
    useEffect,
    useState,
} from 'react';

import type {
    FormEvent,
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

    const [search, setSearch] =
        useState('');

    const [activeSearch, setActiveSearch] =
        useState('');

    const [searching, setSearching] =
        useState(false);

    const [page, setPage] =
        useState(1);

    const [hasNextPage, setHasNextPage] =
        useState(false);

    const [loadingMore, setLoadingMore] =
        useState(false);

    useEffect(() => {
        Promise.all([
            getCatalog(undefined, 1),
            getLibrary(),
        ])
            .then(
                ([
                    catalogData,
                    libraryData,
                ]) => {
                    setItems(
                        catalogData.items,
                    );

                    setPage(
                        catalogData.page,
                    );

                    setHasNextPage(
                        catalogData.hasNextPage,
                    );

                    setAddedItems(
                        libraryData.map(
                            (entry) =>
                                entry.catalogItemId,
                        ),
                    );
                },
            )
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
            await addToLibrary(
                catalogItemId,
            );

            setAddedItems(
                (current) => [
                    ...current,
                    catalogItemId,
                ],
            );
        } catch {
            alert(
                'Impossible d’ajouter cette œuvre.',
            );
        }
    }

    async function handleSearch(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const normalizedSearch =
            search.trim();

        setSearching(true);
        setError(null);

        try {
            const result =
                await getCatalog(
                    normalizedSearch ||
                    undefined,
                    1,
                );

            setItems(
                result.items,
            );

            setPage(
                result.page,
            );

            setHasNextPage(
                result.hasNextPage,
            );

            setActiveSearch(
                normalizedSearch,
            );
        } catch {
            setError(
                'Impossible d’effectuer la recherche.',
            );
        } finally {
            setSearching(false);
        }
    }

    async function handleReset() {
        setSearch('');
        setActiveSearch('');
        setError(null);

        try {
            const result =
                await getCatalog(
                    undefined,
                    1,
                );

            setItems(
                result.items,
            );

            setPage(
                result.page,
            );

            setHasNextPage(
                result.hasNextPage,
            );
        } catch {
            setError(
                'Impossible de réinitialiser le catalogue.',
            );
        }
    }

    async function handleLoadMore() {
        const nextPage =
            page + 1;

        setLoadingMore(true);
        setError(null);

        try {
            const result =
                await getCatalog(
                    activeSearch ||
                    undefined,
                    nextPage,
                );

            setItems(
                (currentItems) => [
                    ...currentItems,
                    ...result.items,
                ],
            );

            setPage(
                result.page,
            );

            setHasNextPage(
                result.hasNextPage,
            );
        } catch {
            setError(
                'Impossible de charger davantage d’œuvres.',
            );
        } finally {
            setLoadingMore(false);
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
            <form
                className="catalog-search"
                onSubmit={handleSearch}
            >
                <input
                    type="search"
                    placeholder="Rechercher un manga ou un anime..."
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value,
                        )
                    }
                />

                <button
                    type="submit"
                    disabled={searching}
                >
                    {searching
                        ? 'Recherche...'
                        : 'Rechercher'}
                </button>

                {(
                    search ||
                    activeSearch
                ) && (
                        <button
                            type="button"
                            onClick={
                                handleReset
                            }
                        >
                            Réinitialiser
                        </button>
                    )}
            </form>

            <h2>Catalogue</h2>

            <div className="catalog">
                {items.map((item) => {
                    const isAdded =
                        addedItems.includes(
                            item.id,
                        );

                    return (
                        <article
                            key={item.id}
                            className="catalog-card"
                        >
                            <span className="media-type">
                                {item.type}
                            </span>

                            <h3>
                                {item.title}
                            </h3>

                            <p>
                                {item.genres.join(
                                    ' • ',
                                )}
                            </p>

                            <button
                                onClick={() =>
                                    handleAdd(
                                        item.id,
                                    )
                                }
                                disabled={
                                    isAdded
                                }
                            >
                                {isAdded
                                    ? 'Ajouté ✓'
                                    : 'Ajouter à ma bibliothèque'}
                            </button>
                        </article>
                    );
                })}
            </div>

            {hasNextPage && (
                <div className="load-more">
                    <button
                        type="button"
                        onClick={
                            handleLoadMore
                        }
                        disabled={
                            loadingMore
                        }
                    >
                        {loadingMore
                            ? 'Chargement...'
                            : 'Charger plus'}
                    </button>
                </div>
            )}
        </main>
    );
}