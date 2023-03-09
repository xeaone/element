import * as esbuild from "https://deno.land/x/esbuild@v0.17.10/mod.js";

const indexhtml = await Deno.readTextFile('./web/index.html');
await Deno.writeTextFile('./web/404.html', indexhtml);
await Deno.writeTextFile('./web/guide/index.html', indexhtml);
await Deno.writeTextFile('./web/security/index.html', indexhtml);

const result = await esbuild.context({
    color: true,
    logLevel: 'debug',
    bundle: true,
    format: 'esm',
    target: 'esnext',
    // target: 'es2015',
    sourcemap: true,
    // treeShaking: true,
    platform: 'browser',
    tsconfig: 'tsconfig.json',
    outfile: 'web/x-element.js',
    entryPoints: [ 'src/index.ts' ],
});

await result.watch();
await result.serve({ servedir: 'web' });

// import { Server, Cors, File, Handler, Normalize, Router } from "https://deno.land/x/xserver@2.5.0/src/mod.ts";
// const port = 8000;
// const file = new File();
// const cors = new Cors();
// const router = new Router();
// const handler = new Handler();
// const normalize = new Normalize();

// file.spa(true);
// file.path('./web');

// cors.get('/*', '*');

// // router.get('/*', context => file.handle(context));

// router.get('/element/*', (context) => {
//     context.url.pathname = context.url.pathname.startsWith('/element') ? context.url.pathname.slice('/element'.length) : context.url.pathname || '/';
//     return file.handle(context);
// });

// handler.add(normalize);
// handler.add(cors);
// handler.add(router);

// await Server(request => handler.handle(request), { port });
