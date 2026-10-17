import type {
    Pool,
} from 'pg';

import type {
    LibraryRepository,
} from '../../modules/library/library.repository.js';

import type {
    CreateLibraryEntryInput,
    LibraryEntry,
    LibraryStatus,
} from '../../modules/library/library.types.js';

export class PostgresLibraryRepository
    implements LibraryRepository {
    constructor(
        private readonly db: Pool,
    ) { }

    async getAll(
        userId: number,
    ): Promise<LibraryEntry[]> {
        const result =
            await this.db.query<LibraryEntry>(
                `
                SELECT
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    status,
                    progress
                FROM library_entries
                WHERE user_id = $1
                ORDER BY id
                `,
                [userId],
            );

        return result.rows;
    }

    async getById(
        id: number,
        userId: number,
    ): Promise<LibraryEntry | undefined> {
        const result =
            await this.db.query<LibraryEntry>(
                `
                SELECT
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    status,
                    progress
                FROM library_entries
                WHERE id = $1
                  AND user_id = $2
                `,
                [
                    id,
                    userId,
                ],
            );

        return result.rows[0];
    }

    async add(
        userId: number,
        input: CreateLibraryEntryInput,
    ): Promise<LibraryEntry> {
        const result =
            await this.db.query<LibraryEntry>(
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
                    userId,
                    input.catalogItemId,
                    input.status,
                ],
            );

        const entry =
            result.rows[0];

        if (!entry) {
            throw new Error(
                'LIBRARY_ENTRY_ALREADY_EXISTS',
            );
        }

        return entry;
    }

    async updateProgress(
        id: number,
        userId: number,
        progress: number,
    ): Promise<LibraryEntry | undefined> {
        const result =
            await this.db.query<LibraryEntry>(
                `
                UPDATE library_entries
                SET progress = $1
                WHERE id = $2
                  AND user_id = $3

                RETURNING
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    status,
                    progress
                `,
                [
                    progress,
                    id,
                    userId,
                ],
            );

        return result.rows[0];
    }

    async delete(
        id: number,
        userId: number,
    ): Promise<boolean> {
        const result =
            await this.db.query(
                `
                DELETE FROM library_entries
                WHERE id = $1
                AND user_id = $2
                `,
                [
                    id,
                    userId,
                ],
            );

        return (
            result.rowCount !== null &&
            result.rowCount > 0
        );
    }

    async updateStatus(
        id: number,
        userId: number,
        status: LibraryStatus,
    ): Promise<LibraryEntry | null> {
        const result =
            await this.db.query(
                `
                UPDATE library_entries
                SET status = $1
                WHERE id = $2
                AND user_id = $3
                RETURNING
                    id,
                    user_id,
                    catalog_item_id,
                    status,
                    progress
                `,
                [
                    status,
                    id,
                    userId,
                ],
            );

        if (result.rowCount === 0) {
            return null;
        }

        const row =
            result.rows[0];

        return {
            id: row.id,
            userId: row.user_id,
            catalogItemId:
                row.catalog_item_id,
            status: row.status,
            progress: row.progress,
        };
    }

}