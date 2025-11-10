import "https://deno.land/x/reflect_metadata@v0.1.12/mod.ts";
import "npm:reflect-metadata";
import { assertEquals, assertThrows } from "https://deno.land/std/assert/mod.ts";
import { DIContainer } from "~/core/dependencyInjection/diContainer.ts";
import { Injectable } from "~/core/decorators/injectable.decorator.ts";

Deno.test("DIContainer resolves class without dependencies", () => {
  @Injectable()
  class A { value = 42 }
  const a = DIContainer.instance.resolve(A as unknown as new (...args: unknown[]) => A);
  assertEquals(a instanceof A, true);
  assertEquals(a.value, 42);
});

Deno.test("DIContainer resolves class with constructor dependencies", () => {
  @Injectable()
  class A { value = 1 }
  @Injectable()
  class B { constructor(public a: A) {} }
  const b = DIContainer.instance.resolve(B as unknown as new (...args: unknown[]) => B);
  assertEquals(b instanceof B, true);
  assertEquals(b.a instanceof A, true);
  assertEquals(b.a.value, 1);
});

Deno.test("DIContainer register/resolve by string token", () => {
  const TOKEN = "core:PolicyEngine-test";
  const instance = { name: "engine" };
  DIContainer.instance.register(TOKEN, instance);
  const resolved = DIContainer.instance.resolve<typeof instance>(TOKEN);
  assertEquals(resolved, instance);
});

Deno.test("DIContainer throws for unresolved string token", () => {
  assertThrows(() => DIContainer.instance.resolve("unknown:token"));
});
