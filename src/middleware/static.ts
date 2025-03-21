import {Context} from "jsr:@oak/oak";

export async function staticMiddleware(ctx: Context, next: () => Promise<unknown>): Promise<void> {
    const path = ctx.request.url.pathname;

    // If the request is for the API, just continue
    if (
        path.startsWith("/api/")) {
        await next();
        return;
    }

    // Determine if the path looks like it refers to a file (has an extension)
    const hasExtension = /\.[^\/]+$/.test(path);

    try {
        if (hasExtension) {
            // If it has an extension, attempt to serve the exact file.
            await ctx.send({
                root: `${Deno.cwd()}/public`,
                path: path,
            });
        } else {
            // If there's no extension, serve index.html as the fallback.
            await ctx.send({
                root: `${Deno.cwd()}/public`,
                path: "index.html",
            });
        }
    } catch (e) {
        if (hasExtension) {
            // If a file with an extension is not found, respond with 404.
            ctx.response.status = 404;
            ctx.response.body = { error: "File not found" };
        } else {
            // If it doesn't have an extension and sending index.html fails,
            // you might want to log the error and return a 500.
            console.error("Error serving index.html fallback", e);
            ctx.response.status = 500;
            ctx.response.body = { error: "Internal server error" };
        }
    }
}