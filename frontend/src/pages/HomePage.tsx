import { RemoveLibraryButton } from "../components/RemoveLibraryButton";
import { t, genreLabel, useLanguage } from "../i18n";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  addToLibrary,
  getCatalog,
  getCatalogByIds,
  getLibrary,
  updateLibraryFavorite,
} from "../api/mangatrack.api";
import type { CatalogSort } from "../api/mangatrack.api";
import type { CatalogItem } from "../types/catalog";
import type { LibraryEntry, LibraryStatus } from "../types/library";

const genres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
];

export function HomePage() {
  useLanguage();
  const statuses: Record<LibraryStatus, string> = {
    a_commencer: t("À commencer"),
    en_cours: t("En cours"),
    termine: t("Terminé"),
    abandonne: t("Abandonné"),
  };
  const generation = useRef(0);
  const filterSentinel = useRef<HTMLDivElement>(null);
  const filterPanel = useRef<HTMLElement>(null);
  const [filterReservedSpace, setFilterReservedSpace] = useState(0);
  const [filtersPinned, setFiltersPinned] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  useEffect(() => {
    const sentinel = filterSentinel.current;
    const panel = filterPanel.current;
    if (!sentinel || !panel) return;
    let pinned = false;
    let fullHeight = panel.offsetHeight;
    const resizeObserver = new ResizeObserver(() => {
      if (!pinned) fullHeight = panel.offsetHeight;
      setFilterReservedSpace(
        pinned ? Math.max(0, fullHeight - panel.offsetHeight) : 0,
      );
    });
    resizeObserver.observe(panel);
    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting && entry.boundingClientRect.top < 12;
        if (next === pinned) return;
        pinned = next;
        // Preserve document height while collapsing. Otherwise short result lists
        // clamp the scroll position and repeatedly pin/unpin the controls.
        setFilterReservedSpace(next ? fullHeight : 0);
        setFiltersPinned(next);
      },
      { rootMargin: "-12px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);
  const [params, setParams] = useSearchParams();
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<number | null>(null);
  const scope = params.get("scope") === "library" ? "library" : "all";
  const query = params.get("q") ?? "";
  const type = params.get("type") ?? "";
  const genre = params.get("genre") ?? "";
  const status = params.get("status") ?? "";
  const favorite = params.get("favorite") === "1";
  const rawSort = params.get("sort") ?? "popularity";
  const sort: CatalogSort = [
    "popularity",
    "trending",
    "score",
    "recent",
    "title",
  ].includes(rawSort)
    ? (rawSort as CatalogSort)
    : "popularity";
  const mediaType = type === "anime" || type === "manga" ? type : undefined;
  const libraryMode = scope === "library" || Boolean(status) || favorite;

  useEffect(() => {
    let active = true;
    generation.current += 1;
    async function load() {
      setLoading(true);
      setError("");
      setPage(1);
      setItems([]);
      setMore(false);
      try {
        const entries = await getLibrary();
        const result = libraryMode
          ? {
              items: await getCatalogByIds(
                entries.map((entry) => entry.catalogItemId),
              ),
              hasNextPage: false,
            }
          : await getCatalog(query, 1, mediaType, genre || undefined, sort);
        if (active) {
          setLibrary(entries);
          setItems(result.items);
          setMore(result.hasNextPage);
        }
      } catch {
        if (active)
          setError(
            t("Impossible de charger les œuvres. Réessaie dans un instant."),
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [query, mediaType, genre, sort, libraryMode]);

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "scope" && value === "all") {
      next.delete("status");
      next.delete("favorite");
    }
    if (key === "status" || key === "favorite") next.set("scope", "library");
    setParams(next);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    filter(
      "q",
      String(new FormData(event.currentTarget).get("q") ?? "").trim(),
    );
  }
  async function loadMore() {
    const currentGeneration = generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await getCatalog(
        query,
        page + 1,
        mediaType,
        genre || undefined,
        sort,
      );
      if (currentGeneration !== generation.current) return;
      setItems((current) => [
        ...current,
        ...result.items.filter(
          (item) => !current.some((existing) => existing.id === item.id),
        ),
      ]);
      setPage(page + 1);
      setMore(result.hasNextPage);
    } catch {
      if (currentGeneration === generation.current)
        setError(
          t("Impossible de charger les œuvres. Réessaie dans un instant."),
        );
    } finally {
      if (currentGeneration === generation.current) setLoading(false);
    }
  }
  async function add(item: CatalogItem) {
    setBusy(item.id);
    setError("");
    try {
      const entry: LibraryEntry = await addToLibrary(item.id);
      setLibrary((current) => [...current, entry]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("Impossible d’ajouter cette œuvre."),
      );
    } finally {
      setBusy(null);
    }
  }
  async function toggleFavorite(entry: LibraryEntry) {
    setBusy(entry.catalogItemId);
    setError("");
    try {
      const updated = await updateLibraryFavorite(entry.id, !entry.isFavorite);
      setLibrary((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      setError(t("Impossible de modifier le favori."));
    } finally {
      setBusy(null);
    }
  }
  const visible = items.filter((item) => {
    const entry = library.find((entry) => entry.catalogItemId === item.id);
    return (
      (!libraryMode || Boolean(entry)) &&
      (!libraryMode ||
        !query ||
        item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())) &&
      (!mediaType || item.type === mediaType) &&
      (!genre || item.genres.includes(genre)) &&
      (!status || entry?.status === status) &&
      (!favorite || entry?.isFavorite)
    );
  });
  if (libraryMode)
    visible.sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : library.findIndex((entry) => entry.catalogItemId === a.id) -
          library.findIndex((entry) => entry.catalogItemId === b.id),
    );

  return (
    <main className="home-page">
      <section className="home-heading">
        <div>
          <span className="page-eyebrow">{t("Ton prochain chapitre")}</span>
          <h1>{t("Découvre. Suis. Reprends.")}</h1>
          <p>{t("Tes mangas et anime, réunis au même endroit.")}</p>
        </div>
        <span className="home-library-count">
          <strong>{library.length}</strong> {t("dans ta bibliothèque")}
        </span>
      </section>
      <div
        ref={filterSentinel}
        className="filter-sentinel"
        aria-hidden="true"
      />
      <section
        ref={filterPanel}
        className={`home-filters ${filtersPinned ? "home-filters-pinned" : ""} ${filtersExpanded ? "home-filters-expanded" : ""}`}
        aria-label={t("Filtres des œuvres")}
      >
        {filtersPinned && (
          <div className="filter-pin-toolbar">
            <strong>{t("Filtres")}</strong>
            <button
              type="button"
              aria-expanded={filtersExpanded}
              aria-controls="home-filter-controls"
              onClick={() => setFiltersExpanded((current) => !current)}
            >
              {filtersExpanded
                ? t("Réduire les filtres")
                : t("Modifier les filtres")}
            </button>
          </div>
        )}
        <div id="home-filter-controls" className="home-filter-controls">
          <div className="scope-tabs" aria-label="Collection">
            <button
              type="button"
              aria-pressed={!libraryMode}
              onClick={() => filter("scope", "all")}
            >
              {t("Tout explorer")}
            </button>
            <button
              type="button"
              aria-pressed={libraryMode}
              onClick={() => filter("scope", "library")}
            >
              {t("Ma bibliothèque")}
            </button>
          </div>
          <form onSubmit={submit} className="home-search">
            <label htmlFor="home-query" className="sr-only">
              {t("Rechercher un titre")}
            </label>
            <input
              id="home-query"
              type="search"
              name="q"
              key={query}
              defaultValue={query}
              placeholder={t("Rechercher un manga ou un anime…")}
            />
            <button type="submit">{t("Rechercher")}</button>
          </form>
          <div className="home-filter-grid">
            <label>
              Type
              <select
                value={type}
                onChange={(event) => filter("type", event.target.value)}
              >
                <option value="">{t("Tous les types")}</option>
                <option value="anime">Anime</option>
                <option value="manga">Manga</option>
              </select>
            </label>
            <label>
              {t("Genre")}
              <select
                value={genre}
                onChange={(event) => filter("genre", event.target.value)}
              >
                <option value="">{t("Tous les genres")}</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genreLabel(genre)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Statut")}
              <select
                value={status}
                onChange={(event) => filter("status", event.target.value)}
              >
                <option value="">{t("Tous les statuts")}</option>
                {Object.entries(statuses).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Trier par")}
              <select
                value={libraryMode && sort !== "title" ? "popularity" : sort}
                onChange={(event) => filter("sort", event.target.value)}
              >
                <option value="popularity">
                  {libraryMode ? t("Derniers ajouts") : t("Popularité")}
                </option>
                {!libraryMode && (
                  <>
                    <option value="trending">{t("Tendances du moment")}</option>
                    <option value="score">{t("Meilleures notes")}</option>
                    <option value="recent">{t("Plus récents")}</option>
                  </>
                )}
                <option value="title">{t("Titre A-Z")}</option>
              </select>
            </label>
          </div>
          <div className="home-filter-footer">
            <button
              type="button"
              aria-pressed={favorite}
              onClick={() => filter("favorite", favorite ? "" : "1")}
            >
              {t("♥ Favoris")}
            </button>
            <button
              type="button"
              onClick={() => {
                setParams({});
              }}
            >
              {t("Réinitialiser les filtres")}
            </button>
            <span role="status">
              {t(
                visible.length === 1
                  ? "{count} œuvre affichée"
                  : "{count} œuvres affichées",
                { count: visible.length },
              )}
            </span>
          </div>
        </div>
      </section>
      <div aria-hidden="true" style={{ height: filterReservedSpace }} />
      {error && (
        <p className="error-message" role="alert">
          {t(error)}
        </p>
      )}
      {loading && <p role="status">{t("Chargement des œuvres…")}</p>}
      {!loading && !error && visible.length === 0 && (
        <section className="catalog-empty">
          <h2>{t("Aucune œuvre pour ces filtres")}</h2>
          <p>
            {t(
              "Explore le catalogue ou essaie d’autres filtres pour trouver ta prochaine lecture.",
            )}
          </p>
        </section>
      )}
      <div className="home-grid">
        {visible.map((item) => {
          const entry = library.find(
            (entry) => entry.catalogItemId === item.id,
          );
          return (
            <article className="home-card" key={item.id}>
              <div className="home-card-top">
                <span className="media-type">{item.type}</span>
                {entry && (
                  <button
                    type="button"
                    className="favorite-button"
                    aria-label={
                      entry.isFavorite
                        ? t("Retirer des favoris")
                        : t("Ajouter aux favoris")
                    }
                    aria-pressed={entry.isFavorite}
                    disabled={busy === item.id}
                    onClick={() => toggleFavorite(entry)}
                  >
                    {entry.isFavorite ? "♥" : "♡"}
                  </button>
                )}
              </div>
              <h2>
                <Link to={`/catalog/${item.id}`}>{item.title}</Link>
              </h2>
              <div className="catalog-genres">
                {item.genres.slice(0, 3).map((genre) => (
                  <span key={genre}>{genreLabel(genre)}</span>
                ))}
              </div>
              {entry ? (
                <div className="home-progress">
                  <span>{statuses[entry.status]}</span>
                  <strong>
                    {entry.progress} / {item.total ?? "—"}{" "}
                    {item.type === "anime" ? t("épisodes") : t("chapitres")}
                  </strong>
                  {item.total != null && item.total > 0 && (
                    <progress
                      value={Math.min(entry.progress, item.total)}
                      max={item.total}
                      aria-label={t("Progression")}
                    />
                  )}
                </div>
              ) : (
                <p>
                  {item.total ?? "—"}{" "}
                  {item.type === "anime" ? t("épisodes") : t("chapitres")}
                </p>
              )}
              <div className="home-card-actions">
                <Link className="action-link" to={`/catalog/${item.id}`}>
                  {entry ? t("Reprendre") : t("Voir la fiche")}{" "}
                  <span aria-hidden="true">↗</span>
                </Link>
                {entry && (
                  <RemoveLibraryButton
                    entryId={entry.id}
                    title={item.title}
                    onRemoved={() =>
                      setLibrary((current) =>
                        current.filter((item) => item.id !== entry.id),
                      )
                    }
                    onError={setError}
                  />
                )}
                {!entry && (
                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => add(item)}
                  >
                    {busy === item.id ? t("Ajout…") : t("+ Suivre")}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!libraryMode && more && (
        <div className="load-more">
          <button
            type="button"
            className="load-more-button"
            aria-busy={loading}
            disabled={loading}
            onClick={loadMore}
          >
            {loading ? t("Chargement...") : t("Afficher plus d’œuvres")}
          </button>
        </div>
      )}
    </main>
  );
}
