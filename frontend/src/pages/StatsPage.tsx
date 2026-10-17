import {
    useEffect,
    useState,
} from 'react';

import {
    getCatalogByIds,
    getLibrary,
} from '../api/mangatrack.api';

import type {
    CatalogItem,
} from '../types/catalog';

import type {
    LibraryEntry,
    LibraryStats,
} from '../types/library';

function calculateStats(
    library: LibraryEntry[],
    catalog: CatalogItem[],
): LibraryStats {
    const ratedEntries =
        library.filter(
            (entry) =>
                entry.rating !== null,
        );

    const averageRating =
        ratedEntries.length > 0
            ? ratedEntries.reduce(
                (sum, entry) =>
                    sum +
                    (entry.rating ?? 0),
                0,
            ) /
            ratedEntries.length
            : null;

    let animeCount = 0;
    let animeProgress = 0;

    let mangaCount = 0;
    let mangaProgress = 0;

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

        if (
            work.type ===
            'anime'
        ) {
            animeCount += 1;

            animeProgress +=
                entry.progress;
        }

        if (
            work.type ===
            'manga'
        ) {
            mangaCount += 1;

            mangaProgress +=
                entry.progress;
        }
    }

    return {
        totalWorks:
            library.length,

        favorites:
            library.filter(
                (entry) =>
                    entry.isFavorite,
            ).length,

        ratedWorks:
            ratedEntries.length,

        averageRating,

        statuses: {
            aCommencer:
                library.filter(
                    (entry) =>
                        entry.status ===
                        'a_commencer',
                ).length,

            enCours:
                library.filter(
                    (entry) =>
                        entry.status ===
                        'en_cours',
                ).length,

            termine:
                library.filter(
                    (entry) =>
                        entry.status ===
                        'termine',
                ).length,

            abandonne:
                library.filter(
                    (entry) =>
                        entry.status ===
                        'abandonne',
                ).length,
        },

        anime: {
            count:
                animeCount,

            progress:
                animeProgress,
        },

        manga: {
            count:
                mangaCount,

            progress:
                mangaProgress,
        },
    };
}

export function StatsPage() {

    const [
        stats,
        setStats,
    ] =
        useState<LibraryStats | null>(
            null,
        );

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

    useEffect(() => {
        let cancelled =
            false;

        async function loadStats() {
            try {
                const library =
                    await getLibrary();

                const ids =
                    library.map(
                        (entry) =>
                            entry.catalogItemId,
                    );

                const catalog =
                    await getCatalogByIds(
                        ids,
                    );

                const calculated =
                    calculateStats(
                        library,
                        catalog,
                    );

                if (!cancelled) {
                    setStats(
                        calculated,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Impossible de charger les statistiques',
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

        loadStats();

        return () => {
            cancelled =
                true;
        };
    }, []);

    if (loading) {
        return (
            <main>
                <h2>
                    Mes statistiques
                </h2>

                <p>
                    Chargement...
                </p>
            </main>
        );
    }

    if (
        error ||
        !stats
    ) {
        return (
            <main>
                <h2>
                    Mes statistiques
                </h2>

                <p className="error-message">
                    {error ??
                        'Impossible de charger les statistiques.'}
                </p>
            </main>
        );
    }

    return (
        <main>
            <h2>
                Mes statistiques
            </h2>

            <div className="stats-grid">
                <article className="stat-card">
                    <span>
                        Œuvres suivies
                    </span>

                    <strong>
                        {
                            stats.totalWorks
                        }
                    </strong>
                </article>

                <article className="stat-card">
                    <span>
                        Favoris
                    </span>

                    <strong>
                        {
                            stats.favorites
                        }
                    </strong>
                </article>

                <article className="stat-card">
                    <span>
                        Œuvres notées
                    </span>

                    <strong>
                        {
                            stats.ratedWorks
                        }
                    </strong>
                </article>

                <article className="stat-card">
                    <span>
                        Note moyenne
                    </span>

                    <strong>
                        {stats.averageRating ===
                            null
                            ? '—'
                            : `${stats.averageRating.toFixed(
                                1,
                            )} / 10`}
                    </strong>
                </article>
            </div>

            <section className="stats-section">
                <h3>
                    Progression
                </h3>

                <div className="stats-grid">
                    <article className="stat-card">
                        <span>
                            Anime suivis
                        </span>

                        <strong>
                            {
                                stats.anime
                                    .count
                            }
                        </strong>
                    </article>

                    <article className="stat-card">
                        <span>
                            Épisodes vus
                        </span>

                        <strong>
                            {
                                stats.anime
                                    .progress
                            }
                        </strong>
                    </article>

                    <article className="stat-card">
                        <span>
                            Mangas suivis
                        </span>

                        <strong>
                            {
                                stats.manga
                                    .count
                            }
                        </strong>
                    </article>

                    <article className="stat-card">
                        <span>
                            Chapitres lus
                        </span>

                        <strong>
                            {
                                stats.manga
                                    .progress
                            }
                        </strong>
                    </article>
                </div>
            </section>

            <section className="stats-section">
                <h3>
                    Répartition par statut
                </h3>

                <div className="stats-grid">
                    <article className="stat-card">
                        <span>
                            À commencer
                        </span>

                        <strong>
                            {
                                stats.statuses
                                    .aCommencer
                            }
                        </strong>
                    </article>

                    <article className="stat-card">
                        <span>
                            En cours
                        </span>

                        <strong>
                            {
                                stats.statuses
                                    .enCours
                            }
                        </strong>
                    </article>

                    <article className="stat-card">
                        <span>
                            Terminées
                        </span>

                        <strong>
                            {
                                stats.statuses
                                    .termine
                            }
                        </strong>
                    </article>

                    <article className="stat-card">
                        <span>
                            Abandonnées
                        </span>

                        <strong>
                            {
                                stats.statuses
                                    .abandonne
                            }
                        </strong>
                    </article>
                </div>
            </section>
        </main>
    );
}