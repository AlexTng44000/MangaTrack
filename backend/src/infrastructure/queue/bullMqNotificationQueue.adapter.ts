import { Queue } from 'bullmq';

import type {
    NotificationQueuePort,
} from '../../modules/notifications/notificationQueue.port.js';

import type {
    NotificationJobData,
} from '../../modules/notifications/notification.types.js';

export class BullMqNotificationQueueAdapter
    implements NotificationQueuePort {
    private readonly queue =
        new Queue<NotificationJobData>(
            'notifications',
            {
                connection: {
                    host: 'localhost',
                    port: 6379,
                },
            },
        );

    async enqueue(
        data: NotificationJobData,
        delay: number,
    ): Promise<string | null> {
        const job = await this.queue.add(
            'send-reminder',
            data,
            {
                delay,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            },
        );

        return job.id ?? null;
    }
}