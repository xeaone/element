import { inc } from 'https://deno.land/std@0.151.0/semver/mod.ts';
import { build, stop } from 'https://deno.land/x/esbuild@v0.14.54/mod.js';

const { readTextFile, writeTextFile } = Deno;

const pkg = JSON.parse(await readTextFile('./package.json'));
pkg.version = inc(pkg.version, 'patch');
await writeTextFile('./package.json', JSON.stringify(pkg, null, '\t'));

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

const result = await build({
    minify: true,
    bundle: true,
    format: 'esm',
    target: 'es2020',
    treeShaking: true,
    platform: 'browser',
    banner: { js: banner },
    outfile: './pro/out.js',
    tsconfig: './tsconfig.json',
    entryPoints: [ 'src/element/element.ts' ],
});

// const file = await Deno.readTextFile('./src/element/element.ts');
// const result = await transform(file, {
//     // entryPoints: [ 'src/element/element.ts' ],
//     loader: 'ts',
//     format: 'esm',
//     // bundle: true,
//     target: 'esnext',
//     platform: 'browser',
//     // banner: { js: banner },
//     // outfile: './pro/out.js',
//     tsconfigRaw: JSON.stringify({
//         "compilerOptions": {
//             "strict": true,
//             "removeComments": true,
//             "module": "ESNext",
//             "target": "ESNext",
//             "lib": [ "ESNext", "DOM", "DOM.Iterable" ],
//         }
//     })
// });
// Deno.writeTextFile('./pro/out.js', result.code);

console.log(result);

await writeTextFile('./web/x-poly.js', await readTextFile('./pro/x-poly.js'));

stop();