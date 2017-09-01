import Loader from './loader';

export default function Module (options) {
	this.modules = {};
	this.loader = new Loader();
	this.setup(options || {});
}

// Module.prototype.patterns = {
// 	imps: /import\s+(\w+)\s+from\s+(?:'|")(\w+)(?:'|")/g,
// 	imp: /import\s+(\w+)\s+from\s+(?:'|")(\w+)(?:'|")/,
// };
//
// Module.prototype.getImports = function (data) {
// 	return data.match(this.patterns.imps);
// };
//
// Module.prototype.handleImports = function (data) {
// 	var imports = this.getImports(data);
// 	for (var i = 0, l = imports.length, statement; i < l; i++) {
// 		statement = imports[i].match(this.patterns.imp);
// 		data = data.replace(imports[i], 'var ' + statement[0] + ' = Jenie.module.modules[\'' + statement[1] + '\']');
// 	}
// 	return data;
// };
//
// Module.prototype.handleExports = function (data) {
// 	data = data.replace('export default', 'return');
// 	data = '(function(){"use strict";' + data + '})()';
// 	return data;
// };
//
// Module.prototype.toCooked = function (data) {
// 	data = this.handleImports(data);
// 	data = this.handleExports(data);
// 	return data;
// };
//
// Module.prototype.getName = function (data) {
// 	data = data.match(/export\s+default\s*(?:function)?\s+(\w+)/);
// 	return data[1];
// };
//
// Module.prototype.toAst = function (data) {
// 	var ast = {};
// 	ast.raw = data;
// 	ast.name = this.getName(ast.raw);
// 	ast.cooked = this.toCooked(ast.raw);
// 	return ast;
// };
//
// Module.prototype.toCode = function (data) {
// 	return (function(w, d) {
// 		'use strict';
// 		return w['eval'].call(null, d);
// 	})(window, data);
// };
//
// Module.prototype.add = function (data) {
// 	var ast = this.toAst(data);
// 	var code = this.toCode(ast.cooked);
// 	this.modules[ast.name] = code;
// };

Module.prototype.setup = function (options) {
	if (options.modules) {
		for (var i = 0, l = options.modules.length; i < l; i++) {
			var module = options.modules[i];
			this.export.call(
				this,
				module.path,
				module.dependencies || module.method,
				module.dependencies ? module.method : null
			);
		}
	}
};

Module.prototype.import = function () {
	var args = arguments, method, i, l;
	if (args.length === 1) {
		if (args[0] in this.modules) {
			return typeof this.modules[args[0]] === 'function' ? this.modules[args[0]]() : this.modules[args[0]];
		} else {
			throw new Error('module ' + args[0] + ' is not defined');
		}
	} else {
		method = args[args.length-1];
		// group might need to be random
		for (i = 0, l = args.length-1; i < l; i++) {
			this.loader.add({ path: args[i], group: '$module' });
		}
		this.loader.start('$module', function () {
			for (i = 0, l = args.length-1; i < l; i++) {
				method = method.bind(null, this.modules[args[i]]);
			}
			method();
		});
	}
};

Module.prototype.export = function () {
	var args = arguments, method, i, l;
	if (args.length) {
		this.import()

		for (i = 0, l = args.length-1; i < l; i++) {
			var dependency = args[i];
			method = method.bind(null, this.import(args[i]));
		}
	}
};

/*
	https://calendar.perfplanet.com/2011/lazy-evaluation-of-commonjs-modules/
	https://tomdale.net/2012/01/amd-is-not-the-answer/
	http://2ality.com/2014/01/eval.html
*/
