import {Context} from "jsr:@oak/oak";
import {Logger} from "~/core/classes/logger.class.ts";
import {CustomMiddleware} from "~/core/interfaces/middleware.interface.ts";
import {Middleware} from "~/core/decorators/middleware.decorator.ts";

@Middleware()
export class LoggerMiddleware implements CustomMiddleware {
    async handle(
        ctx: Context,
        next: () => Promise<unknown>,
    ): Promise<void> {
        Logger.info(` [Request] ${ctx.request.method.padStart(5, ' ')} ${ctx.request.url} - ${ctx.request.ip}`);
        await next();
        Logger.debug(`[Response] ${ctx.request.method.padStart(5, ' ')} [${ctx.response.status}] ${ctx.request.url} - ${ctx.request.ip}`);
    }
}
