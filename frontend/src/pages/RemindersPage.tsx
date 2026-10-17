import {
    useEffect,
    useState,
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

    const [message, setMessage] =
        useState('');

    const [scheduledAt, setScheduledAt] =
        useState('');

    const [reminders, setReminders] =
        useState<Reminder[]>([]);

    const [success, setSuccess] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const [sending, setSending] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [cancellingId, setCancellingId] =
        useState<number | null>(
            null,
        );

    useEffect(() => {
        let cancelled = false;

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
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleSubmit(
        event:
            React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(null);
        setSuccess(null);
        setSending(true);

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

            setMessage('');
            setScheduledAt('');
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Erreur inconnue',
            );
        } finally {
            setSending(false);
        }
    }

    async function handleCancel(
        id: number,
    ) {
        setError(null);
        setSuccess(null);
        setCancellingId(id);

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

    return (
        <main>
            <h2>
                Programmer un rappel
            </h2>

            <form
                className="reminder-form"
                onSubmit={
                    handleSubmit
                }
            >
                <label>
                    Message

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
                    Date et heure

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
                    disabled={
                        sending
                    }
                >
                    {sending
                        ? 'Programmation...'
                        : 'Programmer le rappel'}
                </button>
            </form>

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
                <h2>
                    Mes rappels
                </h2>

                {loading && (
                    <p>
                        Chargement...
                    </p>
                )}

                {!loading &&
                    reminders.length ===
                    0 && (
                        <p>
                            Aucun rappel
                            pour le
                            moment.
                        </p>
                    )}

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
                                <div>
                                    <h3>
                                        {
                                            reminder.message
                                        }
                                    </h3>

                                    <p>
                                        Prévu le :{' '}
                                        {formatDate(
                                            reminder.scheduledAt,
                                        )}
                                    </p>

                                    <p>
                                        Statut :{' '}
                                        <strong>
                                            {getStatusLabel(
                                                reminder.status,
                                            )}
                                        </strong>
                                    </p>
                                </div>

                                {reminder.status ===
                                    'pending' &&
                                    reminder.jobId && (
                                        <button
                                            type="button"
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
            </section>
        </main>
    );
}