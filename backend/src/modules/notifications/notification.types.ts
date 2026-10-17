export interface CreateNotificationInput {
    message: string;
    scheduledAt?: string;
}

export interface NotificationJobData {
    userId: number;
    email: string;
    message: string;
    scheduledAt?: string;
}