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
            <main className="recommendations-page">
                <section className="recommendations-heading">
                    <div>
                        <span className="page-eyebrow">
                            Pour toi
                        </span>

                        <h2>
                            Recommandations
                        </h2>

                        <p>
                            Analyse de ta bibliothèque...
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="recommendations-page">
            <section className="recommendations-heading">
                <div>
                    <span className="page-eyebrow">
                        Pour toi
                    </span>

                    <h2>
                        Recommandé pour toi
                    </h2>

                    <p>
                        MangaTrack analyse tes favoris,
                        tes notes et tes statuts pour
                        proposer des œuvres proches de
                        tes goûts.
                    </p>
                </div>

                <div className="recommendations-count">
                    <strong>
                        {
                            recommendations.length
                        }
                    </strong>

                    <span>
                        suggestion
                        {recommendations.length >
                            1
                            ? 's'
                            : ''}
                    </span>
                </div>
            </section>

            <section className="recommendation-profile">
                <div>
                    <span className="page-eyebrow">
                        Profil de goûts
                    </span>

                    <h3>
                        Tes genres dominants
                    </h3>
                </div>

                {favoriteGenres.length >
                    0 ? (
                    <div className="favorite-genres">
                        {favoriteGenres.map(
                            (genre) => (
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
                ) : (
                    <p>
                        Ajoute et note davantage
                        d’œuvres pour améliorer
                        tes recommandations.
                    </p>
                )}
            </section>

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {recommendations.length ===
                0 &&
                !error ? (
                <section className="recommendations-empty">
                    <span>
                        Pas encore de suggestion
                    </span>

                    <h3>
                        Enrichis ta bibliothèque
                    </h3>

                    <p>
                        Plus tu notes et suis des
                        œuvres, plus MangaTrack peut
                        affiner tes recommandations.
                    </p>
                </section>
            ) : (
                <div className="recommendations-grid">
                    {recommendations.map(
                        (work) => {
                            const isAdded =
                                addedIds.has(
                                    work.id,
                                );

                            return (
                                <article
                                    key={
                                        work.id
                                    }
                                    className={
                                        isAdded
                                            ? 'recommendation-card recommendation-card-added'
                                            : 'recommendation-card'
                                    }
                                >
                                    <div className="recommendation-card-top">
                                        <span className="media-type">
                                            {
                                                work.type
                                            }
                                        </span>

                                        <span className="recommendation-score">
                                            Affinité{' '}
                                            <strong>
                                                {
                                                    work.score
                                                }
                                            </strong>
                                        </span>
                                    </div>

                                    <div className="recommendation-card-main">
                                        <h3>
                                            {
                                                work.title
                                            }
                                        </h3>

                                        <div className="recommendation-genres">
                                            {work.genres
                                                .slice(
                                                    0,
                                                    5,
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

                                        {work.matchedGenres
                                            .length >
                                            0 && (
                                                <div className="recommendation-reason">
                                                    <span>
                                                        Pourquoi cette suggestion ?
                                                    </span>

                                                    <p>
                                                        Correspond à tes goûts pour{' '}
                                                        <strong>
                                                            {work.matchedGenres.join(
                                                                ', ',
                                                            )}
                                                        </strong>
                                                    </p>
                                                </div>
                                            )}
                                    </div>

                                    <div className="recommendation-actions">
                                        <button
                                            type="button"
                                            className="recommendation-details-button"
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
                                            className="recommendation-add-button"
                                            disabled={
                                                isAdded ||
                                                addingId ===
                                                work.id
                                            }
                                            onClick={() =>
                                                handleAdd(
                                                    work.id,
                                                )
                                            }
                                        >
                                            {isAdded
                                                ? 'Ajouté ✓'
                                                : addingId ===
                                                    work.id
                                                    ? 'Ajout...'
                                                    : 'Ajouter'}
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
