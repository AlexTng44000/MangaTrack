import test from 'node:test';
import assert from 'node:assert/strict';

import type {
    NextFunction,
    Request,
    Response,
} from 'express';

import type {
    TokenPort,
} from '../src/modules/users/token.port.js';

import {
    createRequireAuth,
    requireAdmin,
} from '../src/modules/users/auth.middleware.js';

function createResponse() {
    let statusCode = 200;

    let body:
        unknown = null;

    const response = {
        status(code: number) {
            statusCode =
                code;

            return response;
        },

        json(data: unknown) {
            body =
                data;

            return response;
        },
    } as unknown as Response;

    return {
        response,

        getStatusCode() {
            return statusCode;
        },

        getBody() {
            return body;
        },
    };
}

test(
    'une route protégée refuse une requête sans token',
    () => {
        const tokenService = {
            verify() {
                throw new Error(
                    'Ne doit pas être appelé',
                );
            },
        } as unknown as TokenPort;

        const middleware =
            createRequireAuth(
                tokenService,
            );

        const request = {
            headers: {},
        } as Request;

        const {
            response,
            getStatusCode,
            getBody,
        } =
            createResponse();

        let nextCalled =
            false;

        const next =
            (() => {
                nextCalled =
                    true;
            }) as NextFunction;

        middleware(
            request,
            response,
            next,
        );

        assert.equal(
            getStatusCode(),
            401,
        );

        assert.deepEqual(
            getBody(),
            {
                error:
                    'Authentification requise',
            },
        );

        assert.equal(
            nextCalled,
            false,
        );
    },
);

test(
    'une route protégée refuse un token invalide',
    () => {
        const tokenService = {
            verify() {
                throw new Error(
                    'Token invalide',
                );
            },
        } as unknown as TokenPort;

        const middleware =
            createRequireAuth(
                tokenService,
            );

        const request = {
            headers: {
                authorization:
                    'Bearer mauvais-token',
            },
        } as Request;

        const {
            response,
            getStatusCode,
            getBody,
        } =
            createResponse();

        let nextCalled =
            false;

        const next =
            (() => {
                nextCalled =
                    true;
            }) as NextFunction;

        middleware(
            request,
            response,
            next,
        );

        assert.equal(
            getStatusCode(),
            401,
        );

        assert.deepEqual(
            getBody(),
            {
                error:
                    'Token invalide ou expiré',
            },
        );

        assert.equal(
            nextCalled,
            false,
        );
    },
);

test(
    'une route protégée accepte un token valide',
    () => {
        const tokenService = {
            verify(
                token: string,
            ) {
                assert.equal(
                    token,
                    'token-valide',
                );

                return {
                    userId: 42,
                    role: 'user',
                };
            },
        } as unknown as TokenPort;

        const middleware =
            createRequireAuth(
                tokenService,
            );

        const request = {
            headers: {
                authorization:
                    'Bearer token-valide',
            },
        } as Request;

        const {
            response,
            getStatusCode,
        } =
            createResponse();

        let nextCalled =
            false;

        const next =
            (() => {
                nextCalled =
                    true;
            }) as NextFunction;

        middleware(
            request,
            response,
            next,
        );

        assert.equal(
            getStatusCode(),
            200,
        );

        assert.equal(
            nextCalled,
            true,
        );

        assert.deepEqual(
            request.auth,
            {
                userId: 42,
                role: 'user',
            },
        );
    },
);

test(
    'requireAdmin refuse une requête sans authentification',
    () => {
        const request = {
            headers: {},
        } as Request;

        const {
            response,
            getStatusCode,
            getBody,
        } =
            createResponse();

        let nextCalled =
            false;

        const next =
            (() => {
                nextCalled =
                    true;
            }) as NextFunction;

        requireAdmin(
            request,
            response,
            next,
        );

        assert.equal(
            getStatusCode(),
            401,
        );

        assert.deepEqual(
            getBody(),
            {
                error:
                    'Authentification requise',
            },
        );

        assert.equal(
            nextCalled,
            false,
        );
    },
);

test(
    'requireAdmin refuse un utilisateur non administrateur',
    () => {
        const request = {
            headers: {},

            auth: {
                userId: 42,
                role: 'user',
            },
        } as Request;

        const {
            response,
            getStatusCode,
            getBody,
        } =
            createResponse();

        let nextCalled =
            false;

        const next =
            (() => {
                nextCalled =
                    true;
            }) as NextFunction;

        requireAdmin(
            request,
            response,
            next,
        );

        assert.equal(
            getStatusCode(),
            403,
        );

        assert.deepEqual(
            getBody(),
            {
                error:
                    'Accès réservé aux administrateurs',
            },
        );

        assert.equal(
            nextCalled,
            false,
        );
    },
);

test(
    'requireAdmin accepte un administrateur',
    () => {
        const request = {
            headers: {},

            auth: {
                userId: 1,
                role: 'admin',
            },
        } as Request;

        const {
            response,
            getStatusCode,
        } =
            createResponse();

        let nextCalled =
            false;

        const next =
            (() => {
                nextCalled =
                    true;
            }) as NextFunction;

        requireAdmin(
            request,
            response,
            next,
        );

        assert.equal(
            getStatusCode(),
            200,
        );

        assert.equal(
            nextCalled,
            true,
        );
    },
);