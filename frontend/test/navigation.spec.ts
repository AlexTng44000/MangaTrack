import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type {
  CatalogItem,
  CatalogDetails,
  CalendarRelease,
} from "../src/types/catalog";
import type { LibraryEntry } from "../src/types/library";

const works: CatalogItem[] = [
  {
    id: 1,
    title: "Frieren",
    type: "anime",
    genres: ["Adventure", "Fantasy"],
    total: 28,
  },
  { id: 2, title: "Blue Period", type: "manga", genres: ["Drama"], total: 80 },
];
async function setup(
  page: Page,
  options: {
    library?: LibraryEntry[];
    items?: CatalogItem[];
    details?: Record<number, Partial<CatalogDetails>>;
    releases?: CalendarRelease[];
    hasNextPage?: boolean;
  } = {},
) {
  const library: LibraryEntry[] = options.library ?? [];
  const items = options.items ?? works;
  const reminders: Array<Record<string, unknown>> = [];
  const writes: Array<Record<string, unknown>> = [];
  await page.addInitScript(() => {
    sessionStorage.setItem("mangatrack_token", "ui-test-token");
    sessionStorage.setItem(
      "mangatrack_user",
      JSON.stringify({ id: 1, email: "ui@example.invalid", role: "user" }),
    );
  });
  await page.route("**/catalog**", async (route) => {
    // Intercept the API only, leaving frontend /catalog/:id routes intact.
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/catalog") || url.port !== "3354")
      return route.continue();
    if (url.pathname === "/catalog/calendar")
      return route.fulfill({ json: options.releases ?? [] });
    const id = Number(url.pathname.split("/").pop());
    const item = items.find((work) => work.id === id);
    const body = item
      ? {
          ...item,
          description: "A journey worth following.",
          imageUrl: null,
          status: "FINISHED",
          format: "TV",
          seasonYear: 2023,
          averageScore: 90,
          relations: [],
          streamingEpisodes: [],
          externalLinks: [],
          ...options.details?.[id],
        }
      : url.pathname === "/catalog/by-ids"
        ? items.filter((work) =>
            (url.searchParams.get("ids") ?? "")
              .split(",")
              .includes(String(work.id)),
          )
        : {
            items: items.filter(
              (work) =>
                (!url.searchParams.get("search") ||
                  work.title
                    .toLowerCase()
                    .includes(url.searchParams.get("search")!.toLowerCase())) &&
                (!url.searchParams.get("type") ||
                  work.type === url.searchParams.get("type")) &&
                (!url.searchParams.get("genre") ||
                  work.genres.includes(url.searchParams.get("genre")!)),
            ),
            page: 1,
            hasNextPage: options.hasNextPage ?? false,
          };
    await route.fulfill({ json: body });
  });
  await page.route("**/library**", async (route) => {
    if (new URL(route.request().url()).port !== "3354") return route.continue();
    const request = route.request(),
      segments = new URL(request.url()).pathname.split("/");
    if (request.method() === "POST") {
      const input = request.postDataJSON();
      const entry = {
        id: library.length + 10,
        userId: 1,
        ...input,
        progress: 0,
        isFavorite: false,
        rating: null,
        resumeCatalogItemId: null,
        resumeChapter: null,
      };
      library.push(entry);
      await route.fulfill({ status: 201, json: entry });
    } else if (request.method() === "PATCH") {
      const entry = library.find((entry) => entry.id === Number(segments[2]))!;
      Object.assign(entry, request.postDataJSON());
      await route.fulfill({ json: entry });
    } else if (request.method() === "DELETE") {
      library.splice(
        library.findIndex((entry) => entry.id === Number(segments[2])),
        1,
      );
      await route.fulfill({ status: 204 });
    } else await route.fulfill({ json: library });
  });
  await page.route("**/progress/*", async (route) => {
    const entry = library.find(
      (entry) =>
        entry.id ===
        Number(new URL(route.request().url()).pathname.split("/").pop()),
    )!;
    Object.assign(entry, route.request().postDataJSON());
    await route.fulfill({ json: entry });
  });
  await page.route("**/reminders**", async (route) => {
    if (new URL(route.request().url()).port !== "3354") return route.continue();
    const request = route.request();
    if (request.method() === "POST") {
      const input = request.postDataJSON();
      writes.push(input);
      const reminder = {
        ...input,
        id: reminders.length + 1,
        status: "pending",
        jobId: "job",
        userId: 1,
        createdAt: new Date().toISOString(),
      };
      reminders.push(reminder);
      await route.fulfill({ status: 201, json: reminder });
    } else if (request.method() === "DELETE") {
      const reminder = reminders.find(
        (item) =>
          item.id === Number(new URL(request.url()).pathname.split("/").pop()),
      )!;
      reminder.status = "cancelled";
      await route.fulfill({ json: reminder });
    } else await route.fulfill({ json: reminders });
  });
  return { library, reminders, writes };
}

async function openFilters(page: Page) {
  await expect(async () => {
    const edit = page.getByRole('button', { name: 'Modifier les filtres', exact: true });
    if (await edit.isVisible()) await edit.click();
    await expect(page.getByLabel('Rechercher un titre')).toBeVisible();
  }).toPass({ timeout: 5000 });
}
function tracked(catalogItemId: number, progress = 0): LibraryEntry {
  return {
    id: catalogItemId + 10,
    userId: 1,
    catalogItemId,
    progress,
    status: "en_cours",
    isFavorite: false,
    rating: null,
    resumeCatalogItemId: null,
    resumeChapter: null,
  };
}

test("one home filters discovery and library; old library links still work", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/");
  await expect(page.locator(".app-brand-copy strong")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Découvre. Suis. Reprends." }),
  ).toBeVisible();
  const frieren = page.locator(".home-card").filter({ hasText: "Frieren" });
  await frieren.getByRole("button", { name: "+ Suivre", exact: true }).click();
  await expect(frieren.getByRole("link", { name: "Reprendre" })).toBeVisible();
  await openFilters(page);
  await page
    .getByRole("button", { name: "Ma bibliothèque", exact: true })
    .click();
  await expect(page.locator(".home-card")).toHaveCount(1);
  await openFilters(page);
  await page
    .getByRole("combobox", { name: "Statut", exact: true })
    .selectOption("en_cours");
  await expect(page.locator(".home-card")).toHaveCount(0);
  await openFilters(page);
  await page.getByRole("button", { name: "Réinitialiser les filtres" }).click();
  await expect(page.locator(".home-card")).toHaveCount(2);
  await openFilters(page);
  await page.getByLabel("Rechercher un titre").fill("Blue");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.locator(".home-card")).toHaveCount(1);
  await page.goBack();
  await openFilters(page);
  await expect(page.getByLabel("Rechercher un titre")).toHaveValue("");
  await openFilters(page);
  await page
    .getByRole("combobox", { name: "Genre", exact: true })
    .selectOption("Drama");
  await expect(page.locator(".home-card")).toHaveCount(1);
  await expect(page.locator(".home-card")).toContainText("Blue Period");
  await page.goto("/library");
  await expect(page).toHaveURL(/scope=library/);
  await expect(page.locator(".home-card")).toHaveCount(1);
});

test("work detail manages progress, catch-up and reminders scoped to the work", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/catalog/1");
  await page.getByRole("button", { name: "+ Suivre cette œuvre" }).click();
  await page.getByLabel("Progression", { exact: true }).fill("5");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Ma note", exact: true })
    .selectOption("8");
  await page
    .getByRole("button", { name: "♡ Ajouter aux favoris", exact: true })
    .click();
  await page.getByLabel("Date cible").fill("2099-12-31");
  await expect(page.locator(".catchup-result")).toContainText(
    "épisodes / jour",
  );
  await page.getByLabel("Message", { exact: true }).fill("Regarder la suite");
  await page.getByLabel("Date et heure").fill("2099-12-31T12:00");
  await page.getByRole("button", { name: "Programmer le rappel" }).click();
  await expect(page.locator(".work-reminder-list")).toContainText(
    "Regarder la suite",
  );
  expect(state.writes[0].catalogItemId).toBe(1);
  expect(state.library[0]).toMatchObject({
    progress: 5,
    rating: 8,
    isFavorite: true,
  });
  await page.reload();
  await expect(page.locator(".work-reminder-list")).toContainText(
    "Regarder la suite",
  );
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.locator(".work-reminder-list")).toContainText("Annulé");
  await page.goto("/catalog/2");
  await expect(page.locator(".work-reminder-list li")).toHaveCount(0);
});

test("French and English switch without losing filters and persist across reloads", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/?scope=library");
  await page.getByLabel("Langue", { exact: true }).selectOption("en");
  await expect(
    page.getByRole("heading", { name: "Discover. Track. Continue." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "My library", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Discover. Track. Continue." }),
  ).toBeVisible();
  await page.goto("/catalog/1");
  await expect(
    page.getByRole("heading", { name: "Catch-up plan" }),
  ).toBeVisible();
  await page.getByLabel("Language", { exact: true }).selectOption("fr");
  await expect(
    page.getByRole("heading", { name: "Plan de rattrapage" }),
  ).toBeVisible();
});

for (const width of [320, 375, 768, 1440]) {
  test(`home and detail fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page);
    await page.goto("/");
    await expect(page.locator(".home-card")).toHaveCount(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 375 || width === 1440)
      await page.screenshot({
        path: test.info().outputPath("home.png"),
        fullPage: true,
        animations: "disabled",
      });
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: "Rappels", exact: true }),
    ).toHaveCount(0);
    if (width <= 760) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(
        page.getByRole("navigation", { name: "Navigation principale" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Fermer le menu" }).click();
    }
    await page.goto("/catalog/1");
    await expect(
      page.getByRole("heading", { name: "Mon suivi" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 375 || width === 1440)
      await page.screenshot({
        path: test.info().outputPath("detail.png"),
        fullPage: true,
        animations: "disabled",
      });
    for (const route of [
      "/stats",
      "/recommendations",
      "/calendar",
      "/reminders",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}

test("sign-in screen switches language and fits a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "MyMangaTracker" }),
  ).toBeVisible();
  await page.getByLabel("Langue", { exact: true }).selectOption("en");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("remove works directly from library and discovery cards, preserving state on cancellation", async ({
  page,
}) => {
  await setup(page, { library: [tracked(1)] });
  await page.goto("/?scope=library");
  const remove = page.getByRole("button", {
    name: "Retirer Frieren de ma bibliothèque",
    exact: true,
  });
  page.once("dialog", (dialog) => dialog.dismiss());
  await remove.click();
  await expect(page.locator(".home-card")).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await remove.click();
  await expect(page.locator(".home-card")).toHaveCount(0);
  await page.goto("/");
  await page
    .locator(".home-card")
    .filter({ hasText: "Frieren" })
    .getByRole("button", { name: "+ Suivre", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: "Retirer Frieren de ma bibliothèque",
      exact: true,
    })
    .click();
  await expect(page.locator(".home-card")).toHaveCount(2);
  await expect(
    page
      .locator(".home-card")
      .filter({ hasText: "Frieren" })
      .getByRole("button", { name: "+ Suivre", exact: true }),
  ).toBeVisible();
});

test("calendar joins plurals and can remove a tracked work across all its releases", async ({
  page,
}) => {
  const releases = [1, 2].map((episode) => ({
    mediaId: 1,
    title: "Frieren",
    episode,
    airingAt: "2099-12-31T12:00:00Z",
    imageUrl: null,
    format: "TV",
  }));
  await setup(page, { library: [tracked(1)], releases });
  await page.goto("/calendar");
  await expect(page.locator(".calendar-day-count")).toHaveText("2 épisodes");
  await expect(
    page.getByRole("button", {
      name: "Retirer Frieren de ma bibliothèque",
      exact: true,
    }),
  ).toHaveCount(2);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: "Retirer Frieren de ma bibliothèque",
      exact: true,
    })
    .first()
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retirer Frieren de ma bibliothèque",
      exact: true,
    }),
  ).toHaveCount(0);
});

for (const width of [375, 1440])
  test(`filters remain usable after scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const items: CatalogItem[] = Array.from({ length: 36 }, (_, index) => ({
      id: index + 1,
      title: `Work ${index}`,
      type: "anime",
      genres: ["Adventure"],
      total: 12,
    }));
    await setup(page, { items, hasNextPage: true });
    await page.goto("/");
    await expect(page.locator(".home-card")).toHaveCount(36);
    await page.evaluate(() => scrollTo(0, 1200));
    await expect(
      page.getByRole("button", { name: "Modifier les filtres", exact: true }),
    ).toBeVisible();
    const bounds = await page.locator(".home-filters").boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeLessThan(20);
    expect(bounds!.height).toBeLessThan(110);
    await openFilters(page);
    await page.getByLabel("Rechercher un titre").fill("Work 31");
    await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    await expect(page.locator(".home-card")).toHaveCount(1);
    await expect(page.locator(".home-card")).toContainText("Work 31");
    await expect(page).toHaveURL(/q=Work\+31/);
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.locator(".home-filters")).not.toHaveClass(
      /home-filters-pinned/,
    );
    await expect(page.getByLabel("Rechercher un titre")).toBeVisible();
    const loadMore = page.getByRole("button", {
      name: "Afficher plus d’œuvres",
    });
    await expect(loadMore).toBeEnabled();
    const colors = await loadMore.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      text: getComputedStyle(element).color,
    }));
    expect(colors.background).toBe("rgb(102, 38, 212)");
    expect(colors.text).toBe("rgb(255, 255, 255)");
  });

test("links never mark viewing automatically; explicit confirmation updates every progress view", async ({
  page,
  context,
}) => {
  const state = await setup(page, {
    library: [tracked(1, 1)],
    details: {
      1: {
        streamingEpisodes: [
          {
            title: "Episode 1 - The journey",
            url: "https://video.example/one",
            site: "Video",
            thumbnail: null,
          },
          {
            title: "Episode 2 - A new day",
            url: "https://video.example/two",
            site: "Video",
            thumbnail: null,
          },
          {
            title: "Special without a number",
            url: "https://video.example/special",
            site: "Video",
            thumbnail: null,
          },
          {
            title: "Episode 2.5 - Extra",
            url: "https://video.example/extra",
            site: "Video",
            thumbnail: null,
          },
          {
            title: "Unsafe",
            url: "javascript:alert(1)",
            site: "Unsafe",
            thumbnail: null,
          },
        ],
        externalLinks: [
          {
            site: "Video",
            url: "https://video.example",
            type: "STREAMING",
            language: null,
            icon: null,
            isDisabled: false,
          },
        ],
      },
    },
  });
  await context.route("https://video.example/**", (route) =>
    route.fulfill({ body: "External player fixture" }),
  );
  await page.goto("/catalog/1");
  await expect(page.locator(".episode-watch-card")).toHaveCount(4);
  await expect(page.locator(".episode-seen")).toHaveCount(1);
  const popupPromise = page.waitForEvent("popup");
  await page
    .getByRole("link", { name: "Regarder l’épisode 2 · Video ↗", exact: true })
    .click();
  const popup = await popupPromise;
  await popup.close();
  expect(state.library[0].progress).toBe(1);
  await page
    .locator(".next-episode-panel")
    .getByRole("button", { name: "Vu jusqu’à l’épisode 2", exact: true })
    .click();
  await expect(page.locator(".next-episode-panel")).toContainText(
    "Épisodes vus : 2",
  );
  await expect(
    page.getByRole("spinbutton", { name: "Progression", exact: true }),
  ).toHaveValue("2");
  await expect(page.locator(".episode-seen")).toHaveCount(2);
  expect(state.library[0].progress).toBe(2);
});

test("a manga highlights its tracked anime and the manually saved resume chapter", async ({
  page,
}) => {
  const entry = { ...tracked(1, 8), resumeCatalogItemId: 2, resumeChapter: 34 };
  await setup(page, {
    library: [entry],
    details: {
      2: {
        relations: [
          {
            id: 1,
            title: "Frieren",
            type: "anime",
            relationType: "ADAPTATION",
            imageUrl: null,
            format: "TV",
          },
        ],
      },
    },
  });
  await page.goto("/catalog/2");
  await expect(page.locator("#adaptations")).toContainText(
    "Anime suivi : épisode 8",
  );
  await expect(page.locator("#adaptations")).toContainText(
    "Ton point de reprise dans ce manga : chapitre 34",
  );
  await expect(
    page.getByRole("link", { name: "Voir l’anime et mon épisode suivi →" }),
  ).toBeVisible();
});


test('load more appends the next page and disappears when the catalogue ends', async ({ page }) => {
  await setup(page);
  await page.route('http://localhost:3354/catalog?**', async route => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get('page'));
    await route.fulfill({ json: { items: [works[pageNumber === 1 ? 0 : 1]], page: pageNumber, hasNextPage: pageNumber === 1 } });
  });
  await page.goto('/');
  await expect(page.locator('.home-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Afficher plus d’œuvres', exact: true }).click();
  await expect(page.locator('.home-card')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Afficher plus d’œuvres', exact: true })).toHaveCount(0);
});
