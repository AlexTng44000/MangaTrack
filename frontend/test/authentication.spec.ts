import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const account = {
  user: { id: 1, email: "auth@example.invalid", role: "user" },
  token: "fixture.token.signature",
};
async function submit(page: Page, register = true) {
  await page.goto("/");
  if (register)
    await page.getByRole("button", { name: /Pas encore de compte/ }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(account.user.email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("fixture-password");
  await page
    .getByRole("button", {
      name: register ? "Créer mon compte" : "Se connecter",
      exact: true,
    })
    .click();
}
async function expectNoSession(page: Page) {
  expect(
    await page.evaluate(() => sessionStorage.getItem("mangatrack_token")),
  ).toBeNull();
  expect(
    await page.evaluate(() => sessionStorage.getItem("mangatrack_user")),
  ).toBeNull();
}

for (const status of [200, 502])
  test(`a non-JSON auth response (HTTP ${status}) gets a useful diagnostic`, async ({
    page,
  }) => {
    await page.route("**/auth/register", (route) =>
      route.fulfill({
        status,
        contentType: "text/html",
        body: "<html>Proxy error or SPA fallback</html>",
      }),
    );
    await submit(page);
    await expect(page.getByRole("alert")).toContainText(
      status === 200 ? "Vérifie /api/health" : "HTTP 502",
    );
    await expectNoSession(page);
  });

test("network failures never expose a native browser error", async ({
  page,
}) => {
  await page.route("**/auth/register", (route) => route.abort("failed"));
  await submit(page);
  await expect(page.getByRole("alert")).toContainText(
    "Connexion à l’API impossible",
  );
  await expectNoSession(page);
});

test("rate limit responses remain understandable even without a JSON body", async ({
  page,
}) => {
  await page.route("**/auth/login", (route) =>
    route.fulfill({
      status: 429,
      contentType: "text/plain",
      body: "Too many requests",
    }),
  );
  await submit(page, false);
  await expect(page.getByRole("alert")).toHaveText(
    "Trop de tentatives de connexion. Réessaie plus tard.",
  );
  await expectNoSession(page);
});

test("backend validation messages are preserved", async ({ page }) => {
  await page.route("**/auth/register", (route) =>
    route.fulfill({
      status: 409,
      json: { error: "Cet email est déjà utilisé" },
    }),
  );
  await submit(page);
  await expect(page.getByRole("alert")).toHaveText(
    "Cet email est déjà utilisé",
  );
  await expectNoSession(page);
});

test("HTTP 200 JSON without credentials cannot create a session", async ({
  page,
}) => {
  await page.route("**/auth/register", (route) =>
    route.fulfill({ json: { status: "ok" } }),
  );
  await submit(page);
  await expect(page.getByRole("alert")).toContainText(
    "Réponse d’authentification invalide",
  );
  await expectNoSession(page);
});

for (const register of [true, false])
  test(`valid ${register ? "registration" : "login"} stores a complete session`, async ({
    page,
  }) => {
    await page.route(`**/auth/${register ? "register" : "login"}`, (route) =>
      route.fulfill({ json: account }),
    );
    await page.route("**/library", (route) => route.fulfill({ json: [] }));
    await page.route("**/catalog?**", (route) =>
      route.fulfill({ json: { items: [], page: 1, hasNextPage: false } }),
    );
    await submit(page, register);
    await expect(page.locator(".app-header")).toBeVisible();
    expect(
      await page.evaluate(() => sessionStorage.getItem("mangatrack_token")),
    ).toBe(account.token);
    expect(
      await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("mangatrack_user")!),
      ),
    ).toEqual(account.user);
  });

test("storage rejection explains that the account was created instead of exposing a browser exception", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException(
        "The string did not match the expected pattern.",
        "SyntaxError",
      );
    };
  });
  await page.route("**/auth/register", (route) =>
    route.fulfill({ json: account }),
  );
  await submit(page);
  await expect(page.getByRole("alert")).toContainText(
    "Compte créé, mais ce navigateur ne peut pas mémoriser la session.",
  );
  await expectNoSession(page);
});

test("public sites never call a visitor’s localhost and normalize API paths", async ({
  page,
}) => {
  await page.goto("/");
  const results = await page.evaluate(async () => {
    const { resolveApiBaseUrl } = await import("/src/api/baseUrl.ts");
    return [
      resolveApiBaseUrl(
        "http://localhost:3354",
        "https://demo.trycloudflare.com",
      ),
      resolveApiBaseUrl("http://127.0.0.1:3354", "https://example.org"),
      resolveApiBaseUrl(" /api/ ", "https://demo.trycloudflare.com"),
      resolveApiBaseUrl("", "https://demo.trycloudflare.com"),
      resolveApiBaseUrl("https://api.example.org/v1/", "https://example.org"),
      resolveApiBaseUrl("http://localhost:3354/", "http://localhost:5173"),
    ];
  });
  expect(results).toEqual([
    "/api",
    "/api",
    "/api",
    "/api",
    "https://api.example.org/v1",
    "http://localhost:3354",
  ]);
});
