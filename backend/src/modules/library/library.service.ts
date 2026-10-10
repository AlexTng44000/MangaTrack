import type {
    CreateLibraryEntryInput,
    LibraryEntry,
} from './library.types.js';

import type {
    LibraryRepository,
} from './library.repository.js';

export class LibraryService {
    constructor(
        private readonly repository: LibraryRepository,
    ) { }

    async getAll(): Promise<LibraryEntry[]> {
        return this.repository.getAll();
    }

    async getById(
        id: number,
    ): Promise<LibraryEntry | undefined> {
        return this.repository.getById(id);
    }

    async add(
        input: CreateLibraryEntryInput,
    ): Promise<LibraryEntry> {
        return this.repository.add(input);
    }

    async updateProgress(
        id: number,
        progress: number,
    ): Promise<LibraryEntry | undefined> {
        return this.repository.updateProgress(
            id,
            progress,
        );
    }
}