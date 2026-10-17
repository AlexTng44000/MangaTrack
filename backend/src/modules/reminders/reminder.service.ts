import type {
    NotificationService,
} from '../notifications/notification.service.js';

import type {
    ReminderRepository,
} from './reminder.repository.js';

import type {
    CreateReminderInput,
    Reminder,
} from './reminder.types.js';

export class ReminderService {
    constructor(
        private readonly repository:
            ReminderRepository,

        private readonly notificationService:
            NotificationService,
    ) { }

    async getAll(
        userId: number,
    ): Promise<Reminder[]> {
        return this.repository.getAll(
            userId,
        );
    }

    async create(
        userId: number,
        input: CreateReminderInput,
    ): Promise<Reminder> {
        const reminder =
            await this.repository.create(
                userId,
                input,
            );

        try {
            const notification =
                await this.notificationService.createReminder(
                    userId,
                    {
                        message: input.message,
                        scheduledAt:
                            input.scheduledAt,
                    },
                    reminder.id,
                );
            if (notification.jobId) {
                await this.repository.updateJobId(
                    reminder.id,
                    notification.jobId,
                );
            }
            const updatedReminder =
                await this.repository.getById(
                    reminder.id,
                    userId,
                );

            return updatedReminder ?? reminder;
        } catch (error) {
            await this.repository.updateStatus(
                reminder.id,
                'failed',
            );

            throw error;
        }
    }

    async cancel(
        id: number,
        userId: number,
    ): Promise<Reminder> {
        const reminder =
            await this.repository.getById(
                id,
                userId,
            );

        if (!reminder) {
            throw new Error(
                'REMINDER_NOT_FOUND',
            );
        }

        if (
            reminder.status !==
            'pending'
        ) {
            throw new Error(
                'REMINDER_NOT_PENDING',
            );
        }

        if (!reminder.jobId) {
            throw new Error(
                'REMINDER_JOB_NOT_FOUND',
            );
        }

        const removed =
            await this.notificationService.cancelReminder(
                reminder.jobId,
            );

        if (!removed) {
            throw new Error(
                'REMINDER_JOB_NOT_FOUND',
            );
        }

        await this.repository.updateStatus(
            reminder.id,
            'cancelled',
        );

        const updated =
            await this.repository.getById(
                reminder.id,
                userId,
            );

        return updated ?? reminder;
    }
}