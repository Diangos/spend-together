// deno-lint-ignore-file no-explicit-any ban-types
import {RouteDefinitionInterface} from "~/interfaces/routeDefinitionInterface.ts";
import {HttpMethod} from "~/types/httpMethod.ts";
import {OpenAPIV3_1} from "~/types/openApiSchema.ts";

export const routes: Map<unknown, RouteDefinitionInterface[]> = new Map();

function createRouteDecorator(method: HttpMethod) {
    return (path: string | {path: string, version: string}, routeMetadata: OpenAPIV3_1.OperationObject): MethodDecorator => {
        if (typeof path === "string") {
            path = {path, version: "v1"};
        }

        return (target: Object, propertyKey: string|symbol, _descriptor?: PropertyDescriptor) => {
            const targetConstructor = target.constructor
            const controllerRoutes = routes.get(targetConstructor) ?? [];

            controllerRoutes.push({
                requestMethod: method,
                path: path.path,
                methodName: propertyKey.toString(),
                version: path.version,
                routeMetadata
            });

            routes.set(targetConstructor, controllerRoutes);
        };
    };
}

export const Get = createRouteDecorator("get") as any;
export const Post = createRouteDecorator("post") as any;
export const Put = createRouteDecorator("put") as any;
export const Delete = createRouteDecorator("delete") as any;