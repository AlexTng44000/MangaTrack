import {
  useState,
} from 'react';

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

import './App.css';

type Page =
  | 'catalog'
  | 'library'
  | 'reminders'
  | 'admin';

function App() {
  const [user, setUser] =
    useState<AuthUser | null>(
      getCurrentUser(),
    );

  const [page, setPage] =
    useState<Page>('catalog');

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
              setPage('catalog')
            }
          >
            Catalogue
          </button>

          <button
            onClick={() =>
              setPage('library')
            }
          >
            Ma bibliothèque
          </button>

          <button
            onClick={() =>
              setPage('reminders')
            }
          >
            Rappels
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() =>
                setPage('admin')
              }
            >
              Administration
            </button>
          )}

          <button
            onClick={() => {
              logout();
              setUser(null);
              setPage('catalog');
            }}
          >
            Déconnexion
          </button>
        </nav>
      </header>

      {page === 'catalog' && (
        <CatalogPage />
      )}

      {page === 'library' && (
        <LibraryPage />
      )}

      {page === 'reminders' && (
        <RemindersPage />
      )}

      {page === 'admin' &&
        user.role === 'admin' && (
          <AdminPage />
        )}
    </>
  );
}

export default App;