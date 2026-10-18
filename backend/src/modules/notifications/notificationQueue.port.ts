import type {
    NotificationJobData,
} from './notification.types.js';

export interface NotificationQueuePort {
    enqueue(
        data: NotificationJobData,
        delay: number,
    ): Promise<string>;

    remove(
        jobId: string,
    ): Promise<boolean>;
}