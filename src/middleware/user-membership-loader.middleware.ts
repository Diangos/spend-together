import {Middleware} from "~/core/decorators/middleware.decorator.ts";
import {CustomMiddleware} from "~/core/interfaces/middleware.interface.ts";

@Middleware()
export class UserMembershipLoaderMiddleware implements CustomMiddleware {
    async handle() {
        // TODO: load into ctx.state the user's membership details (roles, groups, etc.)
    }
}