import Redis from 'ioredis';
import {
    Queue,
} from 'bullmq';

import {
    env,
} from '../../config/env.js';

import type {
    NotificationQueuePort,
} from '../../modules/notifications/notificationQueue.port.js';

import type {
    NotificationJobData,
} from '../../modules/notifications/notification.types.js';

export class BullMqNotificationQueueAdapter
    implements NotificationQueuePort {

    private readonly connection =
        new Redis(
            env.REDIS_URL,
            {
                maxRetriesPerRequest: null,
            },
        );

    private readonly queue =
        new Queue<NotificationJobData>(
            'notifications',
            {
                connection:
                    this.connection,
            },
        );

    async enqueue(
        data: NotificationJobData,
        delay: number,
    ): Promise<string> {

        const job =
            await this.queue.add(
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

        if (!job.id) {
            throw new Error(
                'BULLMQ_JOB_ID_MISSING',
            );
        }

        return job.id;
    }

    async remove(
        jobId: string,
    ): Promise<boolean> {

        const job =
            await this.queue.getJob(
                jobId,
            );

        if (!job) {
            return false;
        }

        await job.remove();

        return true;
    }
}