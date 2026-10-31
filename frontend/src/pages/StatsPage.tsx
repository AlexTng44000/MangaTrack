import { t, useLanguage } from "../i18n";
import { useEffect, useState } from "react";

import { getCatalogByIds, getLibrary } from "../api/mangatrack.api";

import type { CatalogItem } from "../types/catalog";

import type { LibraryEntry, LibraryStats } from "../types/library";

function calculateStats(
  library: LibraryEntry[],
  catalog: CatalogItem[],
): LibraryStats {
  const ratedEntries = library.filter((entry) => entry.rating !== null);

  const averageRating =
    ratedEntries.length > 0
      ? ratedEntries.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) /
        ratedEntries.length
      : null;

  let animeCount = 0;
  let animeProgress = 0;

  let mangaCount = 0;
  let mangaProgress = 0;

  for (const entry of library) {
    const work = catalog.find((item) => item.id === entry.catalogItemId);

    if (!work) {
      continue;
    }

    if (work.type === "anime") {
      animeCount += 1;
      animeProgress += entry.progress;
    }

    if (work.type === "manga") {
      mangaCount += 1;
      mangaProgress += entry.progress;
    }
  }

  return {
    totalWorks: library.length,

    favorites: library.filter((entry) => entry.isFavorite).length,

    ratedWorks: ratedEntries.length,

    averageRating,

    statuses: {
      aCommencer: library.filter((entry) => entry.status === "a_commencer")
        .length,

      enCours: library.filter((entry) => entry.status === "en_cours").length,

      termine: library.filter((entry) => entry.status === "termine").length,

      abandonne: library.filter((entry) => entry.status === "abandonne").length,
    },

    anime: {
      count: animeCount,

      progress: animeProgress,
    },

    manga: {
      count: mangaCount,

      progress: mangaProgress,
    },
  };
}

function getPercentage(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function StatsPage() {
  useLanguage();
  const [stats, setStats] = useState<LibraryStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const library = await getLibrary();

        const ids = library.map((entry) => entry.catalogItemId);

        const catalog = await getCatalogByIds(ids);

        const calculated = calculateStats(library, catalog);

        if (!cancelled) {
          setStats(calculated);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : t("Impossible de charger les statistiques"),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="stats-page">
        <section className="stats-heading">
          <div>
            <span className="page-eyebrow">{t("Activité")} </span>

            <h2>{t("Mes statistiques")} </h2>

            <p>{t("Chargement de tes données...")} </p>
          </div>
        </section>
      </main>
    );
  }

  if (error || !stats) {
    return (
      <main className="stats-page">
        <section className="stats-heading">
          <div>
            <span className="page-eyebrow">{t("Activité")} </span>

            <h2>{t("Mes statistiques")} </h2>
          </div>
        </section>

        <p className="error-message">
          {error ?? t("Impossible de charger les statistiques.")}
        </p>
      </main>
    );
  }

  const statusItems = [
    {
      label: t("À commencer"),
      value: stats.statuses.aCommencer,
      className: "status-a_commencer",
    },
    {
      label: t("En cours"),
      value: stats.statuses.enCours,
      className: "status-en_cours",
    },
    {
      label: t("Terminées"),
      value: stats.statuses.termine,
      className: "status-termine",
    },
    {
      label: t("Abandonnées"),
      value: stats.statuses.abandonne,
      className: "status-abandonne",
    },
  ];

  return (
    <main className="stats-page">
      <section className="stats-heading">
        <div>
          <span className="page-eyebrow">{t("Activité")} </span>

          <h2>{t("Mes statistiques")} </h2>

          <p>
            {t(
              "Un aperçu de ta bibliothèque, de ta progression et de tes habitudes de suivi.",
            )}{" "}
          </p>
        </div>

        <div className="stats-main-score">
          <span>{t("Note moyenne")} </span>

          <strong>
            {stats.averageRating === null
              ? "—"
              : stats.averageRating.toFixed(1)}
          </strong>

          <small>/ 10</small>
        </div>
      </section>

      <section className="stats-overview-grid">
        <article className="stats-overview-card">
          <span className="stats-card-label">{t("Œuvres suivies")} </span>

          <strong>{stats.totalWorks}</strong>

          <small>{t("dans ta bibliothèque")} </small>
        </article>

        <article className="stats-overview-card">
          <span className="stats-card-label">{t("Favoris")} </span>

          <strong>{stats.favorites}</strong>

          <small>
            {t(stats.favorites > 1 ? "œuvres favorites" : "œuvre favorite")}
          </small>
        </article>

        <article className="stats-overview-card">
          <span className="stats-card-label">{t("Œuvres notées")} </span>

          <strong>{stats.ratedWorks}</strong>

          <small>
            {t("sur")} {stats.totalWorks}
          </small>
        </article>

        <article className="stats-overview-card stats-overview-card-accent">
          <span className="stats-card-label">{t("Progression totale")} </span>

          <strong>{stats.anime.progress + stats.manga.progress}</strong>

          <small>{t("épisodes + chapitres")} </small>
        </article>
      </section>

      <section className="stats-content-grid">
        <article className="stats-panel">
          <div className="section-heading">
            <span className="page-eyebrow">{t("Consommation")} </span>

            <h3>{t("Progression")} </h3>

            <p>{t("Ce que tu as déjà vu ou lu.")} </p>
          </div>

          <div className="stats-media-grid">
            <article className="stats-media-card">
              <span className="media-type">Anime</span>

              <strong>{stats.anime.count}</strong>

              <small>
                {t(stats.anime.count > 1 ? "animes suivis" : "anime suivi")}
              </small>

              <div className="stats-media-progress">
                <span>{t("Épisodes vus")} </span>

                <strong>{stats.anime.progress}</strong>
              </div>
            </article>

            <article className="stats-media-card">
              <span className="media-type">Manga</span>

              <strong>{stats.manga.count}</strong>

              <small>
                {t(stats.manga.count > 1 ? "mangas suivis" : "manga suivi")}
              </small>

              <div className="stats-media-progress">
                <span>{t("Chapitres lus")} </span>

                <strong>{stats.manga.progress}</strong>
              </div>
            </article>
          </div>
        </article>

        <article className="stats-panel">
          <div className="section-heading">
            <span className="page-eyebrow">Organisation</span>

            <h3>{t("Répartition par statut")} </h3>

            <p>{t("La composition actuelle de ta bibliothèque.")} </p>
          </div>

          <div className="stats-status-list">
            {statusItems.map((item) => {
              const percentage = getPercentage(item.value, stats.totalWorks);

              return (
                <div key={item.label} className="stats-status-row">
                  <div className="stats-status-heading">
                    <span className={`status-badge ${item.className}`}>
                      {item.label}
                    </span>

                    <strong>
                      {item.value}{" "}
                      <small>
                        ({percentage}
                        %)
                      </small>
                    </strong>
                  </div>

                  <div className="stats-status-track">
                    <div
                      className={`stats-status-fill ${item.className}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}
