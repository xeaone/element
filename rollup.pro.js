import typescript from '@rollup/plugin-typescript';
import { terser } from "rollup-plugin-terser";
import { readFileSync } from 'fs';

const pkg = readFileSync('./package.json');

const { name, version, license, author, email } = JSON.parse(pkg);

const banner = `
/*!
    Name: ${name}
    Version: ${version}
    License: ${license}
    Author: ${author}
    Email: ${email}
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
`;

export default [
    {
        input: 'src/index.ts',
        output: {
            banner,
            name: 'Oxe',
            file: 'dev/oxe.js',
            format: 'umd',
            indent: '    ',
        }
    },
    {
        input: 'src/index.ts',
        output: {
            banner,
            name: 'Oxe',
            file: 'dev/oxe.min.js',
            format: 'umd',
            indent: '    ',
        },
        plugins: [
            // typescript({
            //     sourceMap: false,
            //     declaration: false,
            //     removeComments: true,
            //     noEmitHelpers: true,
            //     module: 'es6',
            //     target: 'ES2015',
            //     // lib: [ 'es2015', 'es2016', 'dom' ]
            // }),
            // terser()
        ]
    }
];