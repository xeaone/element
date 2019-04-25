import Fs from 'fs';
import Util from 'util';
import Rollup from 'rollup';
import Babel from '@babel/core';
import Package from './package.json';

// const ReadFile = Util.promisify(Fs.readFile);
const WriteFile = Util.promisify(Fs.writeFile);

const header = `/*
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

const main = async function (input, output, name, option) {

    if (!name) return console.error('name required');
    if (!input) return console.error('input path required');
    if (!output) return console.error('output path required');

    const bundled = await Rollup.rollup({ input });

    const generated = await bundled.generate({
        name: `${name[0].toUpperCase()}${name.slice(1).toLowerCase()}`,
        indent: '\t',
        // format: 'esm',
        format: 'umd',
        treeshake: true
    });

    const code = generated.output[0].code;

    const options = {
        moduleId: `${name[0].toUpperCase()}${name.slice(1).toLowerCase()}`,
        comments: false,
        sourceMaps: false,
        plugins: [
            [ 'module:fast-async', {
                spec: true
            } ]
        ],
        presets: [
            [ '@babel/preset-env', {
                modules: false,
                targets: { ie: '11' },
                exclude: [
                    'transform-regenerator',
                    'transform-async-to-generator',
                    'proposal-async-generator-functions'
                ]
            } ]
        ]
    };

    if (option.includes('m')) {
        options.minified = true;
    }

    const result = Babel.transform(code, options);

    await WriteFile(`./${output}`, header + result.code);

};

if (process.argv.length > 2) {
    const args = [];
    const opt = [];

    process.argv.slice(2).forEach(function (arg) {
        if (arg[0] === '-') {
            opt.push.apply(opt, arg.slice(1).split());
        } else {
            args.push(arg);
        }
    });

    args.push(opt);

    main.apply(null, args, opt).catch(console.error);
}

export default main;
