import { Context } from "jsr:@oak/oak";
import {DEFAULT_POLICY_ENGINE_TOKEN, META_AUTH_OPTIONS, META_AUTH_PUBLIC, POLICY_ENGINE_TOKEN} from "~/core/constants/authentication.constant.ts";
import {AuthorizationOptions, AuthorizeDecorator, DIContainer, Logger, PolicyEngine} from "~/core/index.ts";

/** Attach sugar helpers to the function object. */
export const Authorize: AuthorizeDecorator = Object.assign(coreAuthorize, {
    anyScopes: (...scopes: string[]) => coreAuthorize({ anyScopes: scopes }),
    allScopes: (...scopes: string[]) => coreAuthorize({ allScopes: scopes }),
    roles:     (...roles: string[]) => coreAuthorize({ rolesAny: roles }),
    policies:  (...policies: string[]) => coreAuthorize({ policies: policies }),
});

/**
 * Public route marker. The router or OpenAPI generator can read this.
 */
export function Public(): MethodDecorator {
    return (_target: object, _propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata(META_AUTH_PUBLIC, true, descriptor.value);
        return descriptor;
    }
}

/**
 * Core decorator factory (fail-closed on errors).
 */
function coreAuthorize(options: AuthorizationOptions = "authenticated"): MethodDecorator {
    return (_target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const originalFunction = descriptor.value!;

        descriptor.value = async function (ctx: Context, ...args: unknown[]) {
            const engine = getPolicyEngine();

            if (typeof options !== "object") {
                options = {}
            }

            if (!engine) {
                // No engine registered → deny (fail-closed).
                ctx.response.status = options.denyResponse?.code || 403;
                ctx.response.body = {
                    message: options.denyResponse?.message || "Forbidden"
                };
                Logger.error(`[Authorization engine] Engine not found for ${Logger.em(propertyKey.toString())} method. Access denied.`);

                return;
            }

            try {
                const decision = await engine.evaluate(ctx, options);

                if (!decision.allow) {
                    ctx.response.status = options.denyResponse?.code || 403;
                    ctx.response.body = {
                        message:
                            decision.reason ||
                            options.denyResponse?.message ||
                            "Forbidden"
                    };

                    return;
                }
            } catch (e) {
                // Engine error → deny
                Logger.error("[Authorization engine] PolicyEngine error:", e);
                ctx.response.status = 403;
                ctx.response.body = { message: "Forbidden" };
                return;
            }

            return await originalFunction.apply(this, [ctx, ...args]);
        };

        // Expose metadata for OpenAPI generator or other tooling
        Reflect.defineMetadata(META_AUTH_OPTIONS, options, descriptor.value);
        return descriptor;
    };
}

function getPolicyEngine(): PolicyEngine {
    try {
        return DIContainer.instance.resolve(POLICY_ENGINE_TOKEN) as PolicyEngine
    } catch (_error) {
        return DIContainer.instance.resolve(DEFAULT_POLICY_ENGINE_TOKEN) as PolicyEngine
    }
}