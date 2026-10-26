import {
    useEffect,
    useState,
    type FormEvent,
} from 'react';

import {
    cancelReminder,
    createReminder,
    getReminders,
} from '../api/mangatrack.api';

import type {
    Reminder,
    ReminderStatus,
} from '../api/mangatrack.api';

function getStatusLabel(
    status: ReminderStatus,
): string {
    switch (status) {
        case 'pending':
            return 'En attente';

        case 'sent':
            return 'Envoyé';

        case 'failed':
            return 'Échec';

        case 'cancelled':
            return 'Annulé';
    }
}

function formatDate(
    value: string | null,
): string {
    if (!value) {
        return 'Immédiat';
    }

    return new Date(
        value,
    ).toLocaleString(
        'fr-FR',
        {
            dateStyle: 'medium',
            timeStyle: 'short',
        },
    );
}

export function RemindersPage() {
    const [
        message,
        setMessage,
    ] =
        useState('');

    const [
        scheduledAt,
        setScheduledAt,
    ] =
        useState('');

    const [
        reminders,
        setReminders,
    ] =
        useState<Reminder[]>([]);

    const [
        success,
        setSuccess,
    ] =
        useState<string | null>(
            null,
        );

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null,
        );

    const [
        sending,
        setSending,
    ] =
        useState(false);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        cancellingId,
        setCancellingId,
    ] =
        useState<number | null>(
            null,
        );

    useEffect(() => {
        let cancelled =
            false;

        getReminders()
            .then((data) => {
                if (!cancelled) {
                    setReminders(
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

    async function handleSubmit(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(
            null,
        );

        setSuccess(
            null,
        );

        setSending(
            true,
        );

        try {
            const scheduledDate =
                new Date(
                    scheduledAt,
                );

            const reminder =
                await createReminder({
                    message,
                    scheduledAt:
                        scheduledDate.toISOString(),
                });

            setReminders(
                (current) => [
                    reminder,
                    ...current,
                ],
            );

            setSuccess(
                'Rappel programmé avec succès.',
            );

            setMessage(
                '',
            );

            setScheduledAt(
                '',
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Erreur inconnue',
            );
        } finally {
            setSending(
                false,
            );
        }
    }

    async function handleCancel(
        id: number,
    ) {
        setError(
            null,
        );

        setSuccess(
            null,
        );

        setCancellingId(
            id,
        );

        try {
            const updated =
                await cancelReminder(
                    id,
                );

            setReminders(
                (current) =>
                    current.map(
                        (reminder) =>
                            reminder.id ===
                                updated.id
                                ? updated
                                : reminder,
                    ),
            );

            setSuccess(
                'Rappel annulé.',
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Erreur inconnue',
            );
        } finally {
            setCancellingId(
                null,
            );
        }
    }

    const pendingCount =
        reminders.filter(
            (reminder) =>
                reminder.status ===
                'pending',
        ).length;

    const sentCount =
        reminders.filter(
            (reminder) =>
                reminder.status ===
                'sent',
        ).length;

    return (
        <main className="reminders-page">
            <section className="reminders-heading">
                <div>
                    <span className="page-eyebrow">
                        Notifications
                    </span>

                    <h2>
                        Mes rappels
                    </h2>

                    <p>
                        Programme une alerte pour ne
                        pas manquer une sortie ou
                        reprendre une œuvre plus tard.
                    </p>
                </div>

                <div className="reminders-summary">
                    <article>
                        <strong>
                            {
                                reminders.length
                            }
                        </strong>

                        <span>
                            total
                        </span>
                    </article>

                    <article>
                        <strong>
                            {
                                pendingCount
                            }
                        </strong>

                        <span>
                            en attente
                        </span>
                    </article>

                    <article>
                        <strong>
                            {
                                sentCount
                            }
                        </strong>

                        <span>
                            envoyés
                        </span>
                    </article>
                </div>
            </section>

            <section className="reminder-create-card">
                <div className="reminder-create-copy">
                    <span className="page-eyebrow">
                        Nouveau rappel
                    </span>

                    <h3>
                        Programmer une notification
                    </h3>

                    <p>
                        Choisis ton message et la date
                        à laquelle MangaTrack doit
                        déclencher le rappel.
                    </p>
                </div>

                <form
                    className="reminder-form"
                    onSubmit={
                        handleSubmit
                    }
                >
                    <label className="reminder-message-field">
                        <span>
                            Message
                        </span>

                        <textarea
                            value={
                                message
                            }
                            onChange={(
                                event,
                            ) =>
                                setMessage(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Ex : Le prochain épisode de Frieren sort bientôt."
                            required
                        />
                    </label>

                    <label>
                        <span>
                            Date et heure
                        </span>

                        <input
                            type="datetime-local"
                            value={
                                scheduledAt
                            }
                            onChange={(
                                event,
                            ) =>
                                setScheduledAt(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="reminder-submit-button"
                        disabled={
                            sending
                        }
                    >
                        {sending
                            ? 'Programmation...'
                            : 'Programmer le rappel'}
                    </button>
                </form>
            </section>

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

            <section className="reminders-section">
                <div className="section-heading">
                    <span className="page-eyebrow">
                        Historique
                    </span>

                    <h3>
                        Tous mes rappels
                    </h3>

                    <p>
                        Retrouve ici les rappels en
                        attente, envoyés ou annulés.
                    </p>
                </div>

                {loading && (
                    <div className="reminders-empty">
                        Chargement des rappels...
                    </div>
                )}

                {!loading &&
                    reminders.length ===
                    0 && (
                        <div className="reminders-empty">
                            <strong>
                                Aucun rappel
                            </strong>

                            <p>
                                Programme ton premier
                                rappel avec le formulaire
                                ci-dessus ou depuis le
                                calendrier.
                            </p>
                        </div>
                    )}

                {!loading &&
                    reminders.length >
                    0 && (
                        <div className="reminders-list">
                            {reminders.map(
                                (
                                    reminder,
                                ) => (
                                    <article
                                        key={
                                            reminder.id
                                        }
                                        className="reminder-card"
                                    >
                                        <div className="reminder-card-main">
                                            <div className="reminder-card-heading">
                                                <span
                                                    className={`reminder-status reminder-status-${reminder.status}`}
                                                >
                                                    {getStatusLabel(
                                                        reminder.status,
                                                    )}
                                                </span>

                                                <span className="reminder-id">
                                                    #
                                                    {
                                                        reminder.id
                                                    }
                                                </span>
                                            </div>

                                            <h4>
                                                {
                                                    reminder.message
                                                }
                                            </h4>

                                            <div className="reminder-date">
                                                <span>
                                                    Prévu le
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        reminder.scheduledAt,
                                                    )}
                                                </strong>
                                            </div>
                                        </div>

                                        {reminder.status ===
                                            'pending' &&
                                            reminder.jobId && (
                                                <button
                                                    type="button"
                                                    className="reminder-cancel-button"
                                                    onClick={() =>
                                                        handleCancel(
                                                            reminder.id,
                                                        )
                                                    }
                                                    disabled={
                                                        cancellingId ===
                                                        reminder.id
                                                    }
                                                >
                                                    {cancellingId ===
                                                        reminder.id
                                                        ? 'Annulation...'
                                                        : 'Annuler'}
                                                </button>
                                            )}
                                    </article>
                                ),
                            )}
                        </div>
                    )}
            </section>
        </main>
    );
}
