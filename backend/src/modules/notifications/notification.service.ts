import type {
    NotificationQueuePort,
} from './notificationQueue.port.js';

import type {
    CreateNotificationInput,
} from './notification.types.js';

import type {
    UserRepository,
} from '../users/user.repository.js';

export class NotificationService {
    constructor(
        private readonly queue:
            NotificationQueuePort,

        private readonly users:
            UserRepository,
    ) { }

    async createReminder(
        userId: number,
        input: CreateNotificationInput,
        reminderId?: number,
    ) {
        const user =
            await this.users.findById(
                userId,
            );

        if (!user) {
            throw new Error(
                'USER_NOT_FOUND',
            );
        }

        let delay = 0;

        if (input.scheduledAt) {
            const scheduledTimestamp =
                Date.parse(
                    input.scheduledAt,
                );

            if (
                Number.isNaN(
                    scheduledTimestamp,
                )
            ) {
                throw new Error(
                    'scheduledAt doit être une date valide',
                );
            }

            delay =
                scheduledTimestamp -
                Date.now();

            if (delay <= 0) {
                throw new Error(
                    'scheduledAt doit être dans le futur',
                );
            }
        }

        const jobId =
            await this.queue.enqueue(
                {
                    userId,
                    email: user.email,
                    message: input.message,
                    scheduledAt:
                        input.scheduledAt,
                    reminderId,
                },
                delay,
            );
        return {
            jobId,
            status:
                delay > 0
                    ? 'scheduled'
                    : 'queued',
            scheduledAt:
                input.scheduledAt ??
                null,
        };
    }

    async cancelReminder(
        jobId: string,
    ): Promise<boolean> {
        return this.queue.remove(
            jobId,
        );
    }
}