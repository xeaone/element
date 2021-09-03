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
        input: 'build/index.js',
        // input: 'src/index.ts',
        output: {
            banner,
            name: 'Oxe',
            file: 'web/assets/oxe.js',
            format: 'umd',
            indent: '    ',
        }
    }
];
