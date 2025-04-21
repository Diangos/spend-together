import {Application, Context} from "jsr:@oak/oak";
import {load} from "jsr:@std/dotenv";
import {Logger} from "~/core/classes/logger.class.ts";
import {buildRouter, loggerMiddleware, swaggerMiddleware} from "~/core/index.ts";
import {DB} from "~/db/db.ts";
import {errorMiddleware, staticMiddleware} from "~/middleware/index.ts";

import "~/controllers/users.controller.ts";

export async function bootstrap() {
  await load({ envPath: "./.env", export: true });
  Logger.level = Logger.convertLogLevelToEnum(Deno.env.get("LOG_LEVEL"));

  const app = new Application();
  const router = buildRouter();
  const port = Number(Deno.env.get("PORT") ?? 8000);

  try {
    Logger.info(`Creating the DB connection pool`);
    await DB.instance.pool.getConnection();
    Logger.info(`DB connection pool created successfully`);
  } catch (error) {
    Logger.error("Database connection failed:", error);
    await DB.instance.pool.end();
    Deno.exit(1);
  }

  app.use(errorMiddleware);
  Logger.info(`Error Middleware loaded`);
  app.use(loggerMiddleware);
  Logger.info(`Logger Middleware loaded`);
  app.use(router.routes());
  app.use(router.allowedMethods());
  Logger.info('All routes registered');
  app.use(swaggerMiddleware);
  Logger.info(`Swagger Middleware loaded`);
  app.use(staticMiddleware);
  Logger.info(`Static Middleware loaded`);

  // Explicit 404 Fallback
  app.use((ctx: Context) => {
    ctx.response.status = 404;
    ctx.response.body = { error: "Not Found" };
    Logger.warn(`Not Found: ${ctx.request.method} ${ctx.request.url}`);
  });

  Logger.info(Logger.separator);

  try {
    Logger.info(`Server running on http://localhost:${port}`);
    await app.listen({port});
  } catch (error: unknown) {
    Logger.error(`The server encountered an unhandled error: ${error}`);
  } finally {
    Logger.info("Server shutting down");
  }
}
