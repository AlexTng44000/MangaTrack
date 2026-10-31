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

function getTodayInputValue(): string {
    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1,
        ).padStart(
            2,
            '0',
        );

    const day =
        String(
            today.getDate(),
        ).padStart(
            2,
            '0',
        );

    return `${year}-${month}-${day}`;
}

function getMediaUnit(
    type: CatalogItem['type'],
    plural = false,
): string {
    if (type === 'anime') {
        return plural
            ? 'épisodes'
            : 'épisode';
    }

    return plural
        ? 'chapitres'
        : 'chapitre';
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

            const weeklyEquivalent =
                remaining === 0
                    ? 0
                    : Math.min(
                        remaining,
                        Math.ceil(
                            (
                                remaining /
                                days
                            ) *
                            7,
                        ),
                    );

            const progressPercent =
                total > 0
                    ? Math.min(
                        100,
                        Math.round(
                            (
                                selectedWork.entry
                                    .progress /
                                total
                            ) *
                            100,
                        ),
                    )
                    : 0;

            return {
                total,
                remaining,
                days,
                perDay,
                weeklyEquivalent,
                progressPercent,
            };
        }, [
            selectedWork,
            targetDate,
        ]);

    if (loading) {
        return (
            <main className="catch-up-page">
                <section className="catch-up-heading">
                    <div>
                        <span className="page-eyebrow">
                            Objectif
                        </span>

                        <h2>
                            Plan de rattrapage
                        </h2>

                        <p>
                            Chargement de ta bibliothèque...
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="catch-up-page">
            <section className="catch-up-heading">
                <div>
                    <span className="page-eyebrow">
                        Objectif
                    </span>

                    <h2>
                        Plan de rattrapage
                    </h2>

                    <p>
                        Choisis une œuvre et une date
                        cible. MyMangaTracker calcule le
                        rythme à suivre pour arriver
                        à jour sans faire les calculs
                        toi-même.
                    </p>
                </div>

                <div className="catch-up-library-count">
                    <strong>
                        {
                            works.length
                        }
                    </strong>

                    <span>
                        œuvre
                        {works.length > 1
                            ? 's disponibles'
                            : ' disponible'}
                    </span>
                </div>
            </section>

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {works.length === 0 ? (
                <section className="catch-up-empty">
                    <span>
                        Aucun contenu
                    </span>

                    <h3>
                        Ta bibliothèque est vide
                    </h3>

                    <p>
                        Ajoute d’abord une œuvre
                        depuis le catalogue pour
                        créer un plan de rattrapage.
                    </p>
                </section>
            ) : (
                <section className="catch-up-form-card">
                    <div className="catch-up-form-copy">
                        <span className="page-eyebrow">
                            Paramètres
                        </span>

                        <h3>
                            Prépare ton objectif
                        </h3>

                        <p>
                            Sélectionne une œuvre
                            puis indique la date à
                            laquelle tu souhaites
                            être à jour.
                        </p>
                    </div>

                    <div className="catch-up-form">
                        <label>
                            <span>
                                Œuvre
                            </span>

                            <select
                                value={
                                    selectedEntryId
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSelectedEntryId(
                                        event
                                            .target
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
                                            {' — '}
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
                            <span>
                                Date cible
                            </span>

                            <input
                                type="date"
                                min={
                                    getTodayInputValue()
                                }
                                value={
                                    targetDate
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setTargetDate(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />
                        </label>
                    </div>
                </section>
            )}

            {selectedWork && (
                <section className="catch-up-work-summary">
                    <div className="catch-up-work-heading">
                        <div>
                            <span className="media-type">
                                {
                                    selectedWork
                                        .catalog
                                        .type
                                }
                            </span>

                            <h3>
                                {
                                    selectedWork
                                        .catalog
                                        .title
                                }
                            </h3>
                        </div>

                        <div className="catch-up-current-progress">
                            <span>
                                Progression actuelle
                            </span>

                            <strong>
                                {
                                    selectedWork.entry
                                        .progress
                                }

                                {selectedWork.catalog
                                    .total != null &&
                                    ` / ${selectedWork.catalog.total}`}
                            </strong>
                        </div>
                    </div>

                    {selectedWork.catalog
                        .total != null &&
                        selectedWork.catalog
                            .total >
                        0 && (
                            <div className="catch-up-progress">
                                <div className="catch-up-progress-track">
                                    <div
                                        className="catch-up-progress-fill"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.round(
                                                    (
                                                        selectedWork.entry
                                                            .progress /
                                                        selectedWork.catalog
                                                            .total
                                                    ) *
                                                    100,
                                                ),
                                            )}%`,
                                        }}
                                    />
                                </div>

                                <span>
                                    {Math.min(
                                        100,
                                        Math.round(
                                            (
                                                selectedWork.entry
                                                    .progress /
                                                selectedWork.catalog
                                                    .total
                                            ) *
                                            100,
                                        ),
                                    )}
                                    % terminé
                                </span>
                            </div>
                        )}
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
                        <div className="section-heading">
                            <span className="page-eyebrow">
                                Ton rythme
                            </span>

                            <h3>
                                Plan recommandé
                            </h3>

                            <p>
                                Calculé à partir de ta
                                progression actuelle et de
                                ta date cible.
                            </p>
                        </div>

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
                                            {getMediaUnit(
                                                selectedWork
                                                    .catalog
                                                    .type,
                                                plan.remaining >
                                                1,
                                            )}
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
                                            jour
                                            {plan.days > 1
                                                ? 's'
                                                : ''}
                                        </small>
                                    </article>

                                    <article className="catch-up-card catch-up-card-accent">
                                        <span>
                                            Rythme quotidien
                                        </span>

                                        <strong>
                                            {
                                                plan.perDay
                                            }
                                        </strong>

                                        <small>
                                            {getMediaUnit(
                                                selectedWork
                                                    .catalog
                                                    .type,
                                                plan.perDay >
                                                1,
                                            )}{' '}
                                            / jour
                                        </small>
                                    </article>

                                    <article className="catch-up-card">
                                        <span>
                                            Sur 7 jours
                                        </span>

                                        <strong>
                                            {
                                                plan.weeklyEquivalent
                                            }
                                        </strong>

                                        <small>
                                            {getMediaUnit(
                                                selectedWork
                                                    .catalog
                                                    .type,
                                                plan.weeklyEquivalent >
                                                1,
                                            )}
                                        </small>
                                    </article>
                                </div>

                                <div className="catch-up-advice">
                                    <div>
                                        <span className="page-eyebrow">
                                            Conseil
                                        </span>

                                        <p>
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
                                            {getMediaUnit(
                                                selectedWork
                                                    .catalog
                                                    .type,
                                                plan.perDay >
                                                1,
                                            )}{' '}
                                            par jour.
                                        </p>
                                    </div>

                                    <span className="catch-up-target-badge">
                                        Objectif :{' '}
                                        {
                                            targetDate
                                        }
                                    </span>
                                </div>
                            </>
                        )}
                    </section>
                )}
        </main>
    );
}
