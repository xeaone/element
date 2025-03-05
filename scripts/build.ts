import esbuild from '@esbuild';
import { copy, emptyDir } from '@std/fs';

const { version } = JSON.parse(await Deno.readTextFile('deno.json'));

const banner = `/**
* @version ${version}
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
`;

await (new Deno.Command('npx', { args: ['tsc', '-p', 'tsconfig.json'] }).spawn()).output();

for await (const file of Deno.readDir('source')) {
    if (file.isDirectory) continue;
    const data = await Deno.readTextFile(`source/${file.name}`);
    await Deno.writeTextFile(`module/${file.name}`, data);
}

for await (const file of Deno.readDir('module')) {
    if (file.name.endsWith('.map')) continue;
    const data = await Deno.readTextFile(`module/${file.name}`);
    await Deno.writeTextFile(`module/${file.name}`, `${banner}${data}`);
}

await Promise.all([
    esbuild.build({
        color: true,
        bundle: true,
        minify: true,
        sourcemap: true,
        treeShaking: true,
        banner: { js: banner },
        format: 'esm',
        target: 'es2021',
        logLevel: 'debug',
        platform: 'browser',
        outfile: 'public/x-element.js',
        entryPoints: ['source/index.ts'],
    }),
    esbuild.build({
        color: true,
        bundle: true,
        minify: true,
        sourcemap: true,
        treeShaking: true,
        banner: { js: banner },
        format: 'esm',
        target: 'es2021',
        logLevel: 'debug',
        platform: 'browser',
        outfile: 'bundle/es2021.min.js',
        entryPoints: ['source/index.ts'],
    }),
    esbuild.build({
        color: true,
        bundle: true,
        minify: false,
        sourcemap: true,
        treeShaking: true,
        banner: { js: banner },
        format: 'esm',
        target: 'es2021',
        logLevel: 'debug',
        platform: 'browser',
        outfile: 'bundle/es2021.js',
        entryPoints: ['source/index.ts'],
    }),
    esbuild.build({
        color: true,
        bundle: true,
        minify: false,
        sourcemap: true,
        treeShaking: true,
        banner: { js: banner },
        format: 'esm',
        target: 'esnext',
        logLevel: 'debug',
        platform: 'browser',
        outfile: 'bundle/esnext.js',
        entryPoints: ['source/index.ts'],
    }),
    esbuild.build({
        color: true,
        bundle: true,
        minify: true,
        sourcemap: true,
        treeShaking: true,
        banner: { js: banner },
        format: 'esm',
        target: 'esnext',
        logLevel: 'debug',
        platform: 'browser',
        outfile: 'bundle/esnext.min.js',
        entryPoints: ['source/index.ts'],
    }),
    esbuild.build({
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
    }),
]);

esbuild.stop();

await copy('public/index.html', 'public/404.html', { overwrite: true });
await copy('public/index.html', 'public/guide/index.html', { overwrite: true });
await copy('public/index.html', 'public/security/index.html', { overwrite: true });

await emptyDir('docs/');
await copy('public', 'docs', { overwrite: true });
