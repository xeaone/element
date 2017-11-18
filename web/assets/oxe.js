(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Oxe', factory) :
	(global.Oxe = factory());
}(this, (function () { 'use strict';

	var Component = {};

	Component.data = {};
	Component.currentScript = (document._currentScript || document.currentScript);

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
				template = document.querySelector(data.query);
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
		// else if (data.url) {
		//
		// }
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

		options.view = options.view || {};
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
			element.view = Global$1.view.data[uid] = options.view;
			element.events = Global$1.events.data[uid] = options.events;
			element.model = Global$1.model.data.$set(uid, options.model)[uid];
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

	var Batcher = {};

	Batcher.reads = [];
	Batcher.writes = [];
	Batcher.pending = false;
	// Batcher.tasks = [];
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
		if (!this.pending) {
			self.pending = true;
			this.flush();
		}
	};

	Batcher.flush = function (callback) {
		var self = this;
		self.run(self.reads.splice(0, self.reads.length), function () {
			self.run(self.writes.splice(0, self.writes.length), function () {
				if (self.reads.length || self.writes.length) {
					self.flush();
				} else {
					self.pending = false;
				}
			});
		});
	};

	Batcher.run = function (tasks, callback, index) {
		var self = this;
		if (tasks.length) {
			window.requestAnimationFrame(function (time) {
				var count = 0;
				var length = tasks.length;

				index = index || 0;

				for (index; index < length; index++) {

					tasks[index]();

					// if ((performance.now() - time) > self.maxTaskTimeMS) {
					// 	return self.run(tasks, callback, index);
					// }

				}

				return callback();
			});
		} else {
			return callback();
		}
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

	function Events () {
		this.events = {};
	}

	Events.prototype.on = function (name, listener) {
		if (typeof this.events[name] !== 'object') {
			this.events[name] = [];
		}

		this.events[name].push(listener);
	};

	Events.prototype.off = function (name, listener) {
		if (typeof this.events[name] === 'object') {
			var index = this.events[name].indexOf(listener);

			if (index > -1) {
				this.events[name].splice(index, 1);
			}
		}
	};

	Events.prototype.once = function (name, listener) {
		this.on(name, function f () {
			this.off(name, f);
			listener.apply(this, arguments);
		});
	};

	Events.prototype.emit = function (name) {
		if (typeof this.events[name] === 'object') {
			var listeners = this.events[name].slice();
			var args = [].slice.call(arguments, 1);

			for (var i = 0, l = listeners.length; i < l; i++) {
				listeners[i].apply(this, args);
			}
		}
	};

	var Router = {};

	Router = Object.assign(Router, Events.prototype);
	Events.call(Router);

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
		this.base = options.base === undefined ? this.base : Utility.createBase(options.base);
	};

	Router.popstate = function (e) {
		this.navigate(e.state || window.location.href, true);
	};

	Router.click = function (e) {

		// if shadow dom use
		var target = e.path ? e.path[0] : e.target;
		var parent = target.parentNode;

		if (this.container) {

			while (parent) {
				if (parent === this.container) break;
				else parent = parent.parentNode;
			}

			if (parent !== this.container) return;
		}

		if (e.metaKey || e.ctrlKey || e.shiftKey) return;

		// ensure target is anchor tag
		while (target && 'A' !== target.nodeName) target = target.parentNode;
		if (!target || 'A' !== target.nodeName) return;

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

		e.preventDefault();

		if (this.location.href !== target.href) {
			this.navigate(target.href);
		}

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
			location.href = Utility.joinSlash(location.base, '/#/', location.pathname);
		} else {
			location.href =  Utility.joinSlash(location.base, '/', location.pathname);
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
		if (this.isRan) return;
		else this.isRan = true;

		this.view = typeof this.view === 'string' ? document.body.querySelector(this.view) : this.view;

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
			if (
				char === '`' &&
				string[index-1] !== '\\'
				// && string[index-1] + string[index-2] !== '//'
			) {
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

	Loader.patterns = {
		imps: /import\s+\w+\s+from\s+(?:'|").*?(?:'|")/g,
		imp: /import\s+(\w+)\s+from\s+(?:'|")(.*?)(?:'|")/,
		exps: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/g,
		exp: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/,
	};

	Loader.setup = function (options) {
		options = options || {};
		this.loads = options.loads || this.loads;
		this.esm = options.esm === undefined ? this.esm : options.esm;
		this.est = options.est === undefined ? this.est : options.est;
		this.base = options.base === undefined ? this.base : Utility.createBase(options.base);
	};

	Loader.xhr = function (data, callback) {
		if (data.xhr) return;
		if (!data.url) throw new Error('Oxe.Loader - requires a url');

		data.xhr = new XMLHttpRequest();
		data.xhr.addEventListener('readystatechange', function () {
			if (data.xhr.readyState === 4) {
				if (data.xhr.status >= 200 && data.xhr.status < 400) {
					data.text = data.xhr.responseText;
					if (callback) callback(data);
				} else {
					throw new Error(data.xhr.responseText);
				}
			}
		});

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
							if (callback) callback();
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
		if (callback) callback();
	};

	Loader.css = function (data, callback) {
		data.element = document.createElement('link');
		data.element.setAttribute('href', data.url);
		data.element.setAttribute('rel','stylesheet');
		data.element.setAttribute('type', 'text/css');
		data.element.addEventListener('load', function () {
			if (callback) callback(data);
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
			url = Utility.joinSlash(Global$1.base.replace(window.location.origin, ''), url);
		}

		return url;
	};

	Loader.handleImports = function (ast) {
		for (var i = 0, l = ast.imports.length; i < l; i++) {
			ast.imports[i].url = this.normalizeUrl(ast.imports[i].url);
			ast.cooked = ast.cooked.replace(ast.imports[i].raw, 'var ' + ast.imports[i].name + ' = $L.modules[\'' + ast.imports[i].url + '\']');
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
		for (var i = 0, l = this.loads.length; i < l; i++) {
			this.load(this.loads[i]);
		}
	};



	/*
		https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
	*/

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



	/*
		Resources:
			https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
			https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
	*/

	// Keeper.encode = function (data) {
	// 	// encodeURIComponent to get percent-encoded UTF-8
	// 	// convert the percent encodings into raw bytes which
	// 	return window.btoa(window.encodeURIComponent(data).replace(/%([0-9A-F]{2})/g,
	// 		function toSolidBytes (match, char) {
	// 			return String.fromCharCode('0x' + char);
	// 	}));
	// };
	//
	// Keeper.decode = function (data) {
	// 	// from bytestream to percent-encoding to original string
	//     return window.decodeURIComponent(window.atob(data).split('').map(function(char) {
	//         return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
	//     }).join(''));
	// };

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

		// if (data.constructor === Object) {
			Observer.overrideObjectMethods(data, callback, path);
		// } else
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
					if (!arguments.length) return data.length;

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
					if (!arguments.length) return data.length;

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
					if (!data.length) return;

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
					if (!data.length) return;

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
					if (!data.length || (typeof startIndex !== 'number' && typeof deleteCount !== 'number')) return [];
					if (typeof startIndex !== 'number') startIndex = 0;
					if (typeof deleteCount !== 'number') deleteCount = data.length;

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
	Model.isSetup = false;
	Model.container = document.body;

	Model.overwrite = function (data) {
		Observer.create(
			this.data = data,
			this.observer.bind(this)
		);
	};

	Model.traverse = function (path) {
		return Utility.traverse(this.data, path, function (data, key, index, keys) {
			if (isNaN(keys[index+1])) {
				data.$set(key, {});
			} else {
				data.$set(key, []);
			}
		});
	};

	Model.get = function (keys) {
		var result = Utility.traverse(this.data, keys);
		return result ? result.data[result.key] : undefined;
	};

	Model.set = function (keys, value) {
		value = value === undefined ? null : value;
		var result = this.traverse(keys);
		return result.data.$set(result.key, value);
	};

	Model.ensure = function (keys, value) {
		var result = this.traverse(keys);
		if (result.data[result.key] === undefined) {
			return result.data.$set(result.key, value || null);
		} else {
			return result.data[result.key];
		}
	};

	Model.listener = function (element) {
		var value = element.getAttribute('o-value');
		if (value) {
			var i, l;
			var container = Utility.getContainer(element);
			var uid = container.getAttribute('o-uid');
			var path = value.replace(/(^(\w+\.?)+).*/, '$1');
			var result = this.traverse(uid + '.' + path);

			if (element.type === 'checkbox') {
				result.data[result.key] = element.value = element.checked;
			} else if (element.nodeName === 'SELECT' && element.multiple) {
				var values = [];
				var options = element.options;
				for (i = 0, l = options.length; i < l; i++) {
					var option = options[i];
					if (option.selected) {
						values.push(option.value);
					}
				}
				result.data[result.key] = values;
			} else if (element.type === 'radio') {
				var elements = element.parentNode.querySelectorAll('input[type="radio"][o-value="' + path + '"]');
				for (i = 0, l = elements.length; i < l; i++) {
					var radio = elements[i];
					if (radio === element) {
						radio.checked = true;
						result.data[result.key] = i;
					} else {
						radio.checked = false;
					}
				}
			} else {
				result.data[result.key] = element.value;
			}
		}
	};

	Model.input = function (e) {
		if (e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.nodeName !== 'SELECT') {
			this.listener.call(this, e.target);
		}
	};

	Model.change = function (e) {
		this.listener.call(this, e.target);
	};

	Model.observer = function (data, path) {
		var paths = path.split('.');
		var uid = paths[0];
		var type = data === undefined ? 'unrender' : 'render';

		path = paths.slice(1).join('.');
		// console.log(path);

		if (path) {
			Global$1.view.eachBinder(uid, path, function (binder) {
				binder[type]();
			});
		}

	};

	Model.setup = function () {
		if (this.isSetup) {
			return;
		} else {
			this.isSetup = true;
		}

		Observer.create(
			this.data,
			this.observer.bind(this)
		);

		Global$1.inputs.push(this.input.bind(this));
		Global$1.changes.push(this.change.bind(this));
	};

	function UnrenderOn (opt, data) {
		opt.element.removeEventListener(opt.names[1], data, false);
	}

	var RenderValue = function (opt, data) {
		var i , l;

		if (opt.element.type === 'checkbox') {
			data = !data ? false : data;
			opt.element.checked = data;
			opt.element.value = data;
		} else if (opt.element.nodeName === 'SELECT') {
			var options = opt.element.options;
			data = !data && opt.element.multiple ? [] : data;
			for (i = 0, l = options.length; i < l; i++) {
				var option = options[i];
				if (option.selected) {
					if (opt.element.multiple) {
						data.push(option.value);
					} else {
						data = option.value;
						break;
					}
				}
			}
		} else if (opt.element.type === 'radio') {
			var query = 'input[type="radio"][o-value="' + opt.attribute.value + '"]';
			var elements = opt.element.parentNode.querySelectorAll(query);
			for (i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				radio.checked = i === data;
			}
		} else {
			data = data === undefined ? '' : data;
			opt.element.value = data;
		}

		return data;
	};

	function RenderOn (opt, data) {
		if (opt.exists) {
			opt.element.removeEventListener(opt.names[1], data);
			data = data.bind(opt.model);
			opt.element.addEventListener(opt.names[1], data);
		} else {
			data = data.bind(opt.model);
			opt.element.addEventListener(opt.names[1], data);
		}
		return data;
	}

	var OnceBinder = {};

	OnceBinder.data = {};

	OnceBinder.unrenderMethod = {
		on: UnrenderOn,
		value: UnrenderValue
	};

	OnceBinder.renderMethod = {
		on: RenderOn,
		value: RenderValue
	};

	OnceBinder.ensureData = function (opt) {
		return Global$1.model.ensure(opt.keys);
	};

	OnceBinder.setData = function (opt, data) {
		if (data !== undefined) {
			return Global$1.model.set(opt.keys, data);
		}
	};

	OnceBinder.getData = function (opt) {
		if (opt.type === 'on') {
			return Utility.getByPath(Global$1.events.data, opt.uid + '.' + opt.path);
		} else {
			return Global$1.model.get(opt.keys);
		}
	};

	OnceBinder.add = function (opt) {
		opt.exists = true;

		if (!(opt.uid in this.data)) {
			this.data[opt.uid] = {};
		}

		if (!(opt.path in this.data[opt.uid])) {
			this.data[opt.uid][opt.path] = [];
		}

		this.data[opt.uid][opt.path].push(opt);
	};

	OnceBinder.remove = function (opt) {
		var data;

		if (!(opt.uid in this.data)) {
			return;
		}

		if (!(opt.path in this.data[opt.uid])) {
			return;
		}

		data = this.data[opt.uid][opt.path];

		for (var i = 0, l = data.length; i < l; i++) {
			var item = data[i];
			if (item.element === opt.element) {
				return data.splice(i, 1);
			}
		}
	};

	OnceBinder.get = function (opt) {
		var data;

		if (!(opt.uid in this.data)) {
			return;
		}

		if (!(opt.path in this.data[opt.uid])) {
			return;
		}

		data = this.data[opt.uid][opt.path];

		for (var i = 0, l = data.length; i < l; i++) {
			var item = data[i];
			if (item.element === opt.element) {
				return item;
			}
		}
	};

	OnceBinder.update = function (opt) {
		var data;

		if (!(opt.uid in this.data)) {
			return;
		}

		if (!(opt.path in this.data[opt.uid])) {
			return;
		}

		data = this.data[opt.uid][opt.path];

		for (var i = 0, l = data.length; i < l; i++) {
			var item = data[i];
			if (item.element === opt.element) {
				for (var key in opt) {
					item[key] = opt[key];
				}
				return item;
			}
		}
	};

	// OnceBinder.modifyData = function (opt, data) {
	// 	if (opt.modifiers && opt.attribute.modifiers.length) {
	// 		for (var i = 0, l = opt.attribute.modifiers.length; i < l; i++) {
	// 			data = opt.modifiers[opt.attribute.modifiers[i]].call(opt.model, data);
	// 		}
	// 	}
	// 	return data;
	// };

	OnceBinder.option = function (opt) {
		opt = opt || {};

		if (!opt.type) throw new Error('OnceBinder.render - requires a type');
		if (!opt.element) throw new Error('OnceBinder.render - requires a element');

		var tmp = this.get(opt);
		if (tmp) return tmp;

		opt.exists = false;

		opt.container = opt.container || Utility.getContainer(opt.element);
		opt.uid = opt.uid || opt.container.getAttribute('o-uid');

		opt.attribute = opt.attribute || {};
		opt.attribute.value = opt.value || opt.attribute.value || opt.element.getAttribute(opt.attribute.name);

		opt.path = opt.path || opt.attribute.path || Utility.binderPath(opt.attribute.value);
		opt.names = opt.names || opt.attribute.names || Utility.binderNames(opt.attribute.name);
		opt.values = opt.values || opt.attribute.values || Utility.binderValues(opt.attribute.value);
		opt.modifiers = opt.modifiers || opt.attribute.modifiers || Utility.binderModifiers(opt.attribute.value);

		opt.keys = [opt.uid].concat(opt.values);
		opt.model = opt.model || Global$1.model.data[opt.uid];
		opt.modifiers = opt.modifiers || Global$1.modifiers.data[opt.uid];

		this.ensureData(opt);

		return opt;
	};

	OnceBinder.unrender = function (opt) {
		opt.type = opt.type || opt.attribute.type;
		if (opt.method = this.unrenderMethod[opt.type]) {
			Global$1.batcher.write(function (opt, data) {

				opt = this.option(opt);
				data = this.getData(opt);
				data = opt.method.call(this, opt, data);

				if (data !== undefined) {
					this.setData(opt, data);
				}

				if (opt.exists === true) {
					this.remove(opt);
				}

			}.bind(this, opt));
		}
	};

	OnceBinder.render = function (opt) {
		opt.type = opt.type || opt.attribute.type;
		if (opt.method = this.renderMethod[opt.type]) {
			Global$1.batcher.write(function (opt, data) {

				opt = this.option(opt);
				data = this.getData(opt);
				data = opt.method.call(this, opt, data);

				if (data !== undefined) {
					this.setData(opt, data);
				}

				if (opt.exists === false) {
					this.add(opt);
				}

			}.bind(this, opt));
		}
	};

	// import UnrenderValue from './unrender/value';
	// import RenderValue from './render/value';
	function Binder (options) {
		this.cache;

		this.uid = options.uid;
		this.element = options.element;
		this.container = options.container;
		this.attribute = options.attribute;

		this.keys = this.attribute.opts;
		this.events = this.container.events;
		this.modifiers = this.container.modifiers;
		this.type = this.attribute.cmds[0] || 'default';

		this.keys.unshift(this.uid);

		this.ensureData();
		this.setup();
		this.render();
	}

	Binder.prototype.ensureData = function () {
		return Global$1.model.ensure(this.keys);
	};

	Binder.prototype.setData = function (data) {
		return Global$1.model.set(this.keys, data);
	};

	Binder.prototype.getData = function () {
		var data = Global$1.model.get(this.keys);
		return this.modifyData(data);
	};

	Binder.prototype.modifyData = function (data) {
		var model = Global$1.model.get([this.uid]);

		for (var i = 0, l = this.attribute.modifiers.length; i < l; i++) {
			data = this.modifiers[this.attribute.modifiers[i]].call(model, data);
		}

		return data;
	};

	Binder.prototype.setupMethods = {
		// value: RenderValue,
		// on: function () {
		// 	var model = Global.model.get([this.uid]);
		// 	this.cache = Utility.getByPath(this.events, this.attribute.path).bind(model);
		// },
		each: function (data) {
			this.variable = this.attribute.cmds[1];
			this.pattern = new RegExp('\\$(' + this.variable + '|index)', 'ig');
			this.clone = this.element.removeChild(this.element.firstElementChild);
			this.clone = this.clone.outerHTML.replace(
				new RegExp('((?:data-)?o-.*?=")' + this.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
				'$1' + this.attribute.path + '.$' + this.variable + '$2'
			);

			return data || [];
		},
		text: function (data) {
			return data === null ? '' : data;
		},
		enable: function (data) {
			return data === false ? false : true;
		},
		disable: function (data) {
			return data === false ? false : true;
		},
		show: function (data) {
			return data === false ? false : true;
		},
		hide: function (data) {
			return data === false ? false : true;
		},
		write: function (data) {
			return data === false ? false : true;
		},
		read: function (data) {
			return data === false ? false : true;
		},
		required: function (data) {
			return data === false ? false : true;
		},
	};

	Binder.prototype.renderMethods = {
		// on: function (data) {
		// 	this.element.removeEventListener(this.attribute.cmds[1], data);
		// 	this.element.addEventListener(this.attribute.cmds[1], data);
		// },
		each: function (data) {
			if (this.element.children.length > data.length) {
				this.element.removeChild(this.element.lastElementChild);
				this.render();
			} else if (this.element.children.length < data.length) {
				this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, this.element.children.length));
				this.render();
			}
		},
		html: function (data) {
			this.element.innerHTML = data;
		},
		css: function (data) {
			if (this.attribute.cmds.length > 1) {
				data = this.attribute.cmds.slice(1).join('-') + ': ' +  data + ';';
			}
			this.element.style.cssText += data;
		},
		class: function (data) {
			var className = this.attribute.cmds.slice(1).join('-');
			this.element.classList.toggle(className, data);
		},
		text: function (data) {
			this.element.innerText = Utility.toText(data);
		},
		enable: function (data) {
			this.element.disabled = !data;
		},
		disable: function (data) {
			this.element.disabled = data;
		},
		show: function (data) {
			this.element.hidden = !data;
		},
		hide: function (data) {
			this.element.hidden = data;
		},
		write: function (data) {
			this.element.readOnly = !data;
		},
		read: function (data) {
			this.element.readOnly = data;
		},
		required: function (data) {
			this.element.required = data;
		},
		selected: function (data) {
			this.element.selectedIndex = data;
		},
		href: function (data) {
			this.element.href = data;
		},
		src: function (data) {
			this.element.src = data;
		},
		alt: function (data) {
			this.element.alt = data;
		},
		default: function () {}
	};

	Binder.prototype.unrenderMethods = {
		// on: function () {
		// 	this.element.removeEventListener(this.attribute.cmds[1], this.cache, false);
		// },
		each: function () {
			Utility.removeChildren(this.element);
		},
		html: function () {
			Utility.removeChildren(this.element);
		},
		css: function () {
			this.element.style.cssText = '';
		},
		class: function () {
			var className = this.attribute.cmds.slice(1).join('-');
			this.element.classList.remove(className);
		},
		text: function () {
			this.element.innerText = '';
		},
		required: function () {
			this.element.required = false;
		},
		href: function () {
			this.element.href = '';
		},
		src: function () {
			this.element.src = '';
		},
		alt: function () {
			this.element.alt = '';
		},
		default: function () {}
	};

	Binder.prototype.setup = function () {
		if (this.type in this.setupMethods) {
			var data = this.getData();
			data = this.setupMethods[this.type].call(this, data);
			this.setData(data);
		}
		return this;
	};

	Binder.prototype.unrender = function () {
		if (this.type in this.unrenderMethods) {
			Global$1.batcher.write(this.unrenderMethods[this.type].bind(this));
		}
		return this;
	};

	Binder.prototype.render = function () {
		if (this.type in this.renderMethods) {
			var data = this.cache || this.getData();
			Global$1.batcher.write(this.renderMethods[this.type].bind(this, data));
		}
		return this;
	};

	var View = {};

	View.data = {};
	View.isSetup = false;
	View.container = document.body;

	View.PREFIX = /(data-)?o-/;
	View.IS_ACCEPT_PATH = /(data-)?o-.*/;
	View.IS_REJECT_PATH = /(data-)?o-value.*/;

	View.createAttribute = function (name, value) {
		var attribute = {};

		attribute.name = name;
		attribute.value = value;

		attribute.path = Utility.binderPath(attribute.value);
		attribute.modifiers = Utility.binderModifiers(attribute.value);

		attribute.keys = attribute.path.split('.');
		attribute.opts = attribute.keys;
		attribute.cmds = attribute.name.replace(this.PREFIX, '').split('-');

		attribute.type = attribute.cmds[0];

		return attribute;
	};

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
				&& attribute.name !== 'o-method'
				&& attribute.name !== 'o-action'
				&& attribute.name !== 'data-o-action'
				&& attribute.name !== 'data-o-method'
				&& attribute.name.indexOf('o-') === 0
				|| attribute.name.indexOf('data-o-') === 0
			) {
				callback.call(this, this.createAttribute(attribute.name, attribute.value));
			}
		}
	};

	View.eachBinder = function (uid, path, callback) {
		var paths = this.data[uid];
		for (var key in paths) {
			if (key.indexOf(path) === 0) {
				var binders = paths[key];
				for (var i = 0, l = binders.length; i < l; i++) {
					var binder = binders[i];
					callback.call(this, binder, i, binders, paths, key);
				}
			}
		}
	};

	View.push = function (uid, path, binder) {

		if (!(uid in this.data)) {
			this.data[uid] = {};
		}

		if (!(path in this.data[uid])) {
			this.data[uid][path] = [];
		}

		this.data[uid][path].push(binder);
	};

	View.eachElement = function (element, callback, container) {

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
				container = Utility.getContainer(container);
			} else if (!container) {
				container = Utility.getContainer(element);
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
				this.eachElement(element.children[i], callback, container);
			}
		}

	};

	View.add = function (addedElement) {
		this.eachElement(addedElement, function (element, container, uid) {
			this.eachAttribute(element, function (attribute) {
				if (
					attribute.cmds[0] === 'on'
					|| attribute.cmds[0] === 'value'
				) {
					OnceBinder.render({
						uid: uid,
						element: element,
						container: container,
						attribute: attribute
					});
				} else {
					this.push(uid, attribute.path, new Binder({
						uid: uid,
						element: element,
						container: container,
						attribute: attribute
					}));
				}
			});
		});
	};

	View.remove = function (removedElement, target) {
		this.eachElement(removedElement, function (element, container, uid) {
			this.eachAttribute(element, function (attribute) {
				if (
					attribute.cmds[0] === 'on'
					|| attribute.cmds[0] === 'value'
				) {
					OnceBinder.unrender({
						uid: uid,
						element: element,
						container: container,
						attribute: attribute
					});
				} else {
					this.eachBinder(uid, attribute.path, function (binder, index, binders, paths, key) {
						if (binder.element === element) {
							binder.unrender();
							binders.splice(index, 1);
							if (binders.length === 0) {
								delete paths[key];
							}
						}
					});
				}
			});
		}, target);
	};

	View.mutation = function (mutations) {
		var i = mutations.length;
		while (i--) {

			var l;
			var target = mutations[i].target;
			var addedNodes = mutations[i].addedNodes;
			var removedNodes = mutations[i].removedNodes;

			l = addedNodes.length;

			while (l--) {
				var addedNode = addedNodes[l];
				if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {
					if (addedNode.isRouterComponent) addedNode.inRouterCache = true;
					this.add(addedNode);
				}
			}

			l = removedNodes.length;

			while (l--) {
				var removedNode = removedNodes[l];
				if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {
					if (removedNode.isRouterComponent) removedNode.inRouterCache = true;
					this.remove(removedNode, target);
				}
			}

		}
	};

	View.setup = function () {
		if (this.isSetup) {
			return;
		} else this.isSetup = true;

		this.add(this.container);
		Global$1.mutations.push(this.mutation.bind(this));
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
		global: {
			enumerable: true,
			value: {}
		},
		clicks: {
			enumerable: true,
			value: []
		},
		inputs: {
			enumerable: true,
			value: []
		},
		changes: {
			enumerable: true,
			value: []
		},
		popstates: {
			enumerable: true,
			value: []
		},
		mutations: {
			enumerable: true,
			value: []
		},
		events: {
			enumerable: true,
			value: { data: {} }
		},
		modifiers: {
			enumerable: true,
			value: { data: {} }
		},
		view: {
			enumerable: true,
			value: View
		},
		model: {
			enumerable: true,
			value: Model
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

				options = (typeof options === 'function' ? options.call(Oxe) : options) || {};

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
					this.clicks.push(this.router.click.bind(this.router));
					this.popstates.push(this.router.popstate.bind(this.router));
					this.router.setup(options.router);
					this.router.run();
				}

			}
		}
	});

	var UnrenderValue = function (opt, data) {
		var i , l;

		if (opt.element.type === 'checkbox') {
			data = false;
			opt.element.checked = data;
			opt.element.value = data;
		} else if (opt.element.nodeName === 'SELECT') {
			data = [];
			var options = opt.element.options;
			for (i = 0, l = options.length; i < l; i++) {
				var option = options[i];
				option.selected = false;
			}
		} else if (opt.element.type === 'radio') {
			var query = 'input[type="radio"][o-value="' + path + '"]';
			var elements = opt.element.parentNode.querySelectorAll(query);
			for (i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				if (i === 0) {
					radio.checked = true;
				} else {
					radio.checked = false;
				}
			}
		} else {
			data = '';
			opt.element.value = data;
		}

		return data;
	};

	var Utility = {};

	Utility.PATH = /\s*\|.*/;
	Utility.PREFIX = /(data-)?o-/;
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

	Utility.formReset = function (form, model) {
		var elements = form.querySelectorAll('[o-value]');
		for (var i = 0, l = elements.length; i < l; i++) {
			UnrenderValue({
				type: 'o-value',
				element: elements[i]
			});
		}
	};

	Utility.toText = function (data) {
		if (typeof data === 'object') {
			 return JSON.stringify(data);
		} else {
			return String(data);
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

	Utility.removeChildren = function (element) {
		var child;
		while (child = element.lastElementChild) {
			element.removeChild(child);
		}
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
		if (element.hasAttribute('o-uid') || element.hasAttribute('data-o-uid')) return element;
		if (element.parentElement) return this.getContainer(element.parentElement);
		console.log(element);
		console.warn('Utility could not find a uid');
	};

	if (window.Oxe) {
		throw new Error('Oxe pre-defined duplicate Oxe scripts');
	}

	Global$1.window.addEventListener('input', function (e) {
		Global$1.inputs.forEach(function (input) {
			input(e);
		});
	}, true);

	Global$1.window.addEventListener('change', function (e) {
		Global$1.changes.forEach(function (change) {
			change(e);
		});
	}, true);

	Global$1.window.addEventListener('click', function (e) {
		Global$1.clicks.forEach(function (click) {
			click(e);
		});
	}, true);

	Global$1.window.addEventListener('popstate', function (e) {
		Global$1.popstates.forEach(function (popstate) {
			popstate(e);
		});
	}, true);

	Global$1.window.addEventListener('reset', function (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');
		if (submit) {
			var container = Utility.getContainer(element);
			var uid = container.getAttribute('o-uid');
			var model = Global$1.model.data[uid];
			Utility.formReset(element, model);
		}
	});

	Global$1.window.addEventListener('submit', function (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');
		if (submit) {
			var container = Utility.getContainer(element);
			var uid = container.getAttribute('o-uid');
			var model = Global$1.model.data[uid];
			var data = Utility.formData(element, model);
			var method = Utility.getByPath(container.events, submit);
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

	new window.MutationObserver(function (mutations) {
		Global$1.mutations.forEach(function (mutation) {
			mutation(mutations);
		});
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
		if (eIndex) Global$1.loader.load({ url: eIndex });
	});

	Global$1.view.setup();
	Global$1.model.setup();

	return Global$1;

})));
