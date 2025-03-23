import {Context, isHttpError} from "jsr:@oak/oak";

export async function errorMiddleware (ctx: Context, next: () => Promise<unknown>): Promise<void> {
    try {
        await next();
    } catch (err) {
        console.error(err);

        if (isHttpError(err)) {
            ctx.response.status = err.status;
            ctx.response.body = { error: err.message };
        } else {
            ctx.response.status = 500;
            ctx.response.body = { error: 'Internal Server Error' };
        }
    }
}