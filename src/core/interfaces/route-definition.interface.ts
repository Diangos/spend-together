import {HttpMethod, OpenAPIV3_1} from "~/core/index.ts";

export interface RouteDefinitionInterface {
    path: string;
    requestMethod: HttpMethod;
    methodName: string;
    version: string;
    routeMetadata: OpenAPIV3_1.OperationObject;
}