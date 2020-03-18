import Babel from 'rollup-plugin-babel';
import Package from './package.json';

const banner = `
/*
	Name: ${Package.name}
	Version: ${Package.version}
	License: ${Package.license}
	Author: ${Package.author}
	Email: ${Package.email}
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
`;

const name = 'Oxe';
const format = 'umd';
const indent = '    ';
const moduleId = name;
const comments = false;
const input = 'src/index.js';

const plugins = [ [ 'module:fast-async', { 'spec': true } ] ];
// const plugins = [ 'babel-plugin-transform-async-to-promises' ];

const exclude = [ '@babel/plugin-transform-regenerator', '@babel/plugin-transform-async-to-generator' ];

const modules = false;
const targets = '> 0.5%, last 2 versions, Firefox ESR, not dead';
const presets = [ [ '@babel/preset-env', { exclude, modules, targets } ] ];

// 'node_modules/@webcomponents/custom-elements/custom-elements.min.js'

export default [
    {
        input,
        output: { banner, name, format, indent, file: 'dev/oxe.js' },
        plugins: [ Babel({ moduleId, comments, plugins, presets  }) ]
    },
    {
        input,
        output: { compact: true, banner, name, format, indent, file: 'dev/oxe.min.js' },
        plugins: [ Babel({ minified: true, moduleId, comments, plugins, presets }) ]
    }
];
