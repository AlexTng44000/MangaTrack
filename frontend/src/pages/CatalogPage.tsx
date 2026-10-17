import {
    useEffect,
    useState,
} from 'react';

import type {
    FormEvent,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    addToLibrary,
    deleteLibraryEntry,
    getCatalog,
    getLibrary,
} from '../api/mangatrack.api';

import type {
    CatalogItem,
} from '../types/catalog';

function getTotalLabel(
    item: CatalogItem,
): string {
    if (
        item.total === null ||
        item.total === undefined
    ) {
        return 'Total inconnu';
    }

    return item.type === 'anime'
        ? `${item.total} épisode${item.total > 1 ? 's' : ''}`
        : `${item.total} chapitre${item.total > 1 ? 's' : ''}`;
}

export function CatalogPage() {
    const [
        items,
        setItems,
    ] =
        useState<CatalogItem[]>([]);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null,
        );

    const [
        libraryEntries,
        setLibraryEntries,
    ] =
        useState<Record<number, number>>(
            {},
        );

    const [
        removingId,
        setRemovingId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        search,
        setSearch,
    ] =
        useState('');

    const [
        activeSearch,
        setActiveSearch,
    ] =
        useState('');

    const [
        searching,
        setSearching,
    ] =
        useState(false);

    const [
        page,
        setPage,
    ] =
        useState(1);

    const [
        hasNextPage,
        setHasNextPage,
    ] =
        useState(false);

    const [
        loadingMore,
        setLoadingMore,
    ] =
        useState(false);

    const [
        typeFilter,
        setTypeFilter,
    ] =
        useState<
            '' | 'anime' | 'manga'
        >('');

    const [
        genreFilter,
        setGenreFilter,
    ] =
        useState('');

    const [
        activeType,
        setActiveType,
    ] =
        useState<
            '' | 'anime' | 'manga'
        >('');

    const [
        activeGenre,
        setActiveGenre,
    ] =
        useState('');

    const navigate =
        useNavigate();

    useEffect(() => {
        Promise.all([
            getCatalog(
                undefined,
                1,
            ),
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

                    setLibraryEntries(
                        Object.fromEntries(
                            libraryData.map(
                                (entry) => [
                                    entry.catalogItemId,
                                    entry.id,
                                ],
                            ),
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
                setLoading(
                    false,
                );
            });
    }, []);

    async function handleAdd(
        catalogItemId: number,
    ) {
        try {
            await addToLibrary(
                catalogItemId,
            );

            const library =
                await getLibrary();

            const entry =
                library.find(
                    (current) =>
                        current.catalogItemId ===
                        catalogItemId,
                );

            if (entry) {
                setLibraryEntries(
                    (current) => ({
                        ...current,
                        [catalogItemId]:
                            entry.id,
                    }),
                );
            }
        } catch {
            alert(
                'Impossible d’ajouter cette œuvre.',
            );
        }
    }

    async function handleRemove(
        catalogItemId: number,
        libraryEntryId: number,
    ) {
        setRemovingId(
            catalogItemId,
        );

        try {
            await deleteLibraryEntry(
                libraryEntryId,
            );

            setLibraryEntries(
                (current) => {
                    const next = {
                        ...current,
                    };

                    delete next[
                        catalogItemId
                    ];

                    return next;
                },
            );
        } catch {
            alert(
                'Impossible de retirer cette œuvre de la bibliothèque.',
            );
        } finally {
            setRemovingId(
                null,
            );
        }
    }

    async function handleSearch(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const normalizedSearch =
            search.trim();

        setSearching(
            true,
        );

        setError(
            null,
        );

        try {
            const result =
                await getCatalog(
                    normalizedSearch ||
                    undefined,
                    1,
                    typeFilter ||
                    undefined,
                    genreFilter ||
                    undefined,
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

            setActiveType(
                typeFilter,
            );

            setActiveGenre(
                genreFilter,
            );
        } catch {
            setError(
                'Impossible d’effectuer la recherche.',
            );
        } finally {
            setSearching(
                false,
            );
        }
    }

    async function handleReset() {
        setSearch(
            '',
        );

        setActiveSearch(
            '',
        );

        setError(
            null,
        );

        setTypeFilter(
            '',
        );

        setGenreFilter(
            '',
        );

        setActiveType(
            '',
        );

        setActiveGenre(
            '',
        );

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

        setLoadingMore(
            true,
        );

        setError(
            null,
        );

        try {
            const result =
                await getCatalog(
                    activeSearch ||
                    undefined,
                    nextPage,
                    activeType ||
                    undefined,
                    activeGenre ||
                    undefined,
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
            setLoadingMore(
                false,
            );
        }
    }

    const hasActiveFilters =
        Boolean(
            activeSearch ||
            activeType ||
            activeGenre,
        );

    if (loading) {
        return (
            <main className="catalog-page">
                <section className="catalog-heading">
                    <div>
                        <span className="page-eyebrow">
                            Découvrir
                        </span>

                        <h2>
                            Catalogue
                        </h2>

                        <p>
                            Chargement des œuvres...
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="catalog-page">
            <section className="catalog-heading">
                <div>
                    <span className="page-eyebrow">
                        Découvrir
                    </span>

                    <h2>
                        Catalogue
                    </h2>

                    <p>
                        Recherche un anime ou un manga,
                        filtre par type ou par genre,
                        puis ajoute tes découvertes à ta
                        bibliothèque.
                    </p>
                </div>

                <div className="catalog-result-summary">
                    <strong>
                        {
                            items.length
                        }
                    </strong>

                    <span>
                        résultat
                        {items.length > 1
                            ? 's affichés'
                            : ' affiché'}
                    </span>
                </div>
            </section>

            <form
                className="catalog-search"
                onSubmit={
                    handleSearch
                }
            >
                <label className="catalog-search-field">
                    <span>
                        Rechercher
                    </span>

                    <input
                        type="search"
                        placeholder="Titre d’un manga ou d’un anime..."
                        value={
                            search
                        }
                        onChange={(
                            event,
                        ) =>
                            setSearch(
                                event
                                    .target
                                    .value,
                            )
                        }
                    />
                </label>

                <label>
                    <span>
                        Type
                    </span>

                    <select
                        value={
                            typeFilter
                        }
                        onChange={(
                            event,
                        ) =>
                            setTypeFilter(
                                event
                                    .target
                                    .value as
                                | ''
                                | 'anime'
                                | 'manga',
                            )
                        }
                    >
                        <option value="">
                            Tous
                        </option>

                        <option value="anime">
                            Anime
                        </option>

                        <option value="manga">
                            Manga
                        </option>
                    </select>
                </label>

                <label>
                    <span>
                        Genre
                    </span>

                    <select
                        value={
                            genreFilter
                        }
                        onChange={(
                            event,
                        ) =>
                            setGenreFilter(
                                event
                                    .target
                                    .value,
                            )
                        }
                    >
                        <option value="">
                            Tous
                        </option>

                        <option value="Action">
                            Action
                        </option>

                        <option value="Adventure">
                            Adventure
                        </option>

                        <option value="Comedy">
                            Comedy
                        </option>

                        <option value="Drama">
                            Drama
                        </option>

                        <option value="Fantasy">
                            Fantasy
                        </option>

                        <option value="Horror">
                            Horror
                        </option>

                        <option value="Mystery">
                            Mystery
                        </option>

                        <option value="Psychological">
                            Psychological
                        </option>

                        <option value="Romance">
                            Romance
                        </option>

                        <option value="Sci-Fi">
                            Sci-Fi
                        </option>

                        <option value="Slice of Life">
                            Slice of Life
                        </option>

                        <option value="Supernatural">
                            Supernatural
                        </option>
                    </select>
                </label>

                <div className="catalog-search-actions">
                    <button
                        type="submit"
                        className="catalog-search-submit"
                        disabled={
                            searching
                        }
                    >
                        {searching
                            ? 'Recherche...'
                            : 'Rechercher'}
                    </button>

                    {(
                        search ||
                        activeSearch ||
                        typeFilter ||
                        activeType ||
                        genreFilter ||
                        activeGenre
                    ) && (
                            <button
                                type="button"
                                className="catalog-reset-button"
                                onClick={
                                    handleReset
                                }
                            >
                                Réinitialiser
                            </button>
                        )}
                </div>
            </form>

            {hasActiveFilters && (
                <div className="catalog-active-filters">
                    <span>
                        Filtres actifs
                    </span>

                    {activeSearch && (
                        <strong>
                            “
                            {
                                activeSearch
                            }
                            ”
                        </strong>
                    )}

                    {activeType && (
                        <strong>
                            {activeType ===
                                'anime'
                                ? 'Anime'
                                : 'Manga'}
                        </strong>
                    )}

                    {activeGenre && (
                        <strong>
                            {
                                activeGenre
                            }
                        </strong>
                    )}
                </div>
            )}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {items.length === 0 &&
                !error ? (
                <section className="catalog-empty">
                    <span>
                        Aucun résultat
                    </span>

                    <h3>
                        Aucune œuvre ne correspond
                    </h3>

                    <p>
                        Essaie un autre titre ou retire
                        certains filtres.
                    </p>

                    <button
                        type="button"
                        onClick={
                            handleReset
                        }
                    >
                        Réinitialiser la recherche
                    </button>
                </section>
            ) : (
                <div className="catalog">
                    {items.map(
                        (item) => {
                            const libraryEntryId =
                                libraryEntries[
                                item.id
                                ];

                            const isAdded =
                                libraryEntryId !==
                                undefined;

                            return (
                                <article
                                    key={
                                        item.id
                                    }
                                    className={
                                        isAdded
                                            ? 'catalog-card catalog-card-added'
                                            : 'catalog-card'
                                    }
                                >
                                    <div className="catalog-card-top">
                                        <span className="media-type">
                                            {
                                                item.type
                                            }
                                        </span>

                                        {isAdded && (
                                            <span className="catalog-added-badge">
                                                ✓ Bibliothèque
                                            </span>
                                        )}
                                    </div>

                                    <div className="catalog-card-main">
                                        <h3>
                                            {
                                                item.title
                                            }
                                        </h3>

                                        <div className="catalog-genres">
                                            {item.genres
                                                .slice(
                                                    0,
                                                    4,
                                                )
                                                .map(
                                                    (
                                                        genre,
                                                    ) => (
                                                        <span
                                                            key={
                                                                genre
                                                            }
                                                        >
                                                            {
                                                                genre
                                                            }
                                                        </span>
                                                    ),
                                                )}
                                        </div>

                                        <div className="catalog-card-meta">
                                            <span>
                                                {
                                                    getTotalLabel(
                                                        item,
                                                    )
                                                }
                                            </span>

                                            {item.genres.length >
                                                4 && (
                                                    <span>
                                                        +
                                                        {item
                                                            .genres
                                                            .length -
                                                            4}{' '}
                                                        genres
                                                    </span>
                                                )}
                                        </div>
                                    </div>

                                    <div className="catalog-card-actions">
                                        <button
                                            type="button"
                                            className="catalog-details-button"
                                            onClick={() =>
                                                navigate(
                                                    `/catalog/${item.id}`,
                                                )
                                            }
                                        >
                                            Voir la fiche
                                        </button>

                                        {isAdded ? (
                                            <button
                                                type="button"
                                                className="catalog-remove-button"
                                                disabled={
                                                    removingId ===
                                                    item.id
                                                }
                                                onClick={() =>
                                                    handleRemove(
                                                        item.id,
                                                        libraryEntryId,
                                                    )
                                                }
                                            >
                                                {removingId ===
                                                    item.id
                                                    ? 'Retrait...'
                                                    : 'Retirer'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="catalog-add-button"
                                                onClick={() =>
                                                    handleAdd(
                                                        item.id,
                                                    )
                                                }
                                            >
                                                Ajouter
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        },
                    )}
                </div>
            )}

            {hasNextPage &&
                items.length >
                0 && (
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
                                : 'Afficher plus d’œuvres'}
                        </button>
                    </div>
                )}
        </main>
    );
}
