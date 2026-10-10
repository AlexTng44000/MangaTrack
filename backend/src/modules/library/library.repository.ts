import type {
    CreateLibraryEntryInput,
    LibraryEntry,
} from './library.types.js';

export interface LibraryRepository {
    getAll(): Promise<LibraryEntry[]>;

    getById(
        id: number,
    ): Promise<LibraryEntry | undefined>;

    add(
        input: CreateLibraryEntryInput,
    ): Promise<LibraryEntry>;

    updateProgress(
        id: number,
        progress: number,
    ): Promise<LibraryEntry | undefined>;
}