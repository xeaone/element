import { increment, ReleaseType } from 'https://deno.land/std@0.197.0/semver/mod.ts';
import { copy, emptyDir } from 'https://deno.land/std@0.197.0/fs/mod.ts';
import * as esbuild from 'https://deno.land/x/esbuild@v0.19.12/mod.js';

const [ release ] = Deno.args;
if (!release) {
    console.warn('argument required: pre, major, premajor, minor, preminor, patch, prepatch, prerelease');
    Deno.exit();
}

const f = await (new Deno.Command('git', { args: [ 'fetch' ] }).spawn()).output();
if (!f.success) {
    console.warn('git auth check failed');
    Deno.exit();
}

const n = await (new Deno.Command('npm', { args: [ 'whoami' ] }).spawn()).output();
if (!n.success) {
    console.warn('npm auth check failed');
    Deno.exit();
}

const pkg = JSON.parse(await Deno.readTextFile('package.json'));
pkg.version = increment(pkg.version, release as ReleaseType);
const { version } = pkg;

const proceed = confirm(`Do you want to deploy version ${version}?`);
if (!proceed) Deno.exit();

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

const npxTsc = await (new Deno.Command('npx', { args: [ 'tsc' ] }).spawn()).output();
if (!npxTsc.success) {
    console.warn('npx tsc failed');
    Deno.exit();
}

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
        entryPoints: [ 'source/index.ts' ],
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
        entryPoints: [ 'source/index.ts' ],
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
        entryPoints: [ 'source/index.ts' ],
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
        entryPoints: [ 'source/index.ts' ],
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
        entryPoints: [ 'source/index.ts' ],
    }),
]);

esbuild.stop();

await Deno.writeTextFile('package.json', JSON.stringify(pkg, null, '    '));

await copy('public/index.html', 'public/404.html', { overwrite: true });
await copy('public/index.html', 'public/guide/index.html', { overwrite: true });
await copy('public/index.html', 'public/security/index.html', { overwrite: true });

await emptyDir('docs/');
await copy('public', 'docs', { overwrite: true });

await (new Deno.Command('git', { args: [ 'commit', '-a', '-m', version ] }).spawn()).output();
await (new Deno.Command('git', { args: [ 'push' ] }).spawn()).output();
await (new Deno.Command('git', { args: [ 'tag', version ] }).spawn()).output();
await (new Deno.Command('git', { args: [ 'push', '--tag' ] }).spawn()).output();

await (new Deno.Command('npm', { args: [ 'publish', '--access', 'public' ] }).spawn()).output();
