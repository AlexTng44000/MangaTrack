import {
  useState,
} from 'react';

import {
  CatalogPage,
} from './pages/CatalogPage';

import {
  LibraryPage,
} from './pages/LibraryPage';

import './App.css';

function App() {
  const [page, setPage] =
    useState<'catalog' | 'library'>(
      'catalog',
    );

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
        </nav>
      </header>

      {page === 'catalog'
        ? <CatalogPage />
        : <LibraryPage />}
    </>
  );
}

export default App;