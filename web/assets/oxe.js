(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Oxe', factory) :
	(global.Oxe = factory());
}(this, (function () { 'use strict';

	var Component = function () {
		this.data = {};
	};

	Component.prototype.renderSlot = function (target, source) {
		var slots = target.querySelectorAll('slot[name]');

		for (var i = 0, l = slots.length; i < l; i++) {

			var name = slots[i].getAttribute('name');
			var slot = source.querySelector('[slot="'+ name + '"]');

			if (slot) {
				slots[i].parentNode.replaceChild(slot, slots[i]);
			}

		}

		var defaultSlot = target.querySelector('slot:not([name])');

		if (defaultSlot && source.children.length) {

			while (source.firstChild) {
				defaultSlot.insertBefore(source.firstChild);
			}

			defaultSlot.parentNode.removeChild(defaultSlot);

		}

	};

	Component.prototype.renderTemplate = function (data, callback) {
		if (!data) {
			callback(document.createDocumentFragment());
		} else if (typeof data === 'string') {
			var fragment = document.createDocumentFragment();
			var temporary = document.createElement('div');

			temporary.innerHTML = data;

			while (temporary.firstChild) {
				fragment.appendChild(temporary.firstChild);
			}

			callback(fragment);
		} else if (typeof data === 'object') {
			callback(data);
		} else if (typeof data === 'function') {
			data(function (t) {
				this.renderTemplate(t, callback);
			}.bind(this));
		} else {
			throw new Error('Oxe.component.renderTemplate - invalid template type');
		}
	};

	Component.prototype.renderStyle = function (style, scope, callback) {
		if (!style) {
			callback();
		} else if (typeof style === 'string') {

			if (window.CSS && window.CSS.supports) {

				if (!window.CSS.supports('(--t: black)')) {
					var matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);
					matches.forEach(function (match) {
						var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
						var pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
						style = style.replace(rule[0], '');
						style = style.replace(pattern, rule[2]);
					});
				}

				if (!window.CSS.supports(':scope')) {
					style = style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
				}

				if (!window.CSS.supports(':host')) {
					style = style.replace(/\:host/g, '[o-scope="' + scope + '"]');
				}

			}

			var estyle = document.createElement('style');
			var nstyle = document.createTextNode(style);

			estyle.appendChild(nstyle);

			callback(estyle);
		} else if (typeof style === 'object') {
			callback(style);
		} else if (typeof style === 'function') {
			style(function (s) {
				this.renderStyle(s, scope, callback);
			}.bind(this));
		} else {
			throw new Error('Oxe.component.renderStyle - invalid style type');
		}
	};

	Component.prototype.created = function (element, options) {
		var self = this;
		var scope = options.name + '-' + options.count++;

		Object.defineProperty(element, 'scope', {
			enumerable: true,
			value: scope
		});

		element.setAttribute('o-scope', scope);

		Global$1.model.set(scope, options.model || {});
		Global$1.methods.data[scope] = options.methods;

		self.renderTemplate(options.template, function (etemplate) {
			self.renderStyle(options.style, scope, function (estyle) {

				if (estyle) {
					etemplate.insertBefore(estyle, etemplate.firstChild);
				}

				if (options.shadow && 'attachShadow' in document.body) {
					element.attachShadow({ mode: 'open' }).appendChild(etemplate);
				} else if (options.shadow && 'createShadowRoot' in document.body) {
					element.createShadowRoot().appendChild(etemplate);
				} else {
					self.renderSlot(etemplate, element);
					element.appendChild(etemplate);
				}

				if (options.created) {
					options.created.call(element);
				}

			});
		});

	};

	Component.prototype.define = function (options) {
		var self = this;

		if (!options.name) {
			throw new Error('Oxe.component.define - requires name');
		}

		if (options.name in self.data) {
			throw new Error('Oxe.component.define - component defined');
		}

		self.data[options.name] = options;

		options.count = 0;
		options.ready = false;
		options.model = options.model || {};
		options.shadow = options.shadow || false;
		options.template = options.template || '';
		options.properties = options.properties || {};

		options.properties.scope = {
			enumerable: true,
			configurable: true
		};

		options.properties.model = {
			enumerable: true,
			configurable: true,
			get: function () {
				return Global$1.model.get(this.scope);
			},
			set: function (data) {
				data = data && typeof data === 'object' ? data : {};
				return Global$1.model.set(this.scope, data);
			}
		};

		options.properties.methods = {
			enumerable: true,
			get: function () {
				return Global$1.methods.data[this.scope];
			}
		};

		options.proto = Object.create(HTMLElement.prototype, options.properties);

		options.proto.attachedCallback = options.attached;
		options.proto.detachedCallback = options.detached;
		options.proto.attributeChangedCallback = options.attributed;

		options.proto.createdCallback = function () {
			self.created(this, options);
		};

		return document.registerElement(options.name, {
			prototype: options.proto
		});

	};

	var Utility = {};

	Utility.PATH = /\s*\|.*/;
	Utility.PREFIX = /(data-)?o-/;
	Utility.ROOT = /^(https?:)?\/?\//;
	Utility.TYPE = /(data-)?o-|-.*$/g;
	Utility.SPLIT_MODIFIERS = /\s|\s?,\s?/;

	Utility.binderNormalize = function (data) {
		return !data ? '' : data
			.replace(/\s+$/, '')
			.replace(/^\s+/, '')
			.replace(/\.{2,}/g, '.')
			.replace(/\|{2,}/g, '|')
			.replace(/\,{2,}/g, ',')
			.replace(/\s{2,}/g, ' ')
			.replace(/\s?\|\s?/, '|');
	};

	Utility.binderName = function (data) {
		return data.replace(this.PREFIX, '');
	};

	Utility.binderType = function (data) {
		return data.replace(this.TYPE, '');
	};

	Utility.binderNames = function (data) {
		return data.replace(this.PREFIX, '').split('-');
	};

	Utility.binderValues = function (data) {
		data = Utility.binderNormalize(data);
		var index = data.indexOf('|');
		return index === -1 ? data.split('.') : data.slice(0, index).split('.');
	};

	Utility.binderModifiers = function (data) {
		data = Utility.binderNormalize(data);
		var index = data.indexOf('|');
		return index === -1 ? [] : data.slice(index + 1).split(Utility.SPLIT_MODIFIERS);
	};

	Utility.binderPath = function (data) {
		return Utility.binderNormalize(data).replace(Utility.PATH, '');
	};

	Utility.formData = function (form, model) {
		var elements = form.querySelectorAll('[o-value]');
		var data = {};

		var done = 0;
		var count = 0;

		for (var i = 0, l = elements.length; i < l; i++) {

			var element = elements[i];
			var path = element.getAttribute('o-value');

			if (!path) continue;

			path = path.replace(/\s*\|.*/, '');
			var name = path.split('.').slice(-1);

			data[name] = Utility.getByPath(model, path);
		}

		return data;
	};

	Utility.walker = function (node, callback) {
		callback(node);
		node = node.firstChild;
		while (node) {
		    this.walker(node, callback);
		    node = node.nextSibling;
		}
	};

	Utility.replaceEachVariable = function (element, variable, path, index) {
		var self = this;
		var iindex = '$index';
		var vindex = '$' + variable;
		var result = [];

		this.walker(element, function (node) {
			if (node.nodeType === 3) {
				if (node.nodeValue === vindex || node.nodeValue === iindex) {
					node.nodeValue = index;
				}
			} else if (node.nodeType === 1) {
				for (var i = 0, l = node.attributes.length; i < l; i++) {
					var attribute = node.attributes[i];
					var name = attribute.name;
					var value = attribute.value.split(' ')[0].split('|')[0];
					if (name.indexOf('o-') === 0 || name.indexOf('data-o-') === 0) {
						if (value === variable || value.indexOf(variable) === 0) {
							attribute.value = path + '.' + index + attribute.value.slice(variable.length);
						}
					}
				}
			}
		});

	};

	Utility.traverse = function (data, path, callback) {
		var keys = typeof path === 'string' ? path.split('.') : path;
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			var key = keys[i];

			if (!(key in data)) {
				if (typeof callback === 'function') {
					callback(data, key, i, keys);
				} else {
					return undefined;
				}
			}

			data = data[key];
		}

		return {
			data: data,
			key: keys[last]
		}
	};

	Utility.setByPath = function (data, path, value) {
		var keys = typeof path === 'string' ? path.split('.') : path;
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			var key = keys[i];

			if (!(key in data)) {

				if (isNaN(keys[i+1])) {
					data[key] = {};
				} else {
					data[key] = [];
				}

			}

			data = data[key];
		}

		return data[keys[last]] = value;
	};

	Utility.getByPath = function (data, path) {
		var keys = typeof path === 'string' ? path.split('.') : path;
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			var key = keys[i];

			if (!(key in data)) {
				return undefined;
			} else {
				data = data[key];
			}

		}

		return data[keys[last]];
	};

	Utility.joinDot = function () {
		return Array.prototype.join
			.call(arguments, '.')
			.replace(/\.{2,}/g, '.');
	};

	Utility.getScope = function getScope (element) {

		if (element.hasAttribute('o-scope') || element.hasAttribute('data-o-scope')) {
			return element;
		}

		if (element.parentElement) {
			return this.getScope(element.parentElement);
		}

		console.warn('Oxe.utility - could not find container scope');
		console.warn(element);
	};

	Utility.extension = function (data) {
		var position = data.lastIndexOf('.');
		return position > 0 ? data.slice(position + 1) : '';
	};

	Utility.join = function () {
		return Array.prototype.join
			.call(arguments, '/')
			.replace(/\/{2,}/g, '/')
			.replace(/^(https?:\/)/, '$1/');
	};

	Utility.base = function () {
		if (window.document.head.querySelector('base')) {
			return window.document.head.querySelector('base').href;
		} else {
			return window.location.origin + '/';
		}
	};

	Utility.resolve = function (path, base) {
		var result = [];

		path = path.replace(window.location.origin, '');

		if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0 || path.indexOf('//') === 0) {
			return path;
		}

		if (path.charAt(0) !== '/') {
			base = base || this.base();
			path = base + '/' + path;
			path = path.replace(window.location.origin, '');
		}

		path = path.replace(/\/{2,}/, '/');
		path = path.replace(/^\//, '');
		path = path.replace(/\/$/, '');

		var paths = path.split('/');

		for (var i = 0, l = paths.length; i < l; i++) {
			if (paths[i] === '.' || paths[i] === '') {
				continue;
			} else if (paths[i] === '..') {
				if (i > 0) {
					result.splice(i - 1, 1);
				}
			} else {
				result.push(paths[i]);
			}
		}

		return '/' + result.join('/');
	};

	function Events () {
		this.events = {};
	}

	Events.prototype.on = function (name, method) {

		if (!(name in this.events)) {
			this.events[name] = [];
		}

		this.events[name].push(method);
	};

	Events.prototype.off = function (name, method) {

		if (name in this.events) {

			var index = this.events[name].indexOf(method);

			if (index !== -1) {
				this.events[name].splice(index, 1);
			}

		}

	};

	Events.prototype.emit = function (name) {

		if (name in this.events) {
			
			var methods = this.events[name];
			var args = Array.prototype.slice.call(arguments, 1);

			for (var i = 0, l = methods.length; i < l; i++) {
				methods[i].apply(this, args);
			}

		}

	};

	var Batcher = function (options) {
		Events.call(this);

		this.reads = [];
		this.writes = [];
		this.fps = 1000/60;
		this.pending = false;

		this.setup(options);
	};

	Batcher.prototype = Object.create(Events.prototype);
	Batcher.prototype.constructor = Batcher;

	Batcher.prototype.setup = function (options) {
		options = options || {};
		options.fps = options.fps === undefined || options.fps === null ? this.fps : options.fps;
	};

	// adds a task to the read batch
	Batcher.prototype.read = function (method, context) {
		var task = context ? method.bind(context) : method;
		this.reads.push(task);
		this.tick();
		return task;
	};

	// adds a task to the write batch
	Batcher.prototype.write = function (method, context) {
		var task = context ? method.bind(context) : method;
		this.writes.push(task);
		this.tick();
		return task;
	};

	// schedules a new read/write batch if one is not pending
	Batcher.prototype.tick = function () {
		if (!this.pending) {
			this.pending = true;
			window.requestAnimationFrame(this.flush.bind(this));
		}
	};

	Batcher.prototype.flush = function (time) {
		var error, count;

		try {
			count = this.runReads(this.reads, time);
			this.runWrites(this.writes, count);
		} catch (e) {
			if (this.events.error && this.events.error.length) {
				this.emit('error', e);
			} else {
				throw e;
			}
		}

		this.pending = false;

		if (this.reads.length || this.writes.length) {
			this.tick();
		}

	};

	Batcher.prototype.runWrites = function (tasks, count) {
		var task;

		while (task = tasks.shift()) {

			task();

			if (count && tasks.length === count) {
				return;
			}

		}

	};

	Batcher.prototype.runReads = function (tasks, time) {
		var task;

		while (task = tasks.shift()) {

			task();

			if (this.fps && performance.now() - time > this.fps) {
				return tasks.length;
			}

		}

	};

	Batcher.prototype.remove = function (tasks, task) {
		var index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
	};

	Batcher.prototype.clear = function (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	};

	var Fetcher = function (options) {
		this.setup(options);
	};

	Fetcher.prototype.mime = {
		xml: 'text/xml; charset=utf-8',
		html: 'text/html; charset=utf-8',
		text: 'text/plain; charset=utf-8',
		json: 'application/json; charset=utf-8',
		js: 'application/javascript; charset=utf-8'
	};

	Fetcher.prototype.setup = function (options) {
		options = options || {};
		this.auth = options.auth || false;
		this.method = options.method || 'get';
		this.request = options.request;
		this.response = options.response;
		this.acceptType = options.acceptType;
		this.contentType = options.contentType;
		this.responseType = options.responseType;
	};

	Fetcher.prototype.serialize = function (data) {
		var string = '';

		for (var name in data) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return string;
	};

	Fetcher.prototype.change = function (opt, result, xhr) {
		if (xhr.readyState === 4) {

			result.opt = opt;
			result.xhr = xhr;
			result.statusCode = xhr.status;
			result.statusText = xhr.statusText;

			if (xhr['response'] !== undefined) {
				result.data = xhr.response;
			} else if (xhr['responseText'] !== undefined) {
				result.data = xhr.responseText;
			} else {
				result.data = undefined;
			}

			// NOTE this is added for IE10-11 support http://caniuse.com/#search=xhr2
			if (opt.responseType === 'json' && typeof result.data === 'string') {
				try {
					result.data = JSON.parse(result.data);
				} catch (error) {
					console.warn(error);
				}
			}

			if (xhr.status === 401 || xhr.status === 403) {
				if (result.opt.auth) {
					if (Global$1.keeper.response) {
						return Global$1.keeper.response(result);
					}
				}
			}

			if (this.response && this.response(result) === false) {
				return;
			}

			if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
				if (opt.success) {
					opt.success(result);
				} else if (opt.handler) {
					opt.error = false;
					opt.handler(result);
				}
			} else {
				if (opt.error) {
					opt.error(result);
				} else if (opt.handler) {
					opt.error = true;
					opt.handler(result);
				}
			}

		}
	};

	Fetcher.prototype.fetch = function (opt) {
		var data;
		var result = {};
		var xhr = new XMLHttpRequest();

		opt = opt || {};

		opt.headers = {};
		opt.url = opt.url ? opt.url : window.location.href;
		opt.auth = opt.auth === undefined || opt.auth === null ? this.auth : opt.auth;
		opt.method = opt.method === undefined || opt.method === null ? this.method : opt.method;
		opt.acceptType = opt.acceptType === undefined || opt.acceptType === null ? this.acceptType : opt.acceptType;
		opt.contentType = opt.contentType === undefined || opt.contentType === null ? this.contentType : opt.contentType;
		opt.responseType = opt.responseType === undefined || opt.responseType === null ? this.responseType : opt.responseType;

		opt.method = opt.method.toUpperCase();

		xhr.open(opt.method, opt.url, true, opt.username, opt.password);

		if (opt.contentType) {
			switch (opt.contentType) {
				case 'js': opt.headers['Content-Type'] = this.mime.js; break;
				case 'xml': opt.headers['Content-Type'] = this.mime.xml; break;
				case 'html': opt.headers['Content-Type'] = this.mime.html; break;
				case 'json': opt.headers['Content-Type'] = this.mime.json; break;
				default: opt.headers['Content-Type'] = opt.contentType;
			}
		}

		if (opt.acceptType) {
			switch (opt.acceptType) {
				case 'js': opt.headers['Accept'] = this.mime.js; break;
				case 'xml': opt.headers['Accept'] = this.mime.xml; break;
				case 'html': opt.headers['Accept'] = this.mime.html; break;
				case 'json': opt.headers['Accept'] = this.mime.json; break;
				default: opt.headers['Accept'] = opt.acceptType;
			}
		}

		if (opt.responseType) {
			switch (opt.responseType) {
				case 'text': xhr.responseType = 'text'; break;
				case 'json': xhr.responseType = 'json'; break;
				case 'blob': xhr.responseType = 'blob'; break;
				case 'xml': xhr.responseType = 'document'; break;
				case 'html': xhr.responseType = 'document'; break;
				case 'document': xhr.responseType = 'document'; break;
				case 'arraybuffer': xhr.responseType = 'arraybuffer'; break;
				default: xhr.responseType = opt.responseType;
			}
		}

		if (opt.mimeType) {
			xhr.overrideMimeType(opt.mimeType);
		}

		if (opt.withCredentials) {
			xhr.withCredentials = opt.withCredentials;
		}

		if (opt.headers) {
			for (var name in opt.headers) {
				xhr.setRequestHeader(name, opt.headers[name]);
			}
		}

		if (opt.data) {
			if (opt.method === 'GET') {
				opt.url = opt.url + '?' + this.serialize(opt.data);
			} else if (opt.contentType === 'json') {
				data = JSON.stringify(opt.data);
			} else {
				data = opt.data;
			}
		}

		result.xhr = xhr;
		result.opt = opt;
		result.data = opt.data;

		if (result.opt.auth) {
			if (Global$1.keeper.request(result) === false) {
				return;
			}
		}

		if (this.request && this.request(result) === false) {
			return;
		}

		xhr.onreadystatechange = this.change.bind(this, opt, result, xhr);
		xhr.send(data);
	};

	Fetcher.prototype.post = function (opt) {
		opt.method = 'post';
		return this.fetch(opt);
	};

	Fetcher.prototype.get = function (opt) {
		opt.method = 'get';
		return this.fetch(opt);
	};

	Fetcher.prototype.put = function (opt) {
		opt.method = 'put';
		return this.fetch(opt);
	};

	Fetcher.prototype.head = function (opt) {
		opt.method = 'head';
		return this.fetch(opt);
	};

	Fetcher.prototype.patch = function (opt) {
		opt.method = 'patch';
		return this.fetch(opt);
	};

	Fetcher.prototype.delete = function (opt) {
		opt.method = 'delete';
		return this.fetch(opt);
	};

	Fetcher.prototype.options = function (opt) {
		opt.method = 'options';
		return this.fetch(opt);
	};

	Fetcher.prototype.connect = function (opt) {
		opt.method = 'connect';
		return this.fetch(opt);
	};

	var Router = function () {
		Events.call(this);

		this.data = [];
		this.location = {};

		this.ran = false;
		this.auth = false;
		this.hash = false;
		this.trailing = false;

		this.element = null;
		this.container = null;
		this.compiled = false;

		document.addEventListener('click', this.clickListener.bind(this), true);
		window.addEventListener('popstate', this.stateListener.bind(this), true);
	};

	Router.prototype = Object.create(Events.prototype);
	Router.prototype.constructor = Router;

	Router.prototype.setup = function (options) {
		options = options || {};

		this.auth = options.auth === undefined ? this.auth : options.auth;
		this.hash = options.hash === undefined ? this.hash : options.hash;
		this.element = options.element === undefined ? this.element : options.element;
		this.external = options.external === undefined ? this.external : options.external;
		this.trailing = options.trailing === undefined ? this.trailing : options.trailing;
		this.container = options.container === undefined ? this.container : options.container;

		if (options.routes) {
			this.data = this.data.concat(options.routes);
		}

		this.route(window.location.href, { replace: true });
	};

	Router.prototype.scroll = function (x, y) {
		window.scroll(x, y);
	};

	Router.prototype.back = function () {
		window.history.back();
	};

	Router.prototype.redirect = function (path) {
		window.location.href = path;
	};

	Router.prototype.add = function (route) {
		if (!route) {
			throw new Error('Oxe.router.add - requires route parameter');
		} else if (route.constructor.name === 'Object') {
			this.data.push(route);
		} else if (route.constructor.name === 'Array') {
			this.data = this.data.concat(route);
		}
	};

	Router.prototype.remove = function (path) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (path === this.data[i].path) {
				this.data.splice(i, 1);
			}
		}
	};

	Router.prototype.get = function (path) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			var route = this.data[i];
			if (path === route.path) {
				return route;
			}
		}
	};

	Router.prototype.find = function (path) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			var route = this.data[i];
			if (this.isPath(route.path, path)) {
				return route;
			}
		}
	};

	Router.prototype.isPath = function (routePath, userPath) {
		return new RegExp(
			'^' + routePath
			.replace(/{\*}/g, '(?:.*)')
			.replace(/{(\w+)}/g, '([^\/]+)')
			+ '(\/)?$'
		).test(userPath || '/');
	};

	Router.prototype.toParameterObject = function (routePath, userPath) {
		var result = {};

		if (
			!routePath
			|| !userPath
			|| routePath === '/'
			|| userPath === '/'
		) return result;

		var brackets = /{|}/g;
		var pattern = /{(\w+)}/;
		var userPaths = userPath.split('/');
		var routePaths = routePath.split('/');

		for (var i = 0, l = routePaths.length; i < l; i++) {

			if (pattern.test(routePaths[i])) {
				var name = routePaths[i].replace(brackets, '');
				result[name] = userPaths[i];
			}

		}

		return result;
	};

	Router.prototype.toQueryString = function (data) {
		var result = '?';

		for (var key in data) {
			var value = data[key];
			result += key + '=' + value + '&';
		}

		if (result.slice(-1) === '&') {
			result = result.slice(0, -1);
		}

		return result;
	};

	Router.prototype.toQueryObject = function (path) {
		var result = {};

		if (path.indexOf('?') === 0) path = path.slice(1);
		var queries = path.split('&');

		for (var i = 0, l = queries.length; i < l; i++) {
			var query = queries[i].split('=');

			if (query[0] && query[1]) {
				result[query[0]] = query[1];
			}

		}

		return result;
	};

	Router.prototype.toLocationObject = function (path) {
		var location = {};

		location.port = window.location.port;
		location.host = window.location.host;
		location.hash = window.location.hash;
		location.origin = window.location.origin;
		location.hostname = window.location.hostname;
		location.protocol = window.location.protocol;
		location.username = window.location.username;
		location.password = window.location.password;

		location.pathname = decodeURI(path);
		location.base = Global$1.utility.base();
		location.basename = location.base;

		if (location.basename.indexOf(location.origin) === 0) {
			location.basename = location.basename.slice(location.origin.length);
		}

		if (location.pathname.indexOf(location.origin) === 0) {
			location.pathname = location.pathname.slice(location.origin.length);
		}

		if (location.pathname.indexOf(location.basename) === 0) {
			location.pathname = location.pathname.slice(location.basename.length);
		}

		if (location.pathname.indexOf(location.basename.slice(0, -1)) === 0) {
			location.pathname = location.pathname.slice(location.basename.slice(0, -1).length);
		}

		if (
			this.hash
			&& location.pathname.indexOf('#') === 0
			|| location.pathname.indexOf('/#') === 0
			|| location.pathname.indexOf('#/') === 0
			|| location.pathname.indexOf('/#/') === 0
		) {
			location.pathname = location.pathname.slice(2);
		}

		var hashIndex = location.pathname.indexOf('#');
		if (hashIndex !== -1) {
			location.hash = location.pathname.slice(hashIndex);
			location.pathname = location.pathname.slice(0, hashIndex);
		} else {
			location.hash = '';
		}

		var searchIndex = location.pathname.indexOf('?');
		if (searchIndex !== -1) {
			location.search = location.pathname.slice(searchIndex);
			location.pathname = location.pathname.slice(0, searchIndex);
		} else {
			location.search = '';
		}

		location.routePath = Global$1.utility.join('/', location.pathname);
		location.pathname = Global$1.utility.join(location.basename, location.pathname);
		location.href = Global$1.utility.join(location.origin, this.hash ? '#' : '/', location.pathname);

		if (this.trailing) {
			location.href = Global$1.utility.join(location.href, '/');
			location.pathname = Global$1.utility.join(location.pathname, '/');
		} else {
			location.href = location.href.replace(/\/{1,}$/, '');
			location.pathname = location.pathname.replace(/\/{1,}$/, '');
		}

		if (this.hash && /\/#$/.test(location.href)) {
			location.href = location.href + '/';
		}

		location.routePath = location.routePath || '/';
		location.pathname = location.pathname || '/';
		location.href += location.search;
		location.href += location.hash;

		return location;
	};

	Router.prototype.render = function (route) {

		if (document.readyState === 'interactive' || document.readyState === 'complete') {

			this.emit('routing');

			if (route.title) {
				document.title = route.title;
			}

			if (!this.element) {
				this.element = this.element || 'o-router';

				if (typeof this.element === 'string') {
					this.element = document.body.querySelector(this.element);
				}

				if (!this.element) {
					throw new Error('Oxe.router - Missing o-router');
				}

			}

			if (!route.element) {

				if (route.load) {
					Global$1.loader.load(route.load);
				}

				if (typeof route.component === 'string') {
					route.element = document.createElement(route.component);
				} else {
					Global$1.component.define(route.component);
					route.element = document.createElement(route.component.name);
				}

				route.element.inRouterCache = false;
				route.element.isRouterComponent = true;
			}

			while (this.element.firstChild) {
				this.element.removeChild(this.element.firstChild);
			}

			this.element.appendChild(route.element);

			this.scroll(0, 0);
			this.emit('routed');

		} else {
			document.addEventListener('DOMContentLoaded', function _ () {
				this.render.bind(this, route);
				document.removeEventListener('DOMContentLoaded', _);
			}.bind(this), true);
		}

	};

	Router.prototype.route = function (data, options) {
		var location, route;

		options = options || {};

		if (typeof data === 'string') {

			if (options.query) {
				data += this.toQueryString(options.query);
			}

			location = this.toLocationObject(data);
			route = this.find(location.routePath) || {};

			location.title = route.title || '';
			location.query = this.toQueryObject(location.search);
			location.parameters = this.toParameterObject(route.path, location.routePath);

		} else {
			location = data;
			route = this.find(location.routePath) || {};
		}

		if (this.auth && (route.auth === true || route.auth === undefined)) {

			if (Global$1.keeper.route(route) === false) {
				return;
			}

		}

		if (route.handler) {
			return route.handler(route);
		}

		if (route.redirect) {
			return redirect(route.redirect);
		}

		if (this.compiled) {

			if (route.title) {
				document.title = route.title;
			}

			return;
		}

		this.location = location;

		window.history[options.replace ? 'replaceState' : 'pushState'](location, location.title, location.href);

		this.render(route);
	};

	Router.prototype.stateListener = function (e) {
		this.route(e.state || window.location.href, { replace: true });
	};

	Router.prototype.clickListener = function (e) {

		// if shadow dom use
		var target = e.path ? e.path[0] : e.target;
		var parent = target.parentNode;

		if (this.container) {

			while (parent) {

				if (parent === this.container) {
					break;
				} else {
					parent = parent.parentNode;
				}

			}

			if (parent !== this.container) {
				return;
			}

		}

		if (e.metaKey || e.ctrlKey || e.shiftKey) {
			return;
		}

		// ensure target is anchor tag
		while (target && 'A' !== target.nodeName) {
			target = target.parentNode;
		}

		if (!target || 'A' !== target.nodeName) {
			return;
		}

		// check non acceptables
		if (target.hasAttribute('download') ||
			target.hasAttribute('external') ||
			target.hasAttribute('o-external') ||
			target.href.indexOf('tel:') === 0 ||
			target.href.indexOf('ftp:') === 0 ||
			target.href.indexOf('file:') === 0 ||
			target.href.indexOf('mailto:') === 0 ||
			target.href.indexOf(window.location.origin) !== 0
		) return;

		// if external is true then default action
		if (this.external &&
			(this.external.constructor.name === 'RegExp' && this.external.test(target.href) ||
			this.external.constructor.name === 'Function' && this.external(target.href) ||
			this.external.constructor.name === 'String' && this.external === target.href)
		) return;

		if (this.location.href !== target.href) {
			this.route(target.href);
		}

		if (!this.compiled) {
			e.preventDefault();
		}

	};

	var Transformer = {};

	/*

		templates

	*/

	Transformer._innerHandler = function (char) {
		if (char === '\'') return '\\\'';
		if (char === '\"') return '\\"';
		if (char === '\t') return '\\t';
		if (char === '\n') return '\\n';
	};

	Transformer._updateString = function (value, index, string) {
		return string.slice(0, index) + value + string.slice(index+1);
	};

	Transformer._updateIndex = function (value, index) {
		return index + value.length-1;
	};

	Transformer.template = function (data) {
		// NOTE: double backtick in strings or regex could possibly causes issues

		var first = data.indexOf('`');
		var second = data.indexOf('`', first+1);

		if (first === -1 || second === -1) return data;

		var value;
		var ends = 0;
		var starts = 0;
		var string = data;
		var isInner = false;

		for (var index = 0; index < string.length; index++) {
			var char = string[index];

			if (char === '`' && string[index-1] !== '\\') {

				if (isInner) {
					ends++;
					value = '\'';
					isInner = false;
					string = this._updateString(value, index, string);
					index = this._updateIndex(value, index);
				} else {
					starts++;
					value = '\'';
					isInner = true;
					string = this._updateString(value, index, string);
					index = this._updateIndex(value, index);
				}

			} else if (isInner) {

				if (value = this._innerHandler(char, index, string)) {
					string = this._updateString(value, index, string);
					index = this._updateIndex(value, index);
				}

			}

		}

		string = string.replace(/\${(.*?)}/g, '\'+$1+\'');

		if (starts === ends) {
			return string;
		} else {
			throw new Error('Oxe - Transformer missing backtick');
		}

	};

	/*

		modules

	*/

	Transformer.patterns = {
		// lines: /(.*(?:;|\n))/g,
		// line: /(.*\s*{.*\s*.*\s*}.*)|((?:\/\*|`|'|").*\s*.*\s*(?:"|'|`|\*\/))|(.*(?:;|\n))/g,
		exps: /export\s+(?:default|var|let|const)?\s+/g,
		imps: /import(?:\s+(?:\*\s+as\s+)?\w+\s+from)?\s+(?:'|").*?(?:'|")/g,
		imp: /import(?:\s+(?:\*\s+as\s+)?(\w+)\s+from)?\s+(?:'|")(.*?)(?:'|")/
	};

	Transformer.getImports = function (text, base) {
		var result = [];
		var imps = text.match(this.patterns.imps) || [];

		for (var i = 0, l = imps.length; i < l; i++) {
			var imp = imps[i].match(this.patterns.imp);

			result[i] = {
				raw: imp[0],
				name: imp[1],
				url: Global$1.utility.resolve(imp[2], base),
				extension: Global$1.utility.extension(imp[2])
			};

			if (!result[i].extension) {
				result[i].url = result[i].url + '.js';
			}

		}

		return result;
	};

	Transformer.getExports = function (text) {
		var result = [];
		var exps = text.match(this.patterns.exps) || [];

		for (var i = 0, l = exps.length; i < l; i++) {
			var exp = exps[i];

			result[i] = {
				raw: exp,
				default: exp.indexOf('default') !== -1,
			};

		}

		return result;
	};

	Transformer.replaceImports = function (text, imps) {

		if (!imps.length) {
			return text;
		}

		for (var i = 0, l = imps.length; i < l; i++) {
			var imp = imps[i];

			var pattern = (imp.name ? 'var ' + imp.name + ' = ' : '') + '$LOADER.data[\'' + imp.url + '\'].result';

			text = text.replace(imp.raw, pattern);
		}

		return text;
	};

	Transformer.replaceExports = function (text, exps) {

		if (!exps.length) {
			return text;
		}

		if (exps.length === 1) {
			return text.replace(exps[0].raw, 'return ');
		}

		var i, l, pattern;

		text = 'var $EXPORT = {};\n' + text;
		text = text + '\nreturn $EXPORT;\n';

		for (i = 0, l = exps.length; i < l; i++) {
			text = text.replace(exps[i].raw, '$EXPORT.');
		}

		return text;
	};

	Transformer.ast = function (data) {
		var ast = {};

		ast.url = data.url;
		ast.raw = data.text;
		ast.cooked = data.text;
		ast.base = ast.url.slice(0, ast.url.lastIndexOf('/') + 1);

		ast.imports = this.getImports(ast.raw, ast.base);
		ast.exports = this.getExports(ast.raw);

		ast.cooked = this.replaceImports(ast.cooked, ast.imports);
		ast.cooked = this.replaceExports(ast.cooked, ast.exports);

		return ast;
	};

	var Loader = function () {
		Events.call(this);

		this.data = {};
		this.ran = false;
		this.methods = {};
		this.transformers = {};

		document.addEventListener('load', this.listener.bind(this), true);
	};

	Loader.prototype = Object.create(Events.prototype);
	Loader.prototype.constructor = Loader;

	Loader.prototype.setup = function (options) {
		options = options || {};

		this.methods = options.methods || this.methods;
		this.transformers = options.transformers || this.transformers;

		if (options.loads) {
			var load;
			while (load = options.loads.shift()) {
				this.load(load);
			}
		}

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

		data.url = Global$1.utility.resolve(data.url);

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

		data.extension = data.extension || Global$1.utility.extension(data.url);

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

		var path = Global$1.utility.resolve(element.src || element.href);
		var load = this.data[path];

		this.ready(load);
	};



	/*
		https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
	*/

	var Unrender = {};

	Unrender.alt = function (opt) {
		opt.element.alt = '';
	};

	Unrender.each = function (opt) {
		var element;

		while (element = opt.element.lastElementChild) {
			opt.element.removeChild(element);
		}

	};

	Unrender.href = function (opt) {
		opt.element.href = '';
	};

	Unrender.class = function (opt) {

		var className = opt.names.slice(1).join('-');
		opt.element.classList.remove(className);

	};

	Unrender.html = function (opt) {
		var element;

		while (element = opt.element.lastElementChild) {
			opt.element.removeChild(element);
		}

	};

	Unrender.on = function (opt) {
		opt.element.removeEventListener(opt.names[1], opt.cache, false);
	};

	Unrender.css = function (opt) {

		opt.element.style.cssText = '';

	};

	Unrender.required = function (opt) {

		opt.element.required = false;

	};

	Unrender.src = function (opt) {
		opt.element.src = '';
	};

	Unrender.text = function (opt, data) {
		opt.element.innerText = '';
	};

	Unrender.value = function (opt) {
		var i , l, query, element, elements;

		if (opt.element.type === 'checkbox') {

			opt.element.checked = false;
			opt.element.value = false;

		} else if (opt.element.nodeName === 'SELECT') {

			elements = opt.element.options;

			for (i = 0, l = elements.length; i < l; i++) {
				element = elements[i];
				element.selected = false;
			}

		} else if (opt.element.type === 'radio') {

			query = 'input[type="radio"][o-value="' + opt.path + '"]';
			elements = opt.element.parentNode.querySelectorAll(query);

			for (i = 0, l = elements.length; i < l; i++) {
				element = elements[i];

				if (i === 0) {
					element.checked = true;
				} else {
					element.checked = false;
				}

			}

		} else {
			opt.element.value = '';
		}

	};

	Unrender.default = function (opt) {
		console.log(opt);
	};

	var Render = {};

	// TODO dynamic for list dont handle selected

	Render.required = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.required === opt.data) {
				opt.pending = false;
				return;
			}

			Global$1.batcher.write(function () {
				opt.element.required = Global$1.binder.modifyData(opt, opt.data);
				opt.pending = false;
			});
		});
	};

	Render.disable = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.disabled === opt.data) {
				opt.pending = false;
				return;
			}

			Global$1.batcher.write(function () {
				opt.element.disabled = Global$1.binder.modifyData(opt, opt.data);
				opt.pending = false;
			});
		});
	};

	Render.enable = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.disabled === !opt.data) {
				opt.pending = false;
				return;
			}

			Global$1.batcher.write(function () {
				opt.element.disabled = !Global$1.binder.modifyData(opt, opt.data);
				opt.pending = false;
			});
		});
	};

	Render.hide = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.hidden === opt.data) {
				opt.pending = false;
				return;
			}

			Global$1.batcher.write(function () {
				opt.element.hidden = Global$1.binder.modifyData(opt, opt.data);
				opt.pending = false;
			});
		});
	};

	Render.show = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.hidden === !opt.data) {
				opt.pending = false;
				return;
			}

			Global$1.batcher.write(function () {
				opt.element.hidden = !Global$1.binder.modifyData(opt, opt.data);
				opt.pending = false;
			});
		});
	};

	Render.read = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.readOnly === opt.data) {
				opt.pending = false;
				return;
			}

			Global$1.batcher.write(function () {
				opt.element.readOnly = Global$1.binder.modifyData(opt, opt.data);
				opt.pending = false;
			});
		});
	};

	Render.write = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.readOnly === !opt.data) {
				opt.pending = false;
				return;
			}

			Global$1.batcher.write(function () {
				opt.element.readOnly = !Global$1.binder.modifyData(opt, opt.data);
				opt.pending = false;
			});
		});
	};

	Render.html = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.innerHTML === opt.data) {
				opt.pending = false;
				return;
			}

			Global$1.batcher.write(function () {
				opt.element.innerHTML = Global$1.binder.modifyData(opt, opt.data);
				opt.pending = false;
			});
		});
	};

	Render.class = function (opt) {
		Global$1.batcher.write(function () {
			var name = opt.names.slice(1).join('-');
			opt.element.classList.toggle(name, Global$1.binder.modifyData(opt, opt.data));
			opt.pending = false;
		});
	};

	Render.on = function (opt) {

		if (opt.cache) {
			opt.element.removeEventListener(opt.names[1], opt.cache);
		} else {
			opt.cache = Global$1.utility.getByPath(Global$1.methods.data, opt.scope + '.' + opt.path).bind(opt.container);
		}

		opt.element.addEventListener(opt.names[1], opt.cache);
		opt.pending = false;
	};

	Render.css = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element.style.cssText === opt.data) {
				opt.pending = false;
				return;
			}

			var data;

			if (opt.names.length > 1) {
				data = opt.names.slice(1).join('-') + ': ' +  data + ';';
			}

			Global$1.batcher.write(function () {
				opt.element.style.cssText = Global$1.binder.modifyData(opt, data);
				opt.pending = false;
			});
		});
	};

	Render.text = function (opt) {
		var data = opt.data === undefined || opt.data === null ? '' : opt.data;

		if (data && typeof data === 'object') {
			data = JSON.stringify(data);
		} else if (data && typeof data !== 'string') {
			data = String(data);
		}

		Global$1.batcher.write(function () {
			opt.element.innerText = Global$1.binder.modifyData(opt, data);
			opt.pending = false;
		});

	};

	Render.each = function (opt) {

		if (!opt.cache) {
			opt.cache = opt.element.removeChild(opt.element.firstElementChild);
		}

		if (!opt.data || typeof opt.data !== 'object' || opt.element.children.length === opt.data.length) {
			opt.pending = false;
			return;
		}

		Global$1.batcher.read(function () {

			var clone;
			var element = opt.element;
			var data = Global$1.binder.modifyData(opt, opt.data);

			var dLength = data.length;
			var eLength = element.children.length;

			Global$1.batcher.write(function () {

				while (eLength !== dLength) {

					if (eLength > dLength) {

						eLength--;
						element.removeChild(element.children[eLength]);

					} else if (eLength < dLength) {

						clone = opt.cache.cloneNode(true);
						Global$1.utility.replaceEachVariable(clone, opt.names[1], opt.path, eLength);
						element.appendChild(clone);
						eLength++;

					}

				}

				opt.pending = false;
			});
		});
	};

	Render.value = function (opt, caller) {

		Global$1.batcher.read(function () {

			var data, attribute, query;
			var i, l, element, elements;
			var type = opt.element.type;
			var name = opt.element.nodeName;

			if (caller === 'view') {

				if (name === 'SELECT') {
					data = opt.element.multiple ? [] : '';
					elements = opt.element.options;

					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];

						if (element.selected) {
							if (opt.element.multiple) {
								data.push(element.value || element.innerText);
							} else {
								data = element.value || element.innerText;
								break;
							}
						}

					}

				} else if (type === 'radio') {
					query = 'input[type="radio"][o-value="' + opt.value + '"]';
					elements = opt.container.querySelectorAll(query);

					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];

						if (opt.element === element) {
							data = i;
							break;
						}

					}

				} else if (type === 'file') {
					data = data || [];
					for (i = 0, l = opt.element.files.length; i < l; i++) {
						data[i] = opt.element.files[i];
					}
				} else if (type === 'checkbox') {
					data = opt.element.checked;
				} else {
					data = opt.element.value;
				}

				Global$1.model.set(opt.keys, data);
				opt.pending = false;

			} else {
				Global$1.batcher.write(function () {

					if (name === 'SELECT') {
						data = opt.data === undefined ? opt.element.multiple ? [] : '' : opt.data;

						for (i = 0, l = opt.element.options.length; i < l; i++) {
							if (!opt.element.options[i].disabled) {
								if (opt.element.options[i].selected) {
									if (opt.element.multiple) {
										data.push(opt.element.options[i].value || opt.element.options[i].innerText || '');
									} else {
										data = opt.element.options[i].value || opt.element.options[i].innerText || '';
										break;
									}
								} else if (i === l-1 && !opt.element.multiple) {
									data = opt.element.options[0].value || opt.element.options[0].innerText || '';
								}
							}
						}

						Global$1.model.set(opt.keys, data);
					} else if (type === 'radio') {
						data = opt.data === undefined ? Global$1.model.set(opt.keys, 0) : opt.data;
						query = 'input[type="radio"][o-value="' + opt.value + '"]';
						elements = opt.container.querySelectorAll(query);

						for (i = 0, l = elements.length; i < l; i++) {
							element = elements[i];
							element.checked = i === data;
						}

						elements[data].checked = true;
					} else if (type === 'file') {
						data = opt.data === undefined ? Global$1.model.set(opt.keys, []) : opt.data;
						for (i = 0, l = data.length; i < l; i++) {
							opt.element.files[i] = data[i];
						}
					} else if (type === 'checkbox') {
						attribute = 'checked';
						data = opt.data === undefined ? Global$1.model.set(opt.keys, false) : opt.data;
					} else {
						attribute = 'value';
						data = opt.data === undefined ? Global$1.model.set(opt.keys, '') : opt.data;
					}

					if (attribute) {
						opt.element[attribute] = data;
						opt.element[attribute] = Global$1.binder.modifyData(opt, data);
					}

					opt.pending = false;

				});
			}

		});

	};

	Render.default = function (opt) {
		Global$1.batcher.read(function () {

			if (opt.element[opt.type] === opt.data) {
				return;
			}

			Global$1.batcher.write(function () {
				opt.element[opt.type] = Global$1.binder.modifyData(opt, opt.data);
			});

		});
	};

	var Binder = function () {
		this.data = {};
	};

	Binder.prototype.modifyData = function (opt, data) {

		if (!opt.modifiers.length) {
			return data;
		}

		for (var i = 0, l = opt.modifiers.length; i < l; i++) {
			var modifier = opt.modifiers[i];
			data = Global$1.methods.data[opt.scope][modifier].call(opt.container, data);
		}

		return data;
	};

	Binder.prototype.add = function (opt) {

		if (!(opt.scope in this.data)) {
			this.data[opt.scope] = {};
		}

		if (!(opt.path in this.data[opt.scope])) {
			this.data[opt.scope][opt.path] = [];
		}

		this.data[opt.scope][opt.path].push(opt);
	};

	Binder.prototype.remove = function (opt) {

		if (!(opt.scope in this.data)) {
			return;
		}

		if (!(opt.path in this.data[opt.scope])) {
			return;
		}

		var data = this.data[opt.scope][opt.path];

		for (var i = 0, l = data.length; i < l; i++) {
			var item = data[i];

			if (item.element === opt.element) {
				return data.splice(i, 1);
			}

		}

	};

	Binder.prototype.get = function (opt) {

		if (!(opt.scope in this.data)) {
			return null;
		}

		if (!(opt.path in this.data[opt.scope])) {
			return null;
		}

		var data = this.data[opt.scope][opt.path];

		for (var i = 0; i < data.length; i++) {
			var item = data[i];

			if (item.element === opt.element) {
				if (item.name === opt.name) {
					return item;
				}
			}

		}

		return null;
	};

	Binder.prototype.each = function (scope, path, callback) {
		var i, key, binder, binders;
		var paths = this.data[scope];
		if (!path) {
			for (key in paths) {
				binders = paths[key];
				for (i = 0; i < binders.length; i++) {
					binder = binders[i];
					callback(binder, i, binders, paths, key);
				}
			}
		} else {
			for (key in paths) {
				if (key.indexOf(path) === 0) {
					if (key === path || key.slice(path.length).charAt(0) === '.') {
						binders = paths[key];

						for (i = 0; i < binders.length; i++) {
							binder = binders[i];
							callback(binder, i, binders, paths, key);
						}

					}
				}
			}
		}
	};

	Binder.prototype.create = function (opt) {
		opt = opt || {};

		if (!opt.name) {
			throw new Error('Binder.prototype.render - requires a name');
		}

		if (!opt.element) {
			throw new Error('Binder.prototype.render - requires a element');
		}

		opt.container = opt.container || Global$1.utility.getScope(opt.element);
		opt.scope = opt.scope || opt.container.getAttribute('o-scope');
		opt.value = opt.value || opt.element.getAttribute(opt.name);
		opt.path = opt.path || Global$1.utility.binderPath(opt.value);

		opt.type = opt.type || Global$1.utility.binderType(opt.name);
		opt.names = opt.names || Global$1.utility.binderNames(opt.name);
		opt.values = opt.values || Global$1.utility.binderValues(opt.value);
		opt.modifiers = opt.modifiers || Global$1.utility.binderModifiers(opt.value);

		opt.keys = opt.keys || [opt.scope].concat(opt.values);
		opt.model = opt.model || Global$1.model.data[opt.scope];

		return opt;
	};

	Binder.prototype.unrender = function (opt, caller) {

		opt = this.get(opt);

		if (!opt) {
			return;
		}

		if (opt.type in Unrender) {
			Unrender[opt.type](opt, caller);
		} else {
			Unrender.default(opt);
		}

		this.remove(opt);

	};

	Binder.prototype.render = function (opt, caller) {

		opt = this.create(opt);
		opt = this.get(opt) || opt;

		opt.data = Global$1.model.get(opt.keys);

		if (!opt.exists) {
			opt.exists = true;
			this.add(opt);
		}

		if (!opt.pending) {

			opt.pending = true;

			if (opt.type in Render) {
				Render[opt.type](opt, caller);
			} else {
				Render.default(opt);
			}

		}

	};

	var Keeper = function (options) {

		this._ = {};
		this._.token;

		this.scheme = 'Bearer';
		this.type = 'sessionStorage';

		Object.defineProperties(this, {
			token: {
				enumerable: true,
				get: function () {
					return this._.token = this._.token || window[this.type].getItem('token');
				}
			},
			user: {
				enumerable: true,
				get: function () {
					return this._.user = this._.user || JSON.parse(window[this.type].getItem('user'));
				}
			}
		});

		this.setup(options);
	};

	Keeper.prototype.setup = function (options) {
		options = options || {};

		this._.forbidden = options.forbidden || this._.forbidden;
		this._.unauthorized = options.unauthorized || this._.unauthorized;
		this._.authenticated = options.authenticated || this._.authenticated;
		this._.unauthenticated = options.unauthenticated || this._.unauthenticated;

		if (options.type) {
			this.type = options.type + 'Storage';
		}

		if (options.scheme) {
			this.scheme = options.scheme.slice(0, 1).toUpperCase() + options.scheme.slice(1);
		}

	};

	Keeper.prototype.setToken = function (token) {
		if (!token) return;
		if (this.scheme === 'Basic') token = this.encode(token);
		this._.token = window[this.type].setItem('token', token);
	};

	Keeper.prototype.setUser = function (user) {
		if (!user) return;
		user = JSON.stringify(user);
		this._.user = window[this.type].setItem('user', user);
	};

	Keeper.prototype.removeToken = function () {
		this._.token = null;
		window[this.type].removeItem('token');
	};

	Keeper.prototype.removeUser = function () {
		this._.user = null;
		window[this.type].removeItem('user');
	};

	Keeper.prototype.authenticate = function (token, user) {
		this.setToken(token);
		this.setUser(user);

		if (typeof this._.authenticated === 'string') {
			Global$1.router.route(this._.authenticated);
		} else if (typeof this._.authenticated === 'function') {
			this._.authenticated();
		}

	};

	Keeper.prototype.unauthenticate = function () {
		this.removeToken();
		this.removeUser();

		if (typeof this._.unauthenticated === 'string') {
			Global$1.router.route(this._.unauthenticated);
		} else if (typeof this._.unauthenticated === 'function') {
			this._.unauthenticated();
		}

	};

	Keeper.prototype.forbidden = function (result) {

		if (typeof this._.forbidden === 'string') {
			Global$1.router.route(this._.forbidden);
		} else if (typeof this._.forbidden === 'function') {
			this._.forbidden(result);
		}

		return false;
	};

	Keeper.prototype.unauthorized = function (result) {
		// NOTE might want to remove token and user
		// this.removeToken();
		// this.removeUser();

		if (typeof this._.unauthorized === 'string') {
			Global$1.router.route(this._.unauthorized);
		} else if (typeof this._.unauthorized === 'function') {
			this._.unauthorized(result);
		}

		return false;
	};

	Keeper.prototype.route = function (result) {

		if (result.auth === false) {
			return true;
		} else if (!this.token) {
			return this.unauthorized(result);
		} else {
			return true;
		}

	};

	Keeper.prototype.request = function (result) {

		if (result.opt.auth === false) {
			return true;
		} else if (!this.token) {
			return this.unauthorized(result);
		} else {
			result.xhr.setRequestHeader('Authorization', this.scheme + ' ' + this.token);
			return true;
		}

	};

	Keeper.prototype.response = function (result) {

		if (result.statusCode === 401) {
			return this.unauthorized(result);
		} else if (result.statusCode === 403) {
			return this.forbidden(result);
		} else {
			return true;
		}

	};

	Keeper.prototype.encode = function (data) {
		return window.btoa(data);
	};

	Keeper.prototype.decode = function (data) {
	    return window.atob(data);
	};



	/*

		https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding

		// Keeper.prototype.encode = function (data) {
		// 	// encodeURIComponent to get percent-encoded UTF-8
		// 	// convert the percent encodings into raw bytes which
		// 	return window.btoa(window.encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, function (match, char) {
		// 		return String.fromCharCode('0x' + char);
		// 	}));
		// };
		//
		// Keeper.prototype.decode = function (data) {
		// 	// from bytestream to percent-encoding to original string
		//     return window.decodeURIComponent(window.atob(data).split('').map(function(char) {
		//         return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
		//     }).join(''));
		// };

	*/

	var Observer = {};

	/*
		TODO:
			sort reverse
			test array methods
			figure out a way to not update removed items
	*/

	Observer.splice = function () {
		var startIndex = arguments[0];
		var deleteCount = arguments[1];
		var addCount = arguments.length > 2 ? arguments.length - 2 : 0;

		if (
			!this.length
			|| typeof startIndex !== 'number' || typeof deleteCount !== 'number'
		) {
			return [];
		}

		// handle negative startIndex
		if (startIndex < 0) {
			startIndex = this.length + startIndex;
			startIndex = startIndex > 0 ? startIndex : 0;
		} else {
			startIndex = startIndex < this.length ? startIndex : this.length;
		}

		// handle negative deleteCount
		if (deleteCount < 0) {
			deleteCount = 0;
		} else if (deleteCount > (this.length - startIndex)) {
			deleteCount = this.length - startIndex;
		}

		var totalCount = this.$meta.length;
		var key, index, value, updateCount;
		var argumentIndex = 2;
		var argumentsCount = arguments.length - argumentIndex;
		var result = this.slice(startIndex, deleteCount);

		updateCount = (totalCount - 1) - startIndex;

		if (updateCount > 0) {
			index = startIndex;
			while (updateCount--) {
				key = index++;

				if (argumentsCount && argumentIndex < argumentsCount) {
					value = arguments[argumentIndex++];
				} else {
					value = this.$meta[index];
				}

				this.$meta[key] = Observer.create(value, this.$meta.listener, this.$meta.path + key);
				this.$meta.listener(this.$meta[key], this.$meta.path + key, key);
			}
		}

		if (addCount > 0) {
			while (addCount--) {
				key = this.length;
				this.$meta[key] = Observer.create(arguments[argumentIndex++], this.$meta.listener, this.$meta.path + key);
				Observer.defineProperty(this, key);
				this.$meta.listener(this.length, this.$meta.path.slice(0, -1), 'length');
				this.$meta.listener(this.$meta[key], this.$meta.path + key, key);
			}
		}

		if (deleteCount > 0) {
			while (deleteCount--) {
				this.$meta.length--;
				this.length--;
				key = this.length;
				this.$meta.listener(key, this.$meta.path.slice(0, -1), 'length');
				this.$meta.listener(undefined, this.$meta.path + key, key);
			}
		}

		return result;
	};

	Observer.arrayProperties = function () {
		var self = this;

		return {
			push: {
				value: function () {
					if (!arguments.length) return this.length;

					for (var i = 0, l = arguments.length; i < l; i++) {
						self.splice.call(this, this.length, 0, arguments[i]);
					}

					return this.length;
				}
			},
			unshift: {
				value: function () {
					if (!arguments.length) return this.length;

					for (var i = 0, l = arguments.length; i < l; i++) {
						self.splice.call(this, 0, 0, arguments[i]);
					}

					return this.length;
				}
			},
			pop: {
				value: function () {
					if (!this.length) return;
					return self.splice.call(this, this.length-1, 1);
				}
			},
			shift: {
				value: function () {
					if (!this.length) return;
					return self.splice.call(this, 0, 1);
				}
			},
			splice: {
				value: self.splice
			}
		};
	};

	Observer.objectProperties = function () {
		var self = this;

		return {
			$get: {
				value: function (key) {
					return this[key];
				}
			},
			$set: {
				value: function (key, value) {
					if (value !== this[key]) {
						var result = self.create(value, this.$meta.listener, this.$meta.path + key);

						this.$meta[key] = result;
						self.defineProperty(this, key);

						this.$meta.listener(result, this.$meta.path + key, key);

						return result;
					}
				}
			},
			$remove: {
				value: function (key) {
					if (key in this) {
						if (this.constructor === Array) {
							return self.splice.call(this, key, 1);
						} else {
							var result = this[key];
							delete this.$meta[key];
							delete this[key];
							this.$meta.listener(undefined, this.$meta.path + key, key);
							return result;
						}
					}
				}
			}
		};
	};

	Observer.property = function (key) {
		var self = this;

		return {
			enumerable: true,
			configurable: true,
			get: function () {
				return this.$meta[key];
			},
			set: function (value) {
				if (value !== this.$meta[key]) {

					this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);

					this.$meta.listener(this[key], this.$meta.path + key, key, this);
				}
			}
		};
	};

	Observer.defineProperty = function (data, key) {
		return Object.defineProperty(data, key, this.property(key));
	};

	Observer.create = function (source, listener, path) {
		var self = this;

		if (!source || source.constructor !== Object && source.constructor !== Array) {
			return source;
		}

		path = path ? path + '.' : '';

		var key;
		var type = source.constructor;
		var target = source.constructor();
		var properties = source.constructor();

		properties.$meta = {
			value: source.constructor()
		};

		properties.$meta.value.path = path;
		properties.$meta.value.listener = listener;

		if (type === Array) {

			for (key = 0, length = source.length; key < length; key++) {
				properties.$meta.value[key] = self.create(source[key], listener, path + key);
				properties[key] = self.property(key);
			}

			var arrayProperties = self.arrayProperties();

			for (key in arrayProperties) {
				properties[key] = arrayProperties[key];
			}

		} else {

			for (key in source) {
				properties.$meta.value[key] = self.create(source[key], listener, path + key);
				properties[key] = self.property(key);
			}

		}

		var objectProperties = self.objectProperties();

		for (key in objectProperties) {
			properties[key] = objectProperties[key];
		}

		return Object.defineProperties(target, properties);
	};

	var Model = function () {
		Events.call(this);

		this.GET = 2;
		this.SET = 3;
		this.REMOVE = 4;
		this.ran = false;

		this.data = Observer.create({}, this.listener);
	};

	Model.prototype = Object.create(Events.prototype);
	Model.prototype.constructor = Model;

	Model.prototype.traverse = function (type, keys, value) {

		if (typeof keys === 'string') {
			keys = [keys];
		}

		var data = this.data;
		var v, p, path, result;
		var key = keys[keys.length-1];

		for (var i = 0, l = keys.length-1; i < l; i++) {

			if (!(keys[i] in data)) {

				if (type === this.GET || type === this.REMOVE) {
					return undefined;
				} else if (type === this.SET) {
					data.$set(keys[i], isNaN(keys[i+1]) ? {} : []);
				}

			}

			data = data[keys[i]];
		}

		if (type === this.SET) {
			result = data.$set(key, value);
		} else if (type === this.GET) {
			result = data[key];
		} else if (type === this.REMOVE) {
			result = data[key];
			data.$remove(key);
		}

		return result;
	};

	Model.prototype.get = function (keys) {
		return this.traverse(this.GET, keys);
	};

	Model.prototype.remove = function (keys) {
		return this.traverse(this.REMOVE, keys);
	};

	Model.prototype.set = function (keys, value) {
		return this.traverse(this.SET, keys, value);
	};

	Model.prototype.listener = function (data, path) {
		var paths = path.split('.');

		// if (paths.length < 2) {
		// 	return;
		// }

		var scope = paths[0];
		var type = data === undefined ? 'unrender' : 'render';

		path = paths.slice(1).join('.');

		Global$1.binder.each(scope, path, function (binder) {
			Global$1.binder[type](binder);
		});

	};

	var View = function () {

		this.data = {};

		document.addEventListener('input', this.inputListener.bind(this), true);
		document.addEventListener('change', this.changeListener.bind(this), true);

		if (document.readyState === 'interactive' || document.readyState === 'complete') {
			this.add(document.body);
		} else {
			document.addEventListener('DOMContentLoaded', function _ () {
				this.add(document.body);
				document.removeEventListener('DOMContentLoaded', _);
			}.bind(this), true);
		}

		this.mutationObserver = new MutationObserver(this.mutationListener.bind(this));
		this.mutationObserver.observe(document.body, { childList: true, subtree: true });
	};

	View.prototype.hasAcceptAttribute = function (element) {
		var attributes = element.attributes;

		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];

			if (
				attribute.name.indexOf('o-') === 0
				|| attribute.name.indexOf('data-o-') === 0
			) {
				return true;
			}

		}

		return false;
	};

	View.prototype.eachAttribute = function (element, callback) {
		var attributes = element.attributes;

		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];

			if (attribute.name.indexOf('o-') !== 0
				&& attribute.name.indexOf('data-o-') !== 0
			) {
				continue;
			}

			if (
				attribute.name !== 'o-auth'
				&& attribute.name !== 'o-scope'
				&& attribute.name !== 'o-reset'
				&& attribute.name !== 'o-method'
				&& attribute.name !== 'o-action'
				&& attribute.name !== 'o-external'
				&& attribute.name !== 'data-o-auth'
				&& attribute.name !== 'data-o-scope'
				&& attribute.name !== 'data-o-reset'
				&& attribute.name !== 'data-o-method'
				&& attribute.name !== 'data-o-action'
				&& attribute.name !== 'data-o-external'
			) {
				callback.call(this, attribute);
			}

		}

	};

	View.prototype.each = function (element, callback, container) {

		if (
			element.nodeName !== 'O-ROUTER'
			&& !element.hasAttribute('o-setup')
			&& !element.hasAttribute('o-router')
			&& !element.hasAttribute('o-external')
			&& !element.hasAttribute('data-o-setup')
			&& !element.hasAttribute('data-o-router')
			&& !element.hasAttribute('data-o-external')
			&& this.hasAcceptAttribute(element)
		) {

			if (element.hasAttribute('o-scope') || element.hasAttribute('data-o-scope')) {
				container = element;
			} else if (!document.body.contains(element)) {
				container = Global$1.utility.getScope(container);
			} else if (!container) {
				container = Global$1.utility.getScope(element);
			}

			var scope = container.getAttribute('o-scope') || container.getAttribute('data-o-scope');

			callback.call(this, element, container, scope);
		}

		if (
			// element.nodeName !== 'SVG'
			element.nodeName !== 'STYLE'
			& element.nodeName !== 'SCRIPT'
			& element.nodeName !== 'OBJECT'
			& element.nodeName !== 'IFRAME'
		) {

			for (var i = 0, l = element.children.length; i < l; i++) {
				this.each(element.children[i], callback, container);
			}

		}

	};

	View.prototype.add = function (addedElement) {
		this.each(addedElement, function (element, container, scope) {
			this.eachAttribute(element, function (attribute) {
				Global$1.binder.render({
					scope: scope,
					element: element,
					container: container,
					name: attribute.name,
					value: attribute.value
				});
			});
		});
	};

	View.prototype.remove = function (removedElement, target) {
		this.each(removedElement, function (element, container, scope) {
			this.eachAttribute(element, function (attribute) {
				Global$1.binder.unrender({
					scope: scope,
					element: element,
					container: container,
					name: attribute.name,
					value: attribute.value
				});
			});
		}, target);
	};

	View.prototype.inputListener = function (e) {
		if (
			e.target.type !== 'checkbox'
			&& e.target.type !== 'radio'
			&& e.target.type !== 'option'
			&& e.target.nodeName !== 'SELECT'
		) {
			Global$1.binder.render({
				name: 'o-value',
				element: e.target,
			}, 'view');
		}
	};

	View.prototype.changeListener = function (e) {
		Global$1.binder.render({
			name: 'o-value',
			element: e.target,
		}, 'view');
	};

	View.prototype.mutationListener = function (mutations) {
		var c, i = mutations.length;

		while (i--) {
			var target = mutations[i].target;
			var addedNodes = mutations[i].addedNodes;
			var removedNodes = mutations[i].removedNodes;

			c = addedNodes.length;

			while (c--) {
				var addedNode = addedNodes[c];

				if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {

					if (addedNode.isRouterComponent) {
						addedNode.inRouterCache = true;
					}

					this.add(addedNode);
				}

			}

			c = removedNodes.length;

			while (c--) {
				var removedNode = removedNodes[c];

				if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {

					if (removedNode.isRouterComponent) {
						removedNode.inRouterCache = true;
					}

					this.remove(removedNode, target);
				}

			}

		}

	};

	var Global$1 = Object.defineProperties({}, {
		window: {
			enumerable: true,
			get: function () {
				return window;
			}
		},
		document: {
			enumerable: true,
			get: function () {
				return window.document;
			}
		},
		body: {
			enumerable: true,
			get: function () {
				return window.document.body;
			}
		},
		head: {
			enumerable: true,
			get: function () {
				return window.document.head;
			}
		},
		location: {
			enumerable: true,
			get: function () {
				return this.router.location;
			}
		},
		currentScript: {
			enumerable: true,
			get: function () {
				return (window.document._currentScript || window.document.currentScript);
			}
		},
		ownerDocument: {
			enumerable: true,
			get: function () {
				return (window.document._currentScript || window.document.currentScript).ownerDocument;
			}
		},
		global: {
			enumerable: true,
			value: {}
		},
		methods: {
			enumerable: true,
			value: {
				data: {}
			}
		},
		utility: {
			enumerable: true,
			value: Utility
		},
		model: {
			enumerable: true,
			value: new Model()
		},
		view: {
			enumerable: true,
			value: new View()
		},
		binder: {
			enumerable: true,
			value: new Binder()
		},
		keeper:{
			enumerable: true,
			value: new Keeper()
		},
		loader:{
			enumerable: true,
			value: new Loader()
		},
		router:{
			enumerable: true,
			value: new Router()
		},
		batcher:{
			enumerable: true,
			value: new Batcher()
		},
		fetcher:{
			enumerable: true,
			value: new Fetcher()
		},
		component:{
			enumerable: true,
			value: new Component()
		},
		setup: {
			enumerable: true,
			value: function (options) {

				if (this.isSetup) {
					return;
				} else {
					this.isSetup = true;
				}

				options = options || {};

				if (options.keeper) {
					this.keeper.setup(options.keeper);
				}

				if (options.fetcher) {
					this.fetcher.setup(options.fetcher);
				}

				if (options.loader) {
					this.loader.setup(options.loader);
				}

				if (options.router) {
					this.router.setup(options.router);
				}

			}
		}
	});

	document.addEventListener('reset', function resetListener (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		if (submit) {
			var elements = element.querySelectorAll('[o-value]');
			var i = elements.length;

			while (i--) {
				Global$1.binder.unrender({
					name: 'o-value',
					element: elements[i]
				}, 'view');
			}

		}

	}, true);

	document.addEventListener('submit', function submitListener (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		if (!submit) return;

		e.preventDefault();

		var eScope = Global$1.utility.getScope(element);
		var sScope = eScope.getAttribute('o-scope') || eScope.getAttribute('data-o-scope');
		var model = Global$1.model.data[sScope];

		var data = Global$1.utility.formData(element, model);
		var method = Global$1.utility.getByPath(eScope.methods, submit);
		var options = method.call(eScope, data, e);

		if (options && typeof options === 'object') {
			var auth = element.getAttribute('o-auth') || element.getAttribute('data-o-auth');
			var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
			var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
			var enctype = element.getAttribute('o-enctype') || element.getAttribute('data-o-enctype');

			options.url = options.url || action;
			options.method = options.method || method;
			options.auth = options.auth === undefined || options.auth === null ? auth : options.auth;
			options.contentType = options.contentType === undefined || options.contentType === null ? enctype : options.contentType;

			Global$1.fetcher.fetch(options);
		}

		if (
			(
				options
				&& typeof options === 'object'
				&& options.reset
			)
			|| element.hasAttribute('o-reset')
		) {
			element.reset();
		}

	}, true);

	var style = document.createElement('style');

	style.setAttribute('type', 'text/css');
	style.appendChild(document.createTextNode('o-router, o-router > :first-child { display: block; }'));

	document.head.appendChild(style);

	var listener = function () {
		var element = document.querySelector('script[o-setup]');

		if (element) {
			var args = element.getAttribute('o-setup').split(/\s*,\s*/);

			if (args[1] === 'compiled') {
				Global$1.router.compiled = true;
			}

			Global$1.loader.load({
				url: args[0],
				method: args[2],
				transformer: args[1]
			});

		}

		document.registerElement('o-router', {
			prototype: Object.create(HTMLElement.prototype)
		});

	};

	if ('registerElement' in document && 'content' in document.createElement('template')) {
		listener();
	} else {
		var polly = document.createElement('script');

		polly.setAttribute('type', 'text/javascript');
		polly.setAttribute('src', 'https://unpkg.com/oxe@2.9.9/dist/webcomponents-lite.min.js');
		polly.addEventListener('load', function () {
			listener();
			this.removeEventListener('load', listener);
		}, true);

		document.head.appendChild(polly);
	}

	return Global$1;

})));
