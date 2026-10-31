import { t, locale, useLanguage } from "../i18n";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { createReminder, getCalendarReleases } from "../api/mangatrack.api";

import type { CalendarRelease } from "../types/catalog";

function formatDay(date: Date): string {
  return date.toLocaleDateString(locale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(locale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayKey(value: string): string {
  const date = new Date(value);

  return [date.getFullYear(), date.getMonth(), date.getDate()].join("-");
}

function getReleaseKey(release: CalendarRelease): string {
  return [release.mediaId, release.episode, release.airingAt].join("-");
}

function getFormatLabel(format: string | null): string {
  switch (format) {
    case "TV":
      return "TV";

    case "TV_SHORT":
      return t("Format court");

    case "MOVIE":
      return t("Film");

    case "SPECIAL":
      return t("Spécial");

    case "OVA":
      return "OVA";

    case "ONA":
      return "ONA";

    case "MUSIC":
      return t("Musique");

    default:
      return format ?? "Anime";
  }
}

export function CalendarPage() {
  useLanguage();
  const navigate = useNavigate();

  const [releases, setReleases] = useState<CalendarRelease[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [reminderKey, setReminderKey] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCalendarReleases()
      .then((data) => {
        if (!cancelled) {
          setReleases(data);
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

  async function handleReminder(release: CalendarRelease) {
    setError(null);

    setSuccess(null);

    const releaseKey = getReleaseKey(release);

    setReminderKey(releaseKey);

    try {
      await createReminder({
        catalogItemId: release.mediaId,
        message: t("{title} - épisode {episode}", {
          title: release.title,
          episode: release.episode,
        }),

        scheduledAt: release.airingAt,
      });

      setSuccess(
        t("Rappel créé pour {title} - épisode {episode}.", {
          title: release.title,
          episode: release.episode,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur inconnue"));
    } finally {
      setReminderKey(null);
    }
  }

  const grouped = releases.reduce<Record<string, CalendarRelease[]>>(
    (result, release) => {
      const key = getDayKey(release.airingAt);

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push(release);

      return result;
    },
    {},
  );

  const groupedEntries = Object.entries(grouped);

  if (loading) {
    return (
      <main className="calendar-page">
        <section className="calendar-heading">
          <div>
            <span className="page-eyebrow">{t("Planning")} </span>

            <h2>{t("Calendrier des sorties")} </h2>

            <p>{t("Chargement des prochaines sorties...")} </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="calendar-page">
      <section className="calendar-heading">
        <div>
          <span className="page-eyebrow">{t("Planning")} </span>

          <h2>{t("Calendrier des sorties")} </h2>

          <p>
            {t(
              "Les prochains épisodes référencés par AniList sur les 7 prochains jours.",
            )}{" "}
          </p>
        </div>

        <div className="calendar-summary">
          <article className="calendar-summary-card">
            <strong>{releases.length}</strong>

            <span>
              {t("sortie")} {releases.length > 1 ? "s" : ""}
            </span>
          </article>

          <article className="calendar-summary-card">
            <strong>{groupedEntries.length}</strong>

            <span>
              {t("jour")} {groupedEntries.length > 1 ? "s" : ""}
            </span>
          </article>
        </div>
      </section>

      {success && <p className="success-message">{t(success)}</p>}

      {error && <p className="error-message">{t(error)}</p>}

      {releases.length === 0 ? (
        <section className="calendar-empty">
          <span>{t("Aucun épisode prévu")} </span>

          <h3>{t("Rien à signaler cette semaine")} </h3>

          <p>
            {t(
              "AniList ne référence aucune sortie d’anime pour les 7 prochains jours.",
            )}{" "}
          </p>
        </section>
      ) : (
        <div className="calendar-days">
          {groupedEntries.map(([key, dayReleases]) => {
            const date = new Date(dayReleases[0].airingAt);

            return (
              <section key={key} className="calendar-day">
                <div className="calendar-day-header">
                  <div>
                    <span className="calendar-day-label">
                      {t("Sorties du jour")}{" "}
                    </span>

                    <h3>{formatDay(date)}</h3>
                  </div>

                  <span className="calendar-day-count">
                    {dayReleases.length} {t("épisode")}{" "}
                    {dayReleases.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="calendar-releases">
                  {dayReleases.map((release) => {
                    const releaseKey = getReleaseKey(release);

                    const releaseDate = new Date(release.airingAt);

                    return (
                      <article key={releaseKey} className="calendar-card">
                        {release.imageUrl ? (
                          <img src={release.imageUrl} alt={release.title} />
                        ) : (
                          <div className="calendar-card-image-placeholder">
                            Anime
                          </div>
                        )}

                        <div className="calendar-card-content">
                          <div className="calendar-card-top">
                            <span className="calendar-episode-badge">
                              {t("Épisode")} {release.episode}
                            </span>

                            <span className="calendar-format-badge">
                              {getFormatLabel(release.format)}
                            </span>
                          </div>

                          <h4>{release.title}</h4>

                          <div className="calendar-release-meta">
                            <span>{t("Diffusion")} </span>

                            <time dateTime={release.airingAt}>
                              {formatTime(releaseDate)}
                            </time>
                          </div>

                          <div className="calendar-actions">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/catalog/${release.mediaId}`)
                              }
                            >
                              {t("Voir la fiche")}{" "}
                            </button>

                            <button
                              type="button"
                              className="calendar-reminder-button"
                              disabled={reminderKey === releaseKey}
                              onClick={() => handleReminder(release)}
                            >
                              {reminderKey === releaseKey
                                ? t("Création...")
                                : t("Créer un rappel")}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
