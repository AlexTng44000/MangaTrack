import { ViewingLinks } from "../components/ViewingLinks";
import { t, genreLabel, useLanguage } from "../i18n";
import { WorkActions } from "../components/WorkActions";
import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  getCatalogDetails,
  getLibrary,
  updateResumePoint,
} from "../api/mangatrack.api";

import type { CatalogDetails, CatalogRelation } from "../types/catalog";

import type { LibraryEntry } from "../types/library";

function getRelationLabel(relationType: string): string {
  switch (relationType) {
    case "ADAPTATION":
      return "Adaptation";

    case "PREQUEL":
      return t("Préquelle");

    case "SEQUEL":
      return t("Suite");

    case "PARENT":
      return t("Œuvre principale");

    case "SIDE_STORY":
      return t("Histoire parallèle");

    case "SPIN_OFF":
      return "Spin-off";

    case "ALTERNATIVE":
      return t("Version alternative");

    case "SUMMARY":
      return t("Résumé");

    case "CHARACTER":
      return t("Personnages liés");

    case "SOURCE":
      return t("Œuvre source");

    case "COMPILATION":
      return "Compilation";

    case "CONTAINS":
      return t("Contient");

    case "OTHER":
      return t("Autre relation");

    default:
      return relationType.replaceAll("_", " ").toLowerCase();
  }
}

function isMangaAnimeRelation(
  workType: "anime" | "manga",
  relation: CatalogRelation,
): boolean {
  return relation.relationType === "ADAPTATION" && relation.type !== workType;
}

function getMediaStatusLabel(status: string | null): string {
  switch (status) {
    case "FINISHED":
      return t("Terminé");

    case "RELEASING":
      return t("En cours");

    case "NOT_YET_RELEASED":
      return t("À venir");

    case "CANCELLED":
      return t("Annulé");

    case "HIATUS":
      return t("En pause");

    default:
      return status ?? t("Inconnu");
  }
}

export function WorkDetailsPage() {
  useLanguage();
  const { id } = useParams();

  const workId = Number(id);

  const invalidWorkId = !Number.isInteger(workId) || workId < 1;

  const navigate = useNavigate();

  const [work, setWork] = useState<CatalogDetails | null>(null);

  const [loadedWorkId, setLoadedWorkId] = useState<number | null>(null);

  const [relatedLibrary, setRelatedLibrary] = useState<LibraryEntry[]>([]);
  const [libraryEntry, setLibraryEntry] = useState<LibraryEntry | null>(null);

  const [resumeChapterInputs, setResumeChapterInputs] = useState<
    Record<number, string>
  >({});

  const [savingResumeId, setSavingResumeId] = useState<number | null>(null);

  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  const [resumeError, setResumeError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invalidWorkId) {
      return;
    }

    let cancelled = false;

    Promise.all([getCatalogDetails(workId), getLibrary()])
      .then(([details, library]) => {
        if (cancelled) {
          return;
        }

        const entry =
          library.find((current) => current.catalogItemId === workId) ?? null;

        setWork(details);

        setLibraryEntry(entry);
        setRelatedLibrary(library);

        setError(null);

        setResumeMessage(null);

        setResumeError(null);

        if (entry?.resumeCatalogItemId != null && entry.resumeChapter != null) {
          setResumeChapterInputs({
            [entry.resumeCatalogItemId]: String(entry.resumeChapter),
          });
        } else {
          setResumeChapterInputs({});
        }

        setLoadedWorkId(workId);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setWork(null);

        setLibraryEntry(null);

        setError(t("Impossible de charger cette œuvre."));

        setLoadedWorkId(workId);
      });

    return () => {
      cancelled = true;
    };
  }, [workId, invalidWorkId]);

  async function saveResumePoint(relation: CatalogRelation) {
    if (!libraryEntry) {
      return;
    }

    const value = resumeChapterInputs[relation.id] ?? "";

    const chapter = Number(value);

    if (!Number.isInteger(chapter) || chapter < 1) {
      setResumeError(
        t("Le chapitre doit être un nombre entier supérieur à 0."),
      );

      setResumeMessage(null);

      return;
    }

    setSavingResumeId(relation.id);

    setResumeError(null);

    setResumeMessage(null);

    try {
      const updated = await updateResumePoint(
        libraryEntry.id,
        relation.id,
        chapter,
      );

      setLibraryEntry(updated);

      setResumeChapterInputs((current) => ({
        ...current,
        [relation.id]: String(chapter),
      }));

      setResumeMessage(
        t("Point de reprise enregistré : {title}, chapitre {chapter}.", {
          title: relation.title,
          chapter,
        }),
      );
    } catch (err) {
      setResumeError(
        err instanceof Error
          ? err.message
          : t("Impossible d’enregistrer le point de reprise."),
      );
    } finally {
      setSavingResumeId(null);
    }
  }

  async function clearResumePoint(relation: CatalogRelation) {
    if (!libraryEntry) {
      return;
    }

    setSavingResumeId(relation.id);

    setResumeError(null);

    setResumeMessage(null);

    try {
      const updated = await updateResumePoint(libraryEntry.id, null, null);

      setLibraryEntry(updated);

      setResumeChapterInputs((current) => ({
        ...current,
        [relation.id]: "",
      }));

      setResumeMessage(t("Point de reprise supprimé."));
    } catch (err) {
      setResumeError(
        err instanceof Error
          ? err.message
          : t("Impossible de supprimer le point de reprise."),
      );
    } finally {
      setSavingResumeId(null);
    }
  }

  if (invalidWorkId) {
    return <p>{t("Œuvre invalide.")} </p>;
  }

  if (loadedWorkId !== workId) {
    return <p>{t("Chargement...")} </p>;
  }

  if (error || !work) {
    return <p>{error ?? t("Œuvre introuvable.")}</p>;
  }

  const currentWork = work;

  const description = currentWork.description
    ?.replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const mangaAnimeRelations = currentWork.relations.filter((relation) =>
    isMangaAnimeRelation(currentWork.type, relation),
  );

  const otherRelations = currentWork.relations.filter(
    (relation) => !isMangaAnimeRelation(currentWork.type, relation),
  );

  function renderRelation(relation: CatalogRelation, highlighted = false) {
    const canSetResumePoint =
      highlighted &&
      currentWork.type === "anime" &&
      relation.type === "manga" &&
      libraryEntry !== null;

    const isCurrentResumePoint =
      libraryEntry?.resumeCatalogItemId === relation.id &&
      libraryEntry.resumeChapter != null;

    const relatedEntry = relatedLibrary.find(
      (entry) => entry.catalogItemId === relation.id,
    );
    const chapterInput = resumeChapterInputs[relation.id] ?? "";

    return (
      <article
        key={`${relation.relationType}-${relation.id}`}
        className={
          highlighted
            ? "relation-card relation-card-highlight"
            : "relation-card"
        }
      >
        {relation.imageUrl && (
          <img
            src={relation.imageUrl}
            alt={relation.title}
            className="relation-cover"
          />
        )}

        <div className="relation-content">
          <span className="media-type">{relation.type}</span>

          <h4>{relation.title}</h4>

          <p>{getRelationLabel(relation.relationType)}</p>

          {relation.format && <p>Format : {relation.format}</p>}

          {highlighted && (
            <p className="relation-adaptation">
              Adaptation {currentWork.type === "anime" ? "manga" : "anime"}
            </p>
          )}

          {highlighted && relatedEntry && (
            <div className="relation-follow-summary">
              <strong>
                {relation.type === "anime"
                  ? t("Anime suivi : épisode {number}", {
                      number: relatedEntry.progress,
                    })
                  : t("Manga suivi : chapitre {number}", {
                      number: relatedEntry.progress,
                    })}
              </strong>
              {relatedEntry.resumeCatalogItemId === currentWork.id &&
                relatedEntry.resumeChapter != null && (
                  <p>
                    {t(
                      "Ton point de reprise dans ce manga : chapitre {number}",
                      { number: relatedEntry.resumeChapter },
                    )}
                  </p>
                )}
            </div>
          )}
          {canSetResumePoint && (
            <div className="resume-point">
              <h5>{t("Point de reprise manga")} </h5>

              <p>
                {t(
                  "Indique manuellement le chapitre où reprendre après l’anime.",
                )}{" "}
              </p>

              {isCurrentResumePoint && (
                <p className="resume-current">
                  {t("Point actuel : chapitre")}{" "}
                  <strong>{libraryEntry.resumeChapter}</strong>
                </p>
              )}

              <div className="resume-point-form">
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder={t("Ex. 34")}
                  value={chapterInput}
                  onChange={(event) => {
                    setResumeChapterInputs((current) => ({
                      ...current,
                      [relation.id]: event.target.value,
                    }));

                    setResumeError(null);

                    setResumeMessage(null);
                  }}
                />

                <button
                  type="button"
                  disabled={savingResumeId === relation.id}
                  onClick={() => saveResumePoint(relation)}
                >
                  {savingResumeId === relation.id
                    ? t("Enregistrement...")
                    : isCurrentResumePoint
                      ? t("Modifier")
                      : t("Enregistrer")}
                </button>
              </div>

              {isCurrentResumePoint && (
                <button
                  type="button"
                  className="resume-delete"
                  disabled={savingResumeId === relation.id}
                  onClick={() => clearResumePoint(relation)}
                >
                  {t("Supprimer le point de reprise")}{" "}
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(`/catalog/${relation.id}`)}
          >
            {t("Voir la fiche")}{" "}
          </button>
        </div>
      </article>
    );
  }

  const progressPercent =
    libraryEntry && currentWork.total != null && currentWork.total > 0
      ? Math.min(
          100,
          Math.round((libraryEntry.progress / currentWork.total) * 100),
        )
      : null;

  return (
    <main className="work-details">
      <div className="work-details-toolbar">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          {t("← Retour")}{" "}
        </button>

        {libraryEntry && (
          <span className="library-presence">
            {t("✓ Dans ma bibliothèque")}{" "}
          </span>
        )}
      </div>

      <h1 className="work-page-title">{currentWork.title}</h1>
      <nav className="work-shortcuts" aria-label={t("Accès rapides à l’œuvre")}>
        <a href="#watch-links">
          {currentWork.type === "anime"
            ? t("Regarder les épisodes")
            : t("Lire / liens utiles")}{" "}
          ↗
        </a>
        {mangaAnimeRelations.length > 0 && (
          <a href="#adaptations">
            {currentWork.type === "manga"
              ? t("Voir l’anime et mon épisode suivi")
              : t("Reprendre dans le manga")}{" "}
            →
          </a>
        )}
        <a href="#work-tracking">{t("Mon suivi")}</a>
      </nav>
      {mangaAnimeRelations.length > 0 && (
        <section
          id="adaptations"
          className="relations-section adaptations-priority"
        >
          <div className="section-heading">
            <span className="page-eyebrow">{t("Continuer l’histoire")} </span>

            <h3>{t("Adaptation manga / anime")} </h3>

            <p>
              {t(
                "Passe facilement d’un support à l’autre et conserve ton point de reprise.",
              )}{" "}
            </p>
          </div>

          <div className="relations-grid">
            {mangaAnimeRelations.map((relation) =>
              renderRelation(relation, true),
            )}
          </div>
        </section>
      )}

      <ViewingLinks
        key={currentWork.id}
        work={currentWork}
        entry={libraryEntry}
        onChange={setLibraryEntry}
      />
      <section className="work-hero">
        <div className="work-poster-column">
          {currentWork.imageUrl ? (
            <img
              src={currentWork.imageUrl}
              alt={currentWork.title}
              className="work-cover"
            />
          ) : (
            <div className="work-cover-placeholder">{t("Aucune image")} </div>
          )}

          {libraryEntry && (
            <div className="work-library-progress">
              <div className="work-library-progress-heading">
                <span>{t("Ma progression")} </span>

                <strong>
                  {libraryEntry.progress}

                  {currentWork.total != null && ` / ${currentWork.total}`}
                </strong>
              </div>

              {progressPercent !== null && (
                <>
                  <div className="work-library-progress-track">
                    <div
                      className="work-library-progress-fill"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>

                  <small>
                    {progressPercent}
                    {t("% terminé")}{" "}
                  </small>
                </>
              )}
            </div>
          )}
        </div>

        <div className="work-hero-content">
          <div className="work-heading-meta">
            <span className="media-type">{currentWork.type}</span>

            {currentWork.seasonYear && (
              <span className="work-year">{currentWork.seasonYear}</span>
            )}
          </div>

          <h2>{currentWork.title}</h2>

          {currentWork.genres.length > 0 && (
            <div className="work-genres">
              {currentWork.genres.map((genre) => (
                <span key={genre}>{genreLabel(genre)}</span>
              ))}
            </div>
          )}

          <div className="work-meta-grid">
            <article className="work-meta-card">
              <span>
                {currentWork.type === "anime" ? t("Épisodes") : "Chapitres"}
              </span>

              <strong>{currentWork.total ?? "—"}</strong>
            </article>

            <article className="work-meta-card">
              <span>Format</span>

              <strong>{currentWork.format ?? "—"}</strong>
            </article>

            <article className="work-meta-card">
              <span>{t("Statut")} </span>

              <strong>{getMediaStatusLabel(currentWork.status)}</strong>
            </article>

            <article className="work-meta-card">
              <span>{t("Score AniList")} </span>

              <strong>
                {currentWork.averageScore !== null
                  ? `${currentWork.averageScore}/100`
                  : "—"}
              </strong>
            </article>
          </div>

          <section className="work-synopsis">
            <span className="page-eyebrow">{t("À propos")} </span>

            <h3>Synopsis</h3>

            <p className="work-description">
              {description ?? t("Aucun synopsis disponible.")}
            </p>
          </section>
        </div>
      </section>

      <div id="work-tracking">
        {" "}
        <WorkActions
          key={currentWork.id}
          work={currentWork}
          entry={libraryEntry}
          onChange={setLibraryEntry}
        />
      </div>
      {resumeMessage && <p className="success-message">{resumeMessage}</p>}

      {resumeError && <p className="error-message">{resumeError}</p>}

      {otherRelations.length > 0 && (
        <section className="relations-section">
          <div className="section-heading">
            <span className="page-eyebrow">{t("Univers")} </span>

            <h3>{t("Œuvres liées")} </h3>

            <p>
              {t(
                "Suites, préquelles, spin-off et autres œuvres associées.",
              )}{" "}
            </p>
          </div>

          <div className="relations-grid">
            {otherRelations.map((relation) => renderRelation(relation))}
          </div>
        </section>
      )}

      {currentWork.relations.length === 0 && (
        <section className="relations-section">
          <div className="section-heading">
            <span className="page-eyebrow">{t("Univers")} </span>

            <h3>{t("Œuvres liées")} </h3>
          </div>

          <div className="relations-empty">
            {t("Aucune œuvre liée disponible pour le moment.")}{" "}
          </div>
        </section>
      )}
    </main>
  );
}
