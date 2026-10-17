import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
    useParams,
} from 'react-router-dom';

import {
    getCatalogDetails,
    getLibrary,
    updateResumePoint,
} from '../api/mangatrack.api';

import type {
    CatalogDetails,
    CatalogRelation,
} from '../types/catalog';

import type {
    LibraryEntry,
} from '../types/library';

function getRelationLabel(
    relationType: string,
): string {
    switch (relationType) {
        case 'ADAPTATION':
            return 'Adaptation';

        case 'PREQUEL':
            return 'Préquelle';

        case 'SEQUEL':
            return 'Suite';

        case 'PARENT':
            return 'Œuvre principale';

        case 'SIDE_STORY':
            return 'Histoire parallèle';

        case 'SPIN_OFF':
            return 'Spin-off';

        case 'ALTERNATIVE':
            return 'Version alternative';

        case 'SUMMARY':
            return 'Résumé';

        case 'CHARACTER':
            return 'Personnages liés';

        case 'SOURCE':
            return 'Œuvre source';

        case 'COMPILATION':
            return 'Compilation';

        case 'CONTAINS':
            return 'Contient';

        case 'OTHER':
            return 'Autre relation';

        default:
            return relationType
                .replaceAll(
                    '_',
                    ' ',
                )
                .toLowerCase();
    }
}

function isMangaAnimeRelation(
    workType:
        | 'anime'
        | 'manga',
    relation: CatalogRelation,
): boolean {
    return (
        relation.relationType ===
        'ADAPTATION' &&
        relation.type !==
        workType
    );
}

export function WorkDetailsPage() {
    const { id } =
        useParams();

    const workId =
        Number(id);

    const invalidWorkId =
        !Number.isInteger(
            workId,
        ) ||
        workId < 1;

    const navigate =
        useNavigate();

    const [work, setWork] =
        useState<CatalogDetails | null>(
            null,
        );

    const [
        loadedWorkId,
        setLoadedWorkId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        libraryEntry,
        setLibraryEntry,
    ] =
        useState<LibraryEntry | null>(
            null,
        );

    const [
        resumeChapterInputs,
        setResumeChapterInputs,
    ] =
        useState<
            Record<number, string>
        >({});

    const [
        savingResumeId,
        setSavingResumeId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        resumeMessage,
        setResumeMessage,
    ] =
        useState<string | null>(
            null,
        );

    const [
        resumeError,
        setResumeError,
    ] =
        useState<string | null>(
            null,
        );

    const [error, setError] =
        useState<string | null>(
            null,
        );

    useEffect(() => {
        if (invalidWorkId) {
            return;
        }

        let cancelled =
            false;

        Promise.all([
            getCatalogDetails(
                workId,
            ),
            getLibrary(),
        ])
            .then(
                ([
                    details,
                    library,
                ]) => {
                    if (cancelled) {
                        return;
                    }

                    const entry =
                        library.find(
                            (
                                current,
                            ) =>
                                current.catalogItemId ===
                                workId,
                        ) ??
                        null;

                    setWork(
                        details,
                    );

                    setLibraryEntry(
                        entry,
                    );

                    setError(
                        null,
                    );

                    setResumeMessage(
                        null,
                    );

                    setResumeError(
                        null,
                    );

                    if (
                        entry?.resumeCatalogItemId !=
                        null &&
                        entry.resumeChapter !=
                        null
                    ) {
                        setResumeChapterInputs({
                            [entry.resumeCatalogItemId]:
                                String(
                                    entry.resumeChapter,
                                ),
                        });
                    } else {
                        setResumeChapterInputs(
                            {},
                        );
                    }

                    setLoadedWorkId(
                        workId,
                    );
                },
            )
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setWork(
                    null,
                );

                setLibraryEntry(
                    null,
                );

                setError(
                    'Impossible de charger cette œuvre.',
                );

                setLoadedWorkId(
                    workId,
                );
            });

        return () => {
            cancelled =
                true;
        };
    }, [
        workId,
        invalidWorkId,
    ]);

    async function saveResumePoint(
        relation: CatalogRelation,
    ) {
        if (!libraryEntry) {
            return;
        }

        const value =
            resumeChapterInputs[
            relation.id
            ] ??
            '';

        const chapter =
            Number(
                value,
            );

        if (
            !Number.isInteger(
                chapter,
            ) ||
            chapter < 1
        ) {
            setResumeError(
                'Le chapitre doit être un nombre entier supérieur à 0.',
            );

            setResumeMessage(
                null,
            );

            return;
        }

        setSavingResumeId(
            relation.id,
        );

        setResumeError(
            null,
        );

        setResumeMessage(
            null,
        );

        try {
            const updated =
                await updateResumePoint(
                    libraryEntry.id,
                    relation.id,
                    chapter,
                );

            setLibraryEntry(
                updated,
            );

            setResumeChapterInputs(
                (current) => ({
                    ...current,
                    [relation.id]:
                        String(
                            chapter,
                        ),
                }),
            );

            setResumeMessage(
                `Point de reprise enregistré : ${relation.title}, chapitre ${chapter}.`,
            );
        } catch (err) {
            setResumeError(
                err instanceof Error
                    ? err.message
                    : 'Impossible d’enregistrer le point de reprise.',
            );
        } finally {
            setSavingResumeId(
                null,
            );
        }
    }

    async function clearResumePoint(
        relation: CatalogRelation,
    ) {
        if (!libraryEntry) {
            return;
        }

        setSavingResumeId(
            relation.id,
        );

        setResumeError(
            null,
        );

        setResumeMessage(
            null,
        );

        try {
            const updated =
                await updateResumePoint(
                    libraryEntry.id,
                    null,
                    null,
                );

            setLibraryEntry(
                updated,
            );

            setResumeChapterInputs(
                (current) => ({
                    ...current,
                    [relation.id]:
                        '',
                }),
            );

            setResumeMessage(
                'Point de reprise supprimé.',
            );
        } catch (err) {
            setResumeError(
                err instanceof Error
                    ? err.message
                    : 'Impossible de supprimer le point de reprise.',
            );
        } finally {
            setSavingResumeId(
                null,
            );
        }
    }

    if (invalidWorkId) {
        return (
            <p>
                Œuvre invalide.
            </p>
        );
    }

    if (
        loadedWorkId !==
        workId
    ) {
        return (
            <p>
                Chargement...
            </p>
        );
    }

    if (
        error ||
        !work
    ) {
        return (
            <p>
                {error ??
                    'Œuvre introuvable.'}
            </p>
        );
    }

    const currentWork =
        work;

    const description =
        currentWork.description
            ?.replace(
                /<br\s*\/?>/gi,
                '\n',
            )
            .replace(
                /<[^>]+>/g,
                '',
            );

    const mangaAnimeRelations =
        currentWork.relations.filter(
            (relation) =>
                isMangaAnimeRelation(
                    currentWork.type,
                    relation,
                ),
        );

    const otherRelations =
        currentWork.relations.filter(
            (relation) =>
                !isMangaAnimeRelation(
                    currentWork.type,
                    relation,
                ),
        );

    function renderRelation(
        relation:
            CatalogRelation,
        highlighted = false,
    ) {
        const canSetResumePoint =
            highlighted &&
            currentWork.type ===
            'anime' &&
            relation.type ===
            'manga' &&
            libraryEntry !==
            null;

        const isCurrentResumePoint =
            libraryEntry
                ?.resumeCatalogItemId ===
            relation.id &&
            libraryEntry
                .resumeChapter !=
            null;

        const chapterInput =
            resumeChapterInputs[
            relation.id
            ] ??
            '';

        return (
            <article
                key={`${relation.relationType}-${relation.id}`}
                className={
                    highlighted
                        ? 'relation-card relation-card-highlight'
                        : 'relation-card'
                }
            >
                {relation.imageUrl && (
                    <img
                        src={
                            relation.imageUrl
                        }
                        alt={
                            relation.title
                        }
                        className="relation-cover"
                    />
                )}

                <div className="relation-content">
                    <span className="media-type">
                        {
                            relation.type
                        }
                    </span>

                    <h4>
                        {
                            relation.title
                        }
                    </h4>

                    <p>
                        {getRelationLabel(
                            relation.relationType,
                        )}
                    </p>

                    {relation.format && (
                        <p>
                            Format :{' '}
                            {
                                relation.format
                            }
                        </p>
                    )}

                    {highlighted && (
                        <p className="relation-adaptation">
                            Adaptation{' '}
                            {currentWork.type ===
                                'anime'
                                ? 'manga'
                                : 'anime'}
                        </p>
                    )}

                    {canSetResumePoint && (
                        <div className="resume-point">
                            <h5>
                                Point de reprise manga
                            </h5>

                            <p>
                                Indique manuellement le
                                chapitre où reprendre après
                                l’anime.
                            </p>

                            {isCurrentResumePoint && (
                                <p className="resume-current">
                                    Point actuel : chapitre{' '}
                                    <strong>
                                        {
                                            libraryEntry.resumeChapter
                                        }
                                    </strong>
                                </p>
                            )}

                            <div className="resume-point-form">
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    inputMode="numeric"
                                    placeholder="Ex. 34"
                                    value={
                                        chapterInput
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        setResumeChapterInputs(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                [relation.id]:
                                                    event
                                                        .target
                                                        .value,
                                            }),
                                        );

                                        setResumeError(
                                            null,
                                        );

                                        setResumeMessage(
                                            null,
                                        );
                                    }}
                                />

                                <button
                                    type="button"
                                    disabled={
                                        savingResumeId ===
                                        relation.id
                                    }
                                    onClick={() =>
                                        saveResumePoint(
                                            relation,
                                        )
                                    }
                                >
                                    {savingResumeId ===
                                        relation.id
                                        ? 'Enregistrement...'
                                        : isCurrentResumePoint
                                            ? 'Modifier'
                                            : 'Enregistrer'}
                                </button>
                            </div>

                            {isCurrentResumePoint && (
                                <button
                                    type="button"
                                    className="resume-delete"
                                    disabled={
                                        savingResumeId ===
                                        relation.id
                                    }
                                    onClick={() =>
                                        clearResumePoint(
                                            relation,
                                        )
                                    }
                                >
                                    Supprimer le point de reprise
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/catalog/${relation.id}`,
                            )
                        }
                    >
                        Voir la fiche
                    </button>
                </div>
            </article>
        );
    }

    return (
        <main className="work-details">
            <button
                type="button"
                onClick={() =>
                    navigate(-1)
                }
            >
                ← Retour
            </button>

            <div className="work-details-content">
                {currentWork.imageUrl && (
                    <img
                        src={
                            currentWork.imageUrl
                        }
                        alt={
                            currentWork.title
                        }
                        className="work-cover"
                    />
                )}

                <div>
                    <span className="media-type">
                        {
                            currentWork.type
                        }
                    </span>

                    <h2>
                        {
                            currentWork.title
                        }
                    </h2>

                    <p>
                        {currentWork.genres.join(
                            ' • ',
                        )}
                    </p>

                    <p>
                        {currentWork.type ===
                            'anime'
                            ? 'Épisodes'
                            : 'Chapitres'}
                        {' : '}
                        {currentWork.total ??
                            'Inconnu'}
                    </p>

                    {currentWork.seasonYear && (
                        <p>
                            Année :{' '}
                            {
                                currentWork.seasonYear
                            }
                        </p>
                    )}

                    {currentWork.format && (
                        <p>
                            Format :{' '}
                            {
                                currentWork.format
                            }
                        </p>
                    )}

                    {currentWork.status && (
                        <p>
                            Statut :{' '}
                            {
                                currentWork.status
                            }
                        </p>
                    )}

                    {currentWork.averageScore !==
                        null && (
                            <p>
                                Score AniList :{' '}
                                {
                                    currentWork.averageScore
                                }
                                /100
                            </p>
                        )}

                    <h3>
                        Synopsis
                    </h3>

                    <p className="work-description">
                        {description ??
                            'Aucun synopsis disponible.'}
                    </p>
                </div>
            </div>

            {resumeMessage && (
                <p className="success-message">
                    {
                        resumeMessage
                    }
                </p>
            )}

            {resumeError && (
                <p className="error-message">
                    {
                        resumeError
                    }
                </p>
            )}

            {mangaAnimeRelations.length >
                0 && (
                    <section className="relations-section">
                        <h3>
                            Adaptation manga / anime
                        </h3>

                        <p>
                            Cette œuvre possède une
                            adaptation directement liée.
                        </p>

                        <div className="relations-grid">
                            {mangaAnimeRelations.map(
                                (
                                    relation,
                                ) =>
                                    renderRelation(
                                        relation,
                                        true,
                                    ),
                            )}
                        </div>
                    </section>
                )}

            {otherRelations.length >
                0 && (
                    <section className="relations-section">
                        <h3>
                            Œuvres liées
                        </h3>

                        <div className="relations-grid">
                            {otherRelations.map(
                                (
                                    relation,
                                ) =>
                                    renderRelation(
                                        relation,
                                    ),
                            )}
                        </div>
                    </section>
                )}

            {currentWork.relations.length ===
                0 && (
                    <section className="relations-section">
                        <h3>
                            Œuvres liées
                        </h3>

                        <p>
                            Aucune œuvre liée
                            disponible.
                        </p>
                    </section>
                )}
        </main>
    );
}