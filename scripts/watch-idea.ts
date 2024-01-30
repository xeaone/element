import * as esbuild from 'https://deno.land/x/esbuild@v0.20.0/mod.js';

const result = await esbuild.context({
    color: true,
    bundle: true,
    sourcemap: true,
    treeShaking: true,
    format: 'esm',
    target: 'esnext',
    logLevel: 'debug',
    platform: 'browser',
    outfile: 'public/idea/index.js',
    entryPoints: [ 'public/idea/index.ts' ],
});

await result.watch();
await result.serve({ servedir: 'public' });
