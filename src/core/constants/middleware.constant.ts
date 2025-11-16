import { CustomMiddleware} from "../index.ts";

export const MiddlewareAliases = new Map<string, new (...args: unknown[]) => CustomMiddleware>();
