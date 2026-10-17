import test from 'node:test';
import assert from 'node:assert/strict';

import {
    LibraryService,
} from '../src/modules/library/library.service.js';

import type {
    LibraryRepository,
} from '../src/modules/library/library.repository.js';

import type {
    CreateLibraryEntryInput,
    LibraryEntry,
    LibraryStatus,
    UpdateResumePointInput,
} from '../src/modules/library/library.types.js';

const baseEntry: LibraryEntry = {
    id: 1,
    userId: 10,
    catalogItemId: 16498,
    status: 'en_cours',
    progress: 12,
    isFavorite: true,
    rating: 8,
    resumeCatalogItemId: null,
    resumeChapter: null,
};

function createRepository(
    overrides:
        Partial<LibraryRepository> = {},
): LibraryRepository {
    return {
        async getAll(
            _userId: number,
        ): Promise<LibraryEntry[]> {
            return [
                baseEntry,
            ];
        },

        async getById(
            _id: number,
            _userId: number,
        ): Promise<
            LibraryEntry | undefined
        > {
            return baseEntry;
        },

        async add(
            userId: number,
            input:
                CreateLibraryEntryInput,
        ): Promise<LibraryEntry> {
            return {
                ...baseEntry,
                userId,
                catalogItemId:
                    input.catalogItemId,
                status:
                    input.status,
            };
        },

        async updateProgress(
            _id: number,
            _userId: number,
            progress: number,
        ): Promise<
            LibraryEntry | undefined
        > {
            return {
                ...baseEntry,
                progress,
            };
        },

        async delete(
            _id: number,
            _userId: number,
        ): Promise<boolean> {
            return true;
        },

        async updateStatus(
            _id: number,
            _userId: number,
            status:
                LibraryStatus,
        ): Promise<
            LibraryEntry | null
        > {
            return {
                ...baseEntry,
                status,
            };
        },

        async updateFavorite(
            _id: number,
            _userId: number,
            isFavorite: boolean,
        ): Promise<
            LibraryEntry | null
        > {
            return {
                ...baseEntry,
                isFavorite,
            };
        },

        async updateRating(
            _id: number,
            _userId: number,
            rating: number | null,
        ): Promise<
            LibraryEntry | null
        > {
            return {
                ...baseEntry,
                rating,
            };
        },

        async updateResumePoint(
            _id: number,
            _userId: number,
            input:
                UpdateResumePointInput,
        ): Promise<
            LibraryEntry | null
        > {
            return {
                ...baseEntry,
                resumeCatalogItemId:
                    input
                        .resumeCatalogItemId,
                resumeChapter:
                    input
                        .resumeChapter,
            };
        },

        ...overrides,
    };
}

test(
    'le service transmet le userId lors de la modification du point de reprise',
    async () => {
        let receivedUserId:
            number | null =
            null;

        let receivedEntryId:
            number | null =
            null;

        const repository =
            createRepository({
                async updateResumePoint(
                    id,
                    userId,
                    input,
                ) {
                    receivedEntryId =
                        id;

                    receivedUserId =
                        userId;

                    return {
                        ...baseEntry,
                        id,
                        userId,
                        resumeCatalogItemId:
                            input
                                .resumeCatalogItemId,
                        resumeChapter:
                            input
                                .resumeChapter,
                    };
                },
            });

        const service =
            new LibraryService(
                repository,
            );

        const result =
            await service
                .updateResumePoint(
                    5,
                    42,
                    {
                        resumeCatalogItemId:
                            53390,
                        resumeChapter:
                            34,
                    },
                );

        assert.equal(
            receivedEntryId,
            5,
        );

        assert.equal(
            receivedUserId,
            42,
        );

        assert.equal(
            result
                .resumeCatalogItemId,
            53390,
        );

        assert.equal(
            result.resumeChapter,
            34,
        );
    },
);

test(
    'un point de reprise valide est accepté',
    async () => {
        const service =
            new LibraryService(
                createRepository(),
            );

        const result =
            await service
                .updateResumePoint(
                    1,
                    10,
                    {
                        resumeCatalogItemId:
                            53390,
                        resumeChapter:
                            34,
                    },
                );

        assert.equal(
            result
                .resumeCatalogItemId,
            53390,
        );

        assert.equal(
            result.resumeChapter,
            34,
        );
    },
);

test(
    'un point de reprise peut être supprimé',
    async () => {
        const service =
            new LibraryService(
                createRepository(),
            );

        const result =
            await service
                .updateResumePoint(
                    1,
                    10,
                    {
                        resumeCatalogItemId:
                            null,
                        resumeChapter:
                            null,
                    },
                );

        assert.equal(
            result
                .resumeCatalogItemId,
            null,
        );

        assert.equal(
            result.resumeChapter,
            null,
        );
    },
);

test(
    'un manga de reprise sans chapitre est refusé',
    async () => {
        const service =
            new LibraryService(
                createRepository(),
            );

        await assert.rejects(
            () =>
                service
                    .updateResumePoint(
                        1,
                        10,
                        {
                            resumeCatalogItemId:
                                53390,
                            resumeChapter:
                                null,
                        },
                    ),
            {
                message:
                    'INVALID_RESUME_POINT',
            },
        );
    },
);

test(
    'un chapitre sans manga de reprise est refusé',
    async () => {
        const service =
            new LibraryService(
                createRepository(),
            );

        await assert.rejects(
            () =>
                service
                    .updateResumePoint(
                        1,
                        10,
                        {
                            resumeCatalogItemId:
                                null,
                            resumeChapter:
                                34,
                        },
                    ),
            {
                message:
                    'INVALID_RESUME_POINT',
            },
        );
    },
);

test(
    'un chapitre de reprise négatif ou nul est refusé',
    async () => {
        const service =
            new LibraryService(
                createRepository(),
            );

        await assert.rejects(
            () =>
                service
                    .updateResumePoint(
                        1,
                        10,
                        {
                            resumeCatalogItemId:
                                53390,
                            resumeChapter:
                                0,
                        },
                    ),
            {
                message:
                    'INVALID_RESUME_POINT',
            },
        );
    },
);

test(
    'une entrée inexistante provoque une erreur lors du point de reprise',
    async () => {
        const repository =
            createRepository({
                async updateResumePoint() {
                    return null;
                },
            });

        const service =
            new LibraryService(
                repository,
            );

        await assert.rejects(
            () =>
                service
                    .updateResumePoint(
                        999,
                        10,
                        {
                            resumeCatalogItemId:
                                53390,
                            resumeChapter:
                                34,
                        },
                    ),
            {
                message:
                    'LIBRARY_ENTRY_NOT_FOUND',
            },
        );
    },
);

test(
    'une entrée inexistante provoque une erreur lors du changement de statut',
    async () => {
        const repository =
            createRepository({
                async updateStatus() {
                    return null;
                },
            });

        const service =
            new LibraryService(
                repository,
            );

        await assert.rejects(
            () =>
                service
                    .updateStatus(
                        999,
                        10,
                        'termine',
                    ),
            {
                message:
                    'LIBRARY_ENTRY_NOT_FOUND',
            },
        );
    },
);

test(
    'la suppression d’une entrée inexistante provoque une erreur',
    async () => {
        const repository =
            createRepository({
                async delete() {
                    return false;
                },
            });

        const service =
            new LibraryService(
                repository,
            );

        await assert.rejects(
            () =>
                service.delete(
                    999,
                    10,
                ),
            {
                message:
                    'LIBRARY_ENTRY_NOT_FOUND',
            },
        );
    },
);