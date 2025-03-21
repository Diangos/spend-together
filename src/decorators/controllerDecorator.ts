export const controllers: unknown[] = [];

export function Controller(prefix: string = ""): ClassDecorator {
    // deno-lint-ignore ban-types
    return (target: Function) => {
        Reflect.defineMetadata("prefix", prefix, target);
        controllers.push(target);
    };
}