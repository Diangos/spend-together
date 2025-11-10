# Dependency Injection
The project features a rudimentary system for dependency injection. This allows us to use decorators and
`string` / `symbol` variables as identifiers for dependencies.

## Registering Dependencies
To register a dependency, use the `register` function. This function takes an identifier/token and the
dependency to be registered. Any class can be automatically registered using the `@Injectable` decorator.

### Registering via decorator
```typescript
import {Injectable} from "~/core/decorators/injectable.decorator";

@Injectable()
export class Bibi {
    // Class implementation
}
```

### Manual Registration
We can also register stuff manually, using the `DIContainer.instance.register()` method. This takes two 
parameters
 - The token/identifier (string / symbol or a class)
 - An instance of the dependency to register - can be anything, really

Example:
```typescript
import {DIContainer} from '~/core/dependencyInjection/diContainer';

// The x:y syntax below has no meaning. Use any token you like.
DIContainer.instance.register('core:logger', new Logger());
DIContainer.instance.register(
    Symbol.for('core:config'), {
    password: 'do not scrape GitHub for secrets'
});
```
## Resolving Dependencies
Once registered, dependencies can be resolved using the `DIContainer.instance.resolve()` method.
This method takes a single parameter - the token/identifier of the dependency to resolve.

Example:
```typescript
import {DIContainer} from '~/core/dependencyInjection/diContainer';

const logger = DIContainer.instance.resolve<Logger>('core:logger');
```