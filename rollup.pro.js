import typescript from '@rollup/plugin-typescript';
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
            file: 'pro/oxe.js',
            format: 'umd',
            indent: '    ',
        },
        plugins: [
            typescript({
                sourceMap: false,
                declaration: false,
                removeComments: false,
                target: 'es6',
            }),
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            banner,
            name: 'Oxe',
            file: 'pro/oxe.min.js',
            format: 'umd',
            indent: '    ',
        },
        plugins: [
            typescript({
                sourceMap: false,
                declaration: false,
                removeComments: true,
                target: 'es6',
            }),
        ]
    }
];