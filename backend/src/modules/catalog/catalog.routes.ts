import {
    Router,
} from 'express';

import type {
    CatalogService,
} from './catalog.service.js';

import type {
    CatalogFilters,
    MediaType,
} from './catalog.types.js';

export function createCatalogRouter(
    catalogService: CatalogService,
): Router {
    const router =
        Router();

    router.get(
        '/',
        async (req, res) => {
            const search =
                typeof req.query.search ===
                    'string'
                    ? req.query.search.trim()
                    : '';

            const rawPage =
                typeof req.query.page ===
                    'string'
                    ? Number(
                        req.query.page,
                    )
                    : 1;

            const rawType =
                typeof req.query.type ===
                    'string'
                    ? req.query.type
                    : undefined;

            const type:
                MediaType | undefined =
                rawType === 'anime' ||
                    rawType === 'manga'
                    ? rawType
                    : undefined;

            if (
                rawType &&
                rawType !== 'anime' &&
                rawType !== 'manga'
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Le type doit être anime ou manga',
                    });
            }

            const genre =
                typeof req.query.genre ===
                    'string'
                    ? req.query.genre.trim()
                    : undefined;

            const filters:
                CatalogFilters = {
                type,

                genre:
                    genre ||
                    undefined,
            };

            if (
                !Number.isInteger(
                    rawPage,
                ) ||
                rawPage < 1
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Le numéro de page doit être un entier supérieur ou égal à 1',
                    });
            }

            if (search) {
                const result =
                    await catalogService.search(
                        search,
                        rawPage,
                        filters,
                    );

                return res.json(
                    result,
                );
            }

            const result =
                await catalogService.getAll(
                    rawPage,
                    filters,
                );

            return res.json(
                result,
            );
        },
    );

    router.get(
        '/by-ids',
        async (req, res) => {
            const rawIds =
                typeof req.query.ids ===
                    'string'
                    ? req.query.ids
                    : '';

            const ids =
                rawIds
                    .split(',')
                    .map(
                        (value) =>
                            Number(
                                value,
                            ),
                    )
                    .filter(
                        (id) =>
                            Number.isInteger(
                                id,
                            ) &&
                            id > 0,
                    );

            if (
                ids.length ===
                0
            ) {
                return res.json(
                    [],
                );
            }

            const items =
                await catalogService.getByIds(
                    ids,
                );

            return res.json(
                items,
            );
        },
    );

    router.get(
        '/calendar',
        async (req, res) => {
            const now =
                new Date();

            const defaultTo =
                new Date(
                    now.getTime() +
                    7 *
                    24 *
                    60 *
                    60 *
                    1000,
                );

            const rawFrom =
                typeof req.query.from ===
                    'string'
                    ? req.query.from
                    : undefined;

            const rawTo =
                typeof req.query.to ===
                    'string'
                    ? req.query.to
                    : undefined;

            const from =
                rawFrom
                    ? new Date(
                        rawFrom,
                    )
                    : now;

            const to =
                rawTo
                    ? new Date(
                        rawTo,
                    )
                    : defaultTo;

            if (
                Number.isNaN(
                    from.getTime(),
                ) ||
                Number.isNaN(
                    to.getTime(),
                )
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Les dates du calendrier sont invalides',
                    });
            }

            if (
                from.getTime() >=
                to.getTime()
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'La date de fin doit être postérieure à la date de début',
                    });
            }

            const maximumRange =
                31 *
                24 *
                60 *
                60 *
                1000;

            if (
                to.getTime() -
                from.getTime() >
                maximumRange
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'La période du calendrier ne peut pas dépasser 31 jours',
                    });
            }

            const releases =
                await catalogService
                    .getUpcomingReleases(
                        from,
                        to,
                    );

            return res.json(
                releases,
            );
        },
    );

    router.get(
        '/:id',
        async (req, res) => {
            const id =
                Number(
                    req.params.id,
                );

            if (
                !Number.isInteger(
                    id,
                ) ||
                id < 1
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Identifiant invalide',
                    });
            }

            const item =
                await catalogService
                    .getDetails(
                        id,
                    );

            if (!item) {
                return res
                    .status(404)
                    .json({
                        error:
                            'Œuvre introuvable',
                    });
            }

            return res.json(
                item,
            );
        },
    );

    return router;
}