-- Compatible with general reminders created before work-specific reminders.
ALTER TABLE reminders
    ADD COLUMN IF NOT EXISTS catalog_item_id INTEGER
        CHECK (catalog_item_id > 0);
