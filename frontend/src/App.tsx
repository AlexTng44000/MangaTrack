import {
  useState,
} from 'react';

import {
  Navigate,
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

  return (
    <>
      <header className="app-header">
        <div>
          <h1>MangaTrack</h1>

          <p>
            Suis tes mangas et anime
            préférés.
          </p>
        </div>

        <nav>
          <button
            onClick={() =>
              navigate('/catalog')
            }
          >
            Catalogue
          </button>

          <button
            onClick={() =>
              navigate('/library')
            }
          >
            Ma bibliothèque
          </button>

          <button
            onClick={() =>
              navigate('/calendar')
            }
          >
            Calendrier
          </button>

          <button
            onClick={() =>
              navigate('/stats')
            }
          >
            Statistiques
          </button>

          <button
            onClick={() =>
              navigate('/recommendations')
            }
          >
            Recommandations
          </button>

          <button
            onClick={() =>
              navigate('/catch-up')
            }
          >
            Rattrapage
          </button>

          <button
            onClick={() =>
              navigate('/reminders')
            }
          >
            Rappels
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() =>
                navigate('/admin')
              }
            >
              Administration
            </button>
          )}

          <button
            onClick={() => {
              logout();
              setUser(null);

              navigate(
                '/catalog',
              );
            }}
          >
            Déconnexion
          </button>
        </nav>
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

        {user.role === 'admin' && (
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