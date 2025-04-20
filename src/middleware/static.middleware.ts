import {Context, send} from "jsr:@oak/oak";

export async function staticMiddleware(ctx: Context, next: () => Promise<unknown>): Promise<void> {
    try {
        await send(ctx, ctx.request.url.pathname, {
            root: `${Deno.cwd()}/public`,
            index: "index.html",
        });
    } catch {
        await next(); // move on if no static file found
    }
}