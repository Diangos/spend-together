import {verify as verifyArgon2} from "jsr:@felix/argon2";
import {Context} from "jsr:@oak/oak";
import {Logger} from "~/core/classes/logger.class.ts";
import {Controller, Post} from "~/core/index.ts";
import AuthenticationModel from "~/models/authentication.model.ts";
import UserModel from "~/models/users.model.ts";
import {loginSchema} from "~/schemas/auth.schema.ts";
import {AuthenticationService} from "~/services/authentication.service.ts";
import {GeneralService} from "~/services/general.service.ts";

// ───────────────────────────────────────────────────────────────────────────────
// TODO: replace with DOTENV variables and secure secrets management
// ───────────────────────────────────────────────────────────────────────────────
const REFRESH_TTL_DAYS = 14;       // long-lived refresh session
const SECURE_COOKIES = false;      // set true in prod over HTTPS
const COOKIE_NAME = "refresh";

// Argon2 dummy hash (hash of "invalid") for constant-time mitigation
const DUMMY_HASH =
    "$argon2i$v=19$m=4096,t=3,p=1$rboCX6NY3Yh26iEzgKEmWA$daswToHMDCu94YHLk1a8Bhy9THuTJkA9fTA6QdCTqkc";

@Controller('authentication')
export class AuthenticationController {
    constructor(
        public generalService: GeneralService,
        public userModel: UserModel,
        public authenticationService: AuthenticationService,
        public authenticationModel: AuthenticationModel
    ) {
    }

    @Post('login', {
        summary: 'User Login',
        description: 'Handles user login and returns a success message.',
        tags: ['Authentication'],
        responses: {
            200: {
                description: 'Login successful',
                content: {
                    'application/json': {
                        schema: {
                            type: 'string',
                            example: 'Login successful'
                        }
                    }
                }
            },
            400: {
                description: 'Bad Request',
                content: {
                    'application/json': {
                        schema: {
                            type: 'string',
                            example: 'Invalid credentials'
                        }
                    }
                }
            }
        }
    })
    public async login(ctx: Context) {
        const {success, parseResult} = await this.generalService.getAndValidateBody(ctx, loginSchema);
        const data = parseResult.data;

        if (!success) {
            return;
        }

        try {
            const user = await this.userModel.getUserByUsername(data.username);

            // TODO: add maximum login attempts and lockout mechanism
            const hashToCheck = user?.password ?? DUMMY_HASH;   // Constant-time mitigation
            const isValid = await verifyArgon2(hashToCheck, data.password);

            if (!user || !isValid) {
                Logger.info(`Invalid login for ${Logger.em(data.username)}.`, ctx.request.ip);
                ctx.response.status = 401;
                ctx.response.body = { message: "Invalid credentials" };
                return;
            }

            if (!user.verifiedAt) {
                Logger.info(`Unverified account login attempt for ${Logger.em(data.username)}.`, ctx.request.ip);
                ctx.response.status = 403;
                ctx.response.body = { message: "Account not activated" };
                return;
            }

            this.userModel.setLastLoggedIn(user.id)
            await this.createTokenData(ctx, user);
        } catch (e) {
            Logger.error(`An error occurred during login attempt for user with username ${Logger.em(data.username)}.`, e);
            ctx.response.status = 500;
            ctx.response.body = {message: `Internal server error.`};
            return;
        }

        return;
    }

    /**
     * Creates and stores a refresh token, then sets it as a cookie in the response.
     * @param ctx
     * @param user
     * @private
     */
    private async createTokenData(ctx: Context, user: { id: number, username: string }) {
        // User authenticated, create token
        const expiryTime = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3_600_000);
        const token = crypto.randomUUID();

        await this.authenticationModel.createRefreshToken({
            tokenHash: await this.authenticationService.generateTokenHash(token),
            userId: user.id,
            expiresAt: expiryTime,
            ip: ctx.request.ip,
            userAgent: ctx.request.headers.get("user-agent") ?? 'unknown'
        });

        ctx.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: SECURE_COOKIES,
            sameSite: "strict",
            expires: expiryTime,
            path: '/'
        })

        const roles = await this.userModel.getRolesForUser(user.id).catch(() => []);
        const jwt = await this.authenticationService.signAccessJWT({
            sub: String(user.id),
            roles: roles,
        });

        ctx.response.status = 200;
        ctx.response.body = { access: jwt }
    }
}