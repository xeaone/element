const Fs = require('fs');
const Util = require('util');
const Rollup = require('rollup');
const Package = require('./package');
const Babel = require('@babel/core');

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

(async function () {

    const output = process.argv.slice(2)[0];

    if (!output) return console.error('build output path required');

    const bundled = await Rollup.rollup({ input: 'src/index.js' });

    const generated = await bundled.generate({
        name: 'Oxe',
        indent: '\t',
        // format: 'esm',
        format: 'umd',
        treeshake: true
    });

    const code = generated.output[0].code;

    const options = {
        moduleId: 'Oxe',
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

    const dev = Babel.transform(code, options);

    options.minified = true;

    const dst = Babel.transform(code, options);

    await Promise.all([
        await WriteFile(`./${output}/oxe.js`, header + dev.code),
        await WriteFile(`./${output}/oxe.min.js`, header + dst.code),
        await WriteFile('./web/assets/oxe.js', header + dev.code)
    ]);

}()).catch(console.error);
