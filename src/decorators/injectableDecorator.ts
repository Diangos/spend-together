export function Injectable(): ClassDecorator {
    // deno-lint-ignore ban-types
    return (_target: Function) => {
        // Optionally, register service immediately with DI container.
        // For this example, DI will resolve it when needed.
    };
}