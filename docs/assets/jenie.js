var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (global, factory) {
	(typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define('Jenie', factory) : global.Jenie = factory();
})(this, function () {
	'use strict';

	var counter = 0;

	function Uid() {
		return Date.now().toString(36) + (counter++).toString(36);
	}

	function Component(options) {
		var self = this;

		options = options || {};

		if (!options.name) {
			throw new Error('Component requires name');
		}

		if (!options.html && !options.query && !options.element) {
			throw new Error('Component requires html, query, or element');
		}

		self.name = options.name;
		self.view = options.view;
		self.model = options.model;
		self.style = options.style;
		self.events = options.events;
		self.global = options.global;
		self.shadow = options.shadow;
		self.modifiers = options.modifiers;
		self.currentScript = document._currentScript || document.currentScript;

		self.template = self.createTemplate(options);

		self.proto = Object.create(HTMLElement.prototype);
		self.proto.attachedCallback = options.attached;
		self.proto.detachedCallback = options.detached;
		self.proto.attributeChangedCallback = options.attributed;

		self.proto.createdCallback = function () {
			var element = this;

			element.uid = Uid();
			element.isBinded = false;

			// add to view
			self.global.view.data[element.uid] = {};
			element.view = self.global.view.data[element.uid];

			if (self.model) element.model = self.global.model.data.$set(element.uid, self.model)[element.uid];
			if (self.events) element.events = self.global.events.data[element.uid] = self.events;
			if (self.modifiers) element.modifiers = self.global.modifiers.data[element.uid] = self.modifiers;

			// might want to handle default slot
			// might want to overwrite content
			self.replaceSlots(element, self.template);

			if (self.shadow) {
				element.createShadowRoot().appendChild(document.importNode(self.template.content, true));
			} else {
				element.appendChild(document.importNode(self.template.content, true));
			}

			if (options.created) options.created.call(element);
		};

		self.define();
	}

	Component.prototype.replaceSlots = function (element, html) {
		var eSlots = element.querySelectorAll('[slot]');
		for (var i = 0, l = eSlots.length; i < l; i++) {
			var eSlot = eSlots[i];
			var sName = eSlot.getAttribute('slot');
			var tSlot = html.content.querySelector('slot[name=' + sName + ']');
			tSlot.parentNode.replaceChild(eSlot, tSlot);
		}
	};

	Component.prototype.createTemplate = function (options) {
		var template;
		if (options.html) {
			template = document.createElement('template');
			template.innerHTML = options.html;
		} else if (options.query) {
			template = self.currentScript.ownerDocument.querySelector(options.query);
			if (template.nodeType !== 'TEMPLATE') {
				template = document.createElement('template');
				template.content.appendChild(options.element);
			}
		} else if (options.element) {
			if (options.element.nodeType === 'TEMPLATE') {
				template = options.element;
			} else {
				template = document.createElement('template');
				template.content.appendChild(options.element);
			}
		}
		// else if (options.url) {
		//
		// }
		return template;
	};

	Component.prototype.define = function () {
		document.registerElement(this.name, {
			prototype: this.proto
		});
	};

	var Utility = {
		CAMEL: /-(\w)/g,
		// KEBAB: /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,
		// toKebabCase: function (data) {
		// 	return data.replace(this.KEBAB, function (match) {
		// 		return '-' + match.toLowerCase();
		// 	});
		// },
		toCamelCase: function toCamelCase(data) {
			// if (data.constructor.name === 'Array') data = data.join('-');
			return data.replace(this.CAMEL, function (match, next) {
				return next.toUpperCase();
			});
		},
		toText: function toText(data) {
			if (data === null || data === undefined) return '';
			if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') return JSON.stringify(data);else return String(data);
		},
		setByPath: function setByPath(collection, path, value) {
			var keys = path.split('.');
			var last = keys.length - 1;

			for (var i = 0; i < last; i++) {
				var key = keys[i];
				if (collection[key] === undefined) collection[key] = {};
				collection = collection[key];
			}

			return collection[keys[last]] = value;
		},
		getByPath: function getByPath(collection, path) {
			var keys = path.split('.');
			var last = keys.length - 1;

			for (var i = 0; i < last; i++) {
				if (!collection[keys[i]]) return undefined;else collection = collection[keys[i]];
			}

			return collection[keys[last]];
		},
		removeChildren: function removeChildren(element) {
			while (element.lastElementChild) {
				element.removeChild(element.lastElementChild);
			}
		},
		joinSlash: function joinSlash() {
			return Array.prototype.join.call(arguments, '/').replace(/(https?:\/\/)|(\/)+/g, '$1$2');
		},
		joinDot: function joinDot() {
			return Array.prototype.join.call(arguments, '.').replace(/\.{2,}/g, '.');
		},
		getContainer: function getContainer(element) {
			if (!element.uid) {
				if (element !== document.body) {
					return this.getContainer(element.parentElement);
				}
				// else { throw new Error('could not find a uid') }
			} else {
				return element;
			}
		}
		// each: function (items, method, context) {
		// 	return items.reduce(function (promise, item) {
		// 		return promise.then(function () {
		// 			return method.call(context, item);
		// 		});
		// 	}, Promise.resolve());
		// }
	};

	function Events() {
		this.events = {};
	}

	Events.prototype.on = function (name, listener) {
		if (_typeof(this.events[name]) !== 'object') {
			this.events[name] = [];
		}

		this.events[name].push(listener);
	};

	Events.prototype.off = function (name, listener) {
		if (_typeof(this.events[name]) === 'object') {
			var index = this.events[name].indexOf(listener);

			if (index > -1) {
				this.events[name].splice(index, 1);
			}
		}
	};

	Events.prototype.once = function (name, listener) {
		this.on(name, function f() {
			this.off(name, f);
			listener.apply(this, arguments);
		});
	};

	Events.prototype.emit = function (name) {
		if (_typeof(this.events[name]) === 'object') {
			var listeners = this.events[name].slice();
			var args = [].slice.call(arguments, 1);

			for (var i = 0, l = listeners.length; i < l; i++) {
				listeners[i].apply(this, args);
			}
		}
	};

	function Router(options) {
		Events.call(this);
		this.state = {};
		this.cache = {};
		this.location = {};
		this.isRan = false;
		this.setup(options);
	}

	Router.prototype = Object.create(Events.prototype);
	Router.prototype.constructor = Router;

	Router.prototype.setup = function (options) {
		options = options || {};
		this.external = options.external;
		this.routes = options.routes || [];
		this.view = options.view || 'j-view';
		this.base = this.createBase(options.base);
		this.container = options.container || document.body;
		this.hash = options.hash === undefined ? false : options.hash;
		this.trailing = options.trailing === undefined ? false : options.trailing;
		return this;
	};

	Router.prototype.createBase = function (base) {
		base = base || '';

		if (base) {
			var element = document.head.querySelector('base');

			if (!element) {
				element = document.createElement('base');
				document.head.insertBefore(element, document.head.firstChild);
			}

			if (typeof base === 'string') {
				element.href = base;
			}

			base = element.href;
		}

		return base;
	};

	Router.prototype.testPath = function (routePath, userPath) {
		return new RegExp('^' + routePath.replace(/{\*}/g, '(?:.*)').replace(/{(\w+)}/g, '([^\/]+)') + '(\/)?$').test(userPath);
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
			if (this.testPath(route.path, path)) {
				return route;
			}
		}
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
			location.href = Utility.joinSlash(location.base, '/', location.pathname);
		}

		location.href += location.search;
		location.href += location.hash;

		return location;
	};

	Router.prototype.render = function (route) {
		Utility.removeChildren(this.view);

		var component = this.cache[route.component];
		if (!component) {
			component = this.cache[route.component] = document.createElement(route.component);
			component.inRouterCache = false;
			component.isRouterComponent = true;
		}

		this.view.appendChild(component);

		this.scroll(0, 0);
		this.emit('navigated');
	};

	Router.prototype.handler = function (callback) {
		this._handler = callback;
	};

	Router.prototype.navigate = function (data, replace) {

		if (typeof data === 'string') {
			this.state.location = this.getLocation(data);
			this.state.route = this.find(this.state.location.pathname) || {};
			this.state.query = this.toQueryObject(this.state.location.search) || {};
			this.state.parameters = this.toParameterObject(this.state.route.path || '', this.state.location.pathname) || {};
			this.state.title = this.state.route.title || '';
			this.location = this.state.location;
		} else {
			this.state = data;
		}

		window.history[replace ? 'replaceState' : 'pushState'](this.state, this.state.title, this.state.location.href);

		// if (this.state.route.redirect) {
		// 	this.redirect(this.state.route.redirect);
		// } else {
		// 	this.render(this.state.route, function () {
		// 		if (!replace) this.scroll(0, 0);
		// 		this.emit('navigated');
		// 	});
		// }

		if (this.state.route.handler) {
			this.state.route.handler(this.state.route);
		} else if (this.state.route.redirect) {
			this.redirect(this.state.route.redirect);
		} else {
			this._handler(this.state.route);
		}
	};

	Router.prototype.popstate = function (e) {
		this.navigate(e.state || window.location.href, true);
	};

	Router.prototype.click = function (e) {
		var self = this;

		if (e.metaKey || e.ctrlKey || e.shiftKey) return;

		// ensure target is anchor tag use shadow dom if available
		var target = e.path ? e.path[0] : e.target;
		while (target && 'A' !== target.nodeName) {
			target = target.parentNode;
		}if (!target || 'A' !== target.nodeName) return;
		e.preventDefault();

		// if external is true then default action
		if (self.external && (self.external.constructor.name === 'RegExp' && self.external.test(target.href) || self.external.constructor.name === 'Function' && self.external(target.href) || self.external.constructor.name === 'String' && self.external === target.href)) return;

		// check non acceptable attributes and href
		if (target.hasAttribute('download') || target.hasAttribute('external') ||
		// target.hasAttribute('target') ||
		target.href.indexOf('mailto:') !== -1 || target.href.indexOf('file:') !== -1 || target.href.indexOf('tel:') !== -1 || target.href.indexOf('ftp:') !== -1) return;

		if (this.state.location.href === target.href) return;
		self.navigate(target.href);
	};

	Router.prototype.run = function () {
		if (this.isRan) return;else this.isRan = true;
		this.view = this.container.querySelector(this.view);
		if (!this.view) throw new Error('Router requires j-view element');
		this.container.addEventListener('click', this.click.bind(this));
		window.addEventListener('popstate', this.popstate.bind(this));
		this.navigate(window.location.href, true);
	};

	function Loader(options) {
		this.loads = [];
		this.files = {};
		this.modules = {};
		this.setup(options);
	}

	Loader.prototype.LOADED = 3;
	Loader.prototype.LOADING = 2;

	Loader.prototype.patterns = {
		imps: /import\s+\w+\s+from\s+(?:'|").*?(?:'|")/g,
		imp: /import\s+(\w+)\s+from\s+(?:'|")(.*?)(?:'|")/,
		exps: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/g,
		exp: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/
	};

	Loader.prototype.setup = function (options) {
		options = options || {};
		this.esm = options.esm || false;
		this.loads = options.loads || [];
		this.base = this.createBase(options.base);
		return this;
	};

	Loader.prototype.createBase = function (base) {
		base = base || '';

		if (base) {
			var element = document.head.querySelector('base');

			if (!element) {
				element = document.createElement('base');
				document.head.insertBefore(element, document.head.firstChild);
			}

			if (typeof base === 'string') {
				element.href = base;
			}

			base = element.href;
		}

		return base;
	};

	Loader.prototype.getFile = function (data, callback) {
		if (!data.url) throw new Error('Loader requires a url');
		var self = this;

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

	Loader.prototype.interpret = function (data) {
		return function (d, l, w) {
			'use strict';

			return new Function('Loader', 'window', d)(l, w);
		}(data, this, window);
	};

	Loader.prototype.getImports = function (data) {
		var imp,
		    imports = [];
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
			ast.cooked = ast.cooked.replace(ast.imports[i].raw, 'var ' + ast.imports[i].name + ' = Loader.modules[\'' + ast.imports[i].url + '\']');
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

	Loader.prototype.load = function (data, callback) {
		var self = this;

		if (data.constructor === String) data = { url: data };
		data.url = self.normalizeUrl(data.url);
		self.files[data.url] = data;

		self.getFile(data, function (d) {
			var ast = self.toAst(d.text);

			if (self.esm || data.esm) {
				if (ast.imports.length) {
					var meta = {
						count: 0,
						imports: ast.imports,
						total: ast.imports.length,
						listener: function listener() {
							if (++meta.count === meta.total) {
								meta.interpreted = self.interpret(ast.cooked);
								if (data.execute) meta.interpreted();
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

	function Observer(data, callback, path) {
		defineProperties(data, callback, path, true);
		return data;
	}

	function defineProperties(data, callback, path, redefine) {
		path = path ? path + '.' : '';
		for (var key in data) {
			defineProperty(data, key, data[key], callback, path, redefine);
		}if (data.constructor === Object) overrideObjectMethods(data, callback, path);else if (data.constructor === Array) overrideArrayMethods(data, callback, path);
	}

	function defineProperty(data, key, value, callback, path, redefine) {
		var property = Object.getOwnPropertyDescriptor(data, key);

		if (property && property.configurable === false) return;

		var getter = property && property.get;
		var setter = property && property.set;

		// recursive observe child properties
		if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') defineProperties(value, callback, path + key, redefine);

		// set the property value if getter setter previously defined and redefine is not true
		if (getter && setter && redefine === false) return setter.call(data, value);

		Object.defineProperty(data, key, {
			enumerable: true,
			configurable: true,
			get: function get() {
				return getter ? getter.call(data) : value;
			},
			set: function set(newValue) {
				var oldValue = getter ? getter.call(data) : value;

				// set the value with the same value not updated
				if (newValue === oldValue) return;

				if (setter) setter.call(data, newValue);else value = newValue;

				//	adds attributes to new valued property getter setter
				if (newValue && (typeof newValue === 'undefined' ? 'undefined' : _typeof(newValue)) === 'object') defineProperties(newValue, callback, path + key, redefine);

				if (callback) callback(newValue, path + key, key, data);
			}
		});
	}

	function overrideObjectMethods(data, callback, path) {
		Object.defineProperties(data, {
			$set: {
				configurable: true,
				value: function value(key, _value) {
					if (typeof key !== 'string' || _value === undefined) return;
					var isNew = !(key in data);
					defineProperty(data, key, _value, callback, path);
					if (isNew && callback) callback(data[key], path + key, key, data);
					return data;
				}
			},
			$remove: {
				configurable: true,
				value: function value(key) {
					if (typeof key !== 'string') return;
					delete data[key];
					if (callback) callback(undefined, path + key, key, data);
				}
			}
		});
	}

	function overrideArrayMethods(data, callback, path) {
		Object.defineProperties(data, {
			push: {
				configurable: true,
				value: function value() {
					if (!arguments.length || !data.length) return data.length;

					for (var i = 0, l = arguments.length; i < l; i++) {
						defineProperty(data, data.length, arguments[i], callback, path);

						if (callback) {
							callback(data.length, path + 'length', 'length', data);
							callback(data[data.length - 1], path + (data.length - 1), data.length - 1, data);
						}
					}

					return data.length;
				}
			},
			unshift: {
				configurable: true,
				value: function value() {
					if (!arguments.length || !data.length) return data.length;

					var i,
					    l,
					    result = [];

					for (i = 0, l = arguments.length; i < l; i++) {
						result.push(arguments[i]);
					}

					for (i = 0, l = data.length; i < l; i++) {
						result.push(data[i]);
					}

					for (i = 0, l = data.length; i < l; i++) {
						data[i] = result[i];
					}

					for (i, l = result.length; i < l; i++) {
						defineProperty(data, data.length, result[i], callback, path);
						if (callback) {
							callback(data.length, path + 'length', 'length', data);
							callback(data[data.length - 1], path + (data.length - 1), data.length - 1, data);
						}
					}

					return data.length;
				}
			},
			pop: {
				configurable: true,
				value: function value() {
					if (!data.length) return;

					var value = data[data.length - 1];

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
				value: function value() {
					if (!data.length) return;

					var value = data[0];

					for (var i = 0, l = data.length - 1; i < l; i++) {
						data[i] = data[i + 1];
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
				value: function value(startIndex, deleteCount) {
					if (!data.length || typeof startIndex !== 'number' && typeof deleteCount !== 'number') return [];
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
					} else if (deleteCount > data.length - startIndex) {
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
								callback(data[data.length - 1], path + (data.length - 1), data.length - 1, data);
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

	// export default class Observer {
	// 	constructor (data, callback, path) {
	// 		this.defineProperties(data, callback, path, true);
	// 		return data;
	// 	}
	//
	// 	defineProperties (data, callback, path, redefine) {
	// 		path = path ? path + '.' : '';
	// 		for (var key in data) this.defineProperty(data, key, data[key], callback, path, redefine);
	// 		if (data.constructor === Object) this.overrideObjectMethods(data, callback, path);
	// 		else if (data.constructor === Array) this.overrideArrayMethods(data, callback, path);
	// 	}
	//
	// 	defineProperty (data, key, value, callback, path, redefine) {
	// 		var property = Object.getOwnPropertyDescriptor(data, key);
	//
	// 		if (property && property.configurable === false) return;
	//
	// 		var getter = property && property.get;
	// 		var setter = property && property.set;
	//
	// 		// recursive observe child properties
	// 		if (value && typeof value === 'object') this.defineProperties(value, callback, path + key, redefine);
	//
	// 		// set the property value if getter setter previously defined and redefine is not true
	// 		if (getter && setter && redefine === false) return setter.call(data, value);
	//
	// 		Object.defineProperty(data, key, {
	// 			enumerable: true,
	// 			configurable: true,
	// 			get: function () {
	// 				return getter ? getter.call(data) : value;
	// 			},
	// 			set: function (newValue) {
	// 				var oldValue = getter ? getter.call(data) : value;
	//
	// 				// set the value with the same value not updated
	// 				if (newValue === oldValue) return;
	//
	// 				if (setter) setter.call(data, newValue);
	// 				else value = newValue;
	//
	// 				//	adds attributes to new valued property getter setter
	// 				if (newValue && typeof newValue === 'object') this.defineProperties(newValue, callback, path + key, redefine);
	//
	// 				if (callback) callback(newValue, path + key, key, data);
	// 			}
	// 		});
	// 	}
	//
	// 	overrideObjectMethods (data, callback, path) {
	// 		Object.defineProperties(data, {
	// 			$set: {
	// 				configurable: true,
	// 				value: function (key, value) {
	// 					if (typeof key !== 'string' || value === undefined) return;
	// 					var isNew = !(key in data);
	// 					this.defineProperty(data, key, value, callback, path);
	// 					if (isNew && callback) callback(data[key], path + key, key, data);
	// 				}
	// 			},
	// 			$remove: {
	// 				configurable: true,
	// 				value: function (key) {
	// 					if (typeof key !== 'string') return;
	// 					delete data[key];
	// 					if (callback) callback(undefined, path + key, key, data);
	// 				}
	// 			}
	// 		});
	// 	}
	//
	// 	overrideArrayMethods (data, callback, path) {
	// 		Object.defineProperties(data, {
	// 			push: {
	// 				configurable: true,
	// 				value: function () {
	// 					if (!arguments.length || !data.length) return data.length;
	//
	// 					for (var i = 0, l = arguments.length; i < l; i++) {
	// 						this.defineProperty(data, data.length, arguments[i], callback, path);
	//
	// 						if (callback) {
	// 							callback(data.length, path + 'length', 'length', data);
	// 							callback(data[data.length-1], path + (data.length-1), data.length-1, data);
	// 						}
	//
	// 					}
	//
	// 					return data.length;
	// 				}
	// 			},
	// 			unshift: {
	// 				configurable: true,
	// 				value: function () {
	// 					if (!arguments.length || !data.length) return data.length;
	//
	// 					var i, l, result = [];
	//
	// 					for (i = 0, l = arguments.length; i < l; i++) {
	// 						result.push(arguments[i]);
	// 					}
	//
	// 					for (i = 0, l = data.length; i < l; i++) {
	// 						result.push(data[i]);
	// 					}
	//
	// 					for (i = 0, l = data.length; i < l; i++) {
	// 						data[i] = result[i];
	// 					}
	//
	// 					for (i, l = result.length; i < l; i++) {
	// 						this.defineProperty(data, data.length, result[i], callback, path);
	// 						if (callback) {
	// 							callback(data.length, path + 'length', 'length', data);
	// 							callback(data[data.length-1], path + (data.length-1), data.length-1, data);
	// 						}
	// 					}
	//
	// 					return data.length;
	// 				}
	// 			},
	// 			pop: {
	// 				configurable: true,
	// 				value: function () {
	// 					if (!data.length) return;
	//
	// 					var value = data[data.length-1];
	//
	// 					data.length--;
	//
	// 					if (callback) {
	// 						callback(data.length, path + 'length', 'length', data);
	// 						callback(undefined, path + data.length, data.length, data);
	// 					}
	//
	// 					return value;
	// 				}
	// 			},
	// 			shift: {
	// 				configurable: true,
	// 				value: function () {
	// 					if (!data.length) return;
	//
	// 					var value = data[0];
	//
	// 					for (var i = 0, l = data.length-1; i < l; i++) {
	// 						data[i] = data[i+1];
	// 					}
	//
	// 					data.length--;
	//
	// 					if (callback) {
	// 						callback(data.length, path + 'length', 'length', data);
	// 						callback(undefined, path + data.length, data.length, data);
	// 					}
	//
	// 					return value;
	// 				}
	// 			},
	// 			splice: {
	// 				configurable: true,
	// 				value: function (startIndex, deleteCount) {
	// 					if (!data.length || (typeof startIndex !== 'number' && typeof deleteCount !== 'number')) return [];
	// 					if (typeof startIndex !== 'number') startIndex = 0;
	// 					if (typeof deleteCount !== 'number') deleteCount = data.length;
	//
	// 					var removed = [];
	// 					var result = [];
	// 					var index, i, l;
	//
	// 					// follow spec more or less
	// 					// startIndex = parseInt(startIndex, 10);
	// 					// deleteCount = parseInt(deleteCount, 10);
	//
	// 					// handle negative startIndex
	// 					if (startIndex < 0) {
	// 						startIndex = data.length + startIndex;
	// 						startIndex = startIndex > 0 ? startIndex : 0;
	// 					} else {
	// 						startIndex = startIndex < data.length ? startIndex : data.length;
	// 					}
	//
	// 					// handle negative deleteCount
	// 					if (deleteCount < 0) {
	// 						deleteCount = 0;
	// 					} else if (deleteCount > (data.length - startIndex)) {
	// 						deleteCount = data.length - startIndex;
	// 					}
	//
	// 					// copy items up to startIndex
	// 					for (i = 0; i < startIndex; i++) {
	// 						result[i] = data[i];
	// 					}
	//
	// 					// add new items from arguments
	// 					for (i = 2, l = arguments.length; i < l; i++) {
	// 						result.push(arguments[i]);
	// 					}
	//
	// 					// copy removed items
	// 					for (i = startIndex, l = startIndex + deleteCount; i < l; i++) {
	// 						removed.push(data[i]);
	// 					}
	//
	// 					// add the items after startIndex + deleteCount
	// 					for (i = startIndex + deleteCount, l = data.length; i < l; i++) {
	// 						result.push(data[i]);
	// 					}
	//
	// 					index = 0;
	// 					i = result.length - data.length;
	// 					i = result.length - (i < 0 ? 0 : i);
	//
	// 					// update all observed items
	// 					while (i--) {
	// 						data[index] = result[index];
	// 						index++;
	// 					}
	//
	// 					i = result.length - data.length;
	//
	// 					// add and observe or remove items
	// 					if (i > 0) {
	// 						while (i--) {
	// 							this.defineProperty(data, data.length, result[index++], callback, path);
	// 							if (callback) {
	// 								callback(data.length, path + 'length', 'length', data);
	// 								callback(data[data.length-1], path + (data.length-1), data.length-1, data);
	// 							}
	// 						}
	// 					} else if (i < 0) {
	// 						while (i++) {
	// 							data.length--;
	// 							if (callback) {
	// 								callback(data.length, path + 'length', 'length', data);
	// 								callback(undefined, path + data.length, data.length, data);
	// 							}
	// 						}
	// 					}
	//
	// 					return removed;
	// 				}
	// 			}
	// 		});
	// 	}
	//
	// }

	function Model(options) {
		this.isRan = false;
		this.setup(options);
	}

	Model.prototype.setup = function (options) {
		options = options || {};
		this.data = options.data || {};
		this.container = options.container || document.body;
		return this;
	};

	Model.prototype.handler = function (callback) {
		this._handler = callback;
	};

	Model.prototype.overwrite = function (data) {
		Observer(this.data = data, this._handler);
	};

	Model.prototype.inputListener = function (element) {
		var value = element.getAttribute('j-value');
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
				var elements = element.parentNode.querySelectorAll('input[type="radio"][j-value="' + path + '"]');
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

	Model.prototype.run = function () {
		if (this.isRan) return;else this.isRan = true;

		Observer(this.data, this._handler);

		this.container.addEventListener('change', function (e) {
			if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.nodeName !== 'SELECT') {
				this.inputListener.call(this, e.target);
			}
		}.bind(this), true);

		this.container.addEventListener('input', function (e) {
			this.inputListener.call(this, e.target);
		}.bind(this), true);
	};

	var OnceBinder = {
		bind: function bind(element, attribute, container) {
			var model = container.model;
			var type = attribute.cmds[0];
			var key = attribute.path.split('.').pop();
			var data = Utility.getByPath(model, attribute.path);
			var updateModel = data === undefined;
			data = this.type[type](element, attribute, model, data);
			if (updateModel) data = model.$set(key, data);
		},
		type: {
			value: function value(element, attribute, model, data) {
				var i, l;

				if (element.type === 'checkbox') {
					if (element.checked !== data) {
						data = !data ? false : data;
						element.value = element.checked = data;
					}
				} else if (element.nodeName === 'SELECT' && element.multiple) {
					if (element.options.length !== data.length) {
						var options = element.options;
						for (i = 0, l = options.length; i < l; i++) {
							var option = options[i];
							if (option.value === data[i]) {
								option.selected;
							}
						}
					}
				} else if (element.type === 'radio') {
					var elements = element.parentNode.querySelectorAll('input[type="radio"][type="radio"][j-value="' + attribute.value + '"]');
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

	function Binder(options) {
		this.element = options.element;
		this.container = options.container;
		this.attribute = options.attribute;

		this.view = this.container.view;
		this.model = this.container.model;
		this.events = this.container.events;
		this.modifiers = this.container.modifiers;
		this.type = this.attribute.cmds[0] || 'default';
		this.renderType = this.attribute.cmds[0] || 'default';

		if (this.renderType === 'on') {
			this.data = Utility.getByPath(this.events, this.attribute.path).bind(this.model);
		} else {
			this._data = this.attribute.parentPath ? Utility.getByPath(this.model, this.attribute.parentPath) : this.model;

			Object.defineProperty(this, 'data', {
				enumerable: true,
				configurable: false,
				get: function get() {
					if (this._data === undefined) return;
					var data = this._data[this.attribute.parentKey];
					data = this.modify(data);
					return data;
				}
			});

			if (this.type in this.setup) {
				this.setup[this.type].call(this);
			}
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

	Binder.prototype.setup = {
		each: function each() {
			this.pattern = /\$INDEX/g;
			this.variable = this.attribute.cmds[1];
			var child = this.element.firstElementChild;
			if (this.element.children.length === 0) throw new Error('Binder j-each requires a child element');
			this.clone = this.element.removeChild(this.element.firstElementChild);
			this.clone = this.clone.outerHTML.replace(new RegExp('((?:data-)?j-.*?=")' + this.variable + '(.*?")', 'g'), '$1' + this.attribute.path + '.$INDEX$2');
		}
	};

	Binder.prototype.renderMethods = {
		on: function on(data) {
			this.element.removeEventListener(this.attribute.cmds[1], data);
			this.element.addEventListener(this.attribute.cmds[1], data);
		},
		each: function each(data) {
			if (this.element.children.length > data.length) {
				while (this.element.children.length > data.length) {
					this.element.removeChild(this.element.lastElementChild);
				}
			} else if (this.element.children.length < data.length) {
				var html = '';
				var index = this.element.children.length;
				var count = data.length - this.element.children.length;
				while (count--) {
					html += this.clone.replace(this.pattern, index++);
				}
				this.element.insertAdjacentHTML('beforeend', html);
			}
		},
		html: function html(data) {
			this.element.innerHTML = data;
		},
		css: function css(data) {
			if (this.attribute.cmds.length > 1) {
				data = this.attribute.cmds.slice(1).join('-') + ': ' + data + ';';
			}
			this.element.style.cssText += data;
		},
		class: function _class(data) {
			var className = this.attribute.cmds.slice(1).join('-');
			this.element.classList.toggle(className, data);
		},
		text: function text(data) {
			this.element.innerText = Utility.toText(data);
		},
		enable: function enable(data) {
			this.element.disabled = !data;
		},
		disable: function disable(data) {
			this.element.disabled = data;
		},
		show: function show(data) {
			this.element.hidden = !data;
		},
		hide: function hide(data) {
			this.element.hidden = data;
		},
		write: function write(data) {
			this.element.readOnly = !data;
		},
		read: function read(data) {
			this.element.readOnly = data;
		},
		selected: function selected(data) {
			this.element.selectedIndex = data;
		},
		href: function href(data) {
			this.element.href = data;
		},
		default: function _default() {//data
			// Utility.setByPath(this.element, Utility.toCamelCase(this.attribute.cmds), data);
		}
	};

	Binder.prototype.unrenderMethods = {
		on: function on() {
			this.element.removeEventListener(this.attribute.cmds[1], this.data, false);
		},
		each: function each() {
			Utility.removeChildren(this.element);
		},
		html: function html() {
			Utility.removeChildren(this.element);
		},
		css: function css() {
			this.element.style.cssText = '';
		},
		class: function _class() {
			var className = this.attribute.cmds.slice(1).join('-');
			this.element.classList.remove(className);
		},
		text: function text() {
			this.element.innerText = '';
		},
		default: function _default() {}
	};

	Binder.prototype.unrender = function () {
		this.unrenderMethods[this.renderType].call(this, this.data);
		return this;
	};

	Binder.prototype.render = function () {
		// var data = this.renderType === 'on' ? this.data : this.getData();
		// if (this.data === undefined) return;
		this.renderMethods[this.renderType].call(this, this.data);
		return this;
	};

	function View(options) {
		this.isRan = false;
		this.setup(options);
	}

	View.prototype.setup = function (options) {
		options = options || {};
		this.data = options.data || {};
		this.container = options.container || document.body;
		return this;
	};

	View.prototype.PATH = /\s?\|.*/;
	View.prototype.PARENT_KEY = /^.*\./;
	View.prototype.PARENT_PATH = /\.\w+$|^\w+$/;
	View.prototype.PREFIX = /(data-)?j-/;
	View.prototype.MODIFIERS = /^.*?\|\s?/;
	View.prototype.IS_ACCEPT_PATH = /(data-)?j-.*/;
	View.prototype.IS_REJECT_PATH = /(data-)?j-value.*/;

	View.prototype.isOnce = function (node) {
		return node.hasAttribute('j-value') || node.hasAttribute('data-j-value');
	};

	View.prototype.isSkip = function (node) {
		return node.nodeName === 'J-VIEW' || node.hasAttribute('j-view') || node.hasAttribute('data-j-view');
	};

	View.prototype.isSkipChildren = function (node) {
		return node.nodeName === 'IFRAME' || node.nodeName === 'OBJECT' || node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE' || node.nodeName === 'SVG';
	};

	View.prototype.isAccept = function (node) {
		var attributes = node.attributes;
		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];
			if (attribute.name.indexOf('j-') === 0 || attribute.name.indexOf('data-j-') === 0) {
				return true;
			}
		}
		return false;
	};

	View.prototype.isAcceptAttribute = function (attribute) {
		return attribute.name.indexOf('j-') === 0 || attribute.name.indexOf('data-j-') === 0;
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

	View.prototype.add = function () {
		var self = this;
		self.eachElement(arguments[0], arguments[1], function (element, container) {
			self.eachAttribute(element.attributes, function (attribute) {
				if (self.isOnce(element)) {
					OnceBinder.bind(element, attribute, container);
				} else {
					var path = attribute.viewPath;
					if (!self.has(container.uid, path, element)) {
						self.push(container.uid, path, element, container, attribute);
					}
				}
			});
		});
	};

	View.prototype.remove = function () {
		var self = this;
		self.eachElement(arguments[0], arguments[1], function (element, container) {
			self.eachAttributeAcceptPath(element.attributes, function (path) {
				self.eachBinder(container.uid, path, function (binder, index, binders, paths, key) {
					if (binder.element === element) {
						binder.unrender();
						binders.splice(index, 1);
						if (binders.length === 0) delete paths[key];
					}
				});
			});
		});
	};

	View.prototype.handler = function (callback) {
		this._handler = callback;
	};

	View.prototype.run = function () {
		var self = this;
		if (self.isRan) return;else self.isRan = true;

		self.add(self.container);

		self.observer = new MutationObserver(function (mutations) {
			var i = mutations.length;
			while (i--) {
				self._handler(mutations[i].addedNodes, mutations[i].removedNodes, mutations[i].target);
			}
		});

		self.observer.observe(this.container, { childList: true, subtree: true });
	};

	function Http(options) {
		this.setup(options);
	}

	Http.prototype.setup = function (options) {
		options = options || {};
		this.request = options.request;
		this.response = options.response;
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

	Http.prototype.fetch = function (options) {
		var self = this,
		    xhr,
		    request,
		    response;

		options = options || {};
		options.url = options.url ? options.url : window.location.href;
		options.method = options.method ? options.method.toUpperCase() : 'GET';
		options.headers = options.headers ? options.headers : {};

		if (options.data) {
			if (options.method === 'GET') {
				options.url = options.url + '?' + self.serialize(options.data);
				options.data = null;
			} else {
				options.requestType = options.requestType ? options.requestType.toLowerCase() : '';
				options.responseType = options.responseType ? options.responseType.toLowerCase() : '';

				switch (options.requestType) {
					case 'script':
						options.contentType = self.mime.script;break;
					case 'json':
						options.contentType = self.self.mime.json;break;
					case 'xml':
						options.contentType = self.mime.xm;break;
					case 'html':
						options.contentType = self.mime.html;break;
					case 'text':
						options.contentType = self.mime.text;break;
					default:
						options.contentType = self.mime.urlencoded;
				}

				switch (options.responseType) {
					case 'script':
						options.accept = self.mime.script;break;
					case 'json':
						options.accept = self.mime.json;break;
					case 'xml':
						options.accept = self.mime.xml;break;
					case 'html':
						options.accept = self.mime.html;break;
					case 'text':
						options.accept = self.mime.text;break;
				}

				if (options.contentType === self.mime.json) options.data = JSON.stringify(options.data);
				if (options.contentType === self.mime.urlencoded) options.data = self.serialize(options.data);
			}
		}

		xhr = new XMLHttpRequest();

		if (typeof self.request === 'function') request = self.request(options, xhr);

		if (request === undefined || request === true) {
			xhr.open(options.method, options.url, true, options.username, options.password);

			if (options.mimeType) xhr.overrideMimeType(options.mimeType);
			if (options.accept) options.headers['Accept'] = options.accept;
			if (options.withCredentials) xhr.withCredentials = options.withCredentials;
			if (options.contentType) options.headers['Content-Type'] = options.contentType;

			if (options.headers) {
				for (var name in options.headers) {
					xhr.setRequestHeader(name, options.headers[name]);
				}
			}

			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (typeof self.response === 'function') response = self.response(options, xhr);
					if (response === undefined || response === true) {
						if (xhr.status >= 200 && xhr.status < 400) {
							return options.success(xhr);
						} else {
							return options.error(xhr);
						}
					}
				}
			};

			xhr.send(options.data);
		}
	};

	/*
 	@banner
 	name: jenie
 	version: 1.6.10
 	license: mpl-2.0
 	author: alexander elias
 	This Source Code Form is subject to the terms of the Mozilla Public
 	License, v. 2.0. If a copy of the MPL was not distributed with this
 	file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

	var eScript = document._currentScript || document.currentScript;
	var eStyle = document.createElement('style');
	var sStyle = document.createTextNode('j-view, j-view > :first-child { display: block; }');

	eStyle.setAttribute('title', 'Jenie');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	document.head.insertBefore(eStyle, eScript);
	document.registerElement('j-view', { prototype: Object.create(HTMLElement.prototype) });

	// j-index="index.js"
	// this.sIndex = this.eScript.getAttribute('j-index');
	// if (this.sIndex) {
	// 	this.eIndex = document.createElement('script');
	// 	this.eIndex.setAttribute('src', this.sIndex);
	// 	this.eIndex.setAttribute('async', 'false');
	// 	this.eScript.insertAdjacentElement('afterend', this.eIndex);
	// }

	var Jenie = {
		container: document.body,
		events: { data: {} },
		modifiers: { data: {} },
		http: new Http(),
		view: new View(),
		model: new Model(),
		loader: new Loader(),
		router: new Router(),
		setup: function setup(options) {
			options = (typeof options === 'function' ? options.call(this) : options) || {};
			if (options.http) this.http.setup(options.http);
			if (options.view) this.view.setup(options.view);
			if (options.model) this.model.setup(options.model);
			if (options.loader) this.loader.setup(options.loader);
			if (options.router) this.router.setup(options.router);
			this.loader.run();
			this.router.run();
		},
		component: function component(options) {
			options.global = Jenie;
			return new Component(options);
		},
		script: function script() {
			return document._currentScript || document.currentScript;
		},
		document: function (_document) {
			function document() {
				return _document.apply(this, arguments);
			}

			document.toString = function () {
				return _document.toString();
			};

			return document;
		}(function () {
			return (document._currentScript || document.currentScript).ownerDocument;
		}),
		element: function element(name) {
			return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
		},
		query: function query(_query) {
			return (document._currentScript || document.currentScript).ownerDocument.querySelector(_query);
		}
	};

	Jenie.view.handler(function (addedNodes, removedNodes, parentNode) {
		var addedNode, removedNode, containerNode, i;

		i = addedNodes.length;
		while (i--) {
			addedNode = addedNodes[i];
			if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {
				if (addedNode.isRouterComponent) addedNode.inRouterCache = true;
				containerNode = Utility.getContainer(parentNode);
				Jenie.view.add(addedNode, containerNode);
			}
		}

		i = removedNodes.length;
		while (i--) {
			removedNode = removedNodes[i];
			if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {
				if (removedNode.isRouterComponent) removedNode.inRouterCache = true;
				containerNode = Utility.getContainer(parentNode);
				Jenie.view.remove(removedNode, containerNode);
			}
		}
	});

	Jenie.model.handler(function (data, path) {
		var paths = path.split('.');
		var uid = paths[0];
		var pattern = paths.slice(1).join('.');
		var type = data === undefined ? 'unrender' : 'render';
		Jenie.view.eachBinder(uid, pattern, function (binder) {
			binder[type]();
		});
	});

	Jenie.router.handler(function (route) {
		if (route.title) document.title = route.title;
		if (route.url && !(route.component in this.cache)) {
			Jenie.loader.load(route.url.constructor === Object ? route.url : {
				url: route.url
			}, function () {
				Jenie.router.render(route);
			});
		} else {
			Jenie.router.render(route);
		}
	});

	Jenie.view.run();
	Jenie.model.run();

	return Jenie;
});