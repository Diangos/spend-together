import { Context } from "jsr:@oak/oak";
import {CustomMiddleware, Middleware} from "~/core/index.ts";

@Middleware()
export class JsonBodyMiddleware implements CustomMiddleware {
    async handle(context: Context, next: () => Promise<unknown>): Promise<void> {
        if (
            context.request.hasBody &&
            context.request.headers.get("content-type")?.includes("application/json")
        ) {
            try {
                context.state.bodyJson = await context.request.body.json();
            } catch {
                context.state.bodyJson = undefined;
            }
        }

        await next();
    }
}