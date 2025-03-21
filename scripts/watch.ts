import esbuild from '@esbuild';

const index = await Deno.readTextFile('./public/index.html');

await Deno.writeTextFile('./public/404.html', index);
await Deno.writeTextFile('./public/guide/index.html', index);
await Deno.writeTextFile('./public/security/index.html', index);
await Deno.writeTextFile('./public/performance/index.html', index);

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
    entryPoints: ['client/index.ts'],
    tsconfigRaw: {
        compilerOptions: {
            experimentalDecorators: true,
        },
    },
});

await result.watch();
await result.serve({ servedir: 'public' });
