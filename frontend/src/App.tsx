import {
  useState,
} from 'react';

import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';

import {
  CatalogPage,
} from './pages/CatalogPage';

import {
  LibraryPage,
} from './pages/LibraryPage';

import {
  RemindersPage,
} from './pages/RemindersPage';

import {
  CalendarPage,
} from './pages/CalendarPage';

import {
  StatsPage,
} from './pages/StatsPage';

import {
  RecommendationsPage,
} from './pages/RecommendationsPage';

import {
  CatchUpPage,
} from './pages/CatchUpPage';

import {
  AdminPage,
} from './pages/AdminPage';

import {
  AuthPage,
} from './auth/AuthPage';

import {
  getCurrentUser,
  logout,
} from './auth/auth';

import type {
  AuthUser,
} from './auth/auth';

import {
  WorkDetailsPage,
} from './pages/WorkDetailsPage';

import './App.css';

function App() {
  const [user, setUser] =
    useState<AuthUser | null>(
      getCurrentUser(),
    );

  const navigate =
    useNavigate();

  if (!user) {
    return (
      <AuthPage
        onAuthenticated={(
          authenticatedUser,
        ) => {
          setUser(
            authenticatedUser,
          );
        }}
      />
    );
  }

  function getNavLinkClass({
    isActive,
  }: {
    isActive: boolean;
  }) {
    return isActive
      ? 'app-nav-link app-nav-link-active'
      : 'app-nav-link';
  }

  function handleLogout() {
    logout();

    setUser(
      null,
    );

    navigate(
      '/catalog',
      {
        replace: true,
      },
    );
  }

  return (
    <>
      <header className="app-header">
        <button
          type="button"
          className="app-brand"
          onClick={() =>
            navigate(
              '/catalog',
            )
          }
        >
          <span className="app-brand-mark">
            M
          </span>

          <span className="app-brand-copy">
            <strong>
              MangaTrack
            </strong>

            <small>
              Anime & Manga Tracker
            </small>
          </span>
        </button>

        <nav
          className="app-nav"
          aria-label="Navigation principale"
        >
          <NavLink
            to="/catalog"
            className={
              getNavLinkClass
            }
          >
            Catalogue
          </NavLink>

          <NavLink
            to="/library"
            className={
              getNavLinkClass
            }
          >
            Bibliothèque
          </NavLink>

          <NavLink
            to="/calendar"
            className={
              getNavLinkClass
            }
          >
            Calendrier
          </NavLink>

          <NavLink
            to="/stats"
            className={
              getNavLinkClass
            }
          >
            Statistiques
          </NavLink>

          <NavLink
            to="/recommendations"
            className={
              getNavLinkClass
            }
          >
            Recommandations
          </NavLink>

          <NavLink
            to="/catch-up"
            className={
              getNavLinkClass
            }
          >
            Rattrapage
          </NavLink>

          <NavLink
            to="/reminders"
            className={
              getNavLinkClass
            }
          >
            Rappels
          </NavLink>

          {user.role ===
            'admin' && (
              <NavLink
                to="/admin"
                className={
                  getNavLinkClass
                }
              >
                Administration
              </NavLink>
            )}
        </nav>

        <div className="app-header-actions">
          <div className="user-chip">
            <span className="user-avatar">
              {user.email
                .charAt(0)
                .toUpperCase()}
            </span>

            <div className="user-chip-copy">
              <span>
                {user.email}
              </span>

              <small>
                {user.role ===
                  'admin'
                  ? 'Administrateur'
                  : 'Utilisateur'}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Déconnexion
          </button>
        </div>
      </header>

      <Routes>
        <Route
          path="/catalog"
          element={
            <CatalogPage />
          }
        />

        <Route
          path="/catalog/:id"
          element={
            <WorkDetailsPage />
          }
        />

        <Route
          path="/library"
          element={
            <LibraryPage />
          }
        />

        <Route
          path="/calendar"
          element={
            <CalendarPage />
          }
        />

        <Route
          path="/stats"
          element={
            <StatsPage />
          }
        />

        <Route
          path="/recommendations"
          element={
            <RecommendationsPage />
          }
        />

        <Route
          path="/catch-up"
          element={
            <CatchUpPage />
          }
        />

        <Route
          path="/reminders"
          element={
            <RemindersPage />
          }
        />

        {user.role ===
          'admin' && (
            <Route
              path="/admin"
              element={
                <AdminPage />
              }
            />
          )}

        <Route
          path="*"
          element={
            <Navigate
              to="/catalog"
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;