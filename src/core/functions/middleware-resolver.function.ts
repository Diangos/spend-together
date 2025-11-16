import {CustomMiddleware, DIContainer, Logger, MiddlewareAliases, OakMiddleware} from "../index.ts";

export function middlewareResolver(
    identifier: string | (new (...args: unknown[]) => CustomMiddleware),
    container: DIContainer = DIContainer.instance
): OakMiddleware {
    // 1) If string → try DI first (lets you register factory middlewares in DI)
    if (typeof identifier === "string") {
        try {
            const fromDi = container.resolve<unknown>(identifier);

            if (typeof fromDi === "function") {
                // DI contained a factory/instance that is an OakMiddleware
                return fromDi as OakMiddleware;
            }

            if (fromDi && typeof (fromDi as CustomMiddleware).handle === "function") {
                const instance = fromDi as CustomMiddleware;
                Logger.info(`✔️ ${identifier} Middleware loaded`);
                return instance.handle.bind(instance);
            }
        } catch {
            // fall through to alias
        }

        // 2) Fallback: resolve alias → class → DI
        const ctor = MiddlewareAliases.get(identifier);

        if (!ctor) {
            throw new Error(`Middleware "${identifier}" not found in DI or aliases.`);
        }

        const instance = container.resolve<CustomMiddleware>(ctor);
        Logger.info(`✔️ ${identifier} Middleware loaded`);
        return instance.handle.bind(instance);
    }

    // 3) If class token → resolve via DI (singletons, deps, etc.)
    const instance = container.resolve<CustomMiddleware>(identifier);
    const prettyName = instance.constructor.name
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z0-9])/g, '$1 $2');
    Logger.info(`✔️ ${prettyName} loaded`);
    return instance.handle.bind(instance);
}