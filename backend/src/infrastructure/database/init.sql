CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS library_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
    catalog_item_id INTEGER NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE
    status VARCHAR(30) NOT NULL
        CHECK (
            status IN (
                'a_commencer',
                'en_cours',
                'termine',
                'abandonne'
            )
        ),
    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_catalog
        UNIQUE (user_id, catalog_item_id)
);