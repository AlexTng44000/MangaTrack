import type {
    CreateLibraryEntryInput,
    LibraryEntry,
} from './library.types.js';

export interface LibraryRepository {
    getAll(
        userId: number,
    ): Promise<LibraryEntry[]>;

    getById(
        id: number,
        userId: number,
    ): Promise<LibraryEntry | undefined>;

    add(
        userId: number,
        input: CreateLibraryEntryInput,
    ): Promise<LibraryEntry>;

    updateProgress(
        id: number,
        userId: number,
        progress: number,
    ): Promise<LibraryEntry | undefined>;

    delete(
        id: number,
        userId: number,
    ): Promise<boolean>;
}