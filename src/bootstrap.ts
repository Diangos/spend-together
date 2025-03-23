import {Application} from "jsr:@oak/oak";
import {load} from "jsr:@std/dotenv";
import {buildRouter, swaggerMiddleware} from "~/core/index.ts";
import {errorMiddleware} from "~/middleware/error.middleware.ts";
import {staticMiddleware} from "~/middleware/static.middleware.ts";

import "~/controllers/users.controller.ts";

export async function bootstrap() {
  await load({envPath: './.env', export: true});

  const app = new Application();
  const router = buildRouter();
  const port = Number(Deno.env.get("PORT") ?? 8000);

  app.use(errorMiddleware);
  app.use(swaggerMiddleware);
  app.use(staticMiddleware);
  app.use(router.routes());
  app.use(router.allowedMethods());

  console.log(`Server running on http://localhost:${port}`);
  await app.listen({ port });
}
