import * as esbuild from 'https://deno.land/x/esbuild@v0.19.12/mod.js';

const indexhtml = await Deno.readTextFile('./public/index.html');
await Deno.writeTextFile('./public/404.html', indexhtml);
await Deno.writeTextFile('./public/guide/index.html', indexhtml);
await Deno.writeTextFile('./public/security/index.html', indexhtml);

const result = await esbuild.context({
    color: true,
    bundle: true,
    sourcemap: true,
    treeShaking: true,
    format: 'esm',
    target: 'esnext',
    logLevel: 'debug',
    platform: 'browser',
    outfile: 'public/x-element.js',
    entryPoints: [ 'source/index.ts' ],
});

await result.watch();
await result.serve({ servedir: 'public' });
