import { t } from "./i18n";
import { useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RemindersPage } from "./pages/RemindersPage";
import { CalendarPage } from "./pages/CalendarPage";
import { StatsPage } from "./pages/StatsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./auth/AuthPage";
import { getCurrentUser, logout } from "./auth/auth";
import type { AuthUser } from "./auth/auth";
import { WorkDetailsPage } from "./pages/WorkDetailsPage";
import { BRAND_NAME } from "./brand";
import { LanguagePicker } from "./components/LanguagePicker";
import { useLanguage } from "./i18n";
import "./App.css";

function App() {
  useLanguage();
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  if (!user)
    return (
      <>
        <div className="auth-language">
          <LanguagePicker />
        </div>
        <AuthPage onAuthenticated={setUser} />
      </>
    );
  function handleLogout() {
    logout();
    setUser(null);
    setMenuOpen(false);
    navigate("/", { replace: true });
  }
  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "app-nav-link app-nav-link-active" : "app-nav-link";
  return (
    <>
      <a className="skip-link" href="#main-content">
        {t("Aller au contenu")}
      </a>
      <header className="app-header friendly-header">
        <NavLink
          to="/"
          className="app-brand"
          onClick={() => setMenuOpen(false)}
          aria-label={t("Accueil MyMangaTracker")}
        >
          <svg className="brand-symbol" viewBox="0 0 40 40" aria-hidden="true">
            <rect
              x="2"
              y="2"
              width="36"
              height="36"
              rx="12"
              fill="currentColor"
            />
            <path
              d="M11 12h8a5 5 0 0 1 5 5v13l-6-4h-7V12Zm13 3h5v15h-5"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <span className="app-brand-copy">
            <strong>{BRAND_NAME}</strong>
            <small>{t("Ton histoire, à ton rythme")}</small>
          </span>
        </NavLink>
        <button
          className="menu-toggle"
          type="button"
          aria-controls="main-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? t("Fermer le menu") : "Menu"}
        </button>
        <nav
          id="main-navigation"
          className={`app-nav ${menuOpen ? "is-open" : ""}`}
          aria-label={t("Navigation principale")}
          onClick={() => setMenuOpen(false)}
        >
          <NavLink to="/" end className={navClass}>
            {t("Accueil")}
          </NavLink>
          <NavLink to="/calendar" className={navClass}>
            {t("Calendrier")}
          </NavLink>
          <NavLink to="/recommendations" className={navClass}>
            {t("Pour toi")}
          </NavLink>
          <NavLink to="/stats" className={navClass}>
            {t("Statistiques")}
          </NavLink>
          {user.role === "admin" && (
            <NavLink to="/admin" className={navClass}>
              {t("Administration")}
            </NavLink>
          )}
        </nav>
        <div className="app-header-actions">
          <LanguagePicker />
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            {t("Déconnexion")}
          </button>
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<Navigate to="/" replace />} />
          <Route
            path="/library"
            element={<Navigate to="/?scope=library" replace />}
          />
          <Route path="/catalog/:id" element={<WorkDetailsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route
            path="/catch-up"
            element={<Navigate to="/?scope=library" replace />}
          />
          <Route path="/reminders" element={<RemindersPage />} />
          {user.role === "admin" && (
            <Route path="/admin" element={<AdminPage />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
export default App;
