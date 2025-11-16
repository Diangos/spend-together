import {create, getNumericDate, Header, Payload} from "jsr:@zaubrik/djwt";
import {Injectable} from "~/core/index.ts";

// ───────────────────────────────────────────────────────────────────────────────
// TODO: replace with DOTENV variables and secure secrets management
// ───────────────────────────────────────────────────────────────────────────────

const ACCESS_TTL_MIN = 15;         // short-lived access token

// HS256 for simplicity; prefer RS256/ES256 if you rotate keys/public verify
// Lazy initialization to ensure environment variables are loaded first
let ACCESS_SECRET: CryptoKey | null = null;

async function getAccessSecret(): Promise<CryptoKey> {
    if (ACCESS_SECRET) {
        return ACCESS_SECRET;
    }

    const accessSecretEnv = Deno.env.get("ACCESS_SECRET");

    if (!accessSecretEnv) {
        throw new Error("ACCESS_SECRET environment variable is not set. Refusing to start for security reasons.");
    }

    ACCESS_SECRET = await crypto.subtle.importKey(
        "raw",
        (new TextEncoder().encode(accessSecretEnv)),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"] // add "verify" if you also verify in this module
    );

    return ACCESS_SECRET;
}

@Injectable()
export class AuthenticationService {
    /**
     * Hash a refresh token with SHA-256 and return raw bytes
     * since the token in the DB is BINARY(32).
     */
    public async generateTokenHash(token: string): Promise<Uint8Array> {
        const enc = new TextEncoder().encode(token);
        const digest = await crypto.subtle.digest("SHA-256", enc);
        return new Uint8Array(digest); // 32 bytes
    }

    /**
     * Sign a short-lived access JWT.
     * Keep claims minimal: sub, roles/scopes, optional org, jti, exp.
     */
    async signAccessJWT(claims: Partial<Payload>): Promise<string> {
        const secret = await getAccessSecret();
        const header: Header = { alg: "HS256", typ: "JWT" };
        const payload: Payload = {
            ...claims,
            jti: crypto.randomUUID(),
            iat: getNumericDate(0),
            exp: getNumericDate(ACCESS_TTL_MIN * 60),
        };
        return await create(header, payload, secret);
    }
}