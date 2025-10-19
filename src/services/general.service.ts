import {Context} from "jsr:@oak/oak";
import {ZodObject} from "npm:zod@3.24.2/lib/types.d.ts";
import {Logger} from "~/core/classes/logger.class.ts";
import {Injectable} from "~/core/index.ts";

@Injectable()
export class GeneralService {
    public async getAndValidateBody(ctx: Context, schema: ZodObject<unknown>) {
        let success = true;
        const body = await ctx.request.body.json();
        const parseResult = schema.safeParse(body);

        if (!parseResult.success) {
            const formattedError = parseResult.error.format();

                        ctx.response.status = 400;
            ctx.response.body = {
                error: 'Validation failure',
                message: formattedError
            };

            success = false;
            Logger.warn('Invalid user activation data:', formattedError);
        }

        return {success, parseResult};
    }

    public isErrorADuplicateError(e: unknown) {
        return (
            e &&
            typeof e === "object" &&
            ('code' in e) &&
            (e as { code: string }).code.includes('ER_DUP_ENTRY')
        );
    }
}