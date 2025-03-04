import esbuild from '@esbuild';

const pkg = JSON.parse(await Deno.readTextFile('package.json'));
const { version } = pkg;

const npxTsc = await (new Deno.Command('npx', { args: [ 'tsc', 'source', 'module' ] }).spawn()).output();

if (!npxTsc.success) {
    console.warn('npx tsc failed');
    Deno.exit();
}

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
        target: 'es2015',
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
        target: 'es2015',
        logLevel: 'debug',
        platform: 'browser',
        outfile: 'bundle/es2015.min.js',
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
        target: 'es2015',
        logLevel: 'debug',
        platform: 'browser',
        outfile: 'bundle/es2015.js',
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
]);

esbuild.stop();
