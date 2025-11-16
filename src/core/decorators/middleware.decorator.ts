import {MiddlewareAliases, CustomMiddleware} from "../index.ts";

export function Middleware(name?: string): ClassDecorator {
    return (target) => {
        const alias = name ?? target.name;
        MiddlewareAliases.set(alias, target as unknown as new (...a: unknown[]) => CustomMiddleware);
    };
}