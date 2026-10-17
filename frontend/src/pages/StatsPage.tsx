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

function getPercentage(
    value: number,
    total: number,
): number {
    if (total === 0) {
        return 0;
    }

    return Math.round(
        (value / total) * 100,
    );
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
            <main className="stats-page">
                <section className="stats-heading">
                    <div>
                        <span className="page-eyebrow">
                            Activité
                        </span>

                        <h2>
                            Mes statistiques
                        </h2>

                        <p>
                            Chargement de tes données...
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    if (
        error ||
        !stats
    ) {
        return (
            <main className="stats-page">
                <section className="stats-heading">
                    <div>
                        <span className="page-eyebrow">
                            Activité
                        </span>

                        <h2>
                            Mes statistiques
                        </h2>
                    </div>
                </section>

                <p className="error-message">
                    {error ??
                        'Impossible de charger les statistiques.'}
                </p>
            </main>
        );
    }

    const statusItems = [
        {
            label:
                'À commencer',
            value:
                stats.statuses
                    .aCommencer,
            className:
                'status-a_commencer',
        },
        {
            label:
                'En cours',
            value:
                stats.statuses
                    .enCours,
            className:
                'status-en_cours',
        },
        {
            label:
                'Terminées',
            value:
                stats.statuses
                    .termine,
            className:
                'status-termine',
        },
        {
            label:
                'Abandonnées',
            value:
                stats.statuses
                    .abandonne,
            className:
                'status-abandonne',
        },
    ];

    return (
        <main className="stats-page">
            <section className="stats-heading">
                <div>
                    <span className="page-eyebrow">
                        Activité
                    </span>

                    <h2>
                        Mes statistiques
                    </h2>

                    <p>
                        Un aperçu de ta bibliothèque,
                        de ta progression et de tes
                        habitudes de suivi.
                    </p>
                </div>

                <div className="stats-main-score">
                    <span>
                        Note moyenne
                    </span>

                    <strong>
                        {stats.averageRating ===
                            null
                            ? '—'
                            : stats.averageRating.toFixed(
                                1,
                            )}
                    </strong>

                    <small>
                        / 10
                    </small>
                </div>
            </section>

            <section className="stats-overview-grid">
                <article className="stats-overview-card">
                    <span className="stats-card-label">
                        Œuvres suivies
                    </span>

                    <strong>
                        {
                            stats.totalWorks
                        }
                    </strong>

                    <small>
                        dans ta bibliothèque
                    </small>
                </article>

                <article className="stats-overview-card">
                    <span className="stats-card-label">
                        Favoris
                    </span>

                    <strong>
                        {
                            stats.favorites
                        }
                    </strong>

                    <small>
                        œuvre
                        {stats.favorites > 1
                            ? 's'
                            : ''}{' '}
                        favorite
                        {stats.favorites > 1
                            ? 's'
                            : ''}
                    </small>
                </article>

                <article className="stats-overview-card">
                    <span className="stats-card-label">
                        Œuvres notées
                    </span>

                    <strong>
                        {
                            stats.ratedWorks
                        }
                    </strong>

                    <small>
                        sur{' '}
                        {
                            stats.totalWorks
                        }
                    </small>
                </article>

                <article className="stats-overview-card stats-overview-card-accent">
                    <span className="stats-card-label">
                        Progression totale
                    </span>

                    <strong>
                        {stats.anime.progress +
                            stats.manga.progress}
                    </strong>

                    <small>
                        épisodes + chapitres
                    </small>
                </article>
            </section>

            <section className="stats-content-grid">
                <article className="stats-panel">
                    <div className="section-heading">
                        <span className="page-eyebrow">
                            Consommation
                        </span>

                        <h3>
                            Progression
                        </h3>

                        <p>
                            Ce que tu as déjà vu ou lu.
                        </p>
                    </div>

                    <div className="stats-media-grid">
                        <article className="stats-media-card">
                            <span className="media-type">
                                Anime
                            </span>

                            <strong>
                                {
                                    stats.anime
                                        .count
                                }
                            </strong>

                            <small>
                                anime suivi
                                {stats.anime
                                    .count > 1
                                    ? 's'
                                    : ''}
                            </small>

                            <div className="stats-media-progress">
                                <span>
                                    Épisodes vus
                                </span>

                                <strong>
                                    {
                                        stats.anime
                                            .progress
                                    }
                                </strong>
                            </div>
                        </article>

                        <article className="stats-media-card">
                            <span className="media-type">
                                Manga
                            </span>

                            <strong>
                                {
                                    stats.manga
                                        .count
                                }
                            </strong>

                            <small>
                                manga suivi
                                {stats.manga
                                    .count > 1
                                    ? 's'
                                    : ''}
                            </small>

                            <div className="stats-media-progress">
                                <span>
                                    Chapitres lus
                                </span>

                                <strong>
                                    {
                                        stats.manga
                                            .progress
                                    }
                                </strong>
                            </div>
                        </article>
                    </div>
                </article>

                <article className="stats-panel">
                    <div className="section-heading">
                        <span className="page-eyebrow">
                            Organisation
                        </span>

                        <h3>
                            Répartition par statut
                        </h3>

                        <p>
                            La composition actuelle de
                            ta bibliothèque.
                        </p>
                    </div>

                    <div className="stats-status-list">
                        {statusItems.map(
                            (item) => {
                                const percentage =
                                    getPercentage(
                                        item.value,
                                        stats.totalWorks,
                                    );

                                return (
                                    <div
                                        key={
                                            item.label
                                        }
                                        className="stats-status-row"
                                    >
                                        <div className="stats-status-heading">
                                            <span
                                                className={`status-badge ${item.className}`}
                                            >
                                                {
                                                    item.label
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    item.value
                                                }{' '}
                                                <small>
                                                    (
                                                    {
                                                        percentage
                                                    }
                                                    %)
                                                </small>
                                            </strong>
                                        </div>

                                        <div className="stats-status-track">
                                            <div
                                                className={`stats-status-fill ${item.className}`}
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </article>
            </section>
        </main>
    );
}
