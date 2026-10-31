import type {
    Pool,
} from 'pg';

import type {
    ReminderRepository,
} from '../../modules/reminders/reminder.repository.js';

import type {
    CreateReminderInput,
    Reminder,
    ReminderStatus,
} from '../../modules/reminders/reminder.types.js';

export class PostgresReminderRepository
    implements ReminderRepository {

    constructor(
        private readonly db: Pool,
    ) { }

    async create(
        userId: number,
        input: CreateReminderInput,
    ): Promise<Reminder> {
        const result =
            await this.db.query<Reminder>(
                `
                INSERT INTO reminders (
                    user_id,
                    message,
                    scheduled_at,
                    catalog_item_id
                )
                VALUES ($1, $2, $3, $4)

                RETURNING
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    message,
                    scheduled_at AS "scheduledAt",
                    status,
                    job_id AS "jobId",
                    created_at AS "createdAt"
                `,
                [
                    userId,
                    input.message,
                    input.scheduledAt ?? null,
                    input.catalogItemId ?? null,
                ],
            );

        return result.rows[0];
    }

    async getAll(
        userId: number,
    ): Promise<Reminder[]> {
        const result =
            await this.db.query<Reminder>(
                `
                SELECT
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    message,
                    scheduled_at AS "scheduledAt",
                    status,
                    job_id AS "jobId",
                    created_at AS "createdAt"
                FROM reminders
                WHERE user_id = $1
                ORDER BY created_at DESC
                `,
                [
                    userId,
                ],
            );

        return result.rows;
    }

    async getById(
        id: number,
        userId: number,
    ): Promise<Reminder | undefined> {
        const result =
            await this.db.query<Reminder>(
                `
                SELECT
                    id,
                    user_id AS "userId",
                    catalog_item_id AS "catalogItemId",
                    message,
                    scheduled_at AS "scheduledAt",
                    status,
                    job_id AS "jobId",
                    created_at AS "createdAt"
                FROM reminders
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

    async updateStatus(
        id: number,
        status: ReminderStatus,
    ): Promise<void> {
        await this.db.query(
            `
            UPDATE reminders
            SET status = $1
            WHERE id = $2
            `,
            [
                status,
                id,
            ],
        );
    }

    async updateJobId(
        id: number,
        jobId: string,
    ): Promise<void> {
        await this.db.query(
            `
            UPDATE reminders
            SET job_id = $1
            WHERE id = $2
            `,
            [
                jobId,
                id,
            ],
        );
    }
}