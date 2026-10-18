import type {
    CreateReminderInput,
    Reminder,
    ReminderStatus,
} from './reminder.types.js';

export interface ReminderRepository {
    create(
        userId: number,
        input: CreateReminderInput,
    ): Promise<Reminder>;

    getAll(
        userId: number,
    ): Promise<Reminder[]>;

    getById(
        id: number,
        userId: number,
    ): Promise<Reminder | undefined>;

    updateStatus(
        id: number,
        status: ReminderStatus,
    ): Promise<void>;

    updateJobId(
        id: number,
        jobId: string,
    ): Promise<void>;
}