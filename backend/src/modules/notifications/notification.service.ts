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
        const job = await notificationQueue.add(
            'send-reminder',
            input,
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            },
        );

        return {
            jobId: job.id,
            status: 'queued',
        };
    }
}