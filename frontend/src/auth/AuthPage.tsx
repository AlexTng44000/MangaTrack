import { t, useLanguage } from "../i18n";
import { useState } from "react";

import { login, register } from "./auth";

import type { AuthUser } from "./auth";

interface AuthPageProps {
  onAuthenticated: (user: AuthUser) => void;
}
export function AuthPage({ onAuthenticated }: AuthPageProps) {
  useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const result =
        mode === "login"
          ? await login(email, password)
          : await register(email, password);

      onAuthenticated(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>MyMangaTracker</h1>

      <p>
        {mode === "login"
          ? t("Connecte-toi à ton compte.")
          : t("Crée ton compte MyMangaTracker.")}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          {t("Mot de passe")}{" "}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading
            ? t("Chargement...")
            : mode === "login"
              ? t("Se connecter")
              : t("Créer mon compte")}
        </button>
      </form>

      {error && <p className="error-message">{t(error)}</p>}

      <button
        type="button"
        className="auth-switch"
        onClick={() => {
          setError(null);

          setMode(mode === "login" ? "register" : "login");
        }}
      >
        {mode === "login"
          ? t("Pas encore de compte ? S’inscrire")
          : t("Déjà un compte ? Se connecter")}
      </button>
    </main>
  );
}
