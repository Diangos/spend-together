import { Context } from "jsr:@oak/oak";
import { verify } from "jsr:@zaubrik/djwt";
import {CustomMiddleware, Middleware, Logger } from "~/core/index.ts";
import {AuthClaims} from "~/interfaces/authentication.interface.ts";

// HS256 for simplicity; prefer RS256/ES256 if you rotate keys/public verify
const accessSecretEnv = Deno.env.get("ACCESS_SECRET");

if (!accessSecretEnv) {
    throw new Error("ACCESS_SECRET environment variable is not set. Refusing to start for security reasons.");
}
const ACCESS_SECRET: CryptoKey = await crypto.subtle.importKey(
    "raw",
    (new TextEncoder().encode(accessSecretEnv)),
    { name: "HMAC", hash: "SHA-256" },
    false,
        ["sign", "verify"] // allow both signing and verification
);

// If you ever move to RS256/ES256, import keys and pass the CryptoKey instead.

@Middleware()
export class JwtMiddleware implements CustomMiddleware {
    async handle(context: Context, next: () => Promise<unknown>): Promise<void> {
        const authorization = context.request.headers.get("authorization");

        // No header → treat as public; downstream decorators decide if allowed
        if (!authorization) {
            await next();
            return;
        }

        const [scheme, token] = authorization.split(" ");
        const isBearer = scheme?.toLowerCase() === "bearer";
        if (!isBearer || !token) {
            context.response.status = 401;
            context.response.body = { message: "Invalid Authorization header" };
            return;
        }

        try {
            // 1) Verify signature
            const claims = (await verify(token, ACCESS_SECRET)) as Partial<AuthClaims>;

            // 2) Validate time-based claims (explicit; keeps behavior obvious)
            const now = Math.floor(Date.now() / 1000);

            if (typeof claims.exp !== "number" || now >= claims.exp) {
                context.response.status = 401;
                context.response.body = { message: "Token expired" };
                return;
            }
            if (typeof claims.nbf === "number" && now < claims.nbf) {
                context.response.status = 401;
                context.response.body = { message: "Token not active yet" };
                return;
            }

            // 3) Stash on state for downstream use (Authorize(), services, etc.)
            context.state.user = claims;
            context.state.jwt = { raw: token, exp: claims.exp };

            await next();
        } catch (e) {
            Logger.error(e);
            context.response.status = 401;
            context.response.body = { message: "Invalid token" };
        }
    }
}
