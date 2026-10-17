import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    createReminder,
    getCalendarReleases,
} from '../api/mangatrack.api';

import type {
    CalendarRelease,
} from '../types/catalog';

function formatDay(
    date: Date,
): string {
    return date.toLocaleDateString(
        'fr-FR',
        {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        },
    );
}

function formatTime(
    date: Date,
): string {
    return date.toLocaleTimeString(
        'fr-FR',
        {
            hour: '2-digit',
            minute: '2-digit',
        },
    );
}

function getDayKey(
    value: string,
): string {
    const date =
        new Date(value);

    return [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    ].join('-');
}

export function CalendarPage() {
    const navigate =
        useNavigate();

    const [
        releases,
        setReleases,
    ] =
        useState<CalendarRelease[]>(
            [],
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

    const [
        reminderMediaId,
        setReminderMediaId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        success,
        setSuccess,
    ] =
        useState<string | null>(
            null,
        );

    useEffect(() => {
        let cancelled =
            false;

        getCalendarReleases()
            .then((data) => {
                if (!cancelled) {
                    setReleases(
                        data,
                    );
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Erreur inconnue',
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(
                        false,
                    );
                }
            });

        return () => {
            cancelled =
                true;
        };
    }, []);

    async function handleReminder(
        release:
            CalendarRelease,
    ) {
        setError(null);
        setSuccess(null);

        setReminderMediaId(
            release.mediaId,
        );

        try {
            await createReminder({
                message:
                    `${release.title} - épisode ${release.episode}`,

                scheduledAt:
                    release.airingAt,
            });

            setSuccess(
                `Rappel créé pour ${release.title} - épisode ${release.episode}.`,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Erreur inconnue',
            );
        } finally {
            setReminderMediaId(
                null,
            );
        }
    }

    const grouped =
        releases.reduce<
            Record<
                string,
                CalendarRelease[]
            >
        >(
            (
                result,
                release,
            ) => {
                const key =
                    getDayKey(
                        release.airingAt,
                    );

                if (!result[key]) {
                    result[key] =
                        [];
                }

                result[key].push(
                    release,
                );

                return result;
            },
            {},
        );

    if (loading) {
        return (
            <main>
                <h2>
                    Calendrier des sorties
                </h2>

                <p>
                    Chargement du calendrier...
                </p>
            </main>
        );
    }

    return (
        <main>
            <h2>
                Calendrier des sorties
            </h2>

            <p>
                Prochaines sorties d'anime
                sur les 7 prochains jours.
            </p>

            {success && (
                <p className="success-message">
                    {success}
                </p>
            )}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {releases.length === 0 && (
                <p>
                    Aucune sortie prévue.
                </p>
            )}

            <div className="calendar-days">
                {Object.entries(
                    grouped,
                ).map(
                    ([
                        key,
                        dayReleases,
                    ]) => {
                        const date =
                            new Date(
                                dayReleases[0]
                                    .airingAt,
                            );

                        return (
                            <section
                                key={
                                    key
                                }
                                className="calendar-day"
                            >
                                <h3>
                                    {formatDay(
                                        date,
                                    )}
                                </h3>

                                <div className="calendar-releases">
                                    {dayReleases.map(
                                        (
                                            release,
                                        ) => (
                                            <article
                                                key={`${release.mediaId}-${release.episode}-${release.airingAt}`}
                                                className="calendar-card"
                                            >
                                                {release.imageUrl && (
                                                    <img
                                                        src={
                                                            release.imageUrl
                                                        }
                                                        alt={
                                                            release.title
                                                        }
                                                    />
                                                )}

                                                <div className="calendar-card-content">
                                                    <h4>
                                                        {
                                                            release.title
                                                        }
                                                    </h4>

                                                    <p>
                                                        Épisode{' '}
                                                        {
                                                            release.episode
                                                        }
                                                    </p>

                                                    <p>
                                                        {formatTime(
                                                            new Date(
                                                                release.airingAt,
                                                            ),
                                                        )}
                                                    </p>

                                                    {release.format && (
                                                        <p>
                                                            {
                                                                release.format
                                                            }
                                                        </p>
                                                    )}

                                                    <div className="calendar-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/catalog/${release.mediaId}`,
                                                                )
                                                            }
                                                        >
                                                            Voir la fiche
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                reminderMediaId ===
                                                                release.mediaId
                                                            }
                                                            onClick={() =>
                                                                handleReminder(
                                                                    release,
                                                                )
                                                            }
                                                        >
                                                            {reminderMediaId ===
                                                                release.mediaId
                                                                ? 'Création...'
                                                                : 'Créer un rappel'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        ),
                                    )}
                                </div>
                            </section>
                        );
                    },
                )}
            </div>
        </main>
    );
}