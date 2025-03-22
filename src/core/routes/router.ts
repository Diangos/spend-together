import {Router} from "jsr:@oak/oak";
import {Context} from "jsr:@oak/oak/context";
import {controllers, DIContainer, routes} from "~/core/index.ts";

type RequestHandler = (context: Context) => unknown;
type ControllerWithHandlers = { [key: string]: RequestHandler };

export function buildRouter(): Router {
    const router = new Router();

    // For each registered controller...
    for (const controller of controllers) {
        // deno-lint-ignore ban-types
        let prefix = Reflect.getMetadata("prefix", controller as Object) || "";
        // Resolve an instance using the DI container.
        const instance = DIContainer.instance.resolve<ControllerWithHandlers>(controller as new (...args: unknown[]) => ControllerWithHandlers);
        const controllerRoutes = routes.get(controller) || [];

        if (prefix.startsWith('/')) {
            prefix = prefix.substring(1);
        }

        // Register each route.
        for (const routeDef of controllerRoutes) {
            let fullPath = `/api/${routeDef.version}/${prefix}`;    // ex. /api/v1/users

            if (routeDef.path) {
                fullPath += `/${routeDef.path}`
            }

            const handler = (context: Context) => instance[routeDef.methodName](context);

            switch (routeDef.requestMethod) {
                case "get":
                    router.get(fullPath, handler);
                    break;
                case "post":
                    router.post(fullPath, handler);
                    break;
                case "put":
                    router.put(fullPath, handler);
                    break;
                case "delete":
                    router.delete(fullPath, handler);
                    break;
            }
        }
    }

    return router;
}