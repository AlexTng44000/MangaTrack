import type {
    TokenPayload,
} from '../modules/users/token.port.js';

declare global {
    namespace Express {
        interface Request {
            auth?: TokenPayload;
        }
    }
}

export { };