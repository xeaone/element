import * as esbuild from 'https://deno.land/x/esbuild@v0.20.0/mod.js';

// const tsc = new Deno.Command('npx', {
//     args: [
//         'tsc',
//         '--watch',
//     ]
// }).spawn();

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
    target: 'es2022',
    logLevel: 'debug',
    platform: 'browser',
    outfile: 'public/index.js',
    entryPoints: [ 'client/index.ts' ],
    // entryPoints: [ 'tmp/client/index.js' ],
    // tsconfigRaw: {
    //     compilerOptions: {
    //     }
    // }
});

await result.watch();
await result.serve({ servedir: 'public' });

// await tsc.output();