import { t, locale, useLanguage } from "../i18n";
import { useEffect, useState, type FormEvent } from "react";

import {
  cancelReminder,
  createReminder,
  getReminders,
} from "../api/mangatrack.api";

import type { Reminder, ReminderStatus } from "../api/mangatrack.api";

function getStatusLabel(status: ReminderStatus): string {
  switch (status) {
    case "pending":
      return t("En attente");

    case "sent":
      return t("Envoyé");

    case "failed":
      return t("Échec");

    case "cancelled":
      return t("Annulé");
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return t("Immédiat");
  }

  return new Date(value).toLocaleString(locale(), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RemindersPage() {
  useLanguage();
  const [message, setMessage] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");

  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [success, setSuccess] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);

  const [loading, setLoading] = useState(true);

  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getReminders()
      .then((data) => {
        if (!cancelled) {
          setReminders(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("Erreur inconnue"));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    setSuccess(null);

    setSending(true);

    try {
      const scheduledDate = new Date(scheduledAt);

      const reminder = await createReminder({
        message,
        scheduledAt: scheduledDate.toISOString(),
      });

      setReminders((current) => [reminder, ...current]);

      setSuccess(t("Rappel programmé avec succès."));

      setMessage("");

      setScheduledAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur inconnue"));
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(id: number) {
    setError(null);

    setSuccess(null);

    setCancellingId(id);

    try {
      const updated = await cancelReminder(id);

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === updated.id ? updated : reminder,
        ),
      );

      setSuccess(t("Rappel annulé."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur inconnue"));
    } finally {
      setCancellingId(null);
    }
  }

  const pendingCount = reminders.filter(
    (reminder) => reminder.status === "pending",
  ).length;

  const sentCount = reminders.filter(
    (reminder) => reminder.status === "sent",
  ).length;

  return (
    <main className="reminders-page">
      <section className="reminders-heading">
        <div>
          <span className="page-eyebrow">Notifications</span>

          <h2>{t("Mes rappels")} </h2>

          <p>
            {t(
              "Programme une alerte pour ne pas manquer une sortie ou reprendre une œuvre plus tard.",
            )}{" "}
          </p>
        </div>

        <div className="reminders-summary">
          <article>
            <strong>{reminders.length}</strong>

            <span>total</span>
          </article>

          <article>
            <strong>{pendingCount}</strong>

            <span>{t("en attente")} </span>
          </article>

          <article>
            <strong>{sentCount}</strong>

            <span>{t("envoyés")} </span>
          </article>
        </div>
      </section>

      <section className="reminder-create-card">
        <div className="reminder-create-copy">
          <span className="page-eyebrow">{t("Nouveau rappel")} </span>

          <h3>{t("Programmer une notification")} </h3>

          <p>
            {t(
              "Choisis ton message et la date à laquelle MyMangaTracker doit déclencher le rappel.",
            )}{" "}
          </p>
        </div>

        <form className="reminder-form" onSubmit={handleSubmit}>
          <label className="reminder-message-field">
            <span>Message</span>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t(
                "Ex : Le prochain épisode de Frieren sort bientôt.",
              )}
              required
            />
          </label>

          <label>
            <span>{t("Date et heure")} </span>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="reminder-submit-button"
            disabled={sending}
          >
            {sending ? t("Programmation...") : t("Programmer le rappel")}
          </button>
        </form>
      </section>

      {success && <p className="success-message">{t(success)}</p>}

      {error && <p className="error-message">{t(error)}</p>}

      <section className="reminders-section">
        <div className="section-heading">
          <span className="page-eyebrow">{t("Historique")} </span>

          <h3>{t("Tous mes rappels")} </h3>

          <p>
            {t("Retrouve ici les rappels en attente, envoyés ou annulés.")}{" "}
          </p>
        </div>

        {loading && (
          <div className="reminders-empty">
            {t("Chargement des rappels...")}{" "}
          </div>
        )}

        {!loading && reminders.length === 0 && (
          <div className="reminders-empty">
            <strong>{t("Aucun rappel")} </strong>

            <p>
              {t(
                "Programme ton premier rappel avec le formulaire ci-dessus ou depuis le calendrier.",
              )}{" "}
            </p>
          </div>
        )}

        {!loading && reminders.length > 0 && (
          <div className="reminders-list">
            {reminders.map((reminder) => (
              <article key={reminder.id} className="reminder-card">
                <div className="reminder-card-main">
                  <div className="reminder-card-heading">
                    <span
                      className={`reminder-status reminder-status-${reminder.status}`}
                    >
                      {getStatusLabel(reminder.status)}
                    </span>

                    <span className="reminder-id">#{reminder.id}</span>
                  </div>

                  <h4>{reminder.message}</h4>

                  <div className="reminder-date">
                    <span>{t("Prévu le")} </span>

                    <strong>{formatDate(reminder.scheduledAt)}</strong>
                  </div>
                </div>

                {reminder.status === "pending" && reminder.jobId && (
                  <button
                    type="button"
                    className="reminder-cancel-button"
                    onClick={() => handleCancel(reminder.id)}
                    disabled={cancellingId === reminder.id}
                  >
                    {cancellingId === reminder.id
                      ? t("Annulation...")
                      : t("Annuler")}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
