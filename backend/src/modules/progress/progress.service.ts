import type {
    LibraryService,
} from '../library/library.service.js';

import type {
    LibraryEntry,
} from '../library/library.types.js';

export class ProgressService {
    constructor(
        private readonly libraryService: LibraryService,
    ) { }

    async updateProgress(
        userId: number,
        libraryEntryId: number,
        progress: number,
    ) {
        return this.libraryService.updateProgress(
            libraryEntryId,
            userId,
            progress,
        );
    }
}