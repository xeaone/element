/*
	Name: Oxe
	Version: 2.9.3
	License: MPL-2.0
	Author: Alexander Elias
	Email: alex.steven.elias@gmail.com
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Oxe', factory) :
	(global.Oxe = factory());
}(this, (function () { 'use strict';

	var Component = {};

	Component.data = {};

	Component.handleSlots = function (element, template) {
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

	Component.handleTemplate = function (data) {
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

	Component.define = function (options) {
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

		self.data[options.name] = [];

		// options.view = options.view || {};
		options.model = options.model || {};
		options.shadow = options.shadow || false;
		options.properties = options.properties || {};
		options.template = self.handleTemplate(options);

		options.properties.uid = {
			enumerable: true,
			get: function () {
				return this.getAttribute('o-uid');
			}
		};

		options.properties.model = {
			enumerable: true,
			configurable: true,
			get: function () {
				var uid = this.uid;
				return Global$1.model.get(uid);
			},
			set: function (data) {
				var uid = this.uid;
				data = data && data.constructor === Object ? data : {};
				Global$1.model.set(uid, data);
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
			var uid = options.name + '-' + self.data[options.name].length;

			element.setAttribute('o-uid', uid);

			Global$1.model.set(uid, options.model);
			Global$1.events.data[uid] = options.events;
			Global$1.modifiers.data[uid] = options.modifiers;

			if (options.shadow) {
				// element.createShadowRoot().appendChild(document.importNode(options.template.content, true));
				element.attachShadow({ mode: 'open' }).appendChild(document.importNode(options.template.content, true));
			} else {
				// might want to handle default slot
				// might want to overwrite content
				self.handleSlots(element, options.template);
				element.appendChild(document.importNode(options.template.content, true));
			}

			self.data[options.name].push(element);

			if (options.created) {
				options.created.call(element);
			}

		};

		document.registerElement(options.name, {
			prototype: options.proto
		});
	};

	var Modifiers = {};

	Modifiers.data = {};

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

	Utility.resolve = function () {
		var result = [], root = '/';
		var path = Array.prototype.join.call(arguments, '/');

		if (!this.ROOT.test(path)) {
			path = this.base() + path;
		}

		path = path.replace(window.location.origin, '');
		path = path.replace(/^\//, '');
		path = path.replace(/\/$/, '');

		var paths = path.split('/');

		for (var i = 0, l = paths.length; i < l; i++) {
			if (paths[i] === '.' || paths[i] === '') {
				continue;
			} else if (paths[i] === '..') {
				if (i > 0) {
					result.slice(i - 1, 1);
				}
			} else {
				result.push(paths[i]);
			}
		}

		return root + result.join('/');
	};

	var Batcher = {};

	Batcher.reads = [];
	Batcher.writes = [];
	Batcher.pending = false;
	// Batcher.maxTaskTimeMS = 1000/60;

	// adds a task to the read batch
	Batcher.read = function (method, context) {
		var task = context ? method.bind(context) : method;
		this.reads.push(task);
		this.tick();
	};

	// adds a task to the write batch
	Batcher.write = function (method, context) {
		var task = context ? method.bind(context) : method;
		this.writes.push(task);
		this.tick();
	};

	// removes a pending task
	Batcher.remove = function (tasks, task) {
		var index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
	};

	// clears a pending read or write task
	Batcher.clear = function (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	};

	// schedules a new read/write batch if one is not pending
	Batcher.tick = function () {
		if (this.pending) return;
		self.pending = true;
		this.flush();
	};

	Batcher.flush = function () {
		var self = this;

		self.run(self.reads.shift(), function () {
			self.run(self.writes.shift(), function () {

				if (self.reads.length || self.writes.length) {
					self.flush();
				} else {
					self.pending = false;
				}

			});
		});

	};

	Batcher.run = function (task, callback) {

		if (!task) {
			return callback();
		}

		window.requestAnimationFrame(function () {
			task();
			callback();
		});

	};

	var Fetcher = {};

	Fetcher.mime = {
		xml: 'text/xml; charset=utf-8',
		html: 'text/html; charset=utf-8',
		text: 'text/plain; charset=utf-8',
		json: 'application/json; charset=utf-8',
		js: 'application/javascript; charset=utf-8'
	};

	Fetcher.setup = function (opt) {
		opt = opt || {};
		this.auth = opt.auth || false;
		this.type = opt.type || 'text';
		this.method = opt.method || 'get';
		this.request = opt.request || opt.request;
		this.response = opt.response || opt.response;
		return this;
	};

	Fetcher.serialize = function (data) {
		var string = '';

		for (var name in data) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return string;
	};

	Fetcher.change = function (opt, result, xhr) {
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

	Fetcher.fetch = function (opt) {
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

	Fetcher.post = function (opt) {
		opt.method = 'post';
		return Fetcher.fetch(opt);
	};

	Fetcher.get = function (opt) {
		opt.method = 'get';
		return Fetcher.fetch(opt);
	};

	Fetcher.put = function (opt) {
		opt.method = 'put';
		return Fetcher.fetch(opt);
	};

	Fetcher.head = function (opt) {
		opt.method = 'head';
		return Fetcher.fetch(opt);
	};

	Fetcher.patch = function (opt) {
		opt.method = 'patch';
		return Fetcher.fetch(opt);
	};

	Fetcher.delete = function (opt) {
		opt.method = 'delete';
		return Fetcher.fetch(opt);
	};

	Fetcher.options = function (opt) {
		opt.method = 'options';
		return Fetcher.fetch(opt);
	};

	Fetcher.connect = function (opt) {
		opt.method = 'connect';
		return Fetcher.fetch(opt);
	};

	var Events = {};

	Events.data = {};

	function Events$2 () {
		this.events = {};
	}

	Events$2.prototype.on = function (name, listener) {

		if (typeof this.events[name] !== 'object') {
			this.events[name] = [];
		}

		this.events[name].push(listener);
	};

	Events$2.prototype.off = function (name, listener) {

		if (typeof this.events[name] === 'object') {
			var index = this.events[name].indexOf(listener);

			if (index > -1) {
				this.events[name].splice(index, 1);
			}

		}

	};

	Events$2.prototype.once = function (name, listener) {
		this.on(name, function f () {
			this.off(name, f);
			listener.apply(this, arguments);
		});
	};

	Events$2.prototype.emit = function (name) {

		if (typeof this.events[name] === 'object') {
			var listeners = this.events[name].slice();
			var args = Array.prototype.slice.call(arguments, 1);

			for (var i = 0, l = listeners.length; i < l; i++) {
				listeners[i].apply(this, args);
			}

		}

	};

	var Router = {};

	Router = Object.assign(Router, Events$2.prototype);
	Events$2.call(Router);

	Router.cache = {};
	Router.routes = [];
	Router.hash = false;
	Router.auth = false;
	Router.isRan = false;
	Router.location = {};
	Router.view = 'o-view';
	Router.trailing = false;

	Router.setup = function (options) {
		options = options || {};
		this.container = options.container;
		this.auth = options.auth === undefined ? this.auth : options.auth;
		this.view = options.view === undefined ? this.view : options.view;
		this.hash = options.hash === undefined ? this.hash : options.hash;
		this.routes = options.routes === undefined ? this.routes: options.routes;
		this.external = options.external === undefined ? this.external : options.external;
		this.trailing = options.trailing === undefined ? this.trailing : options.trailing;
	};

	Router.scroll = function (x, y) {
		window.scroll(x, y);
	};

	Router.back = function () {
		window.history.back();
	};

	Router.redirect = function (path) {
		window.location.href = path;
	};

	Router.add = function (route) {

		if (route.constructor.name === 'Object') {
			this.routes.push(route);
		} else if (route.constructor.name === 'Array') {
			this.routes = this.routes.concat(route);
		}

	};

	Router.remove = function (path) {

		for (var i = 0, l = this.routes.length; i < l; i++) {

			if (path === this.routes[i].path) {
				this.routes.splice(i, 1);
			}

		}

	};

	Router.get = function (path) {

		for (var i = 0, l = this.routes.length; i < l; i++) {
			var route = this.routes[i];

			if (path === route.path) {
				return route;
			}

		}

	};

	Router.find = function (path) {

		for (var i = 0, l = this.routes.length; i < l; i++) {
			var route = this.routes[i];

			if (this.isPath(route.path, path)) {
				return route;
			}

		}

	};

	Router.isPath = function (routePath, userPath) {
		userPath = userPath || '/';

		return new RegExp(
			'^' + routePath
			.replace(/{\*}/g, '(?:.*)')
			.replace(/{(\w+)}/g, '([^\/]+)')
			+ '(\/)?$'
		).test(userPath);
	};

	Router.toParameterObject = function (routePath, userPath) {
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

	Router.toQueryString = function (data) {
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

	Router.toQueryObject = function (path) {
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

	Router.toLocationObject = function (path) {
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

	Router.batch = function (route) {
		var self = this, component;

		component = self.cache[route.component];

		if (!component) {
			component = self.cache[route.component] = document.createElement(route.component);
			component.inRouterCache = false;
			component.isRouterComponent = true;
		}

		Global$1.batcher.write(function () {
			var child;
			while (child = self.view.firstChild) self.view.removeChild(child);
			self.view.appendChild(component);
			self.scroll(0, 0);
			self.emit('navigated');
		});

	};

	Router.render = function (route) {

		if (route.title) {
			document.title = route.title;
		}

		if (route.url && !(route.component in this.cache)) {
			Global$1.loader.load(route.url, this.batch.bind(this, route));
		} else {
			this.batch(route);
		}

	};

	Router.navigate = function (data, options) {
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

	Router.run = function () {

		if (this.isRan) {
			return;
		}

		this.isRan = true;

		if (typeof this.view === 'string') {
			this.view = document.body.querySelector(this.view);
		}

		if (!this.view) {
			throw new Error('Oxe.router - requires a view element');
		}

		var options = { replace: true };
		this.navigate(window.location.href, options);
	};

	var Router$1 = Router;

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
			throw new Error('Transformer miss matched backticks');
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

	Transformer.getImports = function (text) {
		var result = [];
		var imps = text.match(this.patterns.imps) || [];

		for (var i = 0, l = imps.length; i < l; i++) {
			var imp = imps[i].match(this.patterns.imp);

			result[i] = {
				raw: imp[0],
				name: imp[1],
				url: imp[2]
			};

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

			imp.url = Global$1.utility.resolve(imp.url);
			imp.extension = Global$1.utility.extension(imp.url);

			if (!imp.extension) {
				imp.url = imp.url + '.js';
			}

			var pattern = 'var ' + imp.name + ' = $LOADER.modules[\'' + imp.url + '\'].code';

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

		ast.raw = data;
		ast.cooked = data;

		ast.imports = this.getImports(ast.raw);
		ast.exports = this.getExports(ast.raw);

		ast.cooked = this.replaceImports(ast.cooked, ast.imports);
		ast.cooked = this.replaceExports(ast.cooked, ast.exports);

		return ast;
	};

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

		return (function(d, l, w) {
			'use strict';

			return new Function('$LOADER', 'window', d)(l, w);

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

		data.url = Global$1.utility.resolve(data.url);
		data.extension = Global$1.utility.extension(data.url);

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

	var Render = {};

	Render.class = function (opt) {
		var data = this.getData(opt);

		var name = opt.names.slice(1).join('-');
		opt.element.classList.toggle(name, this.modifyData(opt, data));

	};

	Render.css = function (opt) {
		var data = this.getData(opt);

		if (opt.element.style.cssText === data) {
			return;
		}

		if (opt.names.length > 1) {
			data = opt.names.slice(1).join('-') + ': ' +  data + ';';
		}

		opt.element.style.cssText += this.modifyData(opt, data);

	};

	Render.alt = function (opt) {
		var data = this.getData(opt);

		if (opt.element.alt === data) {
			return;
		}

		opt.element.alt = this.modifyData(opt, data);
	};

	Render.disable = function (opt) {
		var data = this.getData(opt);

		if (opt.element.disabled === data) {
			return;
		}

		if (data === undefined || data === null) {
			data = true;
			this.setData(opt, data);
		}

		opt.element.disabled = this.modifyData(opt, data);
	};

	Render.enable = function (opt) {
		var data = this.getData(opt);

		if (opt.element.disabled === !data) {
			return;
		}

		if (data === undefined || data === null) {
			data = true;
			this.setData(opt, data);
		}

		opt.element.disabled = !this.modifyData(opt, data);
	};

	Render.hide = function (opt) {
		var data = this.getData(opt);

		if (opt.element.hidden === data) {
			return;
		}

		if (data === undefined || data === null) {
			data = true;
			this.setData(opt, data);
		}

		opt.element.hidden = this.modifyData(opt, data);
	};

	Render.html = function (opt) {
		var data = this.getData(opt);

		if (opt.element.innerHTML === data) {
			return;
		}

		opt.element.innerHTML = this.modifyData(opt, data);
	};

	Render.href = function (opt) {
		var data = this.getData(opt);

		if (opt.element.href === data) {
			return;
		}

		opt.element.href = this.modifyData(opt, data);
	};


	Render.read = function (opt) {
		var data = this.getData(opt);

		if (opt.element.readOnly === data) {
			return;
		}

		if (data === undefined || data === null) {
			data = true;
			this.setData(opt, data);
		}

		opt.element.readOnly = this.modifyData(opt, data);
	};

	Render.required = function (opt) {
		var data = this.getData(opt);

		if (opt.element.required === data) {
			return;
		}

		if (data === undefined || data === null) {
			data = true;
			this.setData(opt, data);
		}

		opt.element.required = this.modifyData(opt, data);
	};

	Render.selected = function (opt) {
		var data = this.getData(opt);

		if (opt.element.selectedIndex === data) {
			return;
		}

		if (data === undefined || data === null) {
			data = 0;
			this.setData(opt, data);
		}

		opt.element.selectedIndex = this.modifyData(opt, data);
	};

	Render.show = function (opt) {
		var data = this.getData(opt);

		if (opt.element.hidden === !data) {
			return;
		}

		if (data === undefined || data === null) {
			data = true;
			this.setData(opt, data);
		}

		opt.element.hidden = !this.modifyData(opt, data);
	};

	Render.src = function (opt) {
		var data = this.getData(opt);

		if (opt.element.src === data) {
			return;
		}

		opt.element.src = this.modifyData(opt, data);
	};

	Render.text = function (opt) {
		var data = this.getData(opt);

		if (data && typeof data === 'object') {
			data = JSON.stringify(data);
		} else if (data && typeof data !== 'string') {
			data = String(data);
		}

		data = this.modifyData(opt, data);
		data = data === undefined || data === null ? '' : data;

		opt.element.innerText = data;
	};

	Render.write = function (opt) {
		var data = this.getData(opt);

		if (opt.element.readOnly === !data) {
			return;
		}

		if (data === undefined || data === null) {
			data = true;
			this.setData(opt, data);
		}

		opt.element.readOnly = !this.modifyData(opt, data);
	};

	Render.each = function RenderEach (opt, modified) {
		var data;

		if (!modified) {
			data = this.getData(opt);

			if (!data) {
				data = [];
				this.setData(opt, data);
			}

			modified = this.modifyData(opt, data);
		}

		if (opt.element.children.length > modified.length) {
			opt.element.removeChild(opt.element.lastElementChild);
		} else if (opt.element.children.length < modified.length) {
			opt.element.insertAdjacentHTML('beforeend', opt.clone.replace(opt.pattern, opt.element.children.length));
		}

		if (opt.element.children.length !== modified.length) {
			this.batch(RenderEach.bind(this, opt, modified));
		}

	};

	Render.on = function RenderEach (opt) {
		opt.element.removeEventListener(opt.names[1], opt.cache);
		opt.cache = this.getData(opt).bind(opt.model);
		opt.element.addEventListener(opt.names[1], opt.cache);
	};

	Render.value = function (opt, caller) {
		var i , l, data, query, element, elements;

		data = this.getData(opt);

		if (opt.element.type === 'checkbox') {

			if (caller === 'view') {
				data = opt.element.value = opt.element.checked;
			} else {
				data = !data ? false : data;
				opt.element.value = data;
				opt.element.checked = data;
			}

			data = this.modifyData(opt, data);
			this.setData(opt, data);

		} else if (opt.element.nodeName === 'SELECT') {

			elements = opt.element.options;
			data = data === undefined || data === null && opt.element.multiple ? [] : data;
			data = caller === 'view' && opt.element.multiple ? [] : data;

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

			// if (
			// 	!opt.element.multiple
			// 	&& opt.element.options.length
			// 	&& data === null || data === undefined
			// ) {
			// 	data = elements[0].value || elements[0].innerText;
			// }

			data = this.modifyData(opt, data);
			this.setData(opt, data);

		} else if (opt.element.type === 'radio') {

			query = 'input[type="radio"][o-value="' + opt.value + '"]';
			elements = opt.container.querySelectorAll(query);
			data = !data ? 0 : data;

			for (i = 0, l = elements.length; i < l; i++) {
				element = elements[i];

				if (caller === 'view') {

					if (opt.element === element) {

						data = i;
						element.checked = true;

						data = this.modifyData(opt, data);
						this.setData(opt, data);

					} else {
						element.checked = false;
					}

				} else {
					element.checked = i == data;
				}

			}

		} else if (opt.element.type === 'file') {

			data = opt.element.files;
			data = this.modifyData(opt, data);
			this.setData(opt, data);

		} else if (opt.element.type === 'option') {

			data = opt.element.value || opt.element.innerText;
			data = this.modifyData(opt, data);
			this.setData(opt, data);

		} else {

			data = data === undefined || data === null ? opt.element.value : data;

			if (caller === 'view') {
				data = opt.element.value;
			} else {
				opt.element.value = data;
			}

			data = this.modifyData(opt, data);
			this.setData(opt, data);

		}

	};

	var Setup = {};

	Setup.on = function (opt) {
		var data = this.getData(opt);

		opt.cache = data.bind(opt.model);
		opt.element.addEventListener(opt.names[1], opt.cache);
	};

	Setup.each = function (opt) {

		opt.variable = opt.names[1];
		opt.pattern = new RegExp('\\$(' + opt.variable + '|index)', 'ig');

		opt.clone = opt.element.removeChild(opt.element.firstElementChild);

		opt.clone = opt.clone.outerHTML.replace(
			new RegExp('((?:data-)?o-.*?=")' + opt.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
			'$1' + opt.path + '.$' + opt.variable + '$2'
		);

	};

	var Binder = {};

	Binder.data = {};

	Binder.setupMethod = Setup;
	Binder.renderMethod = Render;
	Binder.unrenderMethod = Unrender;

	Binder.ensureData = function (opt) {
		return Global$1.model.ensure(opt.keys);
	};

	Binder.setData = function (opt, data) {
		return Global$1.model.set(opt.keys, data);
	};

	Binder.getData = function (opt) {

		if (opt.type === 'on') {
			return Global$1.utility.getByPath(Global$1.events.data, opt.uid + '.' + opt.path);
		} else {
			return Global$1.model.get(opt.keys);
		}

	};

	Binder.modifyData = function (opt, data) {

		if (!opt.modifiers.length) {
			return data;
		}

		for (var i = 0, l = opt.modifiers.length; i < l; i++) {
			var modifier = opt.modifiers[i];
			data = Global$1.modifiers.data[opt.uid][modifier].call(opt.model, data);
		}

		return data;
	};

	Binder.add = function (opt) {

		if (opt.exists) {
			return;
		} else {
			opt.exists = true;
		}

		if (opt.type === 'value') {
			return;
		}

		if (!(opt.uid in this.data)) {
			this.data[opt.uid] = {};
		}

		if (!(opt.path in this.data[opt.uid])) {
			this.data[opt.uid][opt.path] = [];
		}

		this.data[opt.uid][opt.path].push(opt);
	};

	Binder.remove = function (opt) {

		if (!opt.exists) {
			return;
		}

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

	Binder.get = function (opt) {

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
				return item;
			}

		}

	};

	Binder.each = function (uid, path, callback) {
		var paths = this.data[uid];

		for (var key in paths) {

			if (key.indexOf(path) === 0) {
				var binders = paths[key];

				for (var i = 0, l = binders.length; i < l; i++) {
					var binder = binders[i];

					callback(binder, i, binders, paths, key);
				}

			}

		}

	};

	Binder.option = function (opt) {
		opt = opt || {};

		if (!opt.name) {
			throw new Error('Binder.render - requires a name');
		}

		if (!opt.element) {
			throw new Error('Binder.render - requires a element');
		}

		opt.container = opt.container || Global$1.utility.getContainer(opt.element);
		opt.uid = opt.uid || opt.container.getAttribute('o-uid');
		opt.value = opt.value || opt.element.getAttribute(opt.name);
		opt.path = opt.path || Global$1.utility.binderPath(opt.value);

		var tmp = this.get(opt);

		if (tmp) {
			return tmp;
		}

		opt.exists = false;
		opt.type = opt.type || Global$1.utility.binderType(opt.name);
		opt.names = opt.names || Global$1.utility.binderNames(opt.name);
		opt.values = opt.values || Global$1.utility.binderValues(opt.value);
		opt.modifiers = opt.modifiers || Global$1.utility.binderModifiers(opt.value);

		opt.keys = opt.keys || [opt.uid].concat(opt.values);
		opt.model = opt.model || Global$1.model.data[opt.uid];
		opt.modifiers = opt.modifiers || Global$1.modifiers.data[opt.uid];

		this.ensureData(opt);

		if (opt.type in this.setupMethod) {
			this.setupMethod[opt.type].call(this, opt);
		}

		return opt;
	};

	Binder.batch = function (callback) {
		Global$1.batcher.write(callback.bind(this));
	};

	Binder.unrender = function (opt, caller) {
		opt = this.option(opt);

		if (opt.type in this.unrenderMethod) {
			this.batch(function () {

				this.unrenderMethod[opt.type].call(this, opt, caller);
				this.remove(opt);

			});
		}
	};

	Binder.render = function (opt, caller) {
		opt = this.option(opt);

		if (opt.type in this.renderMethod) {
			this.batch(function () {

				this.renderMethod[opt.type].call(this, opt, caller);
				this.add(opt);

			});
		}
	};

	var Keeper = {};

	Keeper._ = {};
	Keeper.scheme = 'Bearer';
	Keeper.type = 'sessionStorage';

	Object.defineProperty(Keeper, 'token', {
		enumerable: true,
		get: function () {
			return this._.token = this._.token || window[this.type].getItem('token');
		}
	});

	Object.defineProperty(Keeper, 'user', {
		enumerable: true,
		get: function () {
			return this._.user = this._.user || JSON.parse(window[this.type].getItem('user'));
		}
	});

	Keeper.setup = function (options) {
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

	Keeper.setToken = function (token) {
		if (!token) return;
		if (this.scheme === 'Basic') token = this.encode(token);
		this._.token = window[this.type].setItem('token', token);
	};

	Keeper.setUser = function (user) {
		if (!user) return;
		user = JSON.stringify(user);
		this._.user = window[this.type].setItem('user', user);
	};

	Keeper.removeToken = function () {
		this._.token = null;
		window[this.type].removeItem('token');
	};

	Keeper.removeUser = function () {
		this._.user = null;
		window[this.type].removeItem('user');
	};

	Keeper.authenticate = function (token, user) {
		this.setToken(token);
		this.setUser(user);

		if (typeof this._.authenticated === 'string') {
			Global$1.router.navigate(this._.authenticated);
		} else if (typeof this._.authenticated === 'function') {
			this._.authenticated();
		}

	};

	Keeper.unauthenticate = function () {
		this.removeToken();
		this.removeUser();

		if (typeof this._.unauthenticated === 'string') {
			Global$1.router.navigate(this._.unauthenticated);
		} else if (typeof this._.unauthenticated === 'function') {
			this._.unauthenticated();
		}

	};

	Keeper.forbidden = function (result) {

		if (typeof this._.forbidden === 'string') {
			Global$1.router.navigate(this._.forbidden);
		} else if (typeof this._.forbidden === 'function') {
			this._.forbidden(result);
		}

		return false;
	};

	Keeper.unauthorized = function (result) {
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

	Keeper.route = function (result) {

		if (result.auth === false) {
			return true;
		} else if (!this.token) {
			return this.unauthorized(result);
		} else {
			return true;
		}

	};

	Keeper.request = function (result) {

		if (result.opt.auth === false) {
			return true;
		} else if (!this.token) {
			return this.unauthorized(result);
		} else {
			result.xhr.setRequestHeader('Authorization', this.scheme + ' ' + this.token);
			return true;
		}

	};

	Keeper.response = function (result) {

		if (result.statusCode === 401) {
			return this.unauthorized(result);
		} else if (result.statusCode === 403) {
			return this.forbidden(result);
		} else {
			return true;
		}

	};

	Keeper.encode = function (data) {
		return window.btoa(data);
	};

	Keeper.decode = function (data) {
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

	Observer.create = function (data, callback, path) {
		Observer.defineProperties(data, callback, path, true);
		return data;
	};

	Observer.defineProperties = function (data, callback, path, redefine) {
		path = path ? path + '.' : '';

		var propertyDescriptors = {};

		for (var key in data) {
			var propertyDescriptor = Observer.createPropertyDescriptor(data, key, data[key], callback, path, redefine);

			if (propertyDescriptor) {
				propertyDescriptors[key] = propertyDescriptor;
			}

		}

		Object.defineProperties(data, propertyDescriptors);

		if (data && data.constructor === Object || data.constructor === Array) {
			Observer.overrideObjectMethods(data, callback, path);
		}

		if (data && data.constructor === Array) {
			Observer.overrideArrayMethods(data, callback, path);
		}

	};

	Observer.defineProperty = function (data, key, value, callback, path, redefine) {
		var propertyDescriptor = Observer.createPropertyDescriptor(data, key, value, callback, path, redefine);

		if (propertyDescriptor) {
			Object.defineProperty(data, key, propertyDescriptor);
		}

	};

	Observer.createPropertyDescriptor = function (data, key, value, callback, path, redefine) {
		path = path || '';

		var property = Object.getOwnPropertyDescriptor(data, key);

		if (property && property.configurable === false) {
			return;
		}

		var getter = property && property.get;
		var setter = property && property.set;

		// recursive observe child properties
		if (value && typeof value === 'object') {
			Observer.defineProperties(value, callback, path + key, redefine);
		}

		// set the property value if getter setter previously defined and redefine is false
		if (getter && setter && !redefine) {
			setter.call(data, value);
			return;
		}

		return {
			enumerable: true,
			configurable: true,
			get: function () {
				return getter ? getter.call(data) : value;
			},
			set: function (newValue) {

				var oldValue = getter ? getter.call(data) : value;

				// set the value with the same value not updated
				if (newValue === oldValue) {
					return;
				}

				if (setter) {
					setter.call(data, newValue);
				} else {
					value = newValue;
				}

				//	adds attributes to new valued property getter setter
				if (newValue && typeof newValue === 'object') {
					Observer.defineProperties(newValue, callback, path + key, redefine);
				}

				if (callback) {
					callback(newValue, path + key, key, data);
				}

			}
		};
	};

	Observer.overrideObjectMethods = function (data, callback, path) {
		Object.defineProperties(data, {
			$set: {
				configurable: true,
				value: function (key, value) {

					if (typeof key !== 'string' || value === undefined) {
						return;
					}

					Observer.defineProperty(data, key, value, callback, path);

					if (!(key in data) && callback) {
						callback(data[key], path + key, key, data);
					}

					return data;
				}
			},
			$remove: {
				configurable: true,
				value: function (key) {

					if (typeof key !== 'string') {
						return;
					}

					delete data[key];

					if (callback) {
						callback(undefined, path + key, key, data);
					}

				}
			}
		});
	};

	Observer.overrideArrayMethods = function (data, callback, path) {
		Object.defineProperties(data, {
			push: {
				configurable: true,
				value: function () {

					if (!arguments.length) {
						return data.length;
					}

					for (var i = 0, l = arguments.length; i < l; i++) {
						Observer.defineProperty(data, data.length, arguments[i], callback, path);

						if (callback) {
							callback(data.length, path.slice(0, -1), 'length', data);
							callback(data[data.length-1], path + (data.length-1), data.length-1, data);
						}

					}

					return data.length;
				}
			},
			unshift: {
				configurable: true,
				value: function () {

					if (!arguments.length) {
						return data.length;
					}

					var i, l, result = [];

					for (i = 0, l = arguments.length; i < l; i++) {
						result.push(arguments[i]);
					}

					for (i = 0, l = data.length; i < l; i++) {
						result.push(data[i]);
					}

					for (i = 0, l = data.length; i < l; i++) {
						data[i] = result[i];
					}

					for (i = 0, l = result.length; i < l; i++) {
						Observer.defineProperty(data, data.length, result[i], callback, path);

						if (callback) {
							callback(data.length, path.slice(0, -1), 'length', data);
							callback(data[data.length-1], path + (data.length-1), data.length-1, data);
						}

					}

					return data.length;
				}
			},
			pop: {
				configurable: true,
				value: function () {

					if (!data.length) {
						return;
					}

					var value = data[data.length-1];

					data.length--;

					if (callback) {
						callback(data.length, path.slice(0, -1), 'length', data);
						callback(undefined, path + data.length, data.length, data);
					}

					return value;
				}
			},
			shift: {
				configurable: true,
				value: function () {

					if (!data.length) {
						return;
					}

					var value = data[0];

					for (var i = 0, l = data.length-1; i < l; i++) {
						data[i] = data[i+1];
					}

					data.length--;

					if (callback) {
						callback(data.length, path.slice(0, -1), 'length', data);
						callback(undefined, path + data.length, data.length, data);
					}

					return value;
				}
			},
			splice: {
				configurable: true,
				value: function (startIndex, deleteCount) {

					if (!data.length || (typeof startIndex !== 'number' && typeof deleteCount !== 'number')) {
						return [];
					}

					if (typeof startIndex !== 'number') {
						startIndex = 0;
					}

					if (typeof deleteCount !== 'number') {
						deleteCount = data.length;
					}

					var removed = [];
					var result = [];
					var index, i, l;

					// this would follow spec more or less
					// startIndex = parseInt(startIndex, 10);
					// deleteCount = parseInt(deleteCount, 10);

					// handle negative startIndex
					if (startIndex < 0) {
						startIndex = data.length + startIndex;
						startIndex = startIndex > 0 ? startIndex : 0;
					} else {
						startIndex = startIndex < data.length ? startIndex : data.length;
					}

					// handle negative deleteCount
					if (deleteCount < 0) {
						deleteCount = 0;
					} else if (deleteCount > (data.length - startIndex)) {
						deleteCount = data.length - startIndex;
					}

					// copy items up to startIndex
					for (i = 0; i < startIndex; i++) {
						result[i] = data[i];
					}

					// add new items from arguments
					for (i = 2, l = arguments.length; i < l; i++) {
						result.push(arguments[i]);
					}

					// copy removed items
					for (i = startIndex, l = startIndex + deleteCount; i < l; i++) {
						removed.push(data[i]);
					}

					// add the items after startIndex + deleteCount
					for (i = startIndex + deleteCount, l = data.length; i < l; i++) {
						result.push(data[i]);
					}

					index = 0;
					i = result.length - data.length;
					i = result.length - (i < 0 ? 0 : i);

					// update all observed items
					while (i--) {
						data[index] = result[index];
						index++;
					}

					i = result.length - data.length;

					// add and observe or remove items
					if (i > 0) {

						while (i--) {
							Observer.defineProperty(data, data.length, result[index++], callback, path);

							if (callback) {
								callback(data.length, path.slice(0, -1), 'length', data);
								callback(data[data.length-1], path + (data.length-1), data.length-1, data);
							}

						}

					} else if (i < 0) {

						while (i++) {
							data.length--;

							if (callback) {
								callback(data.length, path.slice(0, -1), 'length', data);
								callback(undefined, path + data.length, data.length, data);
							}

						}

					}

					return removed;
				}
			}
		});
	};

	var Model = {};

	Model.data = {};
	Model.isRan = false;
	Model.container = document.body;

	Model.overwrite = function (data) {
		Observer.create(
			this.data = data,
			this.observer.bind(this)
		);
	};

	Model.traverse = function (path, create) {
		return Global$1.utility.traverse(this.data, path, function (data, key, index, keys) {

			if (create) {

				if (isNaN(keys[index + 1])) {
					data.$set(key, {});
				} else {
					data.$set(key, []);
				}

			}

		});
	};

	Model.get = function (keys) {
		var result = Global$1.utility.traverse(this.data, keys);
		return result ? result.data[result.key] : undefined;
	};

	Model.set = function (keys, value) {
		var result = this.traverse(keys, true);
		// value = value === undefined ? null : value;
		return result.data.$set(result.key, value);
	};

	Model.ensure = function (keys, value) {
		var result = this.traverse(keys, true);

		if (result.data[result.key] === undefined) {
			return result.data.$set(result.key, value || null);
		} else {
			return result.data[result.key];
		}

	};

	Model.observer = function (data, path) {
		var paths = path.split('.');
		var uid = paths[0];
		var type = data === undefined ? 'unrender' : 'render';

		path = paths.slice(1).join('.');

		if (!path) return;

		Global$1.binder.each(uid, path, function (binder) {
			Global$1.binder[type](binder);
		});

	};

	Model.run = function () {

		if (this.isRan) {
			return;
		}

		this.isRan = true;

		Observer.create(
			this.data,
			this.observer.bind(this)
		);

	};

	var View = {};

	View.data = {};
	View.isRan = false;
	View.container = document.body;

	View.hasAcceptAttribute = function (element) {
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

	View.eachAttribute = function (element, callback) {
		var attributes = element.attributes;

		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];

			if (
				attribute.value
				&& attribute.name.indexOf('o-') === 0
				|| attribute.name.indexOf('data-o-') === 0
				&& attribute.name !== 'o-auth'
				&& attribute.name !== 'o-reset'
				&& attribute.name !== 'o-method'
				&& attribute.name !== 'o-action'
				&& attribute.name !== 'o-external'
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

	View.each = function (element, callback, container) {

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

	View.add = function (addedElement) {
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

	View.remove = function (removedElement, target) {
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

	View.run = function () {

		if (this.isRan) {
			return;
		}

		this.isRan = true;

		this.add(this.container);
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
		clicks: {
			enumerable: true,
			value: []
		},
		popstates: {
			enumerable: true,
			value: []
		},
		global: {
			enumerable: true,
			value: {}
		},
		events: {
			enumerable: true,
			value: Events
		},
		modifiers: {
			enumerable: true,
			value: Modifiers
		},
		utility: {
			enumerable: true,
			value: Utility
		},
		view: {
			enumerable: true,
			value: View
		},
		model: {
			enumerable: true,
			value: Model
		},
		binder: {
			enumerable: true,
			value: Binder
		},
		keeper:{
			enumerable: true,
			value: Keeper
		},
		loader:{
			enumerable: true,
			value: Loader
		},
		router:{
			enumerable: true,
			value: Router$1
		},
		batcher:{
			enumerable: true,
			value: Batcher
		},
		fetcher:{
			enumerable: true,
			value: Fetcher
		},
		component:{
			enumerable: true,
			value: Component
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
					this.loader.run();
				}

				if (options.router) {
					this.router.setup(options.router);
					this.router.run();
				}

			}
		}
	});

	Global$1.document.addEventListener('click', function (e) {

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

	Global$1.document.addEventListener('input', function (e) {

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

	Global$1.document.addEventListener('change', function (e) {
		Global$1.binder.render({
			name: 'o-value',
			element: e.target,
		}, 'view');
	}, true);

	Global$1.document.addEventListener('load', function (e) {
		var element = e.target;

		if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
			return;
		}

		var path = Global$1.utility.resolve(element.src || element.href);

		Global$1.loader.modules[path].code = element;

		var listener;
		while (listener = Global$1.loader.modules[path].listener.shift()) {
			listener();
		}

	}, true);

	Global$1.document.addEventListener('reset', function (e) {
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

	Global$1.document.addEventListener('submit', function (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		if (!submit) return;

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

	Global$1.window.addEventListener('popstate', function (e) {
		var options = { replace: true };
		Global$1.router.navigate(e.state || window.location.href, options);
	}, true);

	new Global$1.window.MutationObserver(function (mutations) {
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

	window.requestAnimationFrame(function () {
		var eStyle = Global$1.document.createElement('style');
		var sStyle = Global$1.document.createTextNode('o-view, o-view > :first-child { display: block; }');

		eStyle.setAttribute('title', 'Oxe');
		eStyle.setAttribute('type', 'text/css');
		eStyle.appendChild(sStyle);

		Global$1.head.appendChild(eStyle);
		Global$1.document.registerElement('o-view', { prototype: Object.create(HTMLElement.prototype) });

		var eScript = Global$1.document.querySelector('[o-index]');
		var eIndex = eScript ? eScript.getAttribute('o-index') : null;

		if (eIndex) {
			Global$1.loader.load({ url: eIndex });
		}

	});

	Global$1.view.run();
	Global$1.model.run();

	return Global$1;

})));
