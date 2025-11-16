import {Context, isHttpError} from "jsr:@oak/oak";
import {CustomMiddleware, Middleware} from "~/core/index.ts";

@Middleware()
export class ErrorMiddleware implements CustomMiddleware {
    async handle(ctx: Context, next: () => Promise<unknown>): Promise<void> {
        try {
            await next();
        } catch (err) {
            console.error(err);

            if (isHttpError(err)) {
                ctx.response.status = err.status;
                ctx.response.body = {error: err.message};
            } else {
                ctx.response.status = 500;
                ctx.response.body = {error: 'Internal Server Error'};
            }
        }
    }
}