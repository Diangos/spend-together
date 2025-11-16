import {Context} from "jsr:@oak/oak";
import {Logger} from "~/core/classes/logger.class.ts";
import {controllers, OpenAPIV3_1, routes} from "~/core/index.ts";
import {Middleware} from "~/core/decorators/middleware.decorator.ts";
import {CustomMiddleware} from "~/core/interfaces/middleware.interface.ts";

function generateOpenApiSpec(): OpenAPIV3_1.Document {
    const spec: OpenAPIV3_1.Document = {
        openapi: "3.0.3",
        info: {
            title: "Main API",
            version: "1.0.0",
            description: "An API for the main application",
        },
        servers: [{
            url: `http://localhost:${Number(Deno.env.get("PORT") ?? 8000)}/api`, // TODO: build the URL dynamically
            description: "Local dev server",
        }],
        paths: {},
    };

    for (const controller of controllers) {
        let prefix = Reflect.getMetadata("prefix", controller as Object) || "";
        const controllerRoutes = routes.get(controller) || [];

        if (prefix.startsWith("/")) {
            prefix = prefix.substring(1);
        }

        for (const route of controllerRoutes) {
            const path = `/${route.version}/${prefix}${
                route.path ? "/" + route.path : ""
            }`;

            spec.paths[path] = {
                [route.requestMethod]: {
                    tags: [prefix],
                    summary: route.routeMetadata.summary,
                    // operationId: route.methodName,
                    description: route.routeMetadata.description,
                    requestBody: route.routeMetadata.requestBody,
                    responses: Object.fromEntries(
                        Object.entries(route.routeMetadata.responses as object).map(
                            ([status, response]: [string, { description: unknown }]) => [
                                status,
                                { description: response.description },
                            ],
                        ),
                    ),
                },
            };
        }
    }

    return spec;
}

@Middleware()
export class SwaggerMiddleware implements CustomMiddleware {
         async handle(
        ctx: Context,
        next: () => Promise<unknown>,
    ): Promise<void> {
        const path = ctx.request.url.pathname;

        // If the request is for the API, just continue
        if (!["/openapi.json", "/docs"].some(allowedPaths => path.startsWith(allowedPaths))) {
            await next();
            return;
        }

        try {
            if (path === "/openapi.json") {
                ctx.response.body = generateOpenApiSpec();
            }

            if (path === "/docs") {
                ctx.response.body = await Deno.readTextFile(
                    Deno.cwd() + "/src/core/static/swagger.html",
                );
            }
        } catch (e) {
            Logger.error('Error in swagger middleware:', e);
        }
    }
}