import type { Pool } from 'pg';

import type {
    CreateLibraryEntryInput,
    LibraryEntry,
} from '../../modules/library/library.types.js';

import type {
    LibraryRepository,
} from '../../modules/library/library.repository.js';

export class PostgresLibraryRepository
    implements LibraryRepository {
    constructor(
        private readonly db: Pool,
    ) { }

    async getAll(): Promise<LibraryEntry[]> {
        const result = await this.db.query<LibraryEntry>(`
      SELECT
        id,
        user_id AS "userId",
        catalog_item_id AS "catalogItemId",
        status,
        progress
      FROM library_entries
      ORDER BY id
    `);

        return result.rows;
    }

    async getById(
        id: number,
    ): Promise<LibraryEntry | undefined> {
        const result = await this.db.query<LibraryEntry>(
            `
        SELECT
          id,
          user_id AS "userId",
          catalog_item_id AS "catalogItemId",
          status,
          progress
        FROM library_entries
        WHERE id = $1
      `,
            [id],
        );

        return result.rows[0];
    }

    async add(
        input: CreateLibraryEntryInput,
    ): Promise<LibraryEntry> {
        const result = await this.db.query<LibraryEntry>(
            `
            INSERT INTO library_entries (
              user_id,
              catalog_item_id,
              status
            )
            VALUES ($1, $2, $3)
      
            ON CONFLICT (
              user_id,
              catalog_item_id
            )
            DO NOTHING
      
            RETURNING
              id,
              user_id AS "userId",
              catalog_item_id AS "catalogItemId",
              status,
              progress
          `,
            [
                input.userId,
                input.catalogItemId,
                input.status,
            ],
        );

        const entry = result.rows[0];

        if (!entry) {
            throw new Error(
                'LIBRARY_ENTRY_ALREADY_EXISTS',
            );
        }

        return entry;
    }

    async updateProgress(
        id: number,
        progress: number,
    ): Promise<LibraryEntry | undefined> {
        const result = await this.db.query<LibraryEntry>(
            `
        UPDATE library_entries
        SET progress = $1
        WHERE id = $2
        RETURNING
          id,
          user_id AS "userId",
          catalog_item_id AS "catalogItemId",
          status,
          progress
      `,
            [progress, id],
        );

        return result.rows[0];
    }
}