# Deno + Oak BE Boilerplate
This is a simple boilerplate for a Deno + Oak backend server. It includes a simple router and a middleware for logging requests. It's main purpose is to be used to later expand into a fully fledged API.

### How to run
1. Install Deno

2. Run
    1. Dev mode: `deno run
       --inspect-brk
       --allow-env
       --allow-net
       --allow-read
       --allow-ffi
       --watch
       main.ts`

    2. Production mode: `deno run
       --allow-env
       --allow-net
       --allow-read
       --allow-ffi
       main.ts`

In the dev mode command the `--inspect-brk` flag is used to enable the inspector and pause the execution until a debugger is attached. The `--watch` flag is used to restart the server when a file is changed.