import type {
    LibraryRepository,
} from './library.repository.js';

import type {
    CreateLibraryEntryInput,
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
}