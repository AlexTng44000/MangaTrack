import { useState } from "react";
import { updateProgress } from "../api/mangatrack.api";
import { t, useLanguage } from "../i18n";
import type { CatalogDetails } from "../types/catalog";
import type { LibraryEntry } from "../types/library";

function safeUrl(value: string) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// Never infer an episode number from array order: providers may omit or reorder episodes.
function episodeNumber(title: string): number | null {
  const match = title.match(
    /^(?:episode|épisode|ep\.)\s*#?\s*(\d+)(?![\d.a-z]|\s*[-–]\s*\d)/i,
  );
  const number = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function ViewingLinks({
  work,
  entry,
  onChange,
}: {
  work: CatalogDetails;
  entry: LibraryEntry | null;
  onChange: (entry: LibraryEntry) => void;
}) {
  useLanguage();
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const episodes = (work.streamingEpisodes ?? [])
    .filter((episode) => safeUrl(episode.url))
    .map((episode) => {
      const number = episodeNumber(episode.title);
      return {
        ...episode,
        number:
          number != null && (work.total == null || number <= work.total)
            ? number
            : null,
      };
    });
  const links = Array.from(
    new Map(
      (work.externalLinks ?? [])
        .filter(
          (link) =>
            !link.isDisabled &&
            safeUrl(link.url) &&
            (link.type === "STREAMING" ||
              (work.type === "manga" && link.type === "INFO")),
        )
        .map((link) => [link.url, link]),
    ).values(),
  );
  const next = entry
    ? episodes.find((episode) => episode.number === entry.progress + 1)
    : undefined;
  async function markSeen(number: number) {
    if (!entry) return;
    setBusy(true);
    setError("");
    try {
      onChange(await updateProgress(entry.id, number));
    } catch {
      setError(t("Impossible de modifier la progression"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="watch-links" className="watch-section viewing-links">
      <div className="section-heading">
        <span className="page-eyebrow">{t("Accès direct")}</span>
        <h3>{work.type === "anime" ? t("Où regarder ?") : t("Où lire ?")}</h3>
        <p>{t("Liens externes référencés par AniList pour cette œuvre.")}</p>
      </div>
      {entry && work.type === "anime" && (
        <div className="next-episode-panel">
          <strong>
            {t("Épisodes vus : {count}", { count: entry.progress })}
          </strong>
          {next ? (
            <a
              className="watch-primary-link"
              href={next.url}
              target="_blank"
              rel="noreferrer"
            >
              {t("Regarder l’épisode {number}", { number: next.number! })} ·{" "}
              {next.site} ↗
            </a>
          ) : (
            <p>
              {t("Choisis un lien ci-dessous pour continuer ton visionnage.")}
            </p>
          )}
          {next && (
            <button
              type="button"
              disabled={busy}
              onClick={() => markSeen(next.number!)}
            >
              {t("Vu jusqu’à l’épisode {number}", { number: next.number! })}
            </button>
          )}
        </div>
      )}
      <div className="platform-links">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="platform-link watch-primary-link"
          >
            {link.icon && safeUrl(link.icon) && (
              <img src={link.icon} alt="" className="platform-icon" />
            )}
            <span>{link.site}</span>
            <strong>
              {work.type === "anime"
                ? t("Regarder ↗")
                : t("Ouvrir le lien ↗")}
            </strong>
          </a>
        ))}
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {work.type === "anime" && episodes.length > 0 && (
        <>
          <div className="streaming-heading">
            <h4>{t("Épisodes disponibles")}</h4>
            <span>
              {episodes.length}{" "}
              {t(episodes.length > 1 ? "épisodes" : "épisode")}
            </span>
          </div>
          <div className="streaming-grid">
            {(showAll ? episodes : episodes.slice(0, 12)).map((episode) => {
              const seen =
                episode.number != null &&
                entry != null &&
                episode.number <= entry.progress;
              return (
                <article
                  key={episode.url}
                  className={`episode-watch-card ${seen ? "episode-watch-card-seen" : ""}`}
                >
                  <a
                    href={episode.url}
                    target="_blank"
                    rel="noreferrer"
                    className="streaming-card"
                  >
                    {episode.thumbnail && safeUrl(episode.thumbnail) && (
                      <img
                        src={episode.thumbnail}
                        alt=""
                        className="streaming-thumbnail"
                      />
                    )}
                    <strong>{episode.title || t("Lien vers l’épisode")}</strong>
                    <small>{episode.site} ↗</small>
                  </a>
                  {seen ? (
                    <span className="episode-seen">✓ {t("Vu")}</span>
                  ) : (
                    entry &&
                    episode.number != null && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => markSeen(episode.number!)}
                      >
                        {t("Vu jusqu’à l’épisode {number}", {
                          number: episode.number,
                        })}
                      </button>
                    )
                  )}
                </article>
              );
            })}
          </div>
          {episodes.length > 12 && (
            <button
              type="button"
              className="streaming-toggle"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll
                ? t("Afficher moins")
                : t("Afficher les {count} épisodes", {
                    count: episodes.length,
                  })}
            </button>
          )}
        </>
      )}
      {links.length === 0 && episodes.length === 0 && (
        <p>{t("Aucune plateforme renseignée")}</p>
      )}
      {work.type === "anime" && (
        <p className="viewing-sync-note">
          {t(
            "Ouvrir un lien ne marque pas un épisode comme vu. Confirme ton visionnage ici pour mettre à jour ton suivi ; les plateformes externes ne nous transmettent pas leur historique.",
          )}
        </p>
      )}
    </section>
  );
}
