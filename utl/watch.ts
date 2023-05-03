import * as esbuild from 'https://deno.land/x/esbuild@v0.17.18/mod.js';

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
    treeShaking: true,
    platform: 'browser',
    // tsconfig: 'tsconfig.json',
    outfile: 'web/x-element.js',
    entryPoints: [ 'src/index.ts' ],
    supported: {
        'class-field': true,
        'class-private-accessor': true,
        'class-private-brand-check': true,
        'class-private-field': true,
        'class-private-method': true,
        'class-private-static-accessor': true,
        'class-private-static-field': true,
        'class-static-blocks': true,
        'class-static-field': true,
    }
});

await result.watch();
await result.serve({ servedir: 'web' });
