import { Context } from "jsr:@oak/oak";
import {PolicyRegistry} from "../index.ts";

export const DefaultPolicyRegistry: PolicyRegistry = {
    loaders:  new Map(),    // no loaders by default
    checks:   new Map(),    // no checks by default
    policies: new Map(),    // no policies by default

    readLocation(
        ctx: Context,
        from?: { pathParam?: string; query?: string; body?: string }
    ): Promise<unknown> {
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
            return Promise.resolve((ctx.state?.bodyJson ?? {})[from.body]);
        }

        return Promise.resolve(undefined);
    }
};