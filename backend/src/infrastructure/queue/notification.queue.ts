import { Queue } from 'bullmq';

export interface NotificationJobData {
    userId: number;
    email: string;
    message: string;
}

export const notificationQueue =
    new Queue<NotificationJobData>('notifications', {
        connection: {
            host: 'localhost',
            port: 6379,
        },
    });