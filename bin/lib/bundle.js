'use strict';

const Fsep = require('fsep');
const Path = require('path');
const BabelCore = require('babel-core');

const Camelize = require('./camelize');

module.exports = async function Bundle (data) {

	const imports = data.imports || [];
	const cwd = data.cwd ? Path.normalize(data.cwd) : process.cwd();

	let path = data.path;

	path = Path.isAbsolute(path) ? Path.normalize(path) : Path.resolve(cwd, path);
	path = Path.extname(path) ? path : `${path}.js`;

	const imps = [];
	const globals = {};
	const basePath = Path.dirname(path);
	const fileData = await Fsep.readFile(path);
	const modulePath = Path.relative(cwd, path);
	const result = { code: '', imports: imports };

	const presets = [];

	if (data.transpile) {
		presets.push(['env', { targets: { browsers: 'defaults' } }]);
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
								const fullPath = Path.resolve(basePath, rawPath);
								const relativePath = Path.relative(cwd, fullPath);

								globals[relativePath] = Camelize(relativePath);

								imps.push({
									rawPath: rawPath,
									basePath: basePath,
									fullPath: fullPath,
									relativePath: relativePath
								});

								data.node.source.value = relativePath;
							}
						}
					};
				}
			],
			['transform-es2015-modules-umd', { globals: globals, exactGlobals: true }]
		],
		presets: presets
	});

	for (let imp of imps) {

		if (!result.imports.includes(imp.fullPath)) {
			result.imports.push(imp.fullPath);

			let bundle = await Bundle({
				cwd: cwd,
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
