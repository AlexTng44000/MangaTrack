import type {
    NotificationQueuePort,
} from './notificationQueue.port.js';

import type {
    CreateNotificationInput,
} from './notification.types.js';

export class NotificationService {
    constructor(
        private readonly queue:
            NotificationQueuePort,
    ) { }

    async createReminder(
        input: CreateNotificationInput,
    ) {
        let delay = 0;

        if (input.scheduledAt) {
            const scheduledTimestamp =
                Date.parse(input.scheduledAt);

            if (Number.isNaN(scheduledTimestamp)) {
                throw new Error(
                    'scheduledAt doit être une date valide',
                );
            }

            delay =
                scheduledTimestamp - Date.now();

            if (delay <= 0) {
                throw new Error(
                    'scheduledAt doit être dans le futur',
                );
            }
        }

        const jobId =
            await this.queue.enqueue(
                input,
                delay,
            );

        return {
            jobId,
            status:
                delay > 0 ? 'scheduled' : 'queued',
            scheduledAt:
                input.scheduledAt ?? null,
        };
    }
}