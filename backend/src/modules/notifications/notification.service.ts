import type {
    CreateNotificationInput,
} from './notification.types.js';

import {
    notificationQueue,
} from '../../infrastructure/queue/notification.queue.js';

export class NotificationService {
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

        const job = await notificationQueue.add(
            'send-reminder',
            input,
            {
                delay,
                attempts: 3,

                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            },
        );

        return {
            jobId: job.id,
            status:
                delay > 0 ? 'scheduled' : 'queued',
            scheduledAt:
                input.scheduledAt ?? null,
        };
    }
}