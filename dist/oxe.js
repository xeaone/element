/*
	Name: Oxe
	Version: 1.10.3
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

	var COUNT = 0;

	function Uid () {
		return (Date.now().toString(36) + (COUNT++).toString(36));
	}

	function Component (options) {
		this.currentScript = (document._currentScript || document.currentScript);
		this.setup(options);
	}

	Component.prototype.setup = function (options) {
		options = options || {};
		this.view = options.view;
		this.model = options.model;
		this.events = options.events;
		this.modifiers = options.modifiers;
	};

	Component.prototype._slots = function (element, html) {
		var eSlots = element.querySelectorAll('[slot]');
		for (var i = 0, l = eSlots.length; i < l; i++) {
			var eSlot = eSlots[i];
			var sName = eSlot.getAttribute('slot');
			var tSlot = html.content.querySelector('slot[name='+ sName + ']');
			tSlot.parentNode.replaceChild(eSlot, tSlot);
		}
	};

	Component.prototype._template = function (data) {
		var template;
		if (data.html) {
			template = document.createElement('template');
			template.innerHTML = data.html;
		} else if (data.query) {
			template = self.currentScript.ownerDocument.querySelector(data.query);
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

	Component.prototype._define = function (name, proto) {
		document.registerElement(name, {
			prototype: proto
		});
	};

	Component.prototype.define = function (options) {
		var self = this;

		if (!options.name) {
			throw new Error('Component requires name');
		}

		if (!options.html && !options.query && !options.element) {
			throw new Error('Component requires html, query, or element');
		}

		options.template = self._template(options);
		options.proto = Object.create(HTMLElement.prototype);
		options.proto.attachedCallback = options.attached;
		options.proto.detachedCallback = options.detached;
		options.proto.attributeChangedCallback = options.attributed;

		options.proto.createdCallback = function () {
			var element = this;

			element.uid = Uid();
			element.isBinded = false;
			element.view = self.view.data[element.uid] = {};

			if (options.model) element.model = self.model.data.$set(element.uid, options.model)[element.uid];
			if (options.events) element.events = self.events.data[element.uid] = options.events;
			if (options.modifiers) element.modifiers = self.modifiers.data[element.uid] = options.modifiers;

			// might want to handle default slot
			// might want to overwrite content
			self._slots(element, options.template);

			if (options.shadow) {
				element.createShadowRoot().appendChild(document.importNode(options.template.content, true));
			} else {
				element.appendChild(document.importNode(options.template.content, true));
			}

			if (options.created) {
				options.created.call(element);
			}

		};

		self._define(options.name, options.proto);
	};

	var Utility = {
		// CAMEL: /-(\w)/g,
		// toCamelCase: function (data) {
		// 	return data.replace(this.CAMEL, function (match, next) {
		// 		return next.toUpperCase();
		// 	});
		// },
		createBase: function (base) {
			base = base || '';

			if (base) {
				var element = document.head.querySelector('base');

				if (!element) {
					element = document.createElement('base');
					document.head.insertBefore(element, document.head.firstChild);
				}

				if (base && typeof base === 'string') {
					element.href = base;
				}

				base = element.href;
			}

			return base;
		},
		toText: function (data) {
			if (data === undefined) return ''; // data === null ||
			if (typeof data === 'object') return JSON.stringify(data);
			else return String(data);
		},
		setByPath: function (collection, path, value) {
			var keys = path.split('.');
			var last = keys.length - 1;

			for (var i = 0; i < last; i++) {
				var key = keys[i];
				if (collection[key] === undefined) collection[key] = {};
				collection = collection[key];
			}

			return collection[keys[last]] = value;
		},
		getByPath: function (collection, path) {
			var keys = path.split('.');
			var last = keys.length - 1;

			for (var i = 0; i < last; i++) {
				if (!collection[keys[i]]) return undefined;
				else collection = collection[keys[i]];
			}

			return collection[keys[last]];
		},
		removeChildren: function (element) {
			var self = this, child;
			Oxe.batcher.write(function () {
				while (child = element.lastElementChild) {
					element.removeChild(child);
				}
			});
		},
		joinSlash: function () {
			return Array.prototype.join
				.call(arguments, '/')
				.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
		},
		joinDot: function () {
			return Array.prototype.join
				.call(arguments, '.')
				.replace(/\.{2,}/g, '.');
		},
		getContainer: function getContainer (element) {
			if (element.uid) {
				return element;
			} else {
				if (element !== document.body && element.parentElement) {
					return this.getContainer(element.parentElement);
				} else {
					console.warn('Utility could not find a uid');
					// throw new Error('Utility could not find a uid');
				}
			}
		},
		// each: function (items, method, context) {
		// 	return items.reduce(function (promise, item) {
		// 		return promise.then(function () {
		// 			return method.call(context, item);
		// 		});
		// 	}, Promise.resolve());
		// }
	};

	function Batcher () {
		this.tasks = [];
		this.reads = [];
		this.writes = [];
		this.rafCount = 0;
		this.maxTaskTimeMS = 30;
		this.pending = false;
	}

	// Adds a task to the read batch
	Batcher.prototype.read = function (method, context) {
		var task = context ? method.bind(context) : method;
		this.reads.push(task);
		this.tick();
	};


	// Adds a task to the write batch
	Batcher.prototype.write = function (method, context) {
		var task = context ? method.bind(context) : method;
		this.writes.push(task);
		this.tick();
	};

	// Schedules a new read/write batch if one isn't pending.
	Batcher.prototype.tick = function () {
		var self = this;
		if (!self.pending) {
			self.flush();
		}
	};

	Batcher.prototype.flush = function (callback) {
		var self = this;
		self.pending = true;
		self.run(self.reads, function () {
			self.run(self.writes, function () {
				if (self.reads.length || self.writes.length) {
					self.flush();
				} else {
					self.pending = false;
				}
			});
		});
	};

	Batcher.prototype.run = function (tasks, callback) {
		var self = this;
		if (tasks.length) {
			window.requestAnimationFrame(function (time) {
				var task;

				while (performance.now() - time < self.maxTaskTimeMS) {
					if (task = tasks.shift()) {
						task();
					} else {
						break;
					}
				}

				self.run(tasks, callback);
			});
		} else if (callback) {
			callback();
		}
	};

	// Clears a pending 'read' or 'write' task
	Batcher.prototype.clear = function (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	};

	Batcher.prototype.remove = function (tasks, task) {
		var index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
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

	function Router (options) {
		Events.call(this);

		this.title = '';
		this.cache = {};
		this.route = {};
		this.query = {};
		this.location = {};
		this.isRan = false;
		this.parameters = {};
		this.component = null;

		this.routes = [];
		this.hash = false;
		this.trailing = false;
		this.view = 'o-view';

		this.setup(options);
	}

	Router.prototype = Object.create(Events.prototype);
	Router.prototype.constructor = Router;

	Router.prototype.setup = function (options) {
		options = options || {};
		this.view = options.view === undefined ? this.view: options.view;
		this.hash = options.hash === undefined ? this.hash : options.hash;
		this.routes = options.routes === undefined ? this.routes: options.routes;
		this.loader = options.loader === undefined ? this.loader : options.loader;
		this.batcher = options.batcher === undefined ? this.batcher: options.batcher;
		this.external = options.external === undefined ? this.external: options.external;
		this.container = options.container === undefined ? this.container: options.container;
		this.trailing = options.trailing === undefined ? this.trailing : options.trailing;
		this.base = options.base === undefined ? this.base : Utility.createBase(options.base);
		return this;
	};

	Router.prototype.popstate = function (e) {
		this.navigate(e.state || window.location.href, true);
	};

	Router.prototype.click = function (e) {
		var self = this;

		// if shadow dom use
		var target = e.path ? e.path[0] : e.target;
		var parent = target.parentNode;

		if (self.container) {
			while (parent) {
				if (parent === self.container) break;
				else parent = parent.parentNode;
			}
			if (parent !== self.container) return;
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
		if (self.external &&
			(self.external.constructor.name === 'RegExp' && self.external.test(target.href) ||
			self.external.constructor.name === 'Function' && self.external(target.href) ||
			self.external.constructor.name === 'String' && self.external === target.href)
		) return;

		e.preventDefault();

		if (this.location.href !== target.href) {
			self.navigate(target.href);
		}
	};

	Router.prototype.testPath = function (routePath, userPath) {
		return new RegExp(
			'^' + routePath
			.replace(/{\*}/g, '(?:.*)')
			.replace(/{(\w+)}/g, '([^\/]+)')
			+ '(\/)?$'
		).test(userPath);
	};

	Router.prototype.toParameterObject = function (routePath, userPath) {
		var parameters = {};
		var brackets = /{|}/g;
		var pattern = /{(\w+)}/;
		var userPaths = userPath.split('/');
		var routePaths = routePath.split('/');

		for (var i = 0, l = routePaths.length; i < l; i++) {
			if (pattern.test(routePaths[i])) {
				var name = routePaths[i].replace(brackets, '');
				parameters[name] = userPaths[i];
			}
		}

		return parameters;
	};

	Router.prototype.toQueryString = function (data) {
		if (!data) return;

		var query = '?';

		for (var key in data) {
			query += key + '=' + data[key] + '&';
		}

		return query.slice(-1); // remove trailing &
	};


	Router.prototype.toQueryObject = function (path) {
		if (!path) return;

		var result = {};
		var queries = path.slice(1).split('&');

		for (var i = 0, l = queries.length; i < l; i++) {
			var query = queries[i].split('=');
			result[query[0]] = query[1];
		}

		return result;
	};

	Router.prototype.getLocation = function (path) {
		var location = {};

		location.pathname = decodeURI(path);
		location.origin = window.location.origin;
		location.base = this.base ? this.base : location.origin;

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

	Router.prototype.scroll = function (x, y) {
		window.scroll(x, y);
		return this;
	};

	Router.prototype.back = function () {
		window.history.back();
		return this;
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
		return this;
	};

	Router.prototype.remove = function (path) {
		for (var i = 0, l = this.routes.length; i < l; i++) {
			if (path === this.routes[i].path) {
				this.routes.splice(i, 1);
			}
		}
		return this;
	};

	Router.prototype.get = function (path) {
		for (var i = 0, l = this.routes.length; i < l; i++) {
			var route = this.routes[i];
			if (path === route.path) {
				return route;
			}
		}
		return this;
	};

	Router.prototype.find = function (path) {
		for (var i = 0, l = this.routes.length; i < l; i++) {
			var route = this.routes[i];
			if (this.testPath(route.path, path)) {
				return route;
			}
		}
		return this;
	};

	Router.prototype.addToBatcher = function (route) {
		var self = this, component;

		component = self.cache[route.component];

		if (!component) {

			component = self.cache[route.component] = document.createElement(route.component);

			// NOTE might want to use this to sanitize
			// var script;
			// while (script = component.querySelector('script')) {
			// 	script.parentNode.replaceChild(script);
			// }

			component.inRouterCache = false;
			component.isRouterComponent = true;
		}

		self.batcher.write(function () {
			var child;
			while (child = self.view.firstChild) self.view.removeChild(child);
			self.view.appendChild(component);
			self.scroll(0, 0);
			self.emit('navigated');
		});

		return this;
	};

	Router.prototype.render = function (route) {
		var self = this;

		if (route.title) document.title = route.title;
		if (route.url && !(route.component in self.cache)) {
			self.loader.load(route.url, function () {
				self.addToBatcher(route);
			});
		} else {
			self.addToBatcher(route);
		}
	};

	Router.prototype.navigate = function (data, replace) {
		var self = this;

		if (typeof data === 'string') {
			var path = data; data = {};
			data.location = self.getLocation(path);
			data.route = self.find(data.location.pathname) || {};
			data.query = self.toQueryObject(data.location.search) || {};
			data.parameters = self.toParameterObject(data.route.path || '', data.location.pathname) || {};
			data.component = data.route.component;
			data.title = data.route.title || '';
		}

		self.title = data.title;
		self.route = data.route;
		self.query = data.query;
		self.location = data.location;
		self.parameters = data.parameters;

		window.history[replace ? 'replaceState' : 'pushState'](data, self.title, self.location.href);

		if (self.route.handler) {
			self.route.handler(self.route);
		} else if (self.route.redirect) {
			self.redirect(self.route.redirect);
		} else {
			self.render(self.route);
		}

		return self;
	};

	Router.prototype.run = function () {
		var self = this;

		if (self.isRan) return;
		else self.isRan = true;

		self.view = document.body.querySelector(self.view);

		if (!self.view) {
			throw new Error('Router requires o-view element');
		}

		self.navigate(window.location.href, true);

		return self;
	};

	var Transformer = {
		_innerHandler: function (char) {
			if (char === '\'') return '\\\'';
			if (char === '\"') return '\\"';
			if (char === '\t') return '\\t';
			if (char === '\n') return '\\n';
		},
		_updateString: function (value, index, string) {
			return string.slice(0, index) + value + string.slice(index+1);
		},
		_updateIndex: function (value, index) {
			return index + value.length-1;
		},
		// NOTE: double backtick in strings or regex could possibly causes issues
		template: function (data) {
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
				if (char === '`' && string[index-1] !== '\\' && string[index-1] !== '/') {
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
		}
	};

	function Loader (options) {
		this.loads = [];
		this.files = {};
		this.modules = {};
		this.esm = false;
		this.est = false;
		this.base = Utility.createBase();
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
		this.loads = options.loads || this.loads;
		this.esm = options.esm === undefined ? this.esm : options.esm;
		this.est = options.est === undefined ? this.est : options.est;
		this.base = options.base === undefined ? this.base : Utility.createBase(options.base);
		return this;
	};

	Loader.prototype.getFile = function (data, callback) {
		var self = this;

		// TODO enforce same domain url
		if (!data.url) throw new Error('Loader requires a url');

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
								throw new Error(data.xhr.responseText);
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
							throw new Error(data.xhr.responseText);
						}
					}
				});
				data.xhr.open('GET', data.url);
				data.xhr.send();
			}

			data.status = self.LOADING;
		}
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

	Loader.prototype.normalizeUrl = function (url) {
		if (url.indexOf('.js') === -1) {
			url = url + '.js';
		}
		if (url.indexOf('/') !== 0) {
			url = Utility.joinSlash(this.base.replace(window.location.origin, ''), url);
		}
		return url;
	};

	Loader.prototype.handleImports = function (ast) {
		for (var i = 0, l = ast.imports.length; i < l; i++) {
			ast.imports[i].url = this.normalizeUrl(ast.imports[i].url);
			ast.cooked = ast.cooked.replace(ast.imports[i].raw, 'var ' + ast.imports[i].name + ' = $L.modules[\'' + ast.imports[i].url + '\']');
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

	Loader.prototype.interpret = function (data) {
		data = '\'use strict\';\n\n' + data;
		return (function(d, l, w) { 'use strict';
			return new Function('$L', 'window', d)(l, w);
		}(data, this, window));
	};

	Loader.prototype.load = function (data, callback) {
		var self = this;

		if (data.constructor === String) data = { url: data };
		data.url = self.normalizeUrl(data.url);
		self.files[data.url] = data;

		if (data.url in self.modules) {
			return callback ? callback() : undefined;
		}

		self.getFile(data, function (d) {
			d.text = self.est ? Transformer.template(d.text) : d.text;

			if (self.esm || data.esm) {
				var ast = self.toAst(d.text);

				if (ast.imports.length) {
					var meta = {
						count: 0,
						imports: ast.imports,
						total: ast.imports.length,
						listener: function () {
							if (++meta.count === meta.total) {
								self.modules[d.url] = self.interpret(ast.cooked);
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

	function Observer (data, callback, path) {
		defineProperties(data, callback, path, true);
		return data;
	}

	function defineProperties (data, callback, path, redefine) {
		path = path ? path + '.' : '';
		for (var key in data) defineProperty(data, key, data[key], callback, path, redefine);
		if (data.constructor === Object) overrideObjectMethods(data, callback, path);
		else if (data.constructor === Array) overrideArrayMethods(data, callback, path);
	}

	function defineProperty (data, key, value, callback, path, redefine) {
		var property = Object.getOwnPropertyDescriptor(data, key);

		if (property && property.configurable === false) return;

		var getter = property && property.get;
		var setter = property && property.set;

		// recursive observe child properties
		if (value && typeof value === 'object') defineProperties(value, callback, path + key, redefine);

		// set the property value if getter setter previously defined and redefine is false
		if (getter && setter && !redefine) return setter.call(data, value);
		// if (getter && setter && redefine === false) return setter.call(data, value);

		Object.defineProperty(data, key, {
			enumerable: true,
			configurable: true,
			get: function () {
				return getter ? getter.call(data) : value;
			},
			set: function (newValue) {

				var oldValue = getter ? getter.call(data) : value;

				// set the value with the same value not updated
				if (newValue === oldValue) return;

				if (setter) setter.call(data, newValue);
				else value = newValue;

				//	adds attributes to new valued property getter setter
				if (newValue && typeof newValue === 'object') defineProperties(newValue, callback, path + key, redefine);

				if (callback) callback(newValue, path + key, key, data);
			}
		});
	}

	function overrideObjectMethods (data, callback, path) {
		Object.defineProperties(data, {
			$set: {
				configurable: true,
				value: function (key, value) {
					if (typeof key !== 'string' || value === undefined) return;
					var isNew = !(key in data);
					defineProperty(data, key, value, callback, path);
					if (isNew && callback) callback(data[key], path + key, key, data);
					return data;
				}
			},
			$remove: {
				configurable: true,
				value: function (key) {
					if (typeof key !== 'string') return;
					delete data[key];
					if (callback) callback(undefined, path + key, key, data);
				}
			}
		});
	}

	function overrideArrayMethods (data, callback, path) {
		Object.defineProperties(data, {
			push: {
				configurable: true,
				value: function () {
					if (!arguments.length) return data.length;

					for (var i = 0, l = arguments.length; i < l; i++) {
						defineProperty(data, data.length, arguments[i], callback, path);

						if (callback) {
							callback(data.length, path + 'length', 'length', data);
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
					// for (i, l = result.length; i < l; i++) {
						defineProperty(data, data.length, result[i], callback, path);
						if (callback) {
							callback(data.length, path + 'length', 'length', data);
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
						callback(data.length, path + 'length', 'length', data);
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
						callback(data.length, path + 'length', 'length', data);
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

					// follow spec more or less
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
							defineProperty(data, data.length, result[index++], callback, path);
							if (callback) {
								callback(data.length, path + 'length', 'length', data);
								callback(data[data.length-1], path + (data.length-1), data.length-1, data);
							}
						}
					} else if (i < 0) {
						while (i++) {
							data.length--;
							if (callback) {
								callback(data.length, path + 'length', 'length', data);
								callback(undefined, path + data.length, data.length, data);
							}
						}
					}

					return removed;
				}
			}
		});
	}

	function Model (options) {
		this.isRan = false;
		this.setup(options);
	}

	Model.prototype.setup = function (options) {
		options = options || {};
		this.data = options.data || {};
		this.handler = options.handler;
		this.container = options.container || document.body;
		return this;
	};

	Model.prototype.overwrite = function (data) {
		Observer(
			this.data = data,
			this.handler
		);
	};

	Model.prototype.inputListener = function (element) {
		var value = element.getAttribute('o-value');
		if (value) {
			var i, l;
			var path = value.replace(/(^(\w+\.?)+).*/, '$1');
			var uid = Utility.getContainer(element).uid;

			if (element.type === 'checkbox') {
				element.value = element.checked;
				Utility.setByPath(this.data[uid], path, element.checked);
			} else if (element.nodeName === 'SELECT' && element.multiple) {
				var values = [];
				var options = element.options;
				for (i = 0, l = options.length; i < l; i++) {
					var option = options[i];
					if (option.selected) {
						values.push(option.value);
					}
				}
				Utility.setByPath(this.data[uid], path, values);
			} else if (element.type === 'radio') {
				var elements = element.parentNode.querySelectorAll('input[type="radio"][o-value="' + path + '"]');
				for (i = 0, l = elements.length; i < l; i++) {
					var radio = elements[i];
					if (radio === element) {
						Utility.setByPath(this.data[uid], path, i);
					} else {
						radio.checked = false;
					}
				}
			} else {
				Utility.setByPath(this.data[uid], path, element.value);
			}
		}
	};

	Model.prototype.input = function (e) {
		if (e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.nodeName !== 'SELECT') {
			this.inputListener.call(this, e.target);
		}
	};

	Model.prototype.change = function (e) {
		this.inputListener.call(this, e.target);
	};

	Model.prototype.run = function () {
		var self = this;

		if (self.isRan) return;
		else self.isRan = true;

		Observer(
			self.data,
			self.handler
		);

		Oxe._.inputs.push(this.input.bind(this));
		Oxe._.changes.push(this.change.bind(this));
	};

	var OnceBinder = {
		bind: function (element, attribute, container) {
			if (!this.type[attribute.cmds[0]]) return;

			var model = container.model;
			var type = attribute.cmds[0];
			var key = attribute.parentKey;
			var data = attribute.parentPath ? Utility.getByPath(model, attribute.parentPath) : model;
			var value = this.type[type](element, attribute, data[key]);

			if (data[key] === undefined) {
				data.$set(key, value);
			} else {
				// FIXME selects not setting defaults
				if (value.constructor === Array) {
					data[key].push.apply(null, value);
				}
			}
		},
		type: {
			value: function (element, attribute, data) {
				var i, l;
				if (element.type === 'checkbox') {
					data = !data ? false : data;
					element.value = element.checked = data;
				} else if (element.nodeName === 'SELECT') {
					data = element.multiple ? [] : data;
					var options = element.options;
					for (i = 0, l = options.length; i < l; i++) {
						var option = options[i];
						if (option.selected) {
							if (element.multiple) {
								data.push(option.value);
							} else {
								data = option.value;
								break;
							}
						}
					}
				} else if (element.type === 'radio') {
					var elements = element.parentNode.querySelectorAll('input[type="radio"][o-value="' + attribute.value + '"]');
					for (i = 0, l = elements.length; i < l; i++) {
						var radio = elements[i];
						radio.checked = i === data;
					}
				} else {
					element.value = data;
				}
				return data;
			}
		}
	};

	// TODO sanitize input/output

	function Binder (options) {
		this.element = options.element;
		this.container = options.container;
		this.attribute = options.attribute;

		this.view = this.container.view;
		this.model = this.container.model;
		this.events = this.container.events;
		this.modifiers = this.container.modifiers;
		this.type = this.attribute.cmds[0] || 'default';

		if (this.type === 'on') {
			this.data = Utility.getByPath(this.events, this.attribute.path).bind(this.model);
		} else {
			Object.defineProperty(this, 'data', {
				enumerable: true,
				configurable: false,
				get: function () {
					var data = Utility.getByPath(this.model, this.attribute.path);
					if (data === undefined) return;
					data = this.modify(data);
					return data;
				}
			});

			this.setup();
		}

		this.render();
	}

	Binder.prototype.modify = function (data) {
		for (var i = 0, l = this.attribute.modifiers.length; i < l; i++) {
			data = this.modifiers[this.attribute.modifiers[i]].call(this.model, data);
			if (data === undefined) throw new Error('modifier value is undefined');
		}
		return data;
	};

	Binder.prototype.setupMethods = {
		each: function () {
			this.count = 0;
			this.variable = this.attribute.cmds[1];
			this.pattern = new RegExp('\\$(' + this.variable + '|index)', 'ig');
			this.clone = this.element.removeChild(this.element.firstElementChild);
			this.clone = this.clone.outerHTML.replace(
				new RegExp('((?:data-)?o-.*?=")' + this.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
				'$1' + this.attribute.path + '.$' + this.variable + '$2'
			);
		}
	};

	Binder.prototype.renderMethods = {
		on: function (data) {
			this.element.removeEventListener(this.attribute.cmds[1], data);
			this.element.addEventListener(this.attribute.cmds[1], data);
		},
		each: function (data) {
			if (this.element.children.length > data.length) {
			// if (this.count > data.length) {
				this.element.removeChild(this.element.lastElementChild);
				// this.element.removeChild(this.element.lastElementChild);
				// this.count--;
				this.render();
			} else if (this.element.children.length < data.length) {
			// } else if (this.count < data.length) {
				this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, this.element.children.length));
				// this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, this.count));
				// this.count++;
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
		default: function () { //data
			// Utility.setByPath(this.element, Utility.toCamelCase(this.attribute.cmds), data);
		}
	};

	Binder.prototype.unrenderMethods = {
		on: function () {
			this.element.removeEventListener(this.attribute.cmds[1], this.data, false);
		},
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
		href: function () {
			this.element.href = '';
		},
		src: function () {
			this.element.src = '';
		},
		alt: function () {
			this.element.alt = '';
		},
		default: function () {

		}
	};

	Binder.prototype.setup = function () {
		if (this.type in this.setupMethods) {
			this.setupMethods[this.type].call(this, this.data);
			// INDEX.batcher.write(this.setupMethods[this.type].bind(this, this.data));
		}
	};

	Binder.prototype.unrender = function () {
		if (this.type in this.unrenderMethods) {
			Oxe.batcher.write(this.unrenderMethods[this.type].bind(this, this.data));
		}
		return this;
	};

	Binder.prototype.render = function () {
		if (this.type in this.renderMethods) {
			Oxe.batcher.write(this.renderMethods[this.type].bind(this, this.data));
		}
		return this;
	};

	function View (options) {
		this.isRan = false;
		this.setup(options);
	}

	View.prototype.setup = function (options) {
		options = options || {};
		this.data = options.data || {};
		this.handler = options.handler;
		this.container = options.container || document.body;
		return this;
	};

	View.prototype.PATH = /\s?\|.*/;
	View.prototype.PARENT_KEY = /^.*\./;
	View.prototype.PARENT_PATH = /\.\w+$|^\w+$/;
	View.prototype.PREFIX = /(data-)?o-/;
	View.prototype.MODIFIERS = /^.*?\|\s?/;
	View.prototype.IS_ACCEPT_PATH = /(data-)?o-.*/;
	View.prototype.IS_REJECT_PATH = /(data-)?o-value.*/;

	View.prototype.isOnce = function (attribute) {
		return attribute === 'data-o-value' || attribute === 'o-value';
	};

	View.prototype.isSkip = function (node) {
		return node.nodeName === 'J-VIEW'
			|| node.hasAttribute('o-view')
			|| node.hasAttribute('data-o-view');
	};

	View.prototype.isSkipChildren = function (node) {
		return node.nodeName === 'IFRAME'
			|| node.nodeName === 'OBJECT'
			|| node.nodeName === 'SCRIPT'
			|| node.nodeName === 'STYLE'
			|| node.nodeName === 'SVG';
	};

	View.prototype.isAccept = function (node) {
		var attributes = node.attributes;
		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];
			if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {
				return true;
			}
		}
		return false;
	};

	View.prototype.isAcceptAttribute = function (attribute) {
		return attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0;
	};

	View.prototype.createAttribute = function (name, value) {
		var attribute = {};

		attribute.name = name;
		attribute.value = value;
		attribute.path = attribute.value.replace(this.PATH, '');

		attribute.opts = attribute.path.split('.');
		attribute.cmds = attribute.name.replace(this.PREFIX, '').split('-');

		attribute.parentKey = attribute.path.replace(this.PARENT_KEY, '');
		attribute.parentPath = attribute.path.replace(this.PARENT_PATH, '');
		attribute.viewPath = attribute.cmds[0] === 'each' ? attribute.path + '.length' : attribute.path;

		attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(this.MODIFIERS, '').split(' ');

		return attribute;
	};

	View.prototype.eachAttribute = function (attributes, callback) {
		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];
			if (this.isAcceptAttribute(attribute)) {
				callback(this.createAttribute(attribute.name, attribute.value));
			}
		}
	};

	View.prototype.eachAttributeAcceptPath = function (attributes, callback) {
		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];
			if (!this.IS_REJECT_PATH.test(attribute.name) && this.IS_ACCEPT_PATH.test(attribute.name)) {
				callback(attribute.value.replace(this.PATH, ''));
			}
		}
	};

	View.prototype.eachElement = function (element, container, callback) {
		container = element.uid ? element : container;

		if (this.isAccept(element) && !this.isSkip(element)) {
			callback(element, container);
		}

		if (!this.isSkipChildren(element)) {
			for (element = element.firstElementChild; element; element = element.nextElementSibling) {
				this.eachElement(element, container, callback);
			}
		}
	};

	View.prototype.eachBinder = function (uid, path, callback) {
		var paths = this.data[uid];
		for (var key in paths) {
			if (key.indexOf(path) === 0) {
				var binders = paths[key];
				for (var i = 0; i < binders.length; i++) {
					callback(binders[i], i, binders, paths, key);
				}
			}
		}
	};

	View.prototype.has = function (uid, path, element) {
		if (!(uid in this.data) || !(path in this.data[uid])) return false;
		var binders = this.data[uid][path];
		for (var i = 0, l = binders.length; i < l; i++) {
			if (binders[i].element === element) return true;
		}
		return false;
	};

	View.prototype.push = function (uid, path, element, container, attribute) {
		if (!(uid in this.data)) this.data[uid] = {};
		if (!(path in this.data[uid])) this.data[uid][path] = [];
		this.data[uid][path].push(new Binder({
			element: element,
			container: container,
			attribute: attribute
		}));
	};

	View.prototype.add = function (addedNode, containerNode) {
		var self = this;
		self.eachElement(addedNode, containerNode, function (element, container) {
			self.eachAttribute(element.attributes, function (attribute) {
				if (self.isOnce(attribute.name)) {
					OnceBinder.bind(element, attribute, container);
				} else {
					if (container && container.uid) { // i dont like this check
						var path = attribute.viewPath;
						if (!self.has(container.uid, path, element)) {
							self.push(container.uid, path, element, container, attribute);
						}
					}
				}
			});
		});
	};

	View.prototype.remove = function (removedNode, containerNode) {
		var self = this;
		self.eachElement(removedNode, containerNode, function (element, container) {
			if (container && container.uid) { // i dont like this check
				self.eachAttributeAcceptPath(element.attributes, function (path) {
					self.eachBinder(container.uid, path, function (binder, index, binders, paths, key) {
						if (binder.element === element) {
							binder.unrender();
							binders.splice(index, 1);
							if (binders.length === 0) delete paths[key];
						}
					});
				});
			}
		});
	};

	View.prototype.observer = function (mutations) {
			var i = mutations.length;
			while (i--) {
				this.handler(mutations[i].addedNodes, mutations[i].removedNodes, mutations[i].target);
			}
	};

	View.prototype.run = function () {
		if (this.isRan) return;
		else this.isRan = true;

		this.add(this.container);
		Oxe._.observers.push(this.observer.bind(this));
	};

	function Http (opt) {
		this.setup(opt);
	}

	Http.prototype.setup = function (opt) {
		opt = opt || {};
		// TODO add default response type option
		this.request = opt.request === undefined ? this.request : opt.request;
		this.response = opt.response === undefined ? this.response : opt.response;
		this.auth = opt.auth || false;
		return this;
	};

	Http.prototype.mime = {
		html: 'text/html',
		text: 'text/plain',
		xml: 'application/xml, text/xml',
		json: 'application/json, text/javascript',
		urlencoded: 'application/x-www-form-urlencoded',
		script: 'text/javascript, application/javascript, application/x-javascript'
	};

	Http.prototype.serialize = function (data) {
		var string = '';

		for (var name in data) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return string;
	};

	Http.prototype.fetch = function (opt) {
		var self = this;
		var result = {};
		var xhr = new XMLHttpRequest();

		opt = opt || {};
		opt.headers = {};
		opt.url = opt.url ? opt.url : window.location.href;
		opt.method = opt.method ? opt.method.toUpperCase() : 'GET';

		xhr.open(opt.method, opt.url, true, opt.username, opt.password);

		if (opt.contentType) {
			switch (opt.contentType) {
				case 'xml': opt.contentType = self.mime.xm; break;
				case 'html': opt.contentType = self.mime.html; break;
				case 'text': opt.contentType = self.mime.text; break;
				case 'json': opt.contentType = self.mime.json; break;
				case 'script': opt.contentType = self.mime.script; break;
			}
		}

		if (opt.acceptType) {
			switch (opt.acceptType) {
				case 'xml': opt.acceptType = self.mime.xml; break;
				case 'html': opt.acceptType = self.mime.html; break;
				case 'text': opt.acceptType = self.mime.text; break;
				case 'json': opt.acceptType = self.mime.json; break;
				case 'script': opt.acceptType = self.mime.script; break;
			}
		}

		if (opt.data) {
			if (opt.method === 'GET') {
				opt.data = self.serialize(opt.data);
				opt.url = opt.url + '?' + opt.data;
			}
			else if (!opt.contentType) opt.contentType = self.mime.urlencoded;
			else if (opt.contentType === self.mime.json) opt.data = JSON.stringify(opt.data);
			else if (opt.contentType === self.mime.urlencoded) opt.data = self.serialize(opt.data);
		}

		if (opt.mimeType) xhr.overrideMimeType(opt.mimeType);
		if (opt.responseType) xhr.responseType = opt.responseType;
		if (opt.withCredentials) xhr.withCredentials = opt.withCredentials;

		if (opt.acceptType) opt.headers['Accept'] = opt.acceptType;
		if (opt.contentType) opt.headers['Content-Type'] = opt.contentType;

		if (opt.cache) opt.headers.cache = true;
		else opt.cache = false;

		if (opt.headers) {
			for (var name in opt.headers) {
				xhr.setRequestHeader(name, opt.headers[name]);
			}
		}

		result.xhr = xhr;
		result.opt = opt;
		result.data = opt.data;

		if (self.auth) Oxe.auth.modify(xhr);
		if (self.request && self.request(result) === false) return;

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {

				result.opt = opt;
				result.xhr = xhr;
				result.statusCode = xhr.status;
				result.statusText = xhr.statusText;
				result.data = xhr.response || xhr.responseText;

				// NOTE this is added for IE10-11 support http://caniuse.com/#search=xhr2
				if (opt.responseType === 'json' && typeof result.data !== 'object') result.data = JSON.parse(xhr.responseText);

				if (xhr.status === 401 || xhr.status === 403) {
					if (self.auth) {
						if (Oxe.auth.failure) {
							return Oxe.auth.failure(result);
						} else {
							throw new Error('auth enabled but missing unauthorized handler');
						}
					}
				}

				if (self.response && self.response(result) === false) return;

				if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
					if (opt.success) {
						opt.success(result);
					}
				} else {
					if (opt.error) {
						opt.error(result);
					}
				}

			}
		};

		xhr.send(opt.method === 'GET' ? null : opt.data);

	};

	// 401 Unauthorized
	// 403 Forbidden
	// scheme: Basic, Bearer, Digest, HOBA, Mutual, AWS4-HMAC-SHA256

	// NOTE add cookie type
	// NOTE add preflight to router

	function Auth (options) {
		this.setup(options);
	}

	Auth.prototype.setup = function (options) {
		var creds;

		options = options || {};

		this._ = {};
		this._.failure = options.failure;

		this.scheme = options.scheme || 'Basic';
		this.type = options.type ? 'sessionStorage' : options.type + 'Storage';

		Object.defineProperty(this, 'creds', {
			enumerable: true,
			// configurable: true,
			get: function () {
				return creds = creds ? creds : window[this.type].getItem('creds');
			},
			set: function (data) {
				return creds = window[this.type].setItem('creds', data);
			}
		});
	};

	Auth.prototype.setCreds = function (creds) {
		return window[this.type].setItem('creds', creds);
	};

	Auth.prototype.getCreds = function () {
		return window[this.type].getItem('creds');
	};

	Auth.prototype.modify = function (xhr) {
		xhr.setRequestHeader('Authorization', this.scheme + ' ' + this.creds);
	};

	Auth.prototype.failure = function (data) {
		this._.failure(data);
	};

	// Resources: https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication

	var Oxe = {};

	Oxe.win = window;
	Oxe.doc = document;
	Oxe.body = document.body;
	Oxe.head = document.head;
	Oxe.currentScript = (document._currentScript || document.currentScript);

	Oxe.global = {};
	Oxe.location = {};
	Oxe.events = { data: {} };
	Oxe.modifiers = { data: {} };
	Oxe.oView = document.body.querySelector('o-view');

	Oxe.auth = new Auth();
	Oxe.http = new Http();
	Oxe.view = new View();
	Oxe.model = new Model();
	Oxe.loader = new Loader();
	Oxe.router = new Router();
	Oxe.batcher = new Batcher();
	Oxe.component = new Component();

	Oxe._ = {};
	Oxe._.clicks = [];
	Oxe._.inputs = [];
	Oxe._.changes = [];
	Oxe._.popstates = [];
	Oxe._.observers = [];

	Oxe.script = function () {
		return (document._currentScript || document.currentScript);
	};

	Oxe.document = function () {
		return (document._currentScript || document.currentScript).ownerDocument;
	};

	Oxe.element = function (name) {
		return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
	};

	Oxe.query = function (query) {
		return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
	};

	Oxe.setup = function (options) {
		if (this.isSetup) return;
		else this.isSetup = true;

		options = (typeof options === 'function' ? options.call(Oxe) : options) || {};

		if (options.auth) {
			Oxe.auth.setup(options.auth);
		}

		if (options.http) {
			Oxe.http.setup(options.http);
		}

		if (options.loader) {
			Oxe.loader.setup(options.loader);
			Oxe.loader.run();
		}

		if (options.router) {
			Oxe._.clicks.push(Oxe.router.click.bind(Oxe.router));
			Oxe._.popstates.push(Oxe.router.popstate.bind(Oxe.router));
			options.router.loader = Oxe.loader;
			options.router.batcher = Oxe.batcher;
			Oxe.router.setup(options.router);
			Oxe.router.run();
		}

		return this;
	};

	Oxe._.viewHandler = function (addedNodes, removedNodes, parentNode) {
		var addedNode, removedNode, containerNode, i;

		i = addedNodes.length;
		while (i--) {
			addedNode = addedNodes[i];
			if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {
				if (addedNode.isRouterComponent) addedNode.inRouterCache = true;
				containerNode = addedNode.uid || Utility.getContainer(parentNode);
				Oxe.view.add(addedNode, containerNode);
			}
		}

		i = removedNodes.length;
		while (i--) {
			removedNode = removedNodes[i];
			if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {
				if (removedNode.isRouterComponent) removedNode.inRouterCache = true;
				containerNode = removedNode.uid || Utility.getContainer(parentNode);
				Oxe.view.remove(removedNode, containerNode);
			}
		}

	};

	Oxe._.modelHandler = function (data, path) {
		var paths = path.split('.');
		var uid = paths[0];
		var pattern = paths.slice(1).join('.');
		var type = data === undefined ? 'unrender' : 'render';
		Oxe.view.eachBinder(uid, pattern, function (binder) {
			binder[type]();
		});
	};

	Oxe._.input = Oxe.win.addEventListener('input', function (e) {
		Oxe._.inputs.forEach(function (input) {
			input(e);
		});
	}, true);

	Oxe._.change = Oxe.win.addEventListener('change', function (e) {
		Oxe._.changes.forEach(function (change) {
			change(e);
		});
	}, true);

	Oxe._.click = Oxe.win.addEventListener('click', function (e) {
		Oxe._.clicks.forEach(function (click) {
			click(e);
		});
	}, true);

	Oxe._.popstate = Oxe.win.addEventListener('popstate', function (e) {
		Oxe._.popstates.forEach(function (popstate) {
			popstate(e);
		});
	}, true);

	Oxe._.observer = new window.MutationObserver(function (mutations) {
		Oxe._.observers.forEach(function (observer) {
			observer(mutations);
		});
	}).observe(Oxe.body, {
		childList: true,
		subtree: true
	});

	Oxe.component.setup({
		view: Oxe.view,
		model: Oxe.model,
		events: Oxe.events,
		modifiers: Oxe.modifiers
	});

	Oxe.view.setup({
		handler: Oxe._.viewHandler
	});

	Oxe.model.setup({
		handler: Oxe._.modelHandler
	});

	Oxe.view.run();
	Oxe.model.run();

	window.requestAnimationFrame(function () {
		var eStyle = Oxe.doc.createElement('style');
		var sStyle = Oxe.doc.createTextNode('o-view, o-view > :first-child { display: block; }');
		eStyle.setAttribute('title', 'Oxe');
		eStyle.setAttribute('type', 'text/css');
		eStyle.appendChild(sStyle);
		Oxe.head.appendChild(eStyle);
		Oxe.doc.registerElement('o-view', { prototype: Object.create(HTMLElement.prototype) });
		var eIndex = Oxe.currentScript.getAttribute('o-index');
		if (eIndex) Oxe.loader.load({ url: eIndex });
	});

	return Oxe;

})));
