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
} from '../api/mangatrack.api';

import type {
    CatalogDetails,
    CatalogRelation,
} from '../types/catalog';

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

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(
            null,
        );

    useEffect(() => {
        if (invalidWorkId) {
            return;
        }

        getCatalogDetails(
            workId,
        )
            .then((data) => {
                setWork(
                    data,
                );

                setError(
                    null,
                );
            })
            .catch(() => {
                setError(
                    'Impossible de charger cette œuvre.',
                );
            })
            .finally(() => {
                setLoading(
                    false,
                );
            });
    }, [
        workId,
        invalidWorkId,
    ]);

    if (invalidWorkId) {
        return (
            <p>
                Œuvre invalide.
            </p>
        );
    }

    if (loading) {
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