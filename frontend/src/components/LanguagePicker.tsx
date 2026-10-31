import { setLanguage, t, useLanguage } from "../i18n";
export function LanguagePicker() {
  const language = useLanguage();
  return (
    <label className="language-picker">
      <span className="sr-only">{t("Langue")}</span>
      <select
        aria-label={t("Langue")}
        value={language}
        onChange={(event) =>
          setLanguage(event.target.value === "en" ? "en" : "fr")
        }
      >
        <option value="fr" lang="fr">
          Français
        </option>
        <option value="en" lang="en">
          English
        </option>
      </select>
    </label>
  );
}
