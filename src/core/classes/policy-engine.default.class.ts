import type { Context } from "jsr:@oak/oak";
import type { AuthorizationOptions, Decision, PolicyEngine, PolicyRegistry, RequestUser } from "./../types/authorization.type.ts";

/**
 * Default policy engine. Should cover most common use cases.
 * TODO: Thoroughly vet this - it was written by an LLM
 */
export class DefaultPolicyEngine implements PolicyEngine {
    constructor(private registry: PolicyRegistry) {}

    async evaluate(ctx: Context, options: AuthorizationOptions): Promise<Decision> {
        if (options === "authenticated") {
            return {
                allow: Boolean(ctx.state.user)
            };
        }

        const user = (ctx.state.user ?? {}) as RequestUser;
        const roles  = new Set(user.roles ?? []);
        const scopes = new Set(user.scopes ?? user.roles ?? []);

        // 1) primitive checks
        if (options.anyScopes && !options.anyScopes.some(s => scopes.has(s))) return { allow: false, reason: "missing-scope" };
        if (options.allScopes && !options.allScopes.every(s => scopes.has(s))) return { allow: false, reason: "missing-scope" };
        if (options.rolesAny  && !options.rolesAny.some(r => roles.has(r)))     return { allow: false, reason: "missing-role" };
        if (options.rolesAll  && !options.rolesAll.every(r => roles.has(r)))    return { allow: false, reason: "missing-role" };

        // 2) resource checks (delegated to app)
        if (options.resource) {
            const loader = this.registry.loaders.get(options.resource.load);

            if (!loader) {
                return {allow: false, reason: "unknown-loader"};
            }

            const id = await this.registry.readLocation(ctx, options.resource.from);
            const resource = await loader(ctx, id);
            const checks   = options.resource.checks ?? [];
            const results  = await Promise.all(
                checks.map(name => {
                    const fn = this.registry.checks.get(name);
                    return fn ? Promise.resolve(fn(ctx, resource)) : Promise.resolve(false);
                })
            );
            const ok = (options.resource.mode ?? "any") === "any"
                ? results.some(Boolean)
                : results.every(Boolean);
            if (!ok) return { allow: false, reason: "resource-check-failed" };
        }

        // 3) named policies (delegated to app)
        for (const pol of options.policies ?? []) {
            const fn = this.registry.policies.get(pol);
            if (!fn || !(await fn(ctx))) return { allow: false, reason: `policy:${pol}` };
        }

        return { allow: true };
    }
}
