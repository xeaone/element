import { increment, ReleaseType } from 'https://deno.land/std@0.194.0/semver/mod.ts';
import { copy, emptyDir } from 'https://deno.land/std@0.194.0/fs/mod.ts';
import * as esbuild from 'https://deno.land/x/esbuild@v0.18.13/mod.js';

const { run, readTextFile, writeTextFile, args } = Deno;
const [ release ] = args;
if (!release) {
    console.warn('requires: pre, major, premajor, minor, preminor, patch, prepatch, prerelease',);
    Deno.exit();
}

const f = await run({ cmd: [ 'git', 'fetch' ] }).status();
if (!f.success) throw new Error('git auth');

const n = await run({ cmd: [ 'npm', 'whoami' ] }).status();
if (!n.success) throw new Error('npm auth');

const pkg = JSON.parse(await readTextFile('package.json'));
pkg.version = increment(pkg.version, release as ReleaseType);

const { license, author, email, version } = pkg;

const proceed = confirm(`Do you want to deploy version ${version}?`);
if (!proceed) Deno.exit();

const banner = `/************************************************************************
Name: XElement
Version: ${version}
License: ${license}
Author: ${author}
Email: ${email}
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
************************************************************************/`;

const files = Deno.readDir('src');
for await (const file of files) {
    if (file.isDirectory) continue;
    const data = await Deno.readTextFile(`src/${file.name}`);
    await Deno.writeTextFile(`pro/x-element/${file.name}`, `${banner}\n${data}`);
}

await Promise.all([
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

        outfile: 'web/x-element.js',
        entryPoints: [ 'src/index.ts' ],
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
        outfile: 'pro/x-element.min.js',
        entryPoints: [ 'src/index.ts' ],
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
        outfile: 'pro/x-element.js',
        entryPoints: [ 'src/index.ts' ],
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
        outfile: 'pro/x-element.next.js',
        entryPoints: [ 'src/index.ts' ],
    }),
]);

esbuild.stop();

await writeTextFile('package.json', JSON.stringify(pkg, null, '    '));

await copy('web/index.html', 'web/404.html', { overwrite: true });
await copy('web/index.html', 'web/guide/index.html', { overwrite: true });
await copy('web/index.html', 'web/security/index.html', { overwrite: true });

await emptyDir('docs/');
await copy('web', 'docs', { overwrite: true });

await run({ cmd: [ 'git', 'commit', '-a', '-m', version ] }).status();
await run({ cmd: [ 'git', 'push' ] }).status();
await run({ cmd: [ 'git', 'tag', version ] }).status();
await run({ cmd: [ 'git', 'push', '--tag' ] }).status();

await run({ cmd: [ 'npm', 'publish', '--access', 'public' ] }).status();
