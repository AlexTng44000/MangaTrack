import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const works = [
  {
    id: 1,
    title: "Frieren",
    type: "anime",
    genres: ["Adventure", "Fantasy"],
    total: 28,
  },
  { id: 2, title: "Blue Period", type: "manga", genres: ["Drama"], total: 80 },
];
async function setup(page: Page) {
  const library: Array<Record<string, unknown>> = [];
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
      return route.fulfill({ json: [] });
    const id = Number(url.pathname.split("/").pop());
    const item = works.find((work) => work.id === id);
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
        }
      : url.pathname === "/catalog/by-ids"
        ? works.filter((work) =>
            (url.searchParams.get("ids") ?? "")
              .split(",")
              .includes(String(work.id)),
          )
        : {
            items: works.filter(
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
            hasNextPage: false,
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
  await page
    .getByRole("button", { name: "Ma bibliothèque", exact: true })
    .click();
  await expect(page.locator(".home-card")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Statut", exact: true })
    .selectOption("en_cours");
  await expect(page.locator(".home-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Réinitialiser les filtres" }).click();
  await expect(page.locator(".home-card")).toHaveCount(2);
  await page.getByLabel("Rechercher un titre").fill("Blue");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.locator(".home-card")).toHaveCount(1);
  await page.goBack();
  await expect(page.getByLabel("Rechercher un titre")).toHaveValue("");
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
        fullPage: true, animations: "disabled",
      });
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: "Rappels", exact: true }),
    ).toHaveCount(0);
    if (width <= 760) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(page.getByRole("navigation")).toBeVisible();
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
        fullPage: true, animations: "disabled",
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
