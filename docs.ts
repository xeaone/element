#! /usr/bin/env -S deno run -A

import { copy, emptyDir } from "https://deno.land/std@0.152.0/fs/mod.ts";

await copy("./web/index.html", "./web/404.html", { overwrite: true });
await emptyDir("./docs/");
await copy("./web", "./docs", { overwrite: true });
