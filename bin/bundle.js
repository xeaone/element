'use strict';

const Fsep = require('fsep');
const Path = require('path');
const BabelCore = require('babel-core');

const Camelize = require('./camelize');

module.exports = async function Bundle (path, root, imports) {

	imports = imports || [];
	path = Path.normalize(path);
	root = Path.normalize(root) || process.cwd();

	if (!Path.isAbsolute(path)) {
		path = Path.join(root, path);
	}

	const imps = [];
	const globals = {};
	const basePath = Path.dirname(path);
	const fileData = await Fsep.readFile(path);
	const modulePath = Path.relative(root, path);
	const result = { code: '', imports: imports };

	const transformed = BabelCore.transform(fileData, {
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
		]
	});

	for (let imp of imps) {
		if (!result.imports.includes(imp.fullPath)) {
			result.imports.push(imp.fullPath);
			let bundle = await Bundle(imp.fullPath, root, result.imports);
			result.code += bundle.code;
		}
	}

	result.code += `\n${transformed.code}`;

	return result;
};
