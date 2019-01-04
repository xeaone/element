
const Rollup = require('rollup');
const Package = require('./package');
const Babel = require('@babel/core');
// const Babel = require('rollup-plugin-babel');
// const BabelMinify = require('babel-preset-minify');

const Util = require('util');
const Fs = require('fs');

const ReadFile = Util.promisify(Fs.readFile);
const WriteFile = Util.promisify(Fs.writeFile);

// const Prepend = async function (data, path) {
// 	const fileData = await ReadFile(path, 'utf8');
// 	await WriteFile(path, data + fileData, 'utf8');
// };

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

	const bundled = await Rollup.rollup({ input: 'src/index.js' });

	const generated = await bundled.generate({
		name: 'Oxe',
		indent: '\t',
		format: 'iife',
		treeshake: true
	});

	const code = generated.output[0].code;

	const options = {
		comments: false,
		sourceMaps: false,
		plugins: [
			['module:fast-async', {
				compiler: {
					promises: true,
					generators: false
				}
			}]
        ],
		presets: [
			[
				'@babel/preset-env',
				{
					modules: 'umd',
					// useBuiltIns: 'entry',
					targets: { ie: '11' },
					// exclude: [
						// '@babel/plugin-transform-runtime',
						// '@babel/plugin-transform-regenerator',
						// '@babel/plugin-proposal-async-generator-functions'
					// ]
				}
			]
		]
	};

	const dev = Babel.transform(code, options);

	options.minified = true;

	const dst = Babel.transform(code, options);

	await Promise.all([
		await WriteFile('dst/oxe.js', header + dev.code),
		await WriteFile('dst/oxe.min.js', header + dst.code),
		await WriteFile('web/assets/oxe.js', header + dev.code)
	]);

	// const babel = {
	// 	comments: false,
	// 	sourceMaps: false,
	// 	// externalHelpers: true,
	// 	// externalHelpers: false,
	// 	plugins: [
	// 		'module:fast-async'
	// 		// BabelAsyncToPromises
	// 	],
	// 	presets: [
	// 		[
	// 			'@babel/preset-env',
	// 			{
	// 				targets: { ie: '11' }
	// 			}
	// 		]
	// 	]
	// };
	//
	// const write = {
	// 	name: 'Oxe',
	// 	format: 'iife',
	// 	banner: header,
	// 	treeshake: true
	// };
	//
	//
	// const dev = Rollup.rollup({
	// 	input: 'src/index.js',
	// 	plugins: [
	// 		Babel(Object.assign({}, babel))
	// 	]
	// }).then(function (bundle) {
	// 	return Promise.all([
	// 		bundle.write(Object.assign({}, write, { indent: '\t', file: 'dst/oxe.js' })),
	// 		bundle.write(Object.assign({}, write, { indent: '\t', file: 'web/assets/oxe.js' }))
	// 	]);
	// });

	// babel.presets.push(BabelMinify);
	//
	// const dst = Rollup.rollup({
	// 	input: 'src/index.js',
	// 	plugins: [
	// 		// Babel(Object.assign({}, babel, { minified: true })),
	// 		Babel(babel)
	// 	]
	// }).then(function (bundle) {
	// 	return bundle.write(Object.assign({}, write, { compact: true, file: 'dst/oxe.min.js' }));
	// });
	//
	// await Promise.all([dev, dst]);

}()).catch(console.error);
