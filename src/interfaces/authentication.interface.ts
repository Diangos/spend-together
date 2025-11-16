export interface AuthClaims {
    // [Required] User id as string
    sub: string;
    // [Required] Expiration time (in unix seconds)
    exp: number;
    // [Required] Authorization version (for cache/invalidations)
    av: number;

    // optional
    iat?: number;
    nbf?: number;
    jti?: string;
    roles?: string[];
}