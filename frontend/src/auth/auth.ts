import { API_URL } from "../api/baseUrl";
import { t } from "../i18n";

const TOKEN_KEY = "mangatrack_token";
const USER_KEY = "mangatrack_user";

export interface AuthUser {
  id: number;
  email: string;
  role: "user" | "admin";
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

async function authRequest(
  endpoint: "login" | "register",
  email: string,
  password: string,
): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
  } catch {
    throw new Error(
      t(
        "Connexion à l’API impossible. Vérifie que le backend est démarré et que le tunnel transmet /api.",
      ),
    );
  }

  if (response.status === 429) {
    throw new Error(t("Trop de tentatives de connexion. Réessaie plus tard."));
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? t(
            "Le site répond, mais l’API d’authentification ne renvoie pas du JSON. Vérifie /api/health et la configuration du tunnel.",
          )
        : t(
            "API d’authentification indisponible (HTTP {status}). Vérifie le backend et le tunnel.",
            { status: response.status },
          ),
    );
  }

  if (!response.ok) {
    throw new Error(
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : t(
            "API d’authentification indisponible (HTTP {status}). Vérifie le backend et le tunnel.",
            { status: response.status },
          ),
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("token" in data) ||
    typeof data.token !== "string" ||
    !data.token ||
    !("user" in data) ||
    !data.user ||
    typeof data.user !== "object" ||
    !("id" in data.user) ||
    typeof data.user.id !== "number" ||
    !("email" in data.user) ||
    typeof data.user.email !== "string" ||
    !("role" in data.user) ||
    !["user", "admin"].includes(String(data.user.role))
  ) {
    throw new Error(
      t(
        "Réponse d’authentification invalide. Vérifie que /api est bien relié au backend.",
      ),
    );
  }
  return data as AuthResponse;
}

function saveSession(result: AuthResponse, registration: boolean) {
  try {
    saveToken(result.token);
    saveUser(result.user);
  } catch {
    try {
      removeToken();
    } catch {
      /* Storage may be unavailable in embedded browsers. */
    }
    throw new Error(
      registration
        ? t(
            "Compte créé, mais ce navigateur ne peut pas mémoriser la session. Ouvre le lien dans Safari ou Chrome et connecte-toi.",
          )
        : t(
            "Connexion réussie, mais ce navigateur ne peut pas mémoriser la session. Ouvre le lien dans Safari ou Chrome.",
          ),
    );
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const result = await authRequest("login", email, password);

  saveSession(result, false);
  return result;
}

export async function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const result = await authRequest("register", email, password);

  saveSession(result, true);
  return result;
}

export function logout(): void {
  removeToken();
}
export function saveUser(user: AuthUser): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): AuthUser | null {
  const value = sessionStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}
