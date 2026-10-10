import type {
    CreateLibraryEntryInput,
    LibraryEntry,
} from './library.types.js';

export class LibraryService {
    private entries: LibraryEntry[] = [];
    private nextId = 1;

    getAll(): LibraryEntry[] {
        return this.entries;
    }

    getById(id: number): LibraryEntry | undefined {
        return this.entries.find((entry) => entry.id === id);
    }

    add(input: CreateLibraryEntryInput): LibraryEntry {
        const entry: LibraryEntry = {
            id: this.nextId++,
            userId: input.userId,
            catalogItemId: input.catalogItemId,
            status: input.status,
            progress: 0,
        };

        this.entries.push(entry);

        return entry;
    }

    updateProgress(
        id: number,
        progress: number,
    ): LibraryEntry | undefined {
        const entry = this.getById(id);

        if (!entry) {
            return undefined;
        }

        entry.progress = progress;

        return entry;
    }
}