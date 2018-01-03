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

	return new Function('$LOADER', 'window', data)(this, window);

	// return (function(d, l, w) {
	// 	'use strict';
    //
	// 	return new Function('$LOADER', 'window', d)(l, w);
    //
	// }(data, this, window));
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

Loader.transform = function (data) {
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
		self.modules[data.url].code = self.execute(data.ast ? data.ast.cooked : data.text);

		var listener;
		while (listener = self.modules[data.url].listener.shift()) {
			listener();
		}

		return;
	}

	var count = 0;
	var total = data.ast.imports.length;

	var callback = function () {
		count++;

		if (count === total) {
			self.modules[data.url].code = self.execute(data.ast.cooked);

			var listener;
			while (listener = self.modules[data.url].listener.shift()) {
				listener();
			}

		}

	};

	for (var i = 0; i < total; i++) {
		self.load(data.ast.imports[i].url, callback);
	}

};

Loader.js = function (data) {
	var self = this;

	if (
		self.type === 'es' || data.type === 'es'
		|| self.type === 'est' || data.type === 'est'
		|| self.type === 'esm' || data.type === 'esm'
	) {
		self.xhr(data.url, function (text) {
			data.text = text;
			self.transform(data);
		});
	} else {
		var element = document.createElement('script');

		element.setAttribute('src', data.url);
		element.setAttribute('async', 'true');
		element.setAttribute('o-load', '');

		if (self.type === 'module' || data.type === 'module') {
			element.setAttribute('type','module');
		}

		document.head.appendChild(element);
	}

};

Loader.css = function (data) {
	var self = this;
	var element = document.createElement('link');

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
		if (self.modules[data.url].listener.length) {
			return self.modules[data.url].listener.push(callback);
		}
	}

	self.modules[data.url] = { listener: [ callback ] };

	if (data.extension === 'js') {
		self.js(data);
	} else if (data.extension === 'css') {
		self.css(data);
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
