import { inc, ReleaseType } from 'https://deno.land/std@0.151.0/semver/mod.ts';
import { copy, emptyDir } from 'https://deno.land/std@0.152.0/fs/mod.ts';
import { build, stop } from 'https://deno.land/x/esbuild@v0.15.1/mod.js';

const { run, readTextFile, writeTextFile, args } = Deno;
const [ release ] = args;

const f = await run({ cmd: [ 'git', 'fetch' ] }).status();
if (!f.success) throw new Error('git auth');

const n = await run({ cmd: [ 'npm', 'whoami' ] }).status();
if (!n.success) throw new Error('npm auth');

const pkg = JSON.parse(await readTextFile('./package.json'));
pkg.version = inc(pkg.version, release as ReleaseType);

const { license, author, email, version } = pkg;

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

await Promise.all([
    build({
        // minify: true,
        bundle: true,
        format: 'esm',
        target: 'es2020',
        treeShaking: true,
        platform: 'browser',
        banner: { js: banner },
        outfile: './pro/x-element.js',
        tsconfig: './tsconfig.json',
        entryPoints: [ 'src/element/element.ts' ],
    }),
    build({
        // minify: true,
        bundle: true,
        format: 'esm',
        target: 'es2020',
        treeShaking: true,
        platform: 'browser',
        banner: { js: banner },
        outfile: './web/x-element.js',
        tsconfig: './tsconfig.json',
        entryPoints: [ 'src/element/element.ts' ],
    })
]).then(console.log);

await writeTextFile('./package.json', JSON.stringify(pkg, null, '    '));

await copy('./web/index.html', './web/404.html', { overwrite: true });
await emptyDir('./docs/');
await copy('./web', './docs', { overwrite: true });

await run({ cmd: [ 'git', 'commit', '-a', '-m', version ] });
await run({ cmd: [ 'git', 'push' ] });
await run({ cmd: [ 'git', 'tag', version ] });
await run({ cmd: [ 'git', 'push', '--tag' ] });

await run({ cmd: [ 'npm', 'publish', '--access', 'public' ] });

stop();