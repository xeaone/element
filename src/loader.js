
export default function Loader (options) {
	this.loads = [];
	this.files = {};
	this.modules = {};
	this.setup(options);
}

Loader.prototype.LOADED = 3;
Loader.prototype.LOADING = 2;

Loader.prototype.patterns = {
	imps: /import\s+\w+\s+from\s+(?:'|").*?(?:'|")/g,
	imp: /import\s+(\w+)\s+from\s+(?:'|")(.*?)(?:'|")/,
	exps: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/g,
	exp: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/,
};

Loader.prototype.setup = function (options) {
	options = options || {};
	this.esm = options.esm || false;
	this.loads = options.loads || [];
	this.base = this.createBase(options.base);
	return this;
};

Loader.prototype.createBase = function (base) {
	base = base || '';

	if (base) {
		var element = document.head.querySelector('base');

		if (!element) {
			element = document.createElement('base');
			document.head.insertBefore(element, document.head.firstChild);
		}

		if (typeof base === 'string') {
			element.href = base;
		}

		base = element.href;
	}

	return base;
};

Loader.prototype.joinPath = function () {
	return Array.prototype.join
		.call(arguments, '/')
		.replace(/\/{2,}/g, '/');
};

Loader.prototype.getFile = function (data, callback) {
	if (!data.url) throw new Error('Loader requires a url');
	var self = this;

	if (data.url in self.modules && data.status) {
		if (data.status === self.LOADED) {
			if (callback) callback();
		} else if (data.status === self.LOADING) {
			if (!data.tag) {
				data.xhr.addEventListener('readystatechange', function () {
					if (data.xhr.readyState === 4) {
						if (data.xhr.status >= 200 && data.xhr.status < 400) {
							if (callback) callback(data);
						} else {
							throw data.xhr.responseText;
						}
					}
				});
			} else {
				data.element.addEventListener('load', function () {
					if (callback) callback(data);
				});
			}
		}
	} else {
		if (!data.tag) {
			data.xhr = new XMLHttpRequest();
			data.xhr.addEventListener('readystatechange', function () {
				if (data.xhr.readyState === 4) {
					if (data.xhr.status >= 200 && data.xhr.status < 400) {
						data.status = self.LOADED;
						data.text = data.xhr.responseText;
						if (callback) callback(data);
					} else {
						throw data.xhr.responseText;
					}
				}
			});
			data.url = self.joinPath(self.base.replace(window.location.origin, ''), data.url);
			data.xhr.open('GET', data.url);
			data.xhr.send();
		}

		data.status = self.LOADING;
	}
};

Loader.prototype.interpret = function (data) {
	return (function(d, l, w) { 'use strict';
		return new Function('Loader', 'window', d)(l, w);
	}(data, this, window));
};

Loader.prototype.getImports = function (data) {
	var imp, imports = [];
	var imps = data.match(this.patterns.imps) || [];
	for (var i = 0, l = imps.length; i < l; i++) {
		imp = imps[i].match(this.patterns.imp);
		imports[i] = {
			raw: imp[0],
			name: imp[1],
			url: imp[2]
		};
	}
	return imports;
};

Loader.prototype.getExports = function (data) {
	return data.match(this.patterns.exps) || [];
};

Loader.prototype.handleImports = function (ast) {
	for (var i = 0, l = ast.imports.length; i < l; i++) {
		ast.cooked = ast.cooked.replace(ast.imports[i].raw, 'var ' + ast.imports[i].name + ' = Loader.modules[\'' + ast.imports[i].url + '\']');
		ast.imports[i].url = ast.imports[i].url.indexOf('.js') === -1 ? ast.imports[i].url + '.js' : ast.imports[i].url;
	}
};

Loader.prototype.handleExports = function (ast) {
	ast.cooked = ast.cooked.replace('export default', 'return');
};

Loader.prototype.toAst = function (data) {
	var ast = {};
	ast.raw = data;
	ast.imports = this.getImports(ast.raw);
	ast.exports = this.getExports(ast.raw);
	ast.cooked = ast.raw;
	this.handleImports(ast);
	this.handleExports(ast);
	return ast;
};

Loader.prototype.load = function (data, callback) {
	var self = this;

	if (data.constructor === String) data = { url: data };
	self.files[data.url] = data;

	self.getFile(data, function (d) {
		var ast = self.toAst(d.text);

		if (self.esm || data.esm) {
			if (ast.imports.length) {
				var meta = {
					count: 0,
					imports: ast.imports,
					total: ast.imports.length,
					listener: function () {
						if (++meta.count === meta.total) {
							meta.interpreted = self.interpret(ast.cooked);
							if (data.execute) meta.interpreted();
							if (callback) callback();
						}
					}
				};

				for (var i = 0, l = meta.imports.length; i < l; i++) {
					self.load(meta.imports[i].url, meta.listener);
				}
			} else {
				self.modules[d.url] = self.interpret(ast.cooked);
				if (callback) callback();
			}
		} else {
			self.modules[d.url] = self.interpret(d.text);
			if (callback) callback();
		}
	});
};

Loader.prototype.run = function () {
	for (var i = 0, l = this.loads.length; i < l; i++) {
		this.load(this.loads[i]);
	}
};

/*
	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
*/
