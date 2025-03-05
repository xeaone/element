import esbuild from '@esbuild';
import { copy, emptyDir } from '@std/fs';

await esbuild.build({
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

esbuild.stop();

await copy('public/index.html', 'public/404.html', { overwrite: true });
await copy('public/index.html', 'public/guide/index.html', { overwrite: true });
await copy('public/index.html', 'public/security/index.html', { overwrite: true });

await emptyDir('docs/');
await copy('public', 'docs', { overwrite: true });

