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
    UpdateResumePointInput,
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
                    progress,
                    is_favorite AS "isFavorite",
                    rating,
                    resume_catalog_item_id
                        AS "resumeCatalogItemId",
                    resume_chapter
                        AS "resumeChapter"
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
                    progress,
                    is_favorite AS "isFavorite",
                    rating,
                    resume_catalog_item_id
                        AS "resumeCatalogItemId",
                    resume_chapter
                        AS "resumeChapter"
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
                    progress,
                    is_favorite AS "isFavorite",
                    rating,
                    resume_catalog_item_id
                        AS "resumeCatalogItemId",
                    resume_chapter
                        AS "resumeChapter"
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
                    progress,
                    is_favorite AS "isFavorite",
                    rating,
                    resume_catalog_item_id
                        AS "resumeCatalogItemId",
                    resume_chapter
                        AS "resumeChapter"
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
            await this.db.query<LibraryEntry>(
                `
                UPDATE library_entries
                SET status = $1
                WHERE id = $2
                AND user_id = $3

                RETURNING
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    status,
                    progress,
                    is_favorite AS "isFavorite",
                    rating,
                    resume_catalog_item_id
                        AS "resumeCatalogItemId",
                    resume_chapter
                        AS "resumeChapter"
                `,
                [
                    status,
                    id,
                    userId,
                ],
            );

        return result.rows[0] ?? null;
    }

    async updateFavorite(
        id: number,
        userId: number,
        isFavorite: boolean,
    ): Promise<LibraryEntry | null> {
        const result =
            await this.db.query<LibraryEntry>(
                `
                UPDATE library_entries
                SET is_favorite = $1
                WHERE id = $2
                AND user_id = $3

                RETURNING
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    status,
                    progress,
                    is_favorite AS "isFavorite",
                    rating,
                    resume_catalog_item_id
                        AS "resumeCatalogItemId",
                    resume_chapter
                        AS "resumeChapter"
                `,
                [
                    isFavorite,
                    id,
                    userId,
                ],
            );

        return result.rows[0] ?? null;
    }

    async updateRating(
        id: number,
        userId: number,
        rating: number | null,
    ): Promise<LibraryEntry | null> {
        const result =
            await this.db.query<LibraryEntry>(
                `
                UPDATE library_entries
                SET rating = $1
                WHERE id = $2
                AND user_id = $3

                RETURNING
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    status,
                    progress,
                    is_favorite AS "isFavorite",
                    rating,
                    resume_catalog_item_id
                        AS "resumeCatalogItemId",
                    resume_chapter
                        AS "resumeChapter"
                `,
                [
                    rating,
                    id,
                    userId,
                ],
            );

        return result.rows[0] ?? null;
    }

    async updateResumePoint(
        id: number,
        userId: number,
        input: UpdateResumePointInput,
    ): Promise<LibraryEntry | null> {
        const result =
            await this.db.query<LibraryEntry>(
                `
                UPDATE library_entries
                SET
                    resume_catalog_item_id = $1,
                    resume_chapter = $2
                WHERE id = $3
                AND user_id = $4

                RETURNING
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    status,
                    progress,
                    is_favorite AS "isFavorite",
                    rating,
                    resume_catalog_item_id
                        AS "resumeCatalogItemId",
                    resume_chapter
                        AS "resumeChapter"
                `,
                [
                    input.resumeCatalogItemId,
                    input.resumeChapter,
                    id,
                    userId,
                ],
            );

        return result.rows[0] ?? null;
    }
}