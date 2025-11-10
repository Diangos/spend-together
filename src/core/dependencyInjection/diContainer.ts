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

    public register<T>(token: string | symbol | (new (...args: unknown[]) => T), instance: T): void {
        this.providers.set(token, instance);
    }

    public resolve<T>(token: string | symbol | (new (...args: unknown[]) => T)): T {
        if (this.providers.has(token)) {
            return this.providers.get(token) as T;
        }

        // If token is a non-constructor (string/symbol) and not registered, fail fast.
        if (["string", "symbol"].includes(typeof token)) {
            throw new Error(`DIContainer: No provider found for token: ${String(token)}`);
        }

        // Token is a class constructor → build instance (auto self-binding)
        const paramTypes: Array<unknown> = Reflect.getMetadata("design:paramtypes", token) || [];
        const params = paramTypes.map((param: unknown) => this.resolve(param as new (...args: unknown[]) => unknown));
        const instance = new (token as new (...args: unknown[]) => T)(...params);

        this.register(token, instance);

        return instance;
    }
}