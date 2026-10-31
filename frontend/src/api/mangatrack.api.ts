import { t } from "../i18n";
import type {
  CalendarRelease,
  CatalogPageResult,
  CatalogItem,
  CatalogDetails,
} from "../types/catalog";

import type { LibraryEntry, LibraryStatus } from "../types/library";

import { getToken, logout } from "../auth/auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3354";

async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken();

  if (!token) {
    logout();
    window.location.reload();

    throw new Error(t("Authentification requise"));
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    logout();

    window.location.reload();

    throw new Error(t("Session expirée"));
  }

  return response;
}

export type CatalogSort =
  | "popularity"
  | "trending"
  | "score"
  | "recent"
  | "title";

export async function getCatalog(
  search?: string,
  page = 1,
  type?: "anime" | "manga",
  genre?: string,
  sort: CatalogSort = "popularity",
): Promise<CatalogPageResult> {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (search && search.trim()) {
    params.set("search", search.trim());
  }

  if (type) {
    params.set("type", type);
  }

  if (genre && genre.trim()) {
    params.set("genre", genre.trim());
  }

  params.set("sort", sort);

  const response = await fetch(`${API_URL}/catalog?${params.toString()}`);

  if (!response.ok) {
    throw new Error(t("Impossible de charger le catalogue"));
  }

  return response.json();
}

export async function getCatalogByGenre(
  genre: string,
  page = 1,
): Promise<CatalogPageResult> {
  return getCatalog(undefined, page, undefined, genre);
}

export async function getCalendarReleases(
  from?: string,
  to?: string,
): Promise<CalendarRelease[]> {
  const params = new URLSearchParams();

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  const query = params.toString();

  const url = query
    ? `${API_URL}/catalog/calendar?${query}`
    : `${API_URL}/catalog/calendar`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(t("Impossible de charger le calendrier"));
  }

  return response.json();
}

export async function addToLibrary(catalogItemId: number) {
  const response = await authenticatedFetch(`${API_URL}/library`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      catalogItemId,
      status: "a_commencer",
    }),
  });

  if (response.status === 409) {
    throw new Error(t("Cette œuvre est déjà dans votre bibliothèque."));
  }

  if (!response.ok) {
    throw new Error(t("Impossible d’ajouter cette œuvre."));
  }

  return response.json();
}

export async function getLibrary(): Promise<LibraryEntry[]> {
  const response = await authenticatedFetch(`${API_URL}/library`);

  if (!response.ok) {
    throw new Error(t("Impossible de charger la bibliothèque"));
  }

  return response.json();
}

export async function updateProgress(
  libraryEntryId: number,
  progress: number,
): Promise<LibraryEntry> {
  const response = await authenticatedFetch(
    `${API_URL}/progress/${libraryEntryId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        progress,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(t("Impossible de modifier la progression"));
  }

  return response.json();
}

export type ReminderStatus = "pending" | "sent" | "failed" | "cancelled";

export interface Reminder {
  catalogItemId: number | null;
  id: number;
  userId: number;
  message: string;
  scheduledAt: string | null;
  status: ReminderStatus;
  jobId: string | null;
  createdAt: string;
}

export interface CreateReminderInput {
  catalogItemId?: number;
  message: string;
  scheduledAt?: string;
}

export async function createReminder(
  input: CreateReminderInput,
): Promise<Reminder> {
  const response = await authenticatedFetch(`${API_URL}/reminders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Impossible de programmer le rappel");
  }

  return data;
}

export async function getReminders(): Promise<Reminder[]> {
  const response = await authenticatedFetch(`${API_URL}/reminders`);

  if (!response.ok) {
    throw new Error(t("Impossible de charger les rappels"));
  }

  return response.json();
}

export async function cancelReminder(id: number): Promise<Reminder> {
  const response = await authenticatedFetch(`${API_URL}/reminders/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Impossible d’annuler le rappel");
  }

  return data;
}

export interface AdminUser {
  id: number;
  email: string;
  role: "user" | "admin";
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await authenticatedFetch(`${API_URL}/admin/users`);

  if (!response.ok) {
    throw new Error(t("Impossible de charger les utilisateurs"));
  }

  return response.json();
}

export async function deleteAdminUser(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/admin/users/${id}`, {
    method: "DELETE",
  });

  if (response.ok) {
    return;
  }

  let message = t("Impossible de supprimer cet utilisateur");

  try {
    const data: { error?: string } = await response.json();

    if (data.error === "ADMIN_USER_PROTECTED") {
      message = "Les comptes administrateurs sont protégés.";
    } else if (data.error === "USER_NOT_FOUND") {
      message = "Cet utilisateur n’existe plus.";
    }
  } catch {
    // La réponse ne contient pas forcément de JSON.
  }

  throw new Error(message);
}

export async function deleteLibraryEntry(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/library/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(t("Impossible de supprimer cette œuvre"));
  }
}

export async function updateLibraryStatus(
  id: number,
  status: LibraryStatus,
): Promise<LibraryEntry> {
  const response = await authenticatedFetch(`${API_URL}/library/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status,
    }),
  });

  if (!response.ok) {
    throw new Error(t("Impossible de modifier le statut"));
  }

  return response.json();
}

export async function updateLibraryFavorite(
  id: number,
  isFavorite: boolean,
): Promise<LibraryEntry> {
  const response = await authenticatedFetch(
    `${API_URL}/library/${id}/favorite`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isFavorite,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(t("Impossible de modifier le favori"));
  }

  return response.json();
}

export async function getCatalogByIds(ids: number[]): Promise<CatalogItem[]> {
  if (ids.length === 0) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/catalog/by-ids?ids=${ids.join(",")}`,
  );

  if (!response.ok) {
    throw new Error(t("Impossible de charger les œuvres"));
  }

  return response.json();
}

export async function updateLibraryRating(
  id: number,
  rating: number | null,
): Promise<LibraryEntry> {
  const response = await authenticatedFetch(`${API_URL}/library/${id}/rating`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rating,
    }),
  });

  if (!response.ok) {
    throw new Error(t("Impossible de modifier la note"));
  }

  return response.json();
}

export async function updateResumePoint(
  id: number,
  resumeCatalogItemId: number | null,
  resumeChapter: number | null,
): Promise<LibraryEntry> {
  const response = await authenticatedFetch(`${API_URL}/library/${id}/resume`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resumeCatalogItemId,
      resumeChapter,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Impossible de modifier le point de reprise");
  }

  return data;
}

export async function getCatalogDetails(id: number): Promise<CatalogDetails> {
  const response = await fetch(`${API_URL}/catalog/${id}`);

  if (!response.ok) {
    throw new Error(t("Impossible de charger la fiche"));
  }

  return response.json();
}
