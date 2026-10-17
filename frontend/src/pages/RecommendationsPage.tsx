import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    addToLibrary,
    getCatalog,
    getCatalogByGenre,
    getCatalogByIds,
    getLibrary,
} from '../api/mangatrack.api';

import type {
    CatalogItem,
} from '../types/catalog';

interface Recommendation
    extends CatalogItem {
    score: number;
    matchedGenres: string[];
}

function calculateGenreWeights(
    library: Awaited<
        ReturnType<typeof getLibrary>
    >,
    catalog: CatalogItem[],
): Map<string, number> {
    const weights =
        new Map<string, number>();

    for (const entry of library) {
        const work =
            catalog.find(
                (item) =>
                    item.id ===
                    entry.catalogItemId,
            );

        if (!work) {
            continue;
        }

        let weight = 1;

        if (entry.isFavorite) {
            weight += 3;
        }

        if (
            entry.rating !== null
        ) {
            if (
                entry.rating >= 8
            ) {
                weight += 3;
            } else if (
                entry.rating >= 6
            ) {
                weight += 2;
            } else if (
                entry.rating >= 4
            ) {
                weight += 1;
            }
        }

        if (
            entry.status ===
            'termine'
        ) {
            weight += 1;
        }

        if (
            entry.status ===
            'abandonne'
        ) {
            weight = Math.max(
                0,
                weight - 2,
            );
        }

        for (
            const genre
            of work.genres
        ) {
            weights.set(
                genre,
                (
                    weights.get(
                        genre,
                    ) ?? 0
                ) + weight,
            );
        }
    }

    return weights;
}

export function RecommendationsPage() {
    const navigate =
        useNavigate();

    const [
        recommendations,
        setRecommendations,
    ] =
        useState<Recommendation[]>(
            [],
        );

    const [
        favoriteGenres,
        setFavoriteGenres,
    ] =
        useState<string[]>([]);

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
        addedIds,
        setAddedIds,
    ] =
        useState<Set<number>>(
            new Set(),
        );

    const [
        addingId,
        setAddingId,
    ] =
        useState<number | null>(
            null,
        );

    useEffect(() => {
        let cancelled =
            false;

        async function loadRecommendations() {
            try {
                const library =
                    await getLibrary();

                const libraryIds =
                    library.map(
                        (entry) =>
                            entry.catalogItemId,
                    );

                const libraryCatalog =
                    await getCatalogByIds(
                        libraryIds,
                    );

                const genreWeights =
                    calculateGenreWeights(
                        library,
                        libraryCatalog,
                    );

                const sortedGenres =
                    Array.from(
                        genreWeights.entries(),
                    )
                        .sort(
                            (
                                first,
                                second,
                            ) =>
                                second[1] -
                                first[1],
                        )
                        .slice(
                            0,
                            3,
                        );

                const topGenres =
                    sortedGenres.map(
                        ([genre]) =>
                            genre,
                    );

                if (!cancelled) {
                    setFavoriteGenres(
                        topGenres,
                    );
                }

                let candidates:
                    CatalogItem[] = [];

                if (
                    topGenres.length >
                    0
                ) {
                    const pages =
                        await Promise.all(
                            topGenres.map(
                                (genre) =>
                                    getCatalogByGenre(
                                        genre,
                                    ),
                            ),
                        );

                    candidates =
                        pages.flatMap(
                            (page) =>
                                page.items,
                        );
                } else {
                    const popular =
                        await getCatalog();

                    candidates =
                        popular.items;
                }

                const existingIds =
                    new Set(
                        libraryIds,
                    );

                const unique =
                    new Map<
                        number,
                        CatalogItem
                    >();

                for (
                    const candidate
                    of candidates
                ) {
                    if (
                        existingIds.has(
                            candidate.id,
                        )
                    ) {
                        continue;
                    }

                    unique.set(
                        candidate.id,
                        candidate,
                    );
                }

                const ranked =
                    Array.from(
                        unique.values(),
                    )
                        .map(
                            (
                                candidate,
                            ): Recommendation => {
                                const matchedGenres =
                                    candidate.genres.filter(
                                        (genre) =>
                                            genreWeights.has(
                                                genre,
                                            ),
                                    );

                                const score =
                                    matchedGenres.reduce(
                                        (
                                            total,
                                            genre,
                                        ) =>
                                            total +
                                            (
                                                genreWeights.get(
                                                    genre,
                                                ) ??
                                                0
                                            ),
                                        0,
                                    );

                                return {
                                    ...candidate,
                                    score,
                                    matchedGenres,
                                };
                            },
                        )
                        .sort(
                            (
                                first,
                                second,
                            ) =>
                                second.score -
                                first.score,
                        )
                        .slice(
                            0,
                            24,
                        );

                if (!cancelled) {
                    setRecommendations(
                        ranked,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Impossible de charger les recommandations',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(
                        false,
                    );
                }
            }
        }

        loadRecommendations();

        return () => {
            cancelled =
                true;
        };
    }, []);

    async function handleAdd(
        id: number,
    ) {
        setAddingId(
            id,
        );

        setError(
            null,
        );

        try {
            await addToLibrary(
                id,
            );

            setAddedIds(
                (current) => {
                    const next =
                        new Set(
                            current,
                        );

                    next.add(
                        id,
                    );

                    return next;
                },
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Impossible d’ajouter cette œuvre',
            );
        } finally {
            setAddingId(
                null,
            );
        }
    }

    if (loading) {
        return (
            <main>
                <h2>
                    Recommandations
                </h2>

                <p>
                    Analyse de ta bibliothèque...
                </p>
            </main>
        );
    }

    return (
        <main>
            <h2>
                Recommandé pour toi
            </h2>

            {favoriteGenres.length > 0 ? (
                <p>
                    Basé principalement sur tes goûts pour :{' '}
                    <strong>
                        {favoriteGenres.join(
                            ', ',
                        )}
                    </strong>
                </p>
            ) : (
                <p>
                    Ajoute et note davantage d'œuvres pour
                    améliorer tes recommandations.
                </p>
            )}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {recommendations.length ===
                0 &&
                !error && (
                    <p>
                        Aucune recommandation disponible.
                    </p>
                )}

            <div className="recommendations-grid">
                {recommendations.map(
                    (work) => (
                        <article
                            key={
                                work.id
                            }
                            className="recommendation-card"
                        >
                            <span className="media-type">
                                {
                                    work.type
                                }
                            </span>

                            <h3>
                                {
                                    work.title
                                }
                            </h3>

                            <p>
                                {work.genres.join(
                                    ' • ',
                                )}
                            </p>

                            {work.matchedGenres
                                .length >
                                0 && (
                                    <p className="recommendation-reason">
                                        Correspond à tes goûts :{' '}
                                        <strong>
                                            {work.matchedGenres.join(
                                                ', ',
                                            )}
                                        </strong>
                                    </p>
                                )}

                            <div className="recommendation-actions">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/catalog/${work.id}`,
                                        )
                                    }
                                >
                                    Voir la fiche
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        addedIds.has(
                                            work.id,
                                        ) ||
                                        addingId ===
                                        work.id
                                    }
                                    onClick={() =>
                                        handleAdd(
                                            work.id,
                                        )
                                    }
                                >
                                    {addedIds.has(
                                        work.id,
                                    )
                                        ? 'Ajouté'
                                        : addingId ===
                                            work.id
                                            ? 'Ajout...'
                                            : 'Ajouter à ma bibliothèque'}
                                </button>
                            </div>
                        </article>
                    ),
                )}
            </div>
        </main>
    );
}