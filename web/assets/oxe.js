(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Oxe', factory) :
	(global.Oxe = factory());
}(this, (function () { 'use strict';

	var Component = function () {
		this.data = {};
	};

	Component.prototype.handleSlots = function (element, template) {
		var tSlots = template.content.querySelectorAll('slot');

		for (var i = 0, l = tSlots.length; i < l; i++) {
			var tSlot = tSlots[i];
			var tName = tSlot.getAttribute('name');
			var eSlot = element.querySelector('[slot="'+ tName + '"]');

			if (eSlot) {
				tSlot.parentElement.replaceChild(eSlot, tSlot);
			}

		}

	};

	Component.prototype.handleTemplate = function (data) {
		var template;

		if (data.html) {
			template = document.createElement('template');
			template.innerHTML = data.html;
		} else if (data.query) {

			try {
				template = Global$1.ownerDocument.querySelector(data.query);
			} catch (e) {
				template = Global$1.document.querySelector(data.query);
			}

			if (template.nodeType !== 'TEMPLATE') {
				template = document.createElement('template');
				template.content.appendChild(data.element);
			}

		} else if (data.element) {

			if (data.element.nodeType === 'TEMPLATE') {
				template = data.element;
			} else {
				template = document.createElement('template');
				template.content.appendChild(data.element);
			}

		}

		return template;
	};

	Component.prototype.define = function (options) {
		var self = this;

		if (!options.name) {
			throw new Error('Oxe.component.define - Requires name');
		}

		if (!options.html && !options.query && !options.element) {
			throw new Error('Oxe.component.define - Requires html, query, or element');
		}

		if (options.name in self.data) {
			throw new Error('Oxe.component.define - Component already defined');
		}

		if (!(options.name in self.data)) {
			self.data[options.name] = 0;
			// self.data[options.name] = [];
		}

		// options.view = options.view || {};
		options.model = options.model || {};
		options.shadow = options.shadow || false;
		options.template = self.handleTemplate(options);

		options.properties = options.properties || {};

		options.properties.model = {
			enumerable: true,
			configurable: true,
			get: function () {
				return Global$1.model.get(this.uid);
			},
			set: function (data) {
				data = data && typeof data === 'object' ? data : {};
				return Global$1.model.set(this.uid, data);
			}
		};

		options.properties.events = {
			enumerable: true,
			get: function () {
				var uid = this.uid;
				return Global$1.events.data[uid];
			}
		};

		options.properties.modifiers = {
			enumerable: true,
			get: function () {
				var uid = this.uid;
				return Global$1.modifiers.data[uid];
			}
		};

		options.proto = Object.create(HTMLElement.prototype, options.properties);

		options.proto.attachedCallback = options.attached;
		options.proto.detachedCallback = options.detached;
		options.proto.attributeChangedCallback = options.attributed;

		options.proto.createdCallback = function () {
			var element = this;

			Object.defineProperty(element, 'uid', {
				enumerable: true,
				configurable: true,
				value: options.name + '-' + self.data[options.name]++
			});

			element.setAttribute('o-uid', element.uid);

			Global$1.model.set(element.uid, options.model || {});
			Global$1.events.data[element.uid] = options.events;
			Global$1.modifiers.data[element.uid] = options.modifiers;

			if (options.shadow) {
				// element.createShadowRoot().appendChild(document.importNode(options.template.content, true));
				element.attachShadow({ mode: 'open' }).appendChild(document.importNode(options.template.content, true));
			} else {
				// might want to handle default slot
				// might want to overwrite content
				self.handleSlots(element, options.template);
				element.appendChild(document.importNode(options.template.content, true));
			}

			if (options.created) {
				options.created.call(element);
			}

		};

		document.registerElement(options.name, {
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

	Utility.formData = function (form, model, callback) {
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

			if (!data[name] || data[name].constructor !== FileList) continue

			var files = data[name];
			data[name] = [];

			for (var c = 0, t = files.length; c < t; c++) {
				var file = files[c];
				var reader = new FileReader();

				count++;

				reader.onload = function(d, n, f, e) {

					d[n].push({
						type: f.type,
						size: f.size,
						name: f.name,
						data: e.target.result,
						lastModified: f.lastModified
					});

					done++;

					if (i === l && count === done) {
						callback(d);
					}

				}.bind(null, data, name, file);

				reader.readAsText(file);
			}

		}

		if (i === l && count === done) {
			callback(data);
		}

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

	Utility.getContainer = function getContainer (element) {

		if (element.hasAttribute('o-uid') || element.hasAttribute('data-o-uid')) {
			return element;
		}

		if (element.parentElement) {
			return this.getContainer(element.parentElement);
		}

		console.warn('Oxe.utility - could not find container uid');
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

		if (path.indexOf('/') !== 0) {
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
		this.type = options.type || 'text';
		this.method = options.method || 'get';
		this.request = options.request || options.request;
		this.response = options.response || options.response;
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
		opt.type = opt.type === undefined || opt.type === null ? this.type : opt.type;
		opt.auth = opt.auth === undefined || opt.auth === null ? this.auth : opt.auth;
		opt.method = opt.method === undefined || opt.method === null ? this.method : opt.method;

		opt.method = opt.method.toUpperCase();

		xhr.open(opt.method, opt.url, true, opt.username, opt.password);

		if (opt.type) {
			opt.acceptType = opt.acceptType || opt.type;
			opt.contentType = opt.contentType || opt.type;
			opt.responseType = opt.responseType || opt.type;
		}

		if (opt.contentType) {
			switch (opt.contentType) {
				case 'js': opt.headers['Content-Type'] = this.mime.js; break;
				case 'xml': opt.headers['Content-Type'] = this.mime.xml; break;
				case 'html': opt.headers['Content-Type'] = this.mime.html; break;
				case 'json': opt.headers['Content-Type'] = this.mime.json; break;
				default: opt.headers['Content-Type'] = this.mime.text;
			}
		}

		if (opt.acceptType) {
			switch (opt.acceptType) {
				case 'js': opt.headers['Accept'] = this.mime.js; break;
				case 'xml': opt.headers['Accept'] = this.mime.xml; break;
				case 'html': opt.headers['Accept'] = this.mime.html; break;
				case 'json': opt.headers['Accept'] = this.mime.json; break;
				default: opt.headers['Accept'] = this.mime.text;
			}
		}

		if (opt.responseType) {
			switch (opt.responseType) {
				case 'json': xhr.responseType = 'json'; break;
				case 'blob': xhr.responseType = 'blob'; break;
				case 'xml': xhr.responseType = 'document'; break;
				case 'html': xhr.responseType = 'document'; break;
				case 'document': xhr.responseType = 'document'; break;
				case 'arraybuffer': xhr.responseType = 'arraybuffer'; break;
				default: xhr.responseType = 'text';
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

	var Router = function (options) {
		Events.call(this);

		this.cache = {};
		this.routes = [];
		this.ran = false;
		this.auth = false;
		this.hash = false;
		this.location = {};
		this.container = null;
		this.element = null;
		this.trailing = false;

		this.setup(options);
	};

	Router.prototype = Object.create(Events.prototype);
	Router.prototype.constructor = Router;

	Router.prototype.setup = function (options) {
		options = options || {};
		this.container = options.container;
		this.auth = options.auth === undefined ? this.auth : options.auth;
		this.hash = options.hash === undefined ? this.hash : options.hash;
		this.routes = options.routes === undefined ? this.routes: options.routes;
		this.element = options.element === undefined ? this.element : options.element;
		this.external = options.external === undefined ? this.external : options.external;
		this.trailing = options.trailing === undefined ? this.trailing : options.trailing;
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

		if (route.constructor.name === 'Object') {
			this.routes.push(route);
		} else if (route.constructor.name === 'Array') {
			this.routes = this.routes.concat(route);
		}

	};

	Router.prototype.remove = function (path) {

		for (var i = 0, l = this.routes.length; i < l; i++) {

			if (path === this.routes[i].path) {
				this.routes.splice(i, 1);
			}

		}

	};

	Router.prototype.get = function (path) {

		for (var i = 0, l = this.routes.length; i < l; i++) {
			var route = this.routes[i];

			if (path === route.path) {
				return route;
			}

		}

	};

	Router.prototype.find = function (path) {

		for (var i = 0, l = this.routes.length; i < l; i++) {
			var route = this.routes[i];

			if (this.isPath(route.path, path)) {
				return route;
			}

		}

	};

	Router.prototype.isPath = function (routePath, userPath) {
		userPath = userPath || '/';

		return new RegExp(
			'^' + routePath
			.replace(/{\*}/g, '(?:.*)')
			.replace(/{(\w+)}/g, '([^\/]+)')
			+ '(\/)?$'
		).test(userPath);
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
		var self = this;

		self.emit('navigating');

		if (route.title) {
			document.title = route.title;
		}

		Global$1.loader.load(route.url, function (load) {

			if (!load.result) {
				load.result = document.createElement(route.component);
				load.result.inRouterCache = false;
				load.result.isRouterComponent = true;
			}

			self.domReady(function () {
				var child;

				while (child = self.element.children[0]) {
					self.element.removeChild(child);
				}

				self.element.appendChild(load.result);

				self.scroll(0, 0);
				self.emit('navigated');
			});

		});

	};

	Router.prototype.navigate = function (data, options) {
		var location;

		options = options || {};

		if (typeof data === 'string') {

			if (options.query) {
				data += this.toQueryString(options.query);
			}

			location = this.toLocationObject(data);
			location.route = this.find(location.routePath) || {};
			location.title = location.route.title || '';
			location.query = this.toQueryObject(location.search);
			location.parameters = this.toParameterObject(location.route.path, location.routePath);
		} else {
			location = data;
		}

		if (
			this.auth &&
			(location.route.auth === true ||
			location.route.auth === undefined)
		) {

			if (Global$1.keeper.route(location.route) === false) {
				return;
			}

		}

		this.location = location;
		window.history[options.replace ? 'replaceState' : 'pushState'](this.location, this.location.title, this.location.href);

		if (this.location.route.handler) {
			this.location.route.handler(this.location);
		} else if (this.location.route.redirect) {
			this.redirect(this.location.route.redirect);
		} else {
			this.render(this.location.route);
		}
	};

	Router.prototype.elementReady = function (callback) {
		this.element = this.element || 'o-router';

		if (typeof this.element === 'string') {
			this.element = document.body.querySelector(this.element);
		}

		return callback();
	};

	Router.prototype.domReady = function (callback) {
		if (document.readyState === 'interactive' || document.readyState === 'complete') {
			this.elementReady(callback);
		} else {
			document.onreadystatechange = function () {
				if (document.readyState === 'interactive' || document.readyState === 'complete') {
					this.elementReady(callback);
				}
			}.bind(this);
		}
	};

	Router.prototype.run = function () {

		if (this.ran) {
			return;
		} else {
			this.ran = true;
		}

		var options = { replace: true };

		this.navigate(window.location.href, options);
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
		imps: /import\s+\w+\s+from\s+(?:'|").*?(?:'|")/g,
		imp: /import\s+(\w+)\s+from\s+(?:'|")(.*?)(?:'|")/,
		exps: /export\s+(?:default|var|let|const)?\s+/g
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

			var pattern = 'var ' + imp.name + ' = $LOADER.modules[\'' + imp.url + '\'].result';

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

	var Loader = function (options) {
		Events.call(this);

		this.loads = [];
		this.ran = false;
		this.methods = {};
		this.modules = {};
		this.transformers = {};

		this.setup(options);
	};

	Loader.prototype = Object.create(Events.prototype);
	Loader.prototype.constructor = Loader;

	Loader.prototype.setup = function (options) {
		options = options || {};
		this.methods = options.methods || this.methods;
		this.loads = options.loads || this.loads;
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
				this.load(data.ast.imports[i].url, listener);
			}

		} else {
			callback();
		}

	};

	Loader.prototype.attach = function (data) {
		var element = document.createElement(data.tag);

		data.attributes['o-load'] = '';

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
					async: '',
					src: data.url,
					type: 'text/javascript',
				}
			});
		} else {
			this.attach({
				tag: 'module',
				attributes: {
					async: '',
					src: data.url,
					type: 'module',
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
		}

		data.url = Global$1.utility.resolve(data.url);

		if (data.url in this.modules) {
			var load = this.modules[data.url];

			if (load.listener.length) {
				if (listener) {
					load.listener.push(listener);
				}
			} else {
				load.listener.push(listener);
				this.ready(load);
			}

			return;
		}

		this.modules[data.url] = data;

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
		var load = this.modules[path];

		this.ready(load);
	};

	Loader.prototype.run = function () {

		if (this.ran) {
			return;
		} else {
			this.ran = true;
		}

		Global$1.document.addEventListener('load', this.listener.bind(this), true);

		var load;
		while (load = this.loads.shift()) {
			this.load(load);
		}

	};



	/*
		https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
	*/

	// import Global from '../global';

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

	Unrender.on = function UnrenderOn (opt) {
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
		}

		opt.cache = Global$1.utility.getByPath(Global$1.events.data, opt.uid + '.' + opt.path).bind(opt.model);
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

		if (opt.element.children.length === opt.data.length) {
			opt.pending = false;
			return;
		}

		if (!opt.cache) {
			opt.cache = opt.element.removeChild(opt.element.firstElementChild);
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
					data = opt.element.files;
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
						attribute = 'files';
						data = opt.data === undefined ? Global$1.model.set(opt.keys, []) : opt.data;
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
			data = Global$1.modifiers.data[opt.uid][modifier].call(opt.model, data);
		}

		return data;
	};

	Binder.prototype.add = function (opt) {

		if (!(opt.uid in this.data)) {
			this.data[opt.uid] = {};
		}

		if (!(opt.path in this.data[opt.uid])) {
			this.data[opt.uid][opt.path] = [];
		}

		this.data[opt.uid][opt.path].push(opt);
	};

	Binder.prototype.remove = function (opt) {

		if (!(opt.uid in this.data)) {
			return;
		}

		if (!(opt.path in this.data[opt.uid])) {
			return;
		}

		var data = this.data[opt.uid][opt.path];

		for (var i = 0, l = data.length; i < l; i++) {
			var item = data[i];

			if (item.element === opt.element) {
				return data.splice(i, 1);
			}

		}

	};

	Binder.prototype.get = function (opt) {

		if (!(opt.uid in this.data)) {
			return null;
		}

		if (!(opt.path in this.data[opt.uid])) {
			return null;
		}

		var data = this.data[opt.uid][opt.path];

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

	Binder.prototype.each = function (uid, path, callback) {
		var paths = this.data[uid];


		for (var key in paths) {

			if (key.indexOf(path) === 0) {

				if (key === path || key.slice(path.length).charAt(0) === '.') {

					var binders = paths[key];

					for (var i = 0, l = binders.length; i < l; i++) {
						var binder = binders[i];

						callback(binder, i, binders, paths, key);
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

		opt.container = opt.container || Global$1.utility.getContainer(opt.element);
		opt.uid = opt.uid || opt.container.getAttribute('o-uid');
		opt.value = opt.value || opt.element.getAttribute(opt.name);
		opt.path = opt.path || Global$1.utility.binderPath(opt.value);

		opt.type = opt.type || Global$1.utility.binderType(opt.name);
		opt.names = opt.names || Global$1.utility.binderNames(opt.name);
		opt.values = opt.values || Global$1.utility.binderValues(opt.value);
		opt.modifiers = opt.modifiers || Global$1.utility.binderModifiers(opt.value);

		opt.keys = opt.keys || [opt.uid].concat(opt.values);
		opt.model = opt.model || Global$1.model.data[opt.uid];
		opt.modifiers = opt.modifiers || Global$1.modifiers.data[opt.uid];

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
			Global$1.router.navigate(this._.authenticated);
		} else if (typeof this._.authenticated === 'function') {
			this._.authenticated();
		}

	};

	Keeper.prototype.unauthenticate = function () {
		this.removeToken();
		this.removeUser();

		if (typeof this._.unauthenticated === 'string') {
			Global$1.router.navigate(this._.unauthenticated);
		} else if (typeof this._.unauthenticated === 'function') {
			this._.unauthenticated();
		}

	};

	Keeper.prototype.forbidden = function (result) {

		if (typeof this._.forbidden === 'string') {
			Global$1.router.navigate(this._.forbidden);
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
			Global$1.router.navigate(this._.unauthorized);
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

	// TODO sort reverse

	Observer.arrayProperties = function (callback, path) {
		var self = this;

		return {
			push: {
				value: function () {

					if (!arguments.length) {
						return this.length;
					}


					for (var i = 0, l = arguments.length; i < l; i++) {
						this.$set(this.length, arguments[i], function () {
							callback(this.length + arguments.length, path.slice(0, -1), 'length');
						});
					}

					return this.length;
				}
			},
			unshift: {
				value: function () {

					if (!arguments.length) {
						return this.length;
					}

					callback(this.length + arguments.length, path.slice(0, -1), 'length');
					Array.prototype.unshift.apply(this, arguments);

					throw new Error('this needs to be looked at');

					for (var i = 0, l = this.length; i < l; i++) {
						this.$set(i, this[i]);
					}

					return this.length;
				}
			},
			pop: {
				value: function () {

					if (!this.length) {
						return;
					}

					var value = this[this.length-1];

					// this.length--;
					// this.$meta.length--;
					callback(this.length-1, path.slice(0, -1), 'length');
					this.$remove(this.length);
					// callback(undefined, path + this.length, this.length);

					return value;
				}
			},
			shift: {
				value: function () {

					if (!this.length) {
						return;
					}

					var value = this[0];

					for (var i = 0, l = this.length-1; i < l; i++) {
						this[i] = this[i+1];
					}

					// this.length--;
					// this.$meta.length--;
					callback(this.length-1, path.slice(0, -1), 'length');
					this.$remove(this.length);
					// callback(undefined, path + this.length, this.length);

					return value;
				}
			},
			splice: {
				value: function () {

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

					var index = 2;
					var result = this.slice(startIndex, deleteCount);
					var updateCount = deleteCount < addCount ? addCount-deleteCount : deleteCount-addCount;

					deleteCount = deleteCount-updateCount;
					addCount = addCount-updateCount;

					if (updateCount > 0) {
						while (updateCount--) {
							this.$set(startIndex++, arguments[index++]);
						}
					}

					if (addCount > 0) {
						callback(this.length + addCount, path, 'length');
						while (addCount--) {
							this.$set(this.length, arguments[index++]);
						}
					}

					if (deleteCount > 0) {
						callback(this.length - deleteCount, path, 'length');
						while (deleteCount--) {
							this.$remove(this.length-1);
						}
					}

					return result;
				}
			}
		};
	};

	Observer.objectProperties = function (listener, path) {
		var self = this;

		return {
			$get: {
				value: function (key) {
					return this[key];
				}
			},
			$set: {
				value: function (key, value, callback) {
					if (value !== this[key]) {
						var result = self.create(value, listener, path + key);

						this.$meta[key] = result;
						Object.defineProperty(this, key, self.property(listener, path, key));

						if (callback) {
							callback();
						}

						listener(result, path + key, key);
						return result;
					}
				}
			},
			$remove: {
				value: function (key) {
					if (key in this) {
						var result = this[key];

						if (this.constructor === Array) {
							Array.prototype.splice.call(this.$meta, key, 1);
							Array.prototype.splice.call(this, key, 1);
						} else {
							delete this.$meta[key];
							delete this[key];
						}

						listener(undefined, path + key, key);
						return result;
					}
				}
			}
		};
	};

	Observer.property = function (callback, path, key) {
		var self = this;

		return {
			enumerable: true,
			configurable: true,
			get: function () {
				return this.$meta[key];
			},
			set: function (value) {
				if (value !== this.$meta[key]) {

					this.$meta[key] = self.create(value, callback, path + key);

					callback(this[key], path + key, key, this);
				}
			}
		};
	};

	Observer.create = function (source, callback, path) {
		var self = this;

		if (!source || typeof source !== 'object') {
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

		if (type === Array) {

			for (key = 0, length = source.length; key < length; key++) {
				properties.$meta.value[key] = self.create(source[key], callback, path + key);
				properties[key] = self.property(callback, path, key);
			}

			var arrayProperties = self.arrayProperties(callback, path);
			for (key in arrayProperties) {
				properties[key] = arrayProperties[key];
			}

		} else {

			for (key in source) {
				properties.$meta.value[key] = self.create(source[key], callback, path + key);
				properties[key] = self.property(callback, path, key);
			}

		}

		var objectProperties = self.objectProperties(callback, path);
		for (key in objectProperties) {
			properties[key] = objectProperties[key];
		}

		return Object.defineProperties(target, properties);
	};

	var Model = function (options) {
		options = options || {};
		this.GET = 2;
		this.SET = 3;
		this.REMOVE = 4;
		this.data = Observer.create(options.data || {}, this.listener);
	};

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

		if (paths.length < 2) {
			return;
		}

		var uid = paths[0];
		var type = data === undefined ? 'unrender' : 'render';

		path = paths.slice(1).join('.');

		Global$1.binder.each(uid, path, function (binder) {
			Global$1.binder[type](binder);
		});

	};

	var View = function (options) {
		options = options || {};

		this.data = {};
		this.element = options.element || window.document.body;

		if (window.document.readyState === 'interactive' || window.document.readyState === 'complete') {
			this.add(this.element);
		} else {
			window.document.onreadystatechange = function () {
				if (window.document.readyState === 'interactive' || window.document.readyState === 'complete') {
					this.add(this.element);
				}
			}.bind(this);
		}

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

			if (
				(
					attribute.name.indexOf('o-') === 0
					|| attribute.name.indexOf('data-o-') === 0
				)
				&& attribute.name !== 'o-uid'
				&& attribute.name !== 'o-auth'
				&& attribute.name !== 'o-reset'
				&& attribute.name !== 'o-method'
				&& attribute.name !== 'o-action'
				&& attribute.name !== 'o-external'
				&& attribute.name !== 'data-o-uid'
				&& attribute.name !== 'data-o-auth'
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
			element.nodeName !== 'O-VIEW'
			&& !element.hasAttribute('o-view')
			&& !element.hasAttribute('o-external')
			&& !element.hasAttribute('data-o-view')
			&& !element.hasAttribute('data-o-external')
			&& this.hasAcceptAttribute(element)
		) {

			if (element.hasAttribute('o-uid') || element.hasAttribute('data-o-uid')) {
				container = element;
			} else if (!document.body.contains(element)) {
				container = Global$1.utility.getContainer(container);
			} else if (!container) {
				container = Global$1.utility.getContainer(element);
			}

			var uid = container.getAttribute('o-uid') || container.getAttribute('data-o-uid');

			callback.call(this, element, container, uid);
		}

		if (
			element.nodeName !== 'SVG'
			& element.nodeName !== 'STYLE'
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
		this.each(addedElement, function (element, container, uid) {
			this.eachAttribute(element, function (attribute) {
				Global$1.binder.render({
					uid: uid,
					element: element,
					container: container,
					name: attribute.name,
					value: attribute.value
				});
			});
		});
	};

	View.prototype.remove = function (removedElement, target) {
		this.each(removedElement, function (element, container, uid) {
			this.eachAttribute(element, function (attribute) {
				Global$1.binder.unrender({
					uid: uid,
					element: element,
					container: container,
					name: attribute.name,
					value: attribute.value
				});
			});
		}, target);
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
		events: {
			enumerable: true,
			value: {
				data: {}
			}
		},
		modifiers: {
			enumerable: true,
			value: {
				data: {}
			}
		},
		model: {
			enumerable: true,
			value: new Model()
		},
		view: {
			enumerable: true,
			value: new View()
		},
		utility: {
			enumerable: true,
			value: Utility
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
			value: function setup (options) {

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
					this.loader.run();
				}

				if (options.router) {
					this.router.setup(options.router);
					this.router.run();
				}

			}
		}
	});

	Global$1.document.addEventListener('click', function clickListener (e) {

			// if shadow dom use
			var target = e.path ? e.path[0] : e.target;
			var parent = target.parentNode;

			if (Global$1.router.container) {

				while (parent) {

					if (parent === Global$1.router.container) {
						break;
					} else {
						parent = parent.parentNode;
					}

				}

				if (parent !== Global$1.router.container) {
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
			if (Global$1.router.external &&
				(Global$1.router.external.constructor.name === 'RegExp' && Global$1.router.external.test(target.href) ||
				Global$1.router.external.constructor.name === 'Function' && Global$1.router.external(target.href) ||
				Global$1.router.external.constructor.name === 'String' && Global$1.router.external === target.href)
			) return;

			e.preventDefault();

			if (Global$1.router.location.href !== target.href) {
				Global$1.router.navigate(target.href);
			}

	}, true);

	Global$1.document.addEventListener('input', function inputListener (e) {

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

	}, true);

	Global$1.document.addEventListener('change', function changeListener (e) {
		Global$1.binder.render({
			name: 'o-value',
			element: e.target,
		}, 'view');
	}, true);

	// Global.document.addEventListener('load', function loadListener (e) {
	// 	var element = e.target;
	//
	// 	if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
	// 		return;
	// 	}
	//
	// 	var path = Global.utility.resolve(element.src || element.href);
	//
	// 	var listener;
	// 	var load = Global.loader.modules[path];
	//
	// 	while (listener = load.listener.shift()) {
	// 		listener(load);
	// 	}
	//
	// }, true);

	Global$1.document.addEventListener('reset', function resetListener (e) {
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

	Global$1.document.addEventListener('submit', function submitListener (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		if (!submit) {
			return;
		}

		e.preventDefault();

		var container = Global$1.utility.getContainer(element);
		var uid = container.getAttribute('o-uid');
		var model = Global$1.model.data[uid];

		Global$1.utility.formData(element, model, function (data) {

			var method = Global$1.utility.getByPath(container.events, submit);
			var options = method.call(model, data, e);

			if (options && typeof options === 'object') {
				var auth = element.getAttribute('o-auth') || element.getAttribute('data-o-auth');
				var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
				var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');

				options.url = options.url || action;
				options.method = options.method || method;
				options.auth = options.auth === undefined ? auth : options.auth;

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

		});

	}, true);

	Global$1.window.addEventListener('popstate', function popstateListener (e) {
		var options = { replace: true };
		Global$1.router.navigate(e.state || window.location.href, options);
	}, true);

	new Global$1.window.MutationObserver(function mutationListener (mutations) {
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

					Global$1.view.add(addedNode);
				}

			}

			c = removedNodes.length;

			while (c--) {
				var removedNode = removedNodes[c];

				if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {

					if (removedNode.isRouterComponent) {
						removedNode.inRouterCache = true;
					}

					Global$1.view.remove(removedNode, target);
				}

			}

		}

	}).observe(Global$1.body, {
		childList: true,
		subtree: true
	});

	var eStyle = Global$1.document.createElement('style');
	var sStyle = Global$1.document.createTextNode('o-router, o-router > :first-child { display: block; }');

	eStyle.setAttribute('title', 'Oxe');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	Global$1.head.appendChild(eStyle);

	Global$1.document.registerElement('o-router', {
		prototype: Object.create(HTMLElement.prototype)
	});

	var eIndex = Global$1.document.querySelector('[o-index-url]');

	if (eIndex) {
		var url = eIndex.getAttribute('o-index-url');
		var method = eIndex.getAttribute('o-index-method');
		var transformer = eIndex.getAttribute('o-index-transformer');

		Global$1.loader.load({
			url: url,
			method: method,
			transformer: transformer
		});
	}

	return Global$1;

})));
