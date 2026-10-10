import type { LibraryService } from '../library/library.service.js';
import type { LibraryEntry } from '../library/library.types.js';

export class ProgressService {
    constructor(
        private readonly libraryService: LibraryService,
    ) { }

    updateProgress(
        libraryEntryId: number,
        progress: number,
    ): LibraryEntry | undefined {
        return this.libraryService.updateProgress(
            libraryEntryId,
            progress,
        );
    }
}