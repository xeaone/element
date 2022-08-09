import typescript from '@rollup/plugin-typescript';
import { readFileSync, writeFileSync } from 'fs';
import * as rollup from 'rollup';

const version = process.env.VERSION;
if (!version) throw new Error('version required');

const pkg = JSON.parse(readFileSync('./package.json'));
pkg.version = version;
writeFileSync('./package.json', JSON.stringify(pkg, null, '\t'));

const { license, author, email } = pkg;

const elementBanner = `/************************************************************************
Name: XElement
Version: ${version}
License: ${license}
Author: ${author}
Email: ${email}
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
************************************************************************/`;

// const routerBanner = `/************************************************************************
// Name: XRouter
// Version: ${version}
// License: ${license}
// Author: ${author}
// Email: ${email}
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// ************************************************************************/`;

const element = await rollup.rollup({
    input: './src/element/element.ts',
    plugins: [ typescript({ tsconfig: './tsconfig.json' }) ]
});

// const [ element, router ] = await Promise.all([
//     rollup.rollup({
//         input: './src/element/element.ts',
//         plugins: [ typescript({ tsconfig: './tsconfig.json' }) ]
//     }),
//     rollup.rollup({
//         input: './src/router/router.ts',
//         plugins: [ typescript({ tsconfig: './tsconfig.json' }) ]
//     })
// ]);

await Promise.all([
    element.write({
        banner: elementBanner,
        name: 'XElement',
        file: './web/x-element.js',
        format: 'esm',
        indent: '\t',
    }),
    element.write({
        banner: elementBanner,
        name: 'XElement',
        file: './pro/x-element.js',
        format: 'esm',
        indent: '\t',
    }),
    // router.write({
    //     banner: routerBanner,
    //     name: 'XRouter',
    //     file: './web/x-router.js',
    //     format: 'esm',
    //     indent: '\t',
    // }),
    // router.write({
    //     banner: routerBanner,
    //     name: 'XRouter',
    //     file: './pro/x-router.js',
    //     format: 'esm',
    //     indent: '\t',
    // })
]);

writeFileSync('./web/x-poly.js', readFileSync('./pro/x-poly.js'));