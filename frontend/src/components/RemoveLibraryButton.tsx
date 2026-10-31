import { useState } from "react";
import { deleteLibraryEntry } from "../api/mangatrack.api";
import { t } from "../i18n";

export function RemoveLibraryButton({
  entryId,
  title,
  onRemoved,
  onError,
}: {
  entryId: number;
  title: string;
  onRemoved: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (
      !window.confirm(
        t(
          "Retirer {title} de ta bibliothèque ? Ta progression et ta note seront supprimées.",
          { title },
        ),
      )
    )
      return;
    onError("");
    setBusy(true);
    try {
      await deleteLibraryEntry(entryId);
      onRemoved();
    } catch {
      onError(t("Impossible de supprimer cette œuvre"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      className="remove-library-button"
      aria-label={t("Retirer {title} de ma bibliothèque", { title })}
      disabled={busy}
      onClick={remove}
    >
      <span aria-hidden="true">×</span> {busy ? t("Retrait...") : t("Retirer")}
    </button>
  );
}
