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

function isSafeExternalUrl(
    value: string,
): boolean {
    try {
        const url =
            new URL(value);

        return (
            url.protocol ===
            'https:' ||
            url.protocol ===
            'http:'
        );
    } catch {
        return false;
    }
}


function getMediaStatusLabel(
    status: string | null,
): string {
    switch (status) {
        case 'FINISHED':
            return 'Terminé';

        case 'RELEASING':
            return 'En cours';

        case 'NOT_YET_RELEASED':
            return 'À venir';

        case 'CANCELLED':
            return 'Annulé';

        case 'HIATUS':
            return 'En pause';

        default:
            return status ??
                'Inconnu';
    }
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

    const [
        showAllStreamingEpisodes,
        setShowAllStreamingEpisodes,
    ] =
        useState(false);

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

                    setShowAllStreamingEpisodes(
                        false,
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

    const externalLinks =
        currentWork.externalLinks ??
        [];

    const streamingEpisodes =
        currentWork.streamingEpisodes ??
        [];

    const platformLinks =
        Array.from(
            new Map(
                externalLinks
                    .filter(
                        (link) =>
                            !link.isDisabled &&
                            link.type ===
                            'STREAMING' &&
                            isSafeExternalUrl(
                                link.url,
                            ),
                    )
                    .map(
                        (link) => [
                            link.url,
                            link,
                        ],
                    ),
            ).values(),
        );

    const safeStreamingEpisodes =
        streamingEpisodes.filter(
            (episode) =>
                isSafeExternalUrl(
                    episode.url,
                ),
        );

    const visibleStreamingEpisodes =
        showAllStreamingEpisodes
            ? safeStreamingEpisodes
            : safeStreamingEpisodes.slice(
                0,
                12,
            );

    const hasViewingOptions =
        platformLinks.length >
        0 ||
        safeStreamingEpisodes.length >
        0;

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

    const progressPercent =
        libraryEntry &&
            currentWork.total != null &&
            currentWork.total > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        libraryEntry.progress /
                        currentWork.total
                    ) *
                    100,
                ),
            )
            : null;

    return (
        <main className="work-details">
            <div className="work-details-toolbar">
                <button
                    type="button"
                    className="back-button"
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    ← Retour
                </button>

                {libraryEntry && (
                    <span className="library-presence">
                        ✓ Dans ma bibliothèque
                    </span>
                )}
            </div>

            <section className="work-hero">
                <div className="work-poster-column">
                    {currentWork.imageUrl ? (
                        <img
                            src={
                                currentWork.imageUrl
                            }
                            alt={
                                currentWork.title
                            }
                            className="work-cover"
                        />
                    ) : (
                        <div className="work-cover-placeholder">
                            Aucune image
                        </div>
                    )}

                    {libraryEntry && (
                        <div className="work-library-progress">
                            <div className="work-library-progress-heading">
                                <span>
                                    Ma progression
                                </span>

                                <strong>
                                    {
                                        libraryEntry.progress
                                    }

                                    {currentWork.total !=
                                        null &&
                                        ` / ${currentWork.total}`}
                                </strong>
                            </div>

                            {progressPercent !==
                                null && (
                                    <>
                                        <div className="work-library-progress-track">
                                            <div
                                                className="work-library-progress-fill"
                                                style={{
                                                    width: `${progressPercent}%`,
                                                }}
                                            />
                                        </div>

                                        <small>
                                            {
                                                progressPercent
                                            }
                                            % terminé
                                        </small>
                                    </>
                                )}
                        </div>
                    )}
                </div>

                <div className="work-hero-content">
                    <div className="work-heading-meta">
                        <span className="media-type">
                            {
                                currentWork.type
                            }
                        </span>

                        {currentWork.seasonYear && (
                            <span className="work-year">
                                {
                                    currentWork.seasonYear
                                }
                            </span>
                        )}
                    </div>

                    <h2>
                        {
                            currentWork.title
                        }
                    </h2>

                    {currentWork.genres.length >
                        0 && (
                            <div className="work-genres">
                                {currentWork.genres.map(
                                    (genre) => (
                                        <span
                                            key={genre}
                                        >
                                            {genre}
                                        </span>
                                    ),
                                )}
                            </div>
                        )}

                    <div className="work-meta-grid">
                        <article className="work-meta-card">
                            <span>
                                {currentWork.type ===
                                    'anime'
                                    ? 'Épisodes'
                                    : 'Chapitres'}
                            </span>

                            <strong>
                                {currentWork.total ??
                                    '—'}
                            </strong>
                        </article>

                        <article className="work-meta-card">
                            <span>
                                Format
                            </span>

                            <strong>
                                {currentWork.format ??
                                    '—'}
                            </strong>
                        </article>

                        <article className="work-meta-card">
                            <span>
                                Statut
                            </span>

                            <strong>
                                {getMediaStatusLabel(
                                    currentWork.status,
                                )}
                            </strong>
                        </article>

                        <article className="work-meta-card">
                            <span>
                                Score AniList
                            </span>

                            <strong>
                                {currentWork.averageScore !==
                                    null
                                    ? `${currentWork.averageScore}/100`
                                    : '—'}
                            </strong>
                        </article>
                    </div>

                    <section className="work-synopsis">
                        <span className="page-eyebrow">
                            À propos
                        </span>

                        <h3>
                            Synopsis
                        </h3>

                        <p className="work-description">
                            {description ??
                                'Aucun synopsis disponible.'}
                        </p>
                    </section>
                </div>
            </section>

            <section className="watch-section">
                <div className="section-heading">
                    <span className="page-eyebrow">
                        Disponibilité
                    </span>

                    <h3>
                        {currentWork.type ===
                            'anime'
                            ? 'Où regarder ?'
                            : 'Où lire ?'}
                    </h3>

                    <p>
                        Liens externes référencés par
                        AniList pour cette œuvre.
                    </p>
                </div>

                {platformLinks.length >
                    0 && (
                        <div className="platform-links">
                            {platformLinks.map(
                                (link) => (
                                    <a
                                        key={link.url}
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="platform-link"
                                    >
                                        {link.icon && (
                                            <img
                                                src={
                                                    link.icon
                                                }
                                                alt=""
                                                className="platform-icon"
                                            />
                                        )}

                                        <span>
                                            {link.site}
                                        </span>

                                        <strong>
                                            {currentWork.type ===
                                                'anime'
                                                ? 'Regarder ↗'
                                                : 'Lire ↗'}
                                        </strong>
                                    </a>
                                ),
                            )}
                        </div>
                    )}

                {currentWork.type ===
                    'anime' &&
                    safeStreamingEpisodes
                        .length >
                    0 && (
                        <div className="streaming-episodes">
                            <div className="streaming-heading">
                                <div>
                                    <h4>
                                        Épisodes disponibles
                                    </h4>

                                    <p>
                                        Accès direct aux
                                        épisodes référencés
                                        par AniList.
                                    </p>
                                </div>

                                <span>
                                    {
                                        safeStreamingEpisodes.length
                                    }{' '}
                                    épisode
                                    {safeStreamingEpisodes.length >
                                        1
                                        ? 's'
                                        : ''}
                                </span>
                            </div>

                            <div className="streaming-grid">
                                {visibleStreamingEpisodes.map(
                                    (
                                        episode,
                                        index,
                                    ) => (
                                        <a
                                            key={`${episode.url}-${index}`}
                                            href={
                                                episode.url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="streaming-card"
                                        >
                                            {episode.thumbnail && (
                                                <img
                                                    src={
                                                        episode.thumbnail
                                                    }
                                                    alt=""
                                                    className="streaming-thumbnail"
                                                />
                                            )}

                                            <span>
                                                {episode.title ||
                                                    `Épisode ${index + 1}`}
                                            </span>

                                            <small>
                                                {episode.site}
                                            </small>
                                        </a>
                                    ),
                                )}
                            </div>

                            {safeStreamingEpisodes
                                .length >
                                12 && (
                                    <button
                                        type="button"
                                        className="streaming-toggle"
                                        onClick={() =>
                                            setShowAllStreamingEpisodes(
                                                (
                                                    current,
                                                ) =>
                                                    !current,
                                            )
                                        }
                                    >
                                        {showAllStreamingEpisodes
                                            ? 'Afficher moins'
                                            : `Afficher les ${safeStreamingEpisodes.length} épisodes`}
                                    </button>
                                )}
                        </div>
                    )}

                {!hasViewingOptions && (
                    <div className="watch-empty">
                        <strong>
                            Aucune plateforme renseignée
                        </strong>

                        <p>
                            AniList ne référence
                            actuellement aucune
                            plateforme de{' '}
                            {currentWork.type ===
                                'anime'
                                ? 'visionnage'
                                : 'lecture'}{' '}
                            pour cette œuvre.
                        </p>
                    </div>
                )}

                <p className="watch-disclaimer">
                    MangaTrack n’héberge aucun
                    contenu : les liens ouvrent
                    les plateformes externes
                    référencées par AniList.
                </p>
            </section>

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
                        <div className="section-heading">
                            <span className="page-eyebrow">
                                Continuer l’histoire
                            </span>

                            <h3>
                                Adaptation manga / anime
                            </h3>

                            <p>
                                Passe facilement d’un
                                support à l’autre et
                                conserve ton point de
                                reprise.
                            </p>
                        </div>

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
                        <div className="section-heading">
                            <span className="page-eyebrow">
                                Univers
                            </span>

                            <h3>
                                Œuvres liées
                            </h3>

                            <p>
                                Suites, préquelles,
                                spin-off et autres
                                œuvres associées.
                            </p>
                        </div>

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
                        <div className="section-heading">
                            <span className="page-eyebrow">
                                Univers
                            </span>

                            <h3>
                                Œuvres liées
                            </h3>
                        </div>

                        <div className="relations-empty">
                            Aucune œuvre liée
                            disponible pour le moment.
                        </div>
                    </section>
                )}
        </main>
    );
}