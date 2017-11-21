/*
	Name: Oxe
	Version: 2.6.2
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
			throw new Error('Oxe.component.define requires name');
		}

		if (!options.html && !options.query && !options.element) {
			throw new Error('Oxe.component.define requires html, query, or element');
		}

		// options.view = options.view || {};
		options.model = options.model || {};
		options.template = self.handleTemplate(options);

		options.proto = Object.create(HTMLElement.prototype);

		options.proto.attachedCallback = options.attached;
		options.proto.detachedCallback = options.detached;
		options.proto.attributeChangedCallback = options.attributed;

		options.proto.createdCallback = function () {
			var element = this;

			if (!(options.name in self.data)) {
				self.data[options.name] = [];
			}

			self.data[options.name].push(element);

			var uid = options.name + '-' + self.data[options.name].length;

			element.setAttribute('o-uid', uid);

			// element.view = Global.view.data[uid] = options.view;
			element.model = Global$1.model.set(uid, options.model)[uid];
			element.events = Global$1.events.data[uid] = options.events;
			element.modifiers = Global$1.modifiers.data[uid] = options.modifiers;

			// might want to handle default slot
			// might want to overwrite content
			self.handleSlots(element, options.template);

			if (options.shadow) {
				element.createShadowRoot().appendChild(document.importNode(options.template.content, true));
			} else {
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

	var Modifiers = {};

	Modifiers.data = {};

	var Utility = {};

	Utility.PATH = /\s*\|.*/;
	Utility.PREFIX = /(data-)?o-/;
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

	Utility.createBase = function (base) {
		var element = document.head.querySelector('base');

		if (!element) {
			element = document.createElement('base');
			document.head.insertBefore(element, document.head.firstChild);
		}

		if (typeof base === 'string') {
			element.href = base;
		}

		base = element.href;

		return base;
	};

	Utility.formData = function (form, model) {
		var elements = form.querySelectorAll('[o-value]');
		var data = {};

		for (var i = 0, l = elements.length; i < l; i++) {
			var element = elements[i];
			var path = element.getAttribute('o-value');
			if (path) {
				path = path.replace(/\s*\|.*/, '');
				var name = path.split('.').slice(-1);
				data[name] = Utility.getByPath(model, path);
			}
		}

		return data;
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

	Utility.joinSlash = function () {
		return Array.prototype.join
			.call(arguments, '/')
			.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
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
	Router.base = false;
	Router.hash = false;
	Router.auth = false;
	Router.isRan = false;
	Router.location = {};
	Router.view = 'o-view';
	Router.trailing = false;

	Router.setup = function (options) {
		options = options || {};
		this.base = options.base === undefined ? this.base: options.base;
		this.auth = options.auth === undefined ? this.auth : options.auth;
		this.view = options.view === undefined ? this.view : options.view;
		this.hash = options.hash === undefined ? this.hash : options.hash;
		this.routes = options.routes === undefined ? this.routes: options.routes;
		this.external = options.external === undefined ? this.external: options.external;
		this.trailing = options.trailing === undefined ? this.trailing : options.trailing;
		this.base = options.base === undefined ? this.base : Global$1.utility.createBase(options.base);
	};

	// Router.popstate = function (e) {
	// };

	// Router.click = function (e) {
	// };

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
		return new RegExp(
			'^' + routePath
			.replace(/{\*}/g, '(?:.*)')
			.replace(/{(\w+)}/g, '([^\/]+)')
			+ '(\/)?$'
		).test(userPath);
	};

	Router.toParameter = function (routePath, userPath) {
		var result = {};
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

	Router.toQuery = function (path) {
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

	Router.toLocation = function (path) {
		var location = {};

		location.pathname = decodeURI(path);
		location.origin = window.location.origin;
		location.base = this.base ? this.base : location.origin;

		location.port = window.location.port;
		location.host = window.location.host;
		location.hostname = window.location.hostname;
		location.protocol = window.location.protocol;

		if (location.base.slice(-3) === '/#/') {
			location.base = location.base.slice(0, -3);
		}

		if (location.base.slice(-2) === '/#') {
			location.base = location.base.slice(0, -2);
		}

		if (location.base.slice(-1) === '/') {
			location.base = location.base.slice(0, -1);
		}

		if (location.pathname.indexOf(location.base) === 0) {
			location.pathname = location.pathname.slice(location.base.length);
		}

		if (location.pathname.indexOf(location.origin) === 0) {
			location.pathname = location.pathname.slice(location.origin.length);
		}

		if (location.pathname.indexOf('/#/') === 0) {
			location.pathname = location.pathname.slice(2);
		}

		if (location.pathname.indexOf('#/') === 0) {
			location.pathname = location.pathname.slice(1);
		}

		var hashIndex = this.hash ? location.pathname.indexOf('#', location.pathname.indexOf('#')) : location.pathname.indexOf('#');
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

		if (this.trailing) {
			location.pathname = this.join(location.pathname, '/');
		} else {
			location.pathname = location.pathname.replace(/\/$/, '');
		}

		if (location.pathname.charAt(0) !== '/') {
			location.pathname = '/' + location.pathname;
		}

		if (this.hash) {
			location.href = Global$1.utility.joinSlash(location.base, '/#/', location.pathname);
		} else {
			location.href =  Global$1.utility.joinSlash(location.base, '/', location.pathname);
		}

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

	Router.navigate = function (data, replace) {
		var location;

		if (typeof data === 'string') {
			location = this.toLocation(data);
			location.route = this.find(location.pathname) || {};
			location.title = location.route.title || '';
			location.query = this.toQuery(location.search);
			location.parameters = this.toParameter(location.route.path, location.pathname);
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
		window.history[replace ? 'replaceState' : 'pushState'](this.location, this.location.title, this.location.href);

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

		this.navigate(window.location.href, true);
	};

	var Router$1 = Router;

	var Transformer = {};

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

	// NOTE: double backtick in strings or regex could possibly causes issues
	Transformer.template = function (data) {
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

	var Loader = {};

	Loader.loads = [];
	Loader.modules = {};

	Loader.esm = false;
	Loader.est = false;
	Loader.base = false;
	Loader.isRan = false;

	Loader.patterns = {
		imps: /import\s+\w+\s+from\s+(?:'|").*?(?:'|")/g,
		imp: /import\s+(\w+)\s+from\s+(?:'|")(.*?)(?:'|")/,
		exp: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/,
		exps: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/g
	};

	Loader.setup = function (options) {
		options = options || {};
		this.loads = options.loads || this.loads;
		this.esm = options.esm === undefined ? this.esm : options.esm;
		this.est = options.est === undefined ? this.est : options.est;
		this.base = options.base === undefined ? this.base : Global$1.utility.createBase(options.base);
	};

	Loader.change = function (data, callback) {

		if (data.xhr.readyState === 4) {

			if (data.xhr.status >= 200 && data.xhr.status < 400) {
				data.text = data.xhr.responseText;

				if (callback) {
					callback(data);
				}

			} else {
				throw new Error(data.xhr.responseText);
			}

		}

	};

	Loader.xhr = function (data, callback) {

		if (data.xhr) {
			return;
		}

		if (!data.url) {
			throw new Error('Oxe.Loader - requires a url');
		}

		data.xhr = new XMLHttpRequest();
		data.xhr.addEventListener('readystatechange', this.change.bind(this, data, callback));

		data.xhr.open('GET', data.url);
		data.xhr.send();
	};

	Loader.js = function (data, callback) {
		var self = this;

		if (self.est || data.est) {
			data.text = Transformer.template(data.text);
		}

		if (self.esm || data.esm) {
			data.ast = self.toAst(data.text);

			if (data.ast.imports.length) {

				var meta = {
					count: 0,
					imports: data.ast.imports,
					total: data.ast.imports.length,
					callback: function () {

						if (++meta.count === meta.total) {
							self.modules[data.url] = self.interpret(data.ast.cooked);

							if (callback) {
								callback();
							}

						}

					}
				};

				for (var i = 0, l = meta.imports.length; i < l; i++) {
					self.load(meta.imports[i].url, meta.callback);
				}

				return;
			}
		}

		self.modules[data.url] = self.interpret(data.ast ? data.ast.cooked : data.text);

		if (callback) {
			callback();
		}

	};

	Loader.css = function (data, callback) {
		data.element = document.createElement('link');
		data.element.setAttribute('href', data.url);
		data.element.setAttribute('rel','stylesheet');
		data.element.setAttribute('type', 'text/css');

		data.element.addEventListener('load', function () {

			if (callback) {
				callback(data);
			}

		});

		document.head.appendChild(data.element);
	};

	Loader.getImports = function (data) {
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

	Loader.getExports = function (data) {
		return data.match(this.patterns.exps) || [];
	};

	Loader.ext = function (data) {
		var position = data.lastIndexOf('.');
		return position ? data.slice(position+1) : '';
	};

	Loader.normalizeUrl = function (url) {

		if (!this.ext(url)) {
			url = url + '.js';
		}

		if (this.base && url.indexOf('/') !== 0) {
			url = Global$1.utility.joinSlash(Global$1.base.replace(window.location.origin, ''), url);
		}

		return url;
	};

	Loader.handleImports = function (ast) {

		for (var i = 0, l = ast.imports.length; i < l; i++) {
			ast.imports[i].url = this.normalizeUrl(ast.imports[i].url);
			var pattern = 'var ' + ast.imports[i].name + ' = $L.modules[\'' + ast.imports[i].url + '\']';
			ast.cooked = ast.cooked.replace(ast.imports[i].raw, pattern);
		}

	};

	Loader.handleExports = function (ast) {
		ast.cooked = ast.cooked.replace('export default', 'return');
	};

	Loader.toAst = function (data) {
		var ast = {};
		ast.raw = data;
		ast.imports = this.getImports(ast.raw);
		ast.exports = this.getExports(ast.raw);
		ast.cooked = ast.raw;
		this.handleImports(ast);
		this.handleExports(ast);
		return ast;
	};

	Loader.interpret = function (data) {
		data = '\'use strict\';\n\n' + data;

		return (function(d, l, w) { 'use strict';
			return new Function('$L', 'window', d)(l, w);
		}(data, this, window));

	};

	Loader.load = function (data, callback) {
		var self = this;

		if (data.constructor === String) {
			data = { url: data };
		}

		data.url = self.normalizeUrl(data.url);

		if (data.url in self.modules) {
			return callback ? callback() : undefined;
		}

		data.ext = self.ext(data.url);

		if (data.ext === 'js' || data.ext === '') {
			self.xhr(data, function (d) {
				self.js(d, callback);
			});
		} else if (data.ext === 'css') {
			self.css(data, callback);
		} else {
			throw new Error('Oxe.Loader - unreconized file type');
		}

	};

	Loader.run = function () {

		if (this.isRan) {
			return;
		}

		this.isRan = true;

		for (var i = 0, l = this.loads.length; i < l; i++) {
			this.load(this.loads[i]);
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

		while (element = element.lastElementChild) {
			element.removeChild(element);
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
		var data = this.getData(opt) || '';

		if (typeof data === 'object') {
			data = JSON.stringify(data);
		} else if (typeof data !== 'string') {
			data = String(data);
		}

		opt.element.innerText = this.modifyData(opt, data);
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

			this.setData(opt, data);

		} else if (opt.element.nodeName === 'SELECT') {

			elements = opt.element.options;
			data = !data && opt.element.multiple ? [] : data;
			data = caller === 'view' && opt.element.multiple ? [] : data;

			for (i = 0, l = elements.length; i < l; i++) {
				element = elements[i];

				if (element.selected) {

					if (opt.element.multiple) {
						data.push(element.value);
					} else {
						data = element.value;
						break;
					}

				}

			}

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
						this.setData(opt, data);
					} else {
						element.checked = false;
					}

				} else {
					element.checked = i == data;
				}

			}

		} else {

			data = data === undefined ? '' : data;

			if (caller === 'view') {
				data = opt.element.value;
			} else {
				opt.element.value = data;
			}

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

		Observer.overrideObjectMethods(data, callback, path);

		if (data.constructor === Array) {
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
				&& attribute.name !== 'o-method'
				&& attribute.name !== 'o-action'
				&& attribute.name !== 'o-external'
				&& attribute.name !== 'data-o-action'
				&& attribute.name !== 'data-o-method'
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

	var base = document.head.querySelector('base');

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
				return document;
			}
		},
		body: {
			enumerable: true,
			get: function () {
				return document.body;
			}
		},
		head: {
			enumerable: true,
			get: function () {
				return document.head;
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
				return (document._currentScript || document.currentScript);
			}
		},
		ownerDocument: {
			enumerable: true,
			get: function () {
				return (document._currentScript || document.currentScript).ownerDocument;
			}
		},
		base: {
			enumerable: true,
			get: function () {
				return (base ? base.href : null) || window.location.href
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

	Global$1.window.addEventListener('click', function (e) {

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

	Global$1.window.addEventListener('popstate', function (e) {
		Global$1.router.navigate(e.state || window.location.href, true);
	}, true);

	Global$1.window.addEventListener('input', function (e) {

		if (
			e.target.type !== 'checkbox'
			&& e.target.type !== 'radio'
			&& e.target.nodeName !== 'SELECT'
		) {
			Global$1.binder.render({
				name: 'o-value',
				element: e.target,
			}, 'view');
		}

	}, true);

	Global$1.window.addEventListener('change', function (e) {
		Global$1.binder.render({
			name: 'o-value',
			element: e.target,
		}, 'view');
	}, true);

	Global$1.window.addEventListener('reset', function (e) {
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

	Global$1.window.addEventListener('submit', function (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		if (submit) {
			var container = Global$1.utility.getContainer(element);
			var uid = container.getAttribute('o-uid');
			var model = Global$1.model.data[uid];
			var data = Global$1.utility.formData(element, model);
			var method = Global$1.utility.getByPath(container.events, submit);
			var options = method.call(model, data, e);

			if (options && typeof options === 'object') {
				var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
				var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
				options.url = options.url || action;
				options.method = options.method || method;
				Global$1.fetcher.fetch(options);
			}

			if (element.hasAttribute('o-reset')) {
				element.reset();
			}

			e.preventDefault();
		}

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
