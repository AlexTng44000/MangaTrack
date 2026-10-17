import type {
    LibraryRepository,
} from './library.repository.js';

import type {
    CreateLibraryEntryInput,
    LibraryEntry,
    LibraryStatus,
    UpdateResumePointInput,
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

    async updateFavorite(
        id: number,
        userId: number,
        isFavorite: boolean,
    ): Promise<LibraryEntry> {
        const entry =
            await this.repository.updateFavorite(
                id,
                userId,
                isFavorite,
            );

        if (!entry) {
            throw new Error(
                'LIBRARY_ENTRY_NOT_FOUND',
            );
        }

        return entry;
    }

    async updateRating(
        id: number,
        userId: number,
        rating: number | null,
    ): Promise<LibraryEntry> {
        const entry =
            await this.repository.updateRating(
                id,
                userId,
                rating,
            );

        if (!entry) {
            throw new Error(
                'LIBRARY_ENTRY_NOT_FOUND',
            );
        }

        return entry;
    }

    async updateResumePoint(
        id: number,
        userId: number,
        input: UpdateResumePointInput,
    ): Promise<LibraryEntry> {
        const bothNull =
            input.resumeCatalogItemId === null &&
            input.resumeChapter === null;

        const bothDefined =
            input.resumeCatalogItemId !== null &&
            input.resumeChapter !== null;

        if (
            !bothNull &&
            !bothDefined
        ) {
            throw new Error(
                'INVALID_RESUME_POINT',
            );
        }

        if (
            bothDefined &&
            (
                !Number.isInteger(
                    input.resumeCatalogItemId,
                ) ||
                input.resumeCatalogItemId! <= 0 ||
                !Number.isInteger(
                    input.resumeChapter,
                ) ||
                input.resumeChapter! <= 0
            )
        ) {
            throw new Error(
                'INVALID_RESUME_POINT',
            );
        }

        const entry =
            await this.repository.updateResumePoint(
                id,
                userId,
                input,
            );

        if (!entry) {
            throw new Error(
                'LIBRARY_ENTRY_NOT_FOUND',
            );
        }

        return entry;
    }
}