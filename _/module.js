import Loader from './loader';

export default function Module (options) {
	this.modules = {};
	this.loader = new Loader();
	// this.setup(options || {});
}

Module.prototype.setup = function (options) {};

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
// 	data = '(function(){\'use strict\';' + data + '})()';
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

// Module.prototype.toCode = function (data) {
// 	return (function(w, d) {
// 		'use strict';
// 		return w['eval'].call(null, d);
// 	})(window, data);
// };

Module.prototype.add = function (data) {
	var ast = this.toAst(data);
	var code = this.loader.interpret(ast.cooked);
	this.modules[ast.name] = code;
};


Module.prototype.import = function (name) {
	if (name in this.modules) {
		return  typeof this.modules[name] === 'function' ? this.modules[name]() : this.modules[name];
	} else {
		throw new Error('module ' + name + ' is not defined');
	}
};

Module.prototype.export = function (name, dependencies, method) {
	if (name in this.modules) {
		throw new Error('module ' + name + ' is defined');
	} else {

		if (typeof dependencies === 'function') {
			method = dependencies;
			dependencies = [];
		}

		if (typeof method === 'function') {
			for (var i = 0, l = dependencies.length; i < l; i++) {
				var dependency = dependencies[i];
				method = method.bind(null, this.import(dependency));
			}
		}

		return this.modules[name] = method;
	}
};
