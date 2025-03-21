export class DIContainer {
    private static _instance: DIContainer;
    public static get instance(): DIContainer {
        if (!DIContainer._instance) {
            DIContainer._instance = new DIContainer();
        }
        return DIContainer._instance;
    };

    private providers: Map<unknown, unknown> = new Map();

    private constructor() {}

    public register<T>(token: new (...args: unknown[]) => T, instance: T): void {
        this.providers.set(token, instance);
    }

    public resolve<T>(token: new (...args: unknown[]) => T): T {
        if (this.providers.has(token)) {
            return this.providers.get(token) as T;
        }

        // Resolve constructor dependencies using Reflect metadata.
        const paramTypes: Array<unknown> = Reflect.getMetadata("design:paramtypes", token) || [];
        const params = paramTypes.map((param: unknown) => this.resolve(param as new (...args: unknown[]) => unknown));
        const instance = new token(...params) as T;

        this.register(token, instance);

        return instance;
    }
}