import { Context } from "jsr:@oak/oak";
import {PolicyRegistry} from "~/core/index.ts";

export const AppPolicyRegistry: PolicyRegistry = {
    loaders: new Map(),
    checks:  new Map(),
    policies: new Map(),

    readLocation(ctx: Context, from?: { pathParam?: string; query?: string; body?: string }): Promise<unknown> {
        if (!from) {
            return Promise.resolve(undefined);
        }
        if (from.pathParam) {
            const params = (ctx as unknown as { params?: Record<string, string> }).params ?? {};
            return Promise.resolve(params[from.pathParam]);
        }
        if (from.query) {
            return Promise.resolve(ctx.request.url.searchParams.get(from.query));
        }
        if (from.body) {
            return Promise.resolve(ctx.state?.bodyJson?.[from.body]);
        }

        return Promise.resolve(undefined);
    }
};

// The policy for GET /users
AppPolicyRegistry.policies.set("users:read", (ctx) => {
        const auth = ctx.state.user ?? {
        roles: new Set<string>(),
        buildingAdminOf: [],
        ownerOfUnits: []
    };

    if (auth.roles.has("platform_admin")) {
        return true;
    }

    if (auth.buildingAdminOf.length > 0) {
        return true;
    }

    if (auth.ownerOfUnits.length > 0) {
        return true;
    }

    return false; // Users with no relevant memberships → no access
});