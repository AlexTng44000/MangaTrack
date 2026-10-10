CREATE TABLE IF NOT EXISTS library_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    catalog_item_id INTEGER NOT NULL,
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);