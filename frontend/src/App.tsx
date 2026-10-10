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

import './App.css';

type Page =
  | 'catalog'
  | 'library'
  | 'reminders';

function App() {
  const [page, setPage] =
    useState<Page>('catalog');

  return (
    <>
      <header className="app-header">
        <div>
          <h1>MangaTrack</h1>

          <p>
            Suis tes mangas et anime préférés.
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
    </>
  );
}

export default App;