'use strict';

const Fsep = require('fsep');
const Path = require('path');
const BabelCore = require('babel-core');

const Camelize = require('./camelize');

module.exports = async function Bundle (data) {

	const imports = data.imports || [];
	const root = Path.normalize(data.root) || process.cwd();
	const path = Path.isAbsolute(data.path) ? Path.normalize(data.path) : Path.join(root, data.path);

	const imps = [];
	const globals = {};
	const basePath = Path.dirname(path);
	const fileData = await Fsep.readFile(path);
	const modulePath = Path.relative(root, path);
	const result = { code: '', imports: imports };

	console.log(data.minify);

	const transformed = BabelCore.transform(fileData, {
		minified: data.minify,
		moduleId: Camelize(modulePath),
		plugins: [
			[
				function () {
					return {
						visitor: {
							ImportDeclaration: function (data) {
								const rawPath = data.node.source.value;
								const fullPath = Path.resolve(basePath, rawPath);
								const relativePath = Path.relative(root, fullPath);

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
			['transform-es2015-modules-umd', {
				globals: globals,
				exactGlobals: true
			}]
		],
		presets: [
			['env', {
				// modules: 'umd',
				targets: {
					browsers: 'defaults'
				}
			}]
		]
	});

	for (let imp of imps) {
		if (!result.imports.includes(imp.fullPath)) {
			result.imports.push(imp.fullPath);

			let bundle = await Bundle({
				root: root,
				path: imp.fullPath,
				imports: result.imports
			});

			result.code += bundle.code;
		}
	}

	result.code += `\n${transformed.code}`;

	return result;
};
