import Transformer from './lib/transformer';
import Events from './lib/events';
import Global from './global';

var Loader = function (options) {
	Events.call(this);

	this.data = {};
	this.ran = false;
	this.methods = {};
	this.transformers = {};

	this.setup(options);
};

Loader.prototype = Object.create(Events.prototype);
Loader.prototype.constructor = Loader;

Loader.prototype.setup = function (options) {
	options = options || {};

	this.methods = options.methods || this.methods;
	if (options.loads) this._data = options.loads;
	this.transformers = options.transformers || this.transformers;
};

Loader.prototype.execute = function (data) {
	var text = '\'use strict\';\n\n' + (data.ast ? data.ast.cooked : data.text);
	var code = new Function('$LOADER', 'window', text);
	data.result = code(this, window);
};

Loader.prototype.ready = function (data) {
	if (data && data.listener && data.listener.length) {
		var listener;
		while (listener = data.listener.shift()) {
			listener(data);
		}
	}
};

Loader.prototype.fetch = function (data) {
	var self = this;
	var fetch = new XMLHttpRequest();

	fetch.onreadystatechange = function () {
		if (fetch.readyState === 4) {
			if (fetch.status >= 200 && fetch.status < 300 || fetch.status == 304) {
				data.text = fetch.responseText;
				if (data.extension === 'js') {
					if (data.transformer) {
						self.transform(data, function () {
							self.execute(data);
							self.ready(data);
						});
					} else {
						self.execute(data);
						self.ready(data);
					}
				} else {
					self.ready(data);
				}
			} else {
				throw new Error(fetch.responseText);
			}
		}
	};

	fetch.open('GET', data.url);
	fetch.send();
};

Loader.prototype.transform = function (data, callback) {

	if (data.transformer === 'es' || data.transformer === 'est') {
		data.text = Transformer.template(data.text);
	}

	if (data.transformer === 'es' || data.transformer === 'esm') {
		data.ast = Transformer.ast(data);
	}

	if (data.ast && data.ast.imports.length) {

		var count = 0;
		var total = data.ast.imports.length;

		var listener = function () {
			count++;

			if (count === total) {
				callback();
			}

		};

		for (var i = 0; i < total; i++) {
			this.load({
				listener: listener,
				method: data.method,
				url: data.ast.imports[i].url,
				transformer: data.transformer
			});
		}

	} else {
		callback();
	}

};

Loader.prototype.attach = function (data) {
	var element = document.createElement(data.tag);

	data.attributes['o-load'] = 'true';

	for (var name in data.attributes) {
		element.setAttribute(name, data.attributes[name]);
	}

	document.head.appendChild(element);
};

Loader.prototype.js = function (data) {
	if (
		data.method === 'fetch'
		|| data.transformer === 'es'
		|| data.transformer === 'est'
		|| data.transformer === 'esm'
	) {
		this.fetch(data);
	} else if (data.method === 'script') {
		this.attach({
			tag: 'script',
			attributes: {
				type: 'text/javascript',
				src: data.url,
				async: 'true',
			}
		});
	} else {
		this.attach({
			tag: 'script',
			attributes: {
				type: 'module',
				src: data.url,
				async: 'true',
			}
		});
	}
};

Loader.prototype.css = function (data) {
	if (data.method === 'fetch') {
		this.fetch(data);
	} else {
		this.attach({
			tag: 'link',
			attributes: {
				href: data.url,
				type: 'text/css',
				rel: 'stylesheet'
			}
		});
	}
};

Loader.prototype.load = function (data, listener) {

	if (typeof data === 'string') {
		data = { url: data };
	} else {
		listener = data.listener;
	}

	data.url = Global.utility.resolve(data.url);

	if (data.url in this.data) {
		var load = this.data[data.url];

		if (load.listener.length) {

			if (listener) {
				load.listener.push(listener);
			}

		} else {

			if (listener) {
				load.listener.push(listener);
			}

			this.ready(load);
		}

		return;
	}

	this.data[data.url] = data;

	data.extension = data.extension || Global.utility.extension(data.url);

	data.listener = listener ? [listener] : [];
	data.method = data.method || this.methods[data.extension];
	data.transformer = data.transformer || this.transformers[data.extension];

	if (data.extension === 'js') {
		this.js(data);
	} else if (data.extension === 'css') {
		this.css(data);
	} else {
		this.fetch(data);
	}

};

Loader.prototype.listener = function (e) {
	var element = e.target;

	if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
		return;
	}

	var path = Global.utility.resolve(element.src || element.href);
	var load = this.data[path];

	this.ready(load);
};

Loader.prototype.run = function () {

	if (this.ran) {
		return;
	} else {
		this.ran = true;
	}

	document.addEventListener('load', this.listener.bind(this), true);

	if (this._data) {
		var load;

		while (load = this._data.shift()) {
			this.load(load);
		}

		delete this._data;
	}

};

export default Loader;

/*
	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
*/
