import {Context, send} from "jsr:@oak/oak";
import {Middleware} from "~/core/decorators/middleware.decorator.ts";
import {CustomMiddleware} from "~/core/interfaces/middleware.interface.ts";

@Middleware()
export class StaticMiddleware implements CustomMiddleware {
    async handle(ctx: Context, next: () => Promise<unknown>): Promise<void> {
        try {
            await send(ctx, ctx.request.url.pathname, {
                root: `${Deno.cwd()}/public`,
                index: "index.html",
            });
        } catch {
            await next(); // move on if no static file found
        }
    }
}