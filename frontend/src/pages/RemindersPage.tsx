import {
    useState,
} from 'react';

import {
    createReminder,
} from '../api/mangatrack.api';

export function RemindersPage() {

    const [message, setMessage] =
        useState('');

    const [scheduledAt, setScheduledAt] =
        useState('');

    const [success, setSuccess] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const [sending, setSending] =
        useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(null);
        setSuccess(null);
        setSending(true);

        try {
            const scheduledDate =
                new Date(scheduledAt);

            const result =
                await createReminder({
                    message,
                    scheduledAt:
                        scheduledDate.toISOString(),
                });

            setSuccess(
                `Rappel programmé avec succès. Job ${result.jobId}`,
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

    return (
        <main>
            <h2>Programmer un rappel</h2>

            <form
                className="reminder-form"
                onSubmit={handleSubmit}
            >

                <label>
                    Message
                    <textarea
                        value={message}
                        onChange={(event) =>
                            setMessage(event.target.value)
                        }
                        placeholder="Ex : Le prochain épisode de Frieren sort bientôt."
                        required
                    />
                </label>

                <label>
                    Date et heure
                    <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(event) =>
                            setScheduledAt(
                                event.target.value,
                            )
                        }
                        required
                    />
                </label>

                <button
                    type="submit"
                    disabled={sending}
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
        </main>
    );
}