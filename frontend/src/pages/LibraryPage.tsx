import {
    useEffect,
    useState,
} from 'react';

import {
    deleteLibraryEntry,
    getCatalogByIds,
    getLibrary,
    updateLibraryFavorite,
    updateLibraryRating,
    updateLibraryStatus,
    updateProgress,
} from '../api/mangatrack.api';

import type {
    LibraryEntry,
    LibraryStatus,
} from '../types/library';

import type {
    CatalogItem,
} from '../types/catalog';

import {
    useNavigate,
} from 'react-router-dom';

function getStatusLabel(
    status: LibraryStatus,
): string {
    switch (status) {
        case 'a_commencer':
            return 'À commencer';

        case 'en_cours':
            return 'En cours';

        case 'termine':
            return 'Terminé';

        case 'abandonne':
            return 'Abandonné';

        default:
            return status;
    }
}

export function LibraryPage() {
    const [library, setLibrary] =
        useState<LibraryEntry[]>([]);

    const [catalog, setCatalog] =
        useState<CatalogItem[]>([]);

    const [
        progressInputs,
        setProgressInputs,
    ] =
        useState<Record<number, string>>(
            {},
        );

    const [loading, setLoading] =
        useState(true);

    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState<
            '' | LibraryStatus
        >('');

    const [
        favoriteOnly,
        setFavoriteOnly,
    ] =
        useState(false);

    const navigate =
        useNavigate();

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

                setProgressInputs(
                    Object.fromEntries(
                        libraryData.map(
                            (entry) => [
                                entry.id,
                                String(
                                    entry.progress,
                                ),
                            ],
                        ),
                    ),
                );
            } finally {
                setLoading(
                    false,
                );
            }
        }

        loadLibrary();
    }, []);

    async function saveProgress(
        entry: LibraryEntry,
        work: CatalogItem | undefined,
        requestedProgress: number,
    ) {
        if (
            !Number.isInteger(
                requestedProgress,
            ) ||
            requestedProgress < 0
        ) {
            alert(
                'La progression doit être un nombre entier positif.',
            );

            return;
        }

        let newProgress =
            requestedProgress;

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
                    newProgress ===
                    0
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

            setProgressInputs(
                (current) => ({
                    ...current,
                    [entry.id]:
                        String(
                            updated.progress,
                        ),
                }),
            );
        } catch {
            alert(
                'Impossible de modifier la progression.',
            );
        }
    }

    async function changeProgress(
        entry: LibraryEntry,
        work: CatalogItem | undefined,
        value: number,
    ) {
        await saveProgress(
            entry,
            work,
            entry.progress + value,
        );
    }

    async function handleDirectProgress(
        entry: LibraryEntry,
        work: CatalogItem | undefined,
    ) {
        const rawValue =
            progressInputs[
            entry.id
            ] ??
            String(
                entry.progress,
            );

        const value =
            Number(
                rawValue,
            );

        await saveProgress(
            entry,
            work,
            value,
        );
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
                            item.id ===
                                entry.id
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

    async function handleRatingChange(
        entry: LibraryEntry,
        rating: number,
    ) {
        try {
            const updatedEntry =
                await updateLibraryRating(
                    entry.id,
                    rating,
                );

            setLibrary(
                (currentLibrary) =>
                    currentLibrary.map(
                        (item) =>
                            item.id ===
                                entry.id
                                ? updatedEntry
                                : item,
                    ),
            );
        } catch {
            alert(
                'Impossible de modifier la note.',
            );
        }
    }

    async function handleRemoveRating(
        entry: LibraryEntry,
    ) {
        try {
            const updatedEntry =
                await updateLibraryRating(
                    entry.id,
                    null,
                );

            setLibrary(
                (currentLibrary) =>
                    currentLibrary.map(
                        (item) =>
                            item.id ===
                                entry.id
                                ? updatedEntry
                                : item,
                    ),
            );
        } catch {
            alert(
                'Impossible de retirer la note.',
            );
        }
    }

    async function handleDelete(
        id: number,
    ) {
        try {
            await deleteLibraryEntry(
                id,
            );

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

    const filteredLibrary =
        library.filter(
            (entry) => {
                const matchesStatus =
                    statusFilter === '' ||
                    entry.status ===
                    statusFilter;

                const matchesFavorite =
                    !favoriteOnly ||
                    entry.isFavorite;

                return (
                    matchesStatus &&
                    matchesFavorite
                );
            },
        );

    const hasActiveFilters =
        statusFilter !== '' ||
        favoriteOnly;

    function resetFilters() {
        setStatusFilter(
            '',
        );

        setFavoriteOnly(
            false,
        );
    }

    if (loading) {
        return (
            <main className="library-page">
                <p>
                    Chargement de ta bibliothèque...
                </p>
            </main>
        );
    }

    return (
        <main className="library-page">
            <section className="library-heading">
                <div>
                    <span className="page-eyebrow">
                        Ma collection
                    </span>

                    <h2>
                        Ma bibliothèque
                    </h2>

                    <p>
                        Retrouve tes œuvres,
                        suis ta progression et
                        organise tes prochaines
                        lectures ou sessions.
                    </p>
                </div>

                <div className="library-count">
                    <strong>
                        {library.length}
                    </strong>

                    <span>
                        œuvre
                        {library.length > 1
                            ? 's'
                            : ''}
                    </span>
                </div>
            </section>

            {library.length > 0 && (
                <section className="library-filters">
                    <div className="library-filters-copy">
                        <span className="page-eyebrow">
                            Filtres
                        </span>

                        <h3>
                            Affiner ma bibliothèque
                        </h3>
                    </div>

                    <div className="library-filter-controls">
                        <label className="library-filter-field">
                            <span>
                                Statut
                            </span>

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setStatusFilter(
                                        event
                                            .target
                                            .value as
                                        | ''
                                        | LibraryStatus,
                                    )
                                }
                            >
                                <option value="">
                                    Tous les statuts
                                </option>

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

                        <button
                            type="button"
                            className={
                                favoriteOnly
                                    ? 'library-favorite-filter library-favorite-filter-active'
                                    : 'library-favorite-filter'
                            }
                            onClick={() =>
                                setFavoriteOnly(
                                    (
                                        current,
                                    ) =>
                                        !current,
                                )
                            }
                            aria-pressed={
                                favoriteOnly
                            }
                        >
                            {favoriteOnly
                                ? '♥ Favoris uniquement'
                                : '♡ Tous / Favoris'}
                        </button>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                className="library-filter-reset"
                                onClick={
                                    resetFilters
                                }
                            >
                                Réinitialiser
                            </button>
                        )}
                    </div>

                    <div className="library-filter-result">
                        <strong>
                            {
                                filteredLibrary.length
                            }
                        </strong>

                        <span>
                            sur{' '}
                            {
                                library.length
                            }{' '}
                            œuvre
                            {library.length >
                                1
                                ? 's'
                                : ''}
                        </span>
                    </div>
                </section>
            )}

            {library.length === 0 ? (
                <section className="library-empty">
                    <span>
                        Ta bibliothèque est vide
                    </span>

                    <h3>
                        Commence ta collection
                    </h3>

                    <p>
                        Parcours le catalogue et
                        ajoute les mangas ou anime
                        que tu souhaites suivre.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                '/catalog',
                            )
                        }
                    >
                        Explorer le catalogue
                    </button>
                </section>
            ) : filteredLibrary.length ===
                0 ? (
                <section className="library-empty library-filter-empty">
                    <span>
                        Aucun résultat
                    </span>

                    <h3>
                        Aucune œuvre ne correspond
                    </h3>

                    <p>
                        Modifie les filtres ou
                        réinitialise-les pour afficher
                        toute ta bibliothèque.
                    </p>

                    <button
                        type="button"
                        onClick={
                            resetFilters
                        }
                    >
                        Réinitialiser les filtres
                    </button>
                </section>
            ) : (
                <div className="library-grid">
                    {filteredLibrary.map(
                        (entry) => {
                            const work =
                                catalog.find(
                                    (item) =>
                                        item.id ===
                                        entry.catalogItemId,
                                );

                            const total =
                                work?.total ??
                                null;

                            const progressPercent =
                                total != null &&
                                    total > 0
                                    ? Math.min(
                                        100,
                                        Math.round(
                                            (
                                                entry.progress /
                                                total
                                            ) *
                                            100,
                                        ),
                                    )
                                    : 0;

                            const progressLabel =
                                work?.type ===
                                    'anime'
                                    ? 'Épisodes vus'
                                    : work?.type ===
                                        'manga'
                                        ? 'Chapitres lus'
                                        : 'Progression';

                            return (
                                <article
                                    key={
                                        entry.id
                                    }
                                    className={
                                        entry.isFavorite
                                            ? 'library-card library-card-favorite'
                                            : 'library-card'
                                    }
                                >
                                    <div className="library-card-top">
                                        <span className="media-type">
                                            {work?.type ??
                                                'Œuvre'}
                                        </span>

                                        <button
                                            type="button"
                                            className={
                                                entry.isFavorite
                                                    ? 'favorite-button favorite-button-active'
                                                    : 'favorite-button'
                                            }
                                            onClick={() =>
                                                handleFavoriteToggle(
                                                    entry,
                                                )
                                            }
                                            aria-label={
                                                entry.isFavorite
                                                    ? 'Retirer des favoris'
                                                    : 'Ajouter aux favoris'
                                            }
                                        >
                                            {entry.isFavorite
                                                ? '♥'
                                                : '♡'}
                                        </button>
                                    </div>

                                    <div className="library-card-title">
                                        <h3>
                                            {work?.title ??
                                                `Œuvre #${entry.catalogItemId}`}
                                        </h3>

                                        <span
                                            className={`status-badge status-${entry.status}`}
                                        >
                                            {getStatusLabel(
                                                entry.status,
                                            )}
                                        </span>
                                    </div>

                                    <div className="library-section">
                                        <label
                                            className="library-field"
                                            htmlFor={`status-${entry.id}`}
                                        >
                                            <span>
                                                Statut
                                            </span>

                                            <select
                                                id={`status-${entry.id}`}
                                                value={
                                                    entry.status
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    handleStatusChange(
                                                        entry.id,
                                                        event
                                                            .target
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
                                    </div>

                                    <div className="library-section">
                                        <div className="progress-header">
                                            <span>
                                                {progressLabel}
                                            </span>

                                            <strong>
                                                {
                                                    entry.progress
                                                }

                                                {total != null &&
                                                    ` / ${total}`}
                                            </strong>
                                        </div>

                                        {total != null &&
                                            total > 0 && (
                                                <div className="library-progress-track">
                                                    <div
                                                        className="library-progress-fill"
                                                        style={{
                                                            width: `${progressPercent}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}

                                        <div className="library-progress-controls">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeProgress(
                                                        entry,
                                                        work,
                                                        -1,
                                                    )
                                                }
                                                disabled={
                                                    entry.progress ===
                                                    0
                                                }
                                                aria-label="Diminuer la progression"
                                            >
                                                −
                                            </button>

                                            <div className="library-progress-direct">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={
                                                        total ??
                                                        undefined
                                                    }
                                                    step="1"
                                                    inputMode="numeric"
                                                    aria-label={`Saisir la progression de ${work?.title ?? 'cette œuvre'}`}
                                                    value={
                                                        progressInputs[
                                                        entry.id
                                                        ] ??
                                                        String(
                                                            entry.progress,
                                                        )
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setProgressInputs(
                                                            (
                                                                current,
                                                            ) => ({
                                                                ...current,
                                                                [entry.id]:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    onKeyDown={(
                                                        event,
                                                    ) => {
                                                        if (
                                                            event.key ===
                                                            'Enter'
                                                        ) {
                                                            handleDirectProgress(
                                                                entry,
                                                                work,
                                                            );
                                                        }
                                                    }}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDirectProgress(
                                                            entry,
                                                            work,
                                                        )
                                                    }
                                                >
                                                    Valider
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeProgress(
                                                        entry,
                                                        work,
                                                        1,
                                                    )
                                                }
                                                disabled={
                                                    total !=
                                                    null &&
                                                    entry.progress >=
                                                    total
                                                }
                                                aria-label="Augmenter la progression"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {total != null &&
                                            total > 0 && (
                                                <span className="library-progress-percent">
                                                    {
                                                        progressPercent
                                                    }
                                                    % terminé
                                                </span>
                                            )}
                                    </div>

                                    <div className="library-section rating-control">
                                        <div className="rating-heading">
                                            <span>
                                                Ma note
                                            </span>

                                            <strong>
                                                {entry.rating ===
                                                    null
                                                    ? 'Non noté'
                                                    : `${entry.rating}/10`}
                                            </strong>
                                        </div>

                                        <input
                                            id={`rating-${entry.id}`}
                                            aria-label={`Note pour ${work?.title ?? 'cette œuvre'}`}
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="1"
                                            value={
                                                entry.rating ??
                                                5
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                handleRatingChange(
                                                    entry,
                                                    Number(
                                                        event
                                                            .target
                                                            .value,
                                                    ),
                                                )
                                            }
                                        />

                                        <div className="rating-scale">
                                            <span>
                                                0
                                            </span>

                                            <span>
                                                10
                                            </span>
                                        </div>

                                        {entry.rating !==
                                            null && (
                                                <button
                                                    type="button"
                                                    className="rating-remove"
                                                    onClick={() =>
                                                        handleRemoveRating(
                                                            entry,
                                                        )
                                                    }
                                                >
                                                    Retirer la note
                                                </button>
                                            )}
                                    </div>

                                    <div className="library-card-actions">
                                        <button
                                            type="button"
                                            className="library-details-button"
                                            onClick={() =>
                                                navigate(
                                                    `/catalog/${entry.catalogItemId}`,
                                                )
                                            }
                                        >
                                            Voir la fiche
                                        </button>

                                        <button
                                            type="button"
                                            className="library-delete-button"
                                            onClick={() =>
                                                handleDelete(
                                                    entry.id,
                                                )
                                            }
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </article>
                            );
                        },
                    )}
                </div>
            )}
        </main>
    );
}
