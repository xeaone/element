'use strict';

const Fsep = require('fsep');
const Path = require('path');
const BabelCore = require('babel-core');
const BabelEnv = require('babel-preset-env');
const BabelTransformModules = require('babel-plugin-transform-es2015-modules-umd');

const Camelize = require('./camelize');

module.exports = async function Bundle (data) {

	let base = data.base;
	let path = data.path;

	path = Path.extname(path) ? Path.resolve(path) : Path.resolve(`${path}.js`);
	base = base ? Path.resolve(base) : Path.dirname(path);

	const imports = data.imports || [];

	const imps = [];
	const presets = [];
	const globals = {};
	const folderPath = Path.dirname(path);
	const fileData = await Fsep.readFile(path);
	const modulePath = Path.relative(base, path);
	const result = { code: '', imports: imports };

	if (data.transpile) {
		presets.push([BabelEnv, { targets: { browsers: 'defaults' } }]);
	}

	const transformed = BabelCore.transform(fileData, {
		minified: data.minify,
		comments: data.comments,
		moduleId: data.name || Camelize(modulePath),
		plugins: [
			[
				function () {
					return {
						visitor: {
							ImportDeclaration: function (data) {
								const rawPath = Path.extname(data.node.source.value) ? data.node.source.value : `${data.node.source.value}.js`;
								const fullPath = Path.resolve(folderPath, rawPath);
								const relativePath = Path.relative(base, fullPath);

								globals[relativePath] = Camelize(relativePath);

								imps.push({
									rawPath: rawPath,
									folderPath: folderPath,
									fullPath: fullPath,
									relativePath: relativePath
								});

								data.node.source.value = relativePath;
							}
						}
					};
				}
			],
			[BabelTransformModules, { globals: globals, exactGlobals: true }]
		],
		presets: presets
	});

	for (let imp of imps) {

		if (!result.imports.includes(imp.fullPath)) {
			result.imports.push(imp.fullPath);

			let bundle = await Bundle({
				base: base,
				path: imp.fullPath,
				minify: data.minify,
				imports: result.imports,
				transpile: data.transpile
			});

			result.code += bundle.code;
		}

	}

	result.code += `\n${transformed.code}`;

	return result;
};
