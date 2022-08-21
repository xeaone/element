#! /usr/bin/env -S deno run -A

import { Cors, File, Handler, Normalize, Router, Server } from 'https://deno.land/x/xserver@0.2.1/mod.ts';
import { build, stop } from 'https://deno.land/x/esbuild@v0.15.5/mod.js';

Deno.run({ cmd: [ 'tsc', '--watch' ] }).status();

await build({
    watch: true,
    bundle: true,
    format: 'esm',
    target: 'es2022',
    treeShaking: true,
    platform: 'browser',
    // tsconfig: 'tsconfig.json',
    outfile: 'web/x-element.js',
    // entryPoints: ['src/element/element.ts'],
    entryPoints: ['tmp/element/element.js'],
});

const port = 8000;
const file = new File();
const cors = new Cors();
const router = new Router();
const handler = new Handler();
const normalize = new Normalize();

file.spa(true);
file.path('./web');

cors.get('/*', '*');

// router.get('/*', context => file.handle(context));

router.get('/element/*', (context) => {
    context.url.pathname = context.url.pathname.startsWith('/element') ? context.url.pathname.slice('/element'.length) : context.url.pathname || '/';
    return file.handle(context);
});

handler.add(normalize);
handler.add(cors);
handler.add(router);

const server = Server((request) => handler.handle(request), { port });

console.log(`listening on port: ${port}`);

await server;

stop();
