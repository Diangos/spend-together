import {Context} from "jsr:@oak/oak";
import {controllers, OpenAPIV3_1, routes} from "~/core/index.ts";

function generateOpenApiSpec(): OpenAPIV3_1.Document {
    const spec: OpenAPIV3_1.Document = {
        openapi: "3.0.3",
        info: {
            title: "Main API",
            version: "1.0.0",
            description: "An API for the main application",
        },
        servers: [{
            url: "http://localhost:8000/api", // TODO: build the URL dynamically
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

export async function swaggerMiddleware(
    ctx: Context,
    next: () => Promise<unknown>,
): Promise<void> {
    const path = ctx.request.url.pathname;

    // If the request is for the API, just continue
    if (!["/openapi.json", "/docs"].some(allowedPaths => path.startsWith(allowedPaths))) {
        await next();
        return;
    }

    if (path === "/openapi.json") {
        ctx.response.body = generateOpenApiSpec();
    }

    if (path === "/docs") {
        ctx.response.body = await Deno.readTextFile(
            Deno.cwd() + "/src/core/static/swagger.html",
        );
    }
}
