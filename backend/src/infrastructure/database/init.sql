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

    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,

    rating INTEGER
        CHECK (
            rating >= 0
            AND rating <= 10
        ),

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

    resume_catalog_item_id INTEGER
        CHECK (
            resume_catalog_item_id > 0
        ),

    resume_chapter INTEGER
        CHECK (
            resume_chapter > 0
        ),

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_catalog
        UNIQUE (
            user_id,
            catalog_item_id
        )
);

CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    message TEXT NOT NULL,

    scheduled_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL
        DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'sent',
                'failed',
                'cancelled'
            )
        ),

    job_id VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

/*
 * Compatibilité avec une base déjà existante.
 * CREATE TABLE IF NOT EXISTS ne modifie pas une table
 * qui existe déjà.
 */

ALTER TABLE library_entries
    ADD COLUMN IF NOT EXISTS
        resume_catalog_item_id INTEGER
        CHECK (
            resume_catalog_item_id > 0
        );

ALTER TABLE library_entries
    ADD COLUMN IF NOT EXISTS
        resume_chapter INTEGER
        CHECK (
            resume_chapter > 0
        );

-- Optional AniList ID: keep existing general reminders and associate new ones with a work.
ALTER TABLE reminders
    ADD COLUMN IF NOT EXISTS catalog_item_id INTEGER
        CHECK (catalog_item_id > 0);
