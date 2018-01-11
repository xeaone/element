import Transformer from './lib/transformer';
import Events from './lib/events';
import Global from './global';

// TODO need to emit a setup event

// if (!self.isLoaded) {
// 	self.isLoaded = true;
// 	self.emit('setup');
// }

var Loader = function (options) {
	Events.call(this);

	this.loads = [];
	this.modules = {};
	this.isRan = false;
	this.type = 'module';
	this.isLoaded = false;

	this.setup(options);
};

Loader.prototype = Object.create(Events.prototype);
Loader.prototype.constructor = Loader;

Loader.prototype.setup = function (options) {
	options = options || {};
	this.type = options.type || this.type;
	this.loads = options.loads || this.loads;
};

Loader.prototype.execute = function (data) {
	data = '\'use strict\';\n\n' + data;

	return new Function('$LOADER', 'window', data)(this, window);
};

Loader.prototype.xhr = function (url, callback) {
	var xhr = new XMLHttpRequest();

	xhr.responseType = 'text';

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
				if (callback) {
					callback(xhr.responseText);
				}
			} else {
				throw new Error(xhr.responseText);
			}
		}
	};

	xhr.open('GET', url);
	xhr.send();

};

Loader.prototype.transform = function (data) {
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
		data.ast = Transformer.ast(data);
	}

	var done = function () {
		self.modules[data.url].code = self.execute(data.ast ? data.ast.cooked : data.text);

		var listener;
		while (listener = self.modules[data.url].listener.shift()) {
			listener(self.modules[data.url]);
		}

	}

	if (data.ast && data.ast.imports.length) {

		var count = 0;
		var total = data.ast.imports.length;

		var callback = function () {
			count++;

			if (count === total) {
				done();
			}

		};

		for (var i = 0; i < total; i++) {
			self.load({
				url: data.ast.imports[i].url
			}, callback);
		}

	} else {
		done();
	}

};

Loader.prototype.js = function (data) {
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

		if (self.type === 'module' || data.type === 'module') {
			element.setAttribute('type','module');
		}

		element.setAttribute('o-load', '');

		document.head.appendChild(element);
	}

};

Loader.prototype.css = function (data) {
	var self = this;
	var element = document.createElement('link');

	element.setAttribute('href', data.url);
	element.setAttribute('rel','stylesheet');
	element.setAttribute('type', 'text/css');
	element.setAttribute('o-load', '');

	document.head.appendChild(element);
};

Loader.prototype.load = function (data, callback) {
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
		} else {
			return callback(self.modules[data.url]);
		}
	} else {
		self.modules[data.url] = {
			url: data.url,
			listener: [ callback ]
		};
	}

	if (data.extension === 'js') {
		self.js(data);
	} else if (data.extension === 'css') {
		self.css(data);
	} else {
		throw new Error('Oxe.Loader - unreconized file type');
	}

};

Loader.prototype.run = function () {
	var self = this;
	var load, loaded;

	if (self.isRan) {
		return;
	}

	self.isRan = true;

	while (load = self.loads.shift()) {
		self.load(load);
	}

};

export default Loader;

/*
	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
*/
