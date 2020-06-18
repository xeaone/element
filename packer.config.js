import { readFileSync } from 'fs';

const pkg = readFileSync('./package.json');
const { name, version, license, author, email } = JSON.parse(pkg);

const rollup = {
    format: 'umd',
    indent: '    '
};

const babel = {
    comments: false,
    plugins: [ [ 'module:fast-async', { 'spec': true } ] ],
    presets: [
        [ '@babel/preset-env', {
            modules: false,
            targets: '> 0.5%, last 2 versions, Firefox ESR, not dead',
            exclude: [ '@babel/plugin-transform-regenerator', '@babel/plugin-transform-async-to-generator' ]
        } ]
    ]
};

export default {
    babel,
    rollup,
    bundle: true,
    transform: true,
    name: 'Oxe',
    input: 'src/index.js',
    output: [
        { output: 'oxe.js' },
        { output: 'oxe.min.js', minify: true }
    ],
    header: `
    /*
    	Name: ${name}
    	Version: ${version}
    	License: ${license}
    	Author: ${author}
    	Email: ${email}
    	This Source Code Form is subject to the terms of the Mozilla Public
    	License, v. 2.0. If a copy of the MPL was not distributed with this
    	file, You can obtain one at http://mozilla.org/MPL/2.0/.
    */
    `
};
