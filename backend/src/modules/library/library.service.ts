import type {
    LibraryRepository,
} from './library.repository.js';

import type {
    CreateLibraryEntryInput,
    LibraryEntry,
    LibraryStatus,
} from './library.types.js';

export class LibraryService {
    constructor(
        private readonly repository:
            LibraryRepository,
    ) { }

    async getAll(
        userId: number,
    ) {
        return this.repository.getAll(
            userId,
        );
    }

    async getById(
        id: number,
        userId: number,
    ) {
        return this.repository.getById(
            id,
            userId,
        );
    }

    async add(
        userId: number,
        input: CreateLibraryEntryInput,
    ) {
        return this.repository.add(
            userId,
            input,
        );
    }

    async updateProgress(
        id: number,
        userId: number,
        progress: number,
    ) {
        return this.repository.updateProgress(
            id,
            userId,
            progress,
        );
    }

    async delete(
        id: number,
        userId: number,
    ): Promise<void> {
        const deleted =
            await this.repository.delete(
                id,
                userId,
            );

        if (!deleted) {
            throw new Error(
                'LIBRARY_ENTRY_NOT_FOUND',
            );
        }
    }

    async updateStatus(
        id: number,
        userId: number,
        status: LibraryStatus,
    ): Promise<LibraryEntry> {
        const entry =
            await this.repository.updateStatus(
                id,
                userId,
                status,
            );

        if (!entry) {
            throw new Error(
                'LIBRARY_ENTRY_NOT_FOUND',
            );
        }

        return entry;
    }
}