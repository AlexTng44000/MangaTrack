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
} from '../types/catalog';

export function WorkDetailsPage() {
    const { id } =
        useParams();

    const workId =
        Number(id);

    const invalidWorkId =
        !Number.isInteger(workId) ||
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

        getCatalogDetails(workId)
            .then(setWork)
            .catch(() => {
                setError(
                    'Impossible de charger cette œuvre.',
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, [
        workId,
        invalidWorkId,
    ]);

    if (invalidWorkId) {
        return (
            <p>Œuvre invalide.</p>
        );
    }

    if (loading) {
        return (
            <p>Chargement...</p>
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

    const description =
        work.description
            ?.replace(
                /<br\s*\/?>/gi,
                '\n',
            )
            .replace(
                /<[^>]+>/g,
                '',
            );

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
                {work.imageUrl && (
                    <img
                        src={
                            work.imageUrl
                        }
                        alt={
                            work.title
                        }
                        className="work-cover"
                    />
                )}

                <div>
                    <span className="media-type">
                        {work.type}
                    </span>

                    <h2>
                        {work.title}
                    </h2>

                    <p>
                        {work.genres.join(
                            ' • ',
                        )}
                    </p>

                    <p>
                        {work.type ===
                            'anime'
                            ? 'Épisodes'
                            : 'Chapitres'}
                        {' : '}
                        {work.total ??
                            'Inconnu'}
                    </p>

                    {work.seasonYear && (
                        <p>
                            Année :{' '}
                            {
                                work.seasonYear
                            }
                        </p>
                    )}

                    {work.format && (
                        <p>
                            Format :{' '}
                            {
                                work.format
                            }
                        </p>
                    )}

                    {work.status && (
                        <p>
                            Statut :{' '}
                            {
                                work.status
                            }
                        </p>
                    )}

                    {work.averageScore !==
                        null && (
                            <p>
                                Score AniList :{' '}
                                {
                                    work.averageScore
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
        </main>
    );
}