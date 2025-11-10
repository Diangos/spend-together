/**
 * Authorization-related types and interfaces. These are used in the
 * @Authorize decorator and the PolicyEngine implementation.
 */

import { Context } from "jsr:@oak/oak";

export type AuthorizeDecorator = {
    (opts?: AuthorizationOptions): MethodDecorator;
    anyScopes: (...s: string[]) => MethodDecorator;
    allScopes: (...s: string[]) => MethodDecorator;
    roles:     (...r: string[]) => MethodDecorator;
    policies:  (...p: string[]) => MethodDecorator;
};

/**
 * What to return when access is denied (overrideable per endpoint).
 */
export type DenyResponse = {
    code?: number;
    message?: string;
};

/**
 * Declarative, serializable rules a route can express.
 */
export type AuthorizationOptions = "authenticated" | {
    // role/scope primitives (fast checks)
    anyScopes?: string[];   // OR: user must have at least one
    allScopes?: string[];   // AND: user must have all
    rolesAny?: string[];    // OR
    rolesAll?: string[];    // AND

    // generic resource check hook – core doesn't know the business meaning
    resource?: {
        load: string;         // loader name in the app's PolicyRegistry
        from: { pathParam?: string; query?: string; body?: string };
        checks?: string[];    // check names in app's registry (e.g., "owner", "role(admin)")
        mode?: "any" | "all"; // default "any"
    };

    // named policy bundles – app-defined (e.g., "can.manage.users")
    policies?: string[];

    // response if deny (optional)
    denyResponse?: DenyResponse;
};

/**
 * Engine decision
 */
export type Decision = { allow: boolean; reason?: string };

/**
 * Minimal shape of the authenticated user we expect in ctx.state.user.
 */
export type RequestUser = {
    id?: string | number;
    roles?: string[];
    scopes?: string[]; // optional; can reuse roles as scopes if you want
    [k: string]: unknown; // room for custom options
};

/**
 * An engine takes ctx + options and decides. Implementation is app-supplied.
 */
export interface PolicyEngine {
    evaluate(ctx: Context, options: AuthorizationOptions): Promise<Decision>;
}

/**
 * The app owns these registries; core only calls them by name.
 */
export interface PolicyRegistry {
    loaders: Map<string, (ctx: Context, id: unknown) => Promise<unknown>>;
    checks:  Map<string, (ctx: Context, resource: unknown) => Promise<boolean> | boolean>;
    policies:Map<string, (ctx: Context) => Promise<boolean> | boolean>;

    /** Helper to read id/selector from request without coupling to your framework details. */
    readLocation(ctx: Context, from?: { pathParam?: string; query?: string; body?: string }): Promise<unknown>;
}