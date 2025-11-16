import {Application, Context, } from "jsr:@oak/oak";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import {AppPolicyRegistry} from "~/authorization/policy.authorization.ts";
import {
    buildRouter,
    DefaultPolicyEngine,
    DIContainer,
    Logger,
    LoggerMiddleware,
    POLICY_ENGINE_TOKEN,
    SwaggerMiddleware,
    middlewareResolver,
} from "~/core/index.ts";
import {initCore} from "~/core/main.ts";
import {DB} from "~/db/db.ts";
import {ErrorMiddleware, StaticMiddleware, JsonBodyMiddleware, JwtMiddleware} from "~/middleware/index.ts";

/**
 * Controller imports (services and models get imported and created as needed)
 */
import "~/controllers/authentication.controller.ts";
import "~/controllers/users.controller.ts";

export async function bootstrap() {

    // Initialize core components (Dependency Injection, Logger, etc.)
    initCore();

    // We use the default policy engine with our app's policy registry
    // This basically tells the @Authorize decorator how to decide who
    // can access what.
    // We still need to populate the context for the policy engine
    // (i.e., ctx.state.user) in the authentication middleware, though
    const policyEngine = new DefaultPolicyEngine(AppPolicyRegistry);
    DIContainer.instance.register(POLICY_ENGINE_TOKEN, policyEngine);

    // Initialize Oak App
    const app = new Application();
    // Build routes and instantiate controllers and their dependencies
    const router = buildRouter();
    // Set a port to listen to
    const port = Number(Deno.env.get("PORT") ?? 8000);

    try {
        await DB.instance.pool.getConnection();
        Logger.info(`✔️ DB connection pool created successfully`);
    } catch (error) {
        Logger.error("Database connection failed:", error);
        await DB.instance.pool.end();
        Deno.exit(1);
    }

    app.use(middlewareResolver(ErrorMiddleware));
    app.use(middlewareResolver(LoggerMiddleware));
    app.use(oakCors({
        origin: "http://localhost:4200",
        credentials: true,
        optionsSuccessStatus: 200,
    }));
    app.use(middlewareResolver(JsonBodyMiddleware));
    app.use(middlewareResolver(JwtMiddleware));
    app.use(router.routes());
    app.use(router.allowedMethods());
    Logger.info("🆗 All routes registered");
    app.use(middlewareResolver(SwaggerMiddleware));
    app.use(middlewareResolver(StaticMiddleware));

    // Explicit 404 Fallback
    app.use((ctx: Context) => {
        ctx.response.status = 404;
        ctx.response.body = {error: "Not Found"};
        Logger.warn(`Not Found: ${ctx.request.method} ${ctx.request.url}`);
    });

    Logger.info(Logger.separator);

    try {
        Logger.info(`🚀 Server running on http://localhost:${port}`);
        await app.listen({port});
    } catch (error: unknown) {
        Logger.error(`The server encountered an unhandled error: ${error}`);
    } finally {
        Logger.info("Server shutting down");
    }
}
