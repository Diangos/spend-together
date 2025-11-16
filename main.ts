import {Reflect} from "https://deno.land/x/reflect_metadata@v0.1.12/mod.ts";
import "npm:reflect-metadata";
import {load} from "jsr:@std/dotenv";
import {bootstrap} from "~/bootstrap.ts";

// Get environment variables
await load({envPath: "./.env", export: true});
export const Ref = Reflect; // required for decorators
await bootstrap();