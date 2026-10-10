import type {
    NotificationJobData,
} from './notification.types.js';

export interface NotificationQueuePort {
    enqueue(
        data: NotificationJobData,
        delay: number,
    ): Promise<string | null>;
}