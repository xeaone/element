import Transformer from './lib/transformer';
import Global from './global';

var Loader = {};

Loader.loads = [];
Loader.modules = {};
Loader.isRan = false;
Loader.type = 'module';

Loader.setup = function (options) {
	options = options || {};
	this.type = options.type || this.type;
	this.loads = options.loads || this.loads;
};

Loader.execute = function (data) {
	data = '\'use strict\';\n\n' + data;

	return (function(d, l, w) { 'use strict';
		try {
			return new Function('$LOADER', 'window', d)(l, w);
		} catch (e) {
			throw e;
		}
	}(data, this, window));
};

Loader.xhr = function (url, callback) {
	var xhr = new XMLHttpRequest();

	xhr.addEventListener('readystatechange', function () {
		if (xhr.readyState === 4) {
			if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
				if (callback) callback(xhr.responseText);
			} else {
				throw new Error(xhr.responseText);
			}
		}
	});

	xhr.open('GET', url);
	xhr.send();

};

Loader.transform = function (data, callback) {
	var self = this;

	if (
		self.type === 'es' || data.type === 'es'
		|| self.type === 'est' || data.type === 'est'
	) {
		data.text = Transformer.template(data.text);
	}

	if (
		self.type === 'es' || data.type === 'es'
		|| self.type === 'esm' || data.type === 'esm'
	) {
		data.ast = Transformer.ast(data.text);
	}

	if (!data.ast || !data.ast.imports.length) {
		self.modules[data.url] = self.execute(data.ast ? data.ast.cooked : data.text);
		return callback ? callback() : undefined;
	}

	var meta = {
		count: 0,
		imports: data.ast.imports,
		total: data.ast.imports.length,
		callback: function () {
			if (++meta.count === meta.total) {
				self.modules[data.url] = self.execute(data.ast.cooked);
				if (callback) callback();
			}
		}
	};

	for (var i = 0, l = meta.imports.length; i < l; i++) {
		self.load(meta.imports[i].url, meta.callback);
	}

};

Loader.js = function (data, callback) {
	var self = this;

	if (
		self.type === 'es' || data.type === 'es'
		|| self.type === 'est' || data.type === 'est'
		|| self.type === 'esm' || data.type === 'esm'
	) {
		self.xhr(data.url, function (text) {
			data.text = text;
			self.transform(data, callback)
		});
	} else {
		var element = document.createElement('script');

		self.modules[data.url] = callback;

		element.setAttribute('src', data.url);
		element.setAttribute('async', 'true');
		element.setAttribute('o-load', '');

		if (self.type === 'module' || data.type === 'module') {
			element.setAttribute('type','module');
		}

		document.head.appendChild(element);
	}

};

Loader.css = function (data, callback) {
	var self = this;
	var element = document.createElement('link');

	self.modules[data.url] = callback;

	element.setAttribute('href', data.url);
	element.setAttribute('rel','stylesheet');
	element.setAttribute('type', 'text/css');
	element.setAttribute('o-load', '');

	document.head.appendChild(element);
};

Loader.load = function (data, callback) {
	var self = this;

	if (data.constructor === String) {
		data = { url: data };
	}

	data.url = Global.utility.resolve(data.url);
	data.extension = Global.utility.extension(data.url);

	if (!data.extension) {
		data.url = data.url + '.js';
	}

	if (data.url in self.modules) {
		return callback ? callback() : undefined;
	}

	self.modules[data.url] = undefined;

	if (data.extension === 'js') {
		self.js(data, callback);
	} else if (data.extension === 'css') {
		self.css(data, callback);
	} else {
		throw new Error('Oxe.Loader - unreconized file type');
	}

};

Loader.run = function () {
	var load;

	if (this.isRan) {
		return;
	}

	this.isRan = true;

	while (load = this.loads.shift()) {
		this.load(load);
	}

};

export default Loader;

/*
	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
*/
