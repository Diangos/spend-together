import { Context } from "jsr:@oak/oak";

export type OakMiddleware =
    (context: Context, next: () => Promise<unknown>) => Promise<void> | void;

export interface CustomMiddleware {
    handle(context: Context, next: () => Promise<unknown>): Promise<void>;
}