import {Application} from "jsr:@oak/oak";
import {buildRouter, swaggerMiddleware} from "~/core/index.ts";
import {staticMiddleware} from "~/middleware/static.ts";

import "~/controllers/usersController.ts";
import env = Deno.env;

export async function bootstrap() {
  const app = new Application();
  const router = buildRouter();
  const port = Number(env.get("port") ?? 8000);

  app.use(swaggerMiddleware);
  app.use(staticMiddleware);
  app.use(router.routes());
  app.use(router.allowedMethods());

  console.log(`Server running on http://localhost:${port}`);
  await app.listen({ port });
}
