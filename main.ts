import {Reflect} from "https://deno.land/x/reflect_metadata@v0.1.12/mod.ts";
import "npm:reflect-metadata"; // Required for Typescript to recognize the polyfill
import {bootstrap} from "~/bootstrap.ts";

export const Ref = Reflect; // required for decorators
await bootstrap();