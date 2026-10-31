import { t, locale, useLanguage } from "../i18n";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import {
  addToLibrary,
  cancelReminder,
  createReminder,
  deleteLibraryEntry,
  getReminders,
  updateLibraryFavorite,
  updateLibraryRating,
  updateLibraryStatus,
  updateProgress,
} from "../api/mangatrack.api";
import type { Reminder } from "../api/mangatrack.api";
import type { CatalogDetails } from "../types/catalog";
import type { LibraryEntry, LibraryStatus } from "../types/library";

export function WorkActions({
  work,
  entry,
  onChange,
}: {
  work: CatalogDetails;
  entry: LibraryEntry | null;
  onChange: (entry: LibraryEntry | null) => void;
}) {
  useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progress, setProgress] = useState(String(entry?.progress ?? 0));
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderError, setReminderError] = useState("");
  const [remindersLoading, setRemindersLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getReminders()
      .then((items) => {
        if (active)
          setReminders(items.filter((item) => item.catalogItemId === work.id));
      })
      .catch(() => {
        if (active) setReminderError(t("Impossible de charger les rappels."));
      })
      .finally(() => {
        if (active) setRemindersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [work.id]);

  async function save(action: () => Promise<LibraryEntry | null>) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const updated = await action();
      onChange(updated);
      setProgress(String(updated?.progress ?? 0));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("Impossible d’enregistrer les modifications."),
      );
    } finally {
      setBusy(false);
    }
  }
  async function schedule(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const scheduled = new Date(date);
    if (
      !Number.isFinite(scheduled.getTime()) ||
      scheduled.getTime() <= Date.now()
    ) {
      setError(t("Choisis une date et une heure dans le futur."));
      return;
    }
    setBusy(true);
    try {
      const reminder = await createReminder({
        catalogItemId: work.id,
        message: `${work.title.slice(0, 160)} — ${message.trim()}`,
        scheduledAt: scheduled.toISOString(),
      });
      setReminders((items) => [reminder, ...items]);
      setMessage("");
      setDate("");
      setSuccess(t("Rappel programmé avec succès."));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("Impossible de programmer le rappel."),
      );
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id: number) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const updated = await cancelReminder(id);
      setReminders((items) =>
        items.map((item) => (item.id === id ? updated : item)),
      );
      setSuccess(t("Rappel annulé."));
    } catch {
      setError(t("Impossible d’annuler le rappel."));
    } finally {
      setBusy(false);
    }
  }
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  // Calendar days, rather than elapsed 24-hour periods, avoid DST rounding errors.
  const days = target
    ? Math.round(
        (Date.parse(`${target}T00:00:00Z`) -
          Date.parse(`${todayValue}T00:00:00Z`)) /
          86400000,
      ) + 1
    : 0;
  const remaining =
    entry && work.total != null
      ? Math.max(0, work.total - entry.progress)
      : null;
  const unit = work.type === "anime" ? t("épisodes") : t("chapitres");
  const statusLabels = {
    pending: t("En attente"),
    sent: t("Envoyé"),
    failed: t("Échec"),
    cancelled: t("Annulé"),
  };

  return (
    <section className="work-actions" aria-label={t("Mon suivi")}>
      <div className="section-heading">
        <span className="page-eyebrow">{t("À ton rythme")}</span>
        <h2>{t("Mon suivi")}</h2>
        <p>
          {t("Ta progression, ton objectif et tes rappels pour cette œuvre.")}
        </p>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {t(error)}
        </p>
      )}
      {success && (
        <p className="success-message" role="status">
          {t(success)}
        </p>
      )}
      <div className="work-tools-grid">
        <section className="work-tool">
          <h3>{t("Ma bibliothèque")}</h3>
          {!entry ? (
            <>
              <p>
                {t(
                  "Ajoute cette œuvre pour suivre ta progression et préparer ton rattrapage.",
                )}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => save(() => addToLibrary(work.id))}
              >
                {t("+ Suivre cette œuvre")}
              </button>
            </>
          ) : (
            <>
              <label>
                {t("Statut")}
                <select
                  value={entry.status}
                  disabled={busy}
                  onChange={(event) =>
                    save(() =>
                      updateLibraryStatus(
                        entry.id,
                        event.target.value as LibraryStatus,
                      ),
                    )
                  }
                >
                  <option value="a_commencer">{t("À commencer")}</option>
                  <option value="en_cours">{t("En cours")}</option>
                  <option value="termine">{t("Terminé")}</option>
                  <option value="abandonne">{t("Abandonné")}</option>
                </select>
              </label>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = Number(progress);
                  if (
                    progress.trim() === "" ||
                    !Number.isInteger(value) ||
                    value < 0 ||
                    (work.total != null && value > work.total)
                  ) {
                    setError(
                      t(
                        "La progression doit être un entier compris entre zéro et le total.",
                      ),
                    );
                    return;
                  }
                  void save(() => updateProgress(entry.id, value));
                }}
              >
                <label>
                  {t("Progression")}
                  <input
                    type="number"
                    min="0"
                    max={work.total ?? undefined}
                    step="1"
                    required
                    value={progress}
                    onChange={(event) => setProgress(event.target.value)}
                  />
                </label>
                <button disabled={busy} type="submit">
                  {t("Enregistrer")}
                </button>
              </form>
              <label>
                {t("Ma note")}
                <select
                  value={entry.rating ?? ""}
                  disabled={busy}
                  onChange={(event) =>
                    save(() =>
                      updateLibraryRating(
                        entry.id,
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      ),
                    )
                  }
                >
                  <option value="">{t("Non noté")}</option>
                  {Array.from({ length: 11 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}/10
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={busy}
                aria-pressed={entry.isFavorite}
                onClick={() =>
                  save(() => updateLibraryFavorite(entry.id, !entry.isFavorite))
                }
              >
                {entry.isFavorite
                  ? t("♥ Retirer des favoris")
                  : t("♡ Ajouter aux favoris")}
              </button>
              <button
                type="button"
                className="danger-action"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      t(
                        "Retirer cette œuvre de ta bibliothèque ? Ta progression et ta note seront supprimées.",
                      ),
                    )
                  )
                    void save(async () => {
                      await deleteLibraryEntry(entry.id);
                      return null;
                    });
                }}
              >
                {t("Retirer de ma bibliothèque")}
              </button>
            </>
          )}
        </section>
        <section className="work-tool">
          <h3>{t("Plan de rattrapage")}</h3>
          {!entry ? (
            <p>
              {t(
                "Ajoute cette œuvre à ta bibliothèque pour calculer ton rythme.",
              )}
            </p>
          ) : work.total == null ? (
            <p>
              {t(
                "Le nombre total d’épisodes ou de chapitres est inconnu pour cette œuvre.",
              )}
            </p>
          ) : (
            <>
              <p>
                {remaining} {unit} {t("à terminer")}
              </p>
              <label>
                {t("Date cible")}
                <input
                  type="date"
                  min={todayValue}
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                />
              </label>
              {target && days <= 0 && (
                <p role="alert">
                  {t("La date cible doit être aujourd’hui ou dans le futur.")}
                </p>
              )}
              {days > 0 && remaining != null && (
                <div className="catchup-result" role="status">
                  {remaining === 0 ? (
                    <strong>{t("Tu es déjà à jour !")}</strong>
                  ) : (
                    <>
                      <strong>
                        {Math.ceil(remaining / days)} {unit} {t("/ jour")}
                      </strong>
                      <span>
                        {Math.min(remaining, Math.ceil((remaining / days) * 7))}{" "}
                        {unit} {t("/ semaine")}
                      </span>
                      <span>
                        {days}{" "}
                        {t(
                          days === 1 ? "jour disponible" : "jours disponibles",
                        )}
                      </span>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>
        <section className="work-tool work-reminders">
          <h3>{t("Mes rappels pour cette œuvre")}</h3>
          <p>{t("Choisis quand reprendre ta lecture ou ton visionnage.")}</p>
          <form onSubmit={schedule}>
            <label>
              Message
              <textarea
                required
                maxLength={300}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("Par exemple : reprendre le prochain épisode")}
              />
            </label>
            <label>
              {t("Date et heure")}
              <input
                required
                type="datetime-local"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? t("Programmation...") : t("Programmer le rappel")}
            </button>
          </form>
          {remindersLoading && (
            <p role="status">{t("Chargement des rappels...")}</p>
          )}
          {reminderError && <p role="alert">{reminderError}</p>}
          {!remindersLoading && !reminderError && reminders.length === 0 && (
            <p>{t("Aucun rappel pour cette œuvre.")}</p>
          )}
          <Link className="action-link" to="/reminders">
            {t("Tous mes rappels")}
          </Link>
          <ul className="work-reminder-list">
            {reminders.map((reminder) => (
              <li key={reminder.id}>
                <div>
                  <strong>{reminder.message}</strong>
                  <span>
                    {statusLabels[reminder.status]} ·{" "}
                    {reminder.scheduledAt
                      ? new Date(reminder.scheduledAt).toLocaleString(
                          locale(),
                          { dateStyle: "medium", timeStyle: "short" },
                        )
                      : t("Immédiat")}
                  </span>
                </div>
                {reminder.status === "pending" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => cancel(reminder.id)}
                  >
                    {t("Annuler")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
