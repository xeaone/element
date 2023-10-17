import * as esbuild from 'https://deno.land/x/esbuild@v0.19.2/mod.js';

const result = await esbuild.context({
    color: true,
    bundle: true,
    sourcemap: true,
    treeShaking: true,
    format: 'esm',
    target: 'esnext',
    logLevel: 'debug',
    platform: 'browser',
    outdir: './tmp/virtual/.',
    entryPoints: [
        './source/virtual/codes.ts',
        './source/virtual/domify.ts',
        './source/virtual/parse.ts',
        './source/virtual/stringify.ts',
        './source/virtual/tool.ts',
    ],
});

await result.watch();
