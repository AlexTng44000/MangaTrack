import {
    useEffect,
    useMemo,
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
} from '../types/library';

interface CatchUpWork {
    entry: LibraryEntry;
    catalog: CatalogItem;
}

export function CatchUpPage() {
    const [
        works,
        setWorks,
    ] =
        useState<CatchUpWork[]>(
            [],
        );

    const [
        selectedEntryId,
        setSelectedEntryId,
    ] =
        useState('');

    const [
        targetDate,
        setTargetDate,
    ] =
        useState('');

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

        async function loadWorks() {
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

                const catalogMap =
                    new Map(
                        catalog.map(
                            (item) => [
                                item.id,
                                item,
                            ],
                        ),
                    );

                const availableWorks =
                    library
                        .map(
                            (
                                entry,
                            ): CatchUpWork | null => {
                                const catalogItem =
                                    catalogMap.get(
                                        entry.catalogItemId,
                                    );

                                if (
                                    !catalogItem
                                ) {
                                    return null;
                                }

                                return {
                                    entry,
                                    catalog:
                                        catalogItem,
                                };
                            },
                        )
                        .filter(
                            (
                                work,
                            ): work is CatchUpWork =>
                                work !== null,
                        );

                if (!cancelled) {
                    setWorks(
                        availableWorks,
                    );

                    setError(
                        null,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Impossible de charger la bibliothèque.',
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

        loadWorks();

        return () => {
            cancelled =
                true;
        };
    }, []);

    const selectedWork =
        useMemo(
            () =>
                works.find(
                    (work) =>
                        work.entry.id ===
                        Number(
                            selectedEntryId,
                        ),
                ) ??
                null,
            [
                works,
                selectedEntryId,
            ],
        );

    const plan =
        useMemo(() => {
            if (
                !selectedWork ||
                !targetDate
            ) {
                return null;
            }

            const total =
                selectedWork.catalog
                    .total;

            if (
                total === null ||
                total === undefined
            ) {
                return {
                    error:
                        'Le nombre total d’épisodes ou de chapitres est inconnu pour cette œuvre.',
                };
            }

            const remaining =
                Math.max(
                    0,
                    total -
                    selectedWork.entry
                        .progress,
                );

            const now =
                new Date();

            const target =
                new Date(
                    `${targetDate}T23:59:59`,
                );

            if (
                Number.isNaN(
                    target.getTime(),
                )
            ) {
                return {
                    error:
                        'La date cible est invalide.',
                };
            }

            const difference =
                target.getTime() -
                now.getTime();

            if (difference < 0) {
                return {
                    error:
                        'La date cible doit être aujourd’hui ou dans le futur.',
                };
            }

            const millisecondsPerDay =
                1000 *
                60 *
                60 *
                24;

            const days =
                Math.max(
                    1,
                    Math.ceil(
                        difference /
                        millisecondsPerDay,
                    ),
                );

            const perDay =
                remaining === 0
                    ? 0
                    : Math.ceil(
                        remaining /
                        days,
                    );

            const perWeek =
                remaining === 0
                    ? 0
                    : Math.ceil(
                        (
                            remaining /
                            days
                        ) *
                        7,
                    );

            return {
                total,
                remaining,
                days,
                perDay,
                perWeek,
            };
        }, [
            selectedWork,
            targetDate,
        ]);

    if (loading) {
        return (
            <main>
                <h2>
                    Plan de rattrapage
                </h2>

                <p>
                    Chargement de ta bibliothèque...
                </p>
            </main>
        );
    }

    return (
        <main>
            <h2>
                Plan de rattrapage
            </h2>

            <p>
                Choisis une œuvre et une date cible.
                MangaTrack calcule le rythme à suivre
                pour arriver à jour.
            </p>

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {works.length === 0 ? (
                <p>
                    Ta bibliothèque est vide.
                    Ajoute d’abord une œuvre au catalogue.
                </p>
            ) : (
                <section className="catch-up-form">
                    <label>
                        Œuvre

                        <select
                            value={
                                selectedEntryId
                            }
                            onChange={(
                                event,
                            ) =>
                                setSelectedEntryId(
                                    event.target
                                        .value,
                                )
                            }
                        >
                            <option value="">
                                Choisir une œuvre
                            </option>

                            {works.map(
                                (work) => (
                                    <option
                                        key={
                                            work.entry
                                                .id
                                        }
                                        value={
                                            work.entry
                                                .id
                                        }
                                    >
                                        {
                                            work.catalog
                                                .title
                                        }
                                        {' - '}
                                        {work.catalog
                                            .type ===
                                            'anime'
                                            ? 'Anime'
                                            : 'Manga'}
                                    </option>
                                ),
                            )}
                        </select>
                    </label>

                    <label>
                        Date cible

                        <input
                            type="date"
                            value={
                                targetDate
                            }
                            onChange={(
                                event,
                            ) =>
                                setTargetDate(
                                    event.target
                                        .value,
                                )
                            }
                        />
                    </label>
                </section>
            )}

            {selectedWork && (
                <section className="catch-up-summary">
                    <h3>
                        {
                            selectedWork
                                .catalog
                                .title
                        }
                    </h3>

                    <p>
                        Progression actuelle :{' '}
                        <strong>
                            {
                                selectedWork.entry
                                    .progress
                            }
                        </strong>

                        {selectedWork.catalog
                            .total != null && (
                                <>
                                    {' / '}
                                    <strong>
                                        {
                                            selectedWork
                                                .catalog
                                                .total
                                        }
                                    </strong>
                                </>
                            )}

                        {' '}
                        {selectedWork.catalog
                            .type ===
                            'anime'
                            ? 'épisodes'
                            : 'chapitres'}
                    </p>
                </section>
            )}

            {plan &&
                'error' in plan && (
                    <p className="error-message">
                        {
                            plan.error
                        }
                    </p>
                )}

            {plan &&
                !('error' in plan) &&
                selectedWork && (
                    <section className="catch-up-results">
                        <h3>
                            Ton plan
                        </h3>

                        {plan.remaining ===
                            0 ? (
                            <div className="catch-up-complete">
                                <strong>
                                    Tu es déjà à jour !
                                </strong>

                                <p>
                                    Aucun rattrapage
                                    nécessaire pour cette
                                    œuvre.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="catch-up-grid">
                                    <article className="catch-up-card">
                                        <span>
                                            Reste à voir / lire
                                        </span>

                                        <strong>
                                            {
                                                plan.remaining
                                            }
                                        </strong>

                                        <small>
                                            {selectedWork
                                                .catalog
                                                .type ===
                                                'anime'
                                                ? 'épisodes'
                                                : 'chapitres'}
                                        </small>
                                    </article>

                                    <article className="catch-up-card">
                                        <span>
                                            Temps disponible
                                        </span>

                                        <strong>
                                            {
                                                plan.days
                                            }
                                        </strong>

                                        <small>
                                            jours
                                        </small>
                                    </article>

                                    <article className="catch-up-card">
                                        <span>
                                            Rythme quotidien
                                        </span>

                                        <strong>
                                            {
                                                plan.perDay
                                            }
                                        </strong>

                                        <small>
                                            {selectedWork
                                                .catalog
                                                .type ===
                                                'anime'
                                                ? 'épisode(s) / jour'
                                                : 'chapitre(s) / jour'}
                                        </small>
                                    </article>

                                    <article className="catch-up-card">
                                        <span>
                                            Environ par semaine
                                        </span>

                                        <strong>
                                            {
                                                plan.perWeek
                                            }
                                        </strong>

                                        <small>
                                            {selectedWork
                                                .catalog
                                                .type ===
                                                'anime'
                                                ? 'épisodes'
                                                : 'chapitres'}
                                        </small>
                                    </article>
                                </div>

                                <p className="catch-up-advice">
                                    Pour terminer{' '}
                                    <strong>
                                        {
                                            selectedWork
                                                .catalog
                                                .title
                                        }
                                    </strong>{' '}
                                    avant le{' '}
                                    <strong>
                                        {new Date(
                                            `${targetDate}T12:00:00`,
                                        ).toLocaleDateString(
                                            'fr-FR',
                                        )}
                                    </strong>
                                    , vise environ{' '}
                                    <strong>
                                        {
                                            plan.perDay
                                        }
                                    </strong>{' '}
                                    {selectedWork
                                        .catalog
                                        .type ===
                                        'anime'
                                        ? 'épisode(s)'
                                        : 'chapitre(s)'}{' '}
                                    par jour.
                                </p>
                            </>
                        )}
                    </section>
                )}
        </main>
    );
}