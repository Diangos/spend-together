import {HttpMethod} from "~/types/httpMethod.ts";
import {OpenAPIV3_1} from "~/types/openApiSchema.ts";

export interface RouteDefinitionInterface {
    path: string;
    requestMethod: HttpMethod;
    methodName: string;
    version: string;
    routeMetadata: OpenAPIV3_1.OperationObject;
}