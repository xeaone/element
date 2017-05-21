(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Jenie', factory) :
	(global.Jenie = factory());
}(this, (function () { 'use strict';

	function Model$1 () {}

	Model$1.prototype.join = function () {
		return Array.prototype.join
		.call(arguments, '.')
		.replace(/\.{2,}/g, '.')
		.replace(/^\.|\.$/g, '');
	};

	Model$1.prototype.isCollection = function (data) {
		return data && (data.constructor.name === 'Object' || data.constructor.name === 'Array');
	};

	Model$1.prototype.defineSplice = function (path, meta, target, argument) {
		var self = this;

		if (argument[2]) {

			Array.prototype.splice.call(meta, argument[0], argument[1]);
			self.emit(self.join(path), target);

		} else {

			Array.prototype.slice.call(argument, 2).forEach(function (value) {

				value = self.defineCollection(path, value);
				Array.prototype.splice.call(meta, argument[0], argument[1], value);
				target = self.defineProperty(path, meta, target, meta.length-1);
				self.emit(self.join(path), target);

			});

		}

	};

	Model$1.prototype.arrayPushUnshift = function (path, meta, target, method, argument) {
		var self = this;

		Array.prototype.forEach.call(argument, function (value) {

			value = self.defineCollection(path, value);
			Array.prototype[method].call(meta, value);
			target = self.defineProperty(path, meta, target, meta.length-1);
			self.emit(self.join(path), target);

		});

	};

	Model$1.prototype.arrayPopShift = function (path, meta, target, method) {
		var self = this;

		Array.prototype[method].call(meta);
		Array.prototype.pop.call(target);
		self.emit(self.join(path), target);

	};

	Model$1.prototype.defineArray = function (path, meta, target) {
		var self = this;

		return Object.defineProperties(target, {
			splice: {
				value: function () {
					return self.defineSplice(path, meta, target, arguments);
				}
			},
			push: {
				value: function () {
					return self.arrayPushUnshift(path, meta, target, 'push', arguments);
				}
			},
			unshift: {
				value: function () {
					return self.arrayPushUnshift(path, meta, target, 'unshift', arguments);
				}
			},
			pop: {
				value: function () {
					return self.arrayPopShift(path, meta, target, 'pop');
				}
			},
			shift: {
				value: function () {
					return self.arrayPopShift(path, meta, target, 'shift');
				}
			}
		});

	};

	Model$1.prototype.defineObject = function (path, meta, target) {
		var self = this;

		return Object.defineProperties(target, {
			set: {
				value: function (key, value) {

					if (self.isCollection(value)) {
						value = self.defineCollection(self.join(path, key), value);
					}

					meta[key] = value;
					target = self.defineProperty(path, meta, target, key);
					self.emit(self.join(path, key), target[key]);

				}
			},
			remove: {
				value: function (key) {

					delete target[key];
					delete meta[key];
					self.emit(self.join(path, key), undefined);

				}
			}
		});

	};

	Model$1.prototype.defineProperty = function (path, meta, target, key) {
		var self = this;

		return Object.defineProperty(target, key, {
			enumerable: true,
			configurable: true,
			get: function () {
				return meta[key];
			},
			set: function (value) {

				if (meta[key] !== value) {

					if (value === undefined) {

						delete meta[key];
						delete target[key];
						self.emit(self.join(path, key), undefined);

					} else {

						meta[key] = self.defineCollection(self.join(path, key), value);
						self.emit(self.join(path, key), target[key]);

					}

				}

			}
		});

	};

	Model$1.prototype.defineCollection = function (path, source) {
		var self = this;

		if (!self.isCollection(source)) return source;

		var type = source ? source.constructor.name : '';
		var target = source.constructor();
		var meta = source.constructor();

		if (type === 'Object') {
			target = self.defineObject(path, meta, target);
		} else if (type === 'Array') {
			target = self.defineArray(path, meta, target);
		}

		Object.keys(source).forEach(function (key) {

			if (source[key] !== undefined) {

				meta[key] = self.defineCollection(self.join(path, key), source[key]);
				target = self.defineProperty(path, meta, target, key);

			}

		});

		return target;
	};

	Model$1.prototype.set = function (path, value) {
		var keys = path.split('.');
		var last = keys.length - 1;
		var collection = this.data;

		for (var i = 0, key; i < last; i++) {
			key = keys[i];
			if (collection[key] === undefined) collection[key] = {};
			collection = collection[key];
		}

		return collection[keys[last]] = value;
	};

	Model$1.prototype.get = function (path) {
		var keys = path.split('.');
		var last = keys.length - 1;
		var collection = this.data;

		for (var i = 0; i < last; i++) {
			if (!collection[keys[i]]) return undefined;
			else collection = collection[keys[i]];
		}

		return collection[keys[last]];
	};

	Model$1.prototype.listener = function (listener) {
		this.emit = listener;
	};

	Model$1.prototype.run = function (data) {
		this.data = this.defineCollection('', data);
	};

	var model = Model$1;

	function Collection$1 (data) {
		Object.defineProperty(this, 'data', {
			value: data || []
		});
	}

	Collection$1.prototype.get = function (key) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (key === this.data[i][0]) {
				return this.data[i][1];
			}
		}
	};

	Collection$1.prototype.remove = function (key) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (key === this.data[i][0]) {
				return this.data.splice(i, 1)[0][1];
			}
		}
	};

	Collection$1.prototype.removeById = function (id) {
		return this.data.splice(id, 1);
	};

	Collection$1.prototype.has = function (key) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (key === this.data[i][0]) {
				return true;
			}
		}

		return false;
	};

	Collection$1.prototype.set = function (key, value) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (key === this.data[i][0]) {
				return this.data[i][1] = value;
			}
		}

		return this.data[l] = [key, value];
	};

	Collection$1.prototype.push = function (value) {
		this.data[this.data.length] = [this.data.length, value];
		return value;
	};

	Collection$1.prototype.size = function () {
		return this.data.length;
	};

	Collection$1.prototype.forEach = function (callback, context) {
		context = context || null;

		for (var i = 0, l = this.data.length; i < l; i++) {
			callback.call(context, this.data[i][1], this.data[i][0], i, this.data);
		}
	};

	var collection = Collection$1;

	var Collection = collection;

	function View$1 () {
		this.data = new Collection();
	}

	View$1.prototype.regexp = {
		PATH: /\s?\|(.*?)$/,
		PREFIX: /(data-)?j-/,
		MODIFIERS: /^(.*?)\|\s?/,
		ATTRIBUTE_ACCEPTS: /(data-)?j-/,
		ELEMENT_ACCEPTS: /(data-)?j-/,
		ELEMENT_REJECTS_CHILDREN: /(data-)?j-each/,
		ELEMENT_REJECTS: /^\w+(-\w+)+|^iframe|^object|^script/
	};

	View$1.prototype.preview = function (element) {
		return element.outerHTML
		.replace(/\/?>([\s\S])*/, '')
		.replace(/^</, '');
	};

	View$1.prototype.eachElement = function (elements, callback) {
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			var preview = this.preview(element);

			if (this.regexp.ELEMENT_REJECTS.test(preview)) {
				i += element.querySelectorAll('*').length;
			} else if (this.regexp.ELEMENT_REJECTS_CHILDREN.test(preview)) {
				i += element.querySelectorAll('*').length;
				callback.call(this, element);
			} else if (this.regexp.ELEMENT_ACCEPTS.test(preview)) {
				callback.call(this, element);
			}
		}
	};

	View$1.prototype.eachAttribute = function (element, callback) {
		Array.prototype.forEach.call(element.attributes, function (ea) {
			if (this.regexp.ATTRIBUTE_ACCEPTS.test(ea.name)) {
				var attribute = {};
				attribute.name = ea.name;
				attribute.value = ea.value;
				attribute.path = attribute.value.replace(this.regexp.PATH, '');
				attribute.opts = attribute.path.split('.');
				attribute.command = attribute.name.replace(this.regexp.PREFIX, '');
				attribute.cmds = attribute.command.split('-');
				attribute.key = attribute.opts.slice(-1);
				attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(this.regexp.MODIFIERS, '').split(' ');
				callback.call(this, attribute);
			}
		}, this);
	};

	View$1.prototype.unrenderAll = function (pattern) {
		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

		this.data.forEach(function (paths, path) {
			paths.forEach(function (unit) {
				if (pattern.test(path)) {
					unit.unrender();
				}
			}, this);
		}, this);
	};

	View$1.prototype.renderAll = function (pattern) {
		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

		this.data.forEach(function (paths, path) {
			paths.forEach(function (unit) {
				if (pattern.test(path)) {
					unit.render();
				}
			}, this);
		}, this);
	};

	View$1.prototype.removeOne = function (element) {
		this.data.forEach(function (paths) {
			paths.forEach(function (unit, _, id) {
				if (element === unit.element) {
					paths.removeById(id);
				}
			}, this);
		}, this);
	};

	View$1.prototype.removeAll = function (elements) {
		Array.prototype.forEach.call(elements, function (element) {
			this.removeOne(element);
		}, this);
	};

	View$1.prototype.addOne = function (element) {
		var self = this;

		self.eachAttribute(element, function (attribute) {

			if (!self.data.has(attribute.path)) {
				self.data.set(attribute.path, new Collection());
			}

			self.emit(element, attribute);
		});
	};

	View$1.prototype.addAll = function (elements) {
		this.eachElement(elements, function (element) {
			this.addOne(element);
		});
	};

	View$1.prototype.listener = function (listener) {
		this.emit = listener;
	};

	View$1.prototype.run = function (elements) {
		this.elements = elements;
		this.addAll(this.elements);
	};

	var view = View$1;

	function Unit$1 () {}

	Unit$1.prototype.setByPath = function (collection, path, value) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0, key; i < last; i++) {
			key = keys[i];
			if (collection[key] === undefined) collection[key] = {};
			collection = collection[key];
		}

		return collection[keys[last]] = value;
	};

	Unit$1.prototype.toCamelCase = function (data) {
		if (data.constructor.name === 'Array') data = data.join('-');
		return data.replace(/-[a-z]/g, function (match) {
			return match[1].toUpperCase();
		});
	};

	Unit$1.prototype.renderMethods = {
		on: function () {
			var eventName = this.attribute.cmds[1];
			this.element.removeEventListener(eventName, this.data, false);
			this.element.addEventListener(eventName, this.data, false);
		},
		each: function () {
			if (!this.clone) {
				this.variable = this.attribute.cmds.slice(1).join('.');
				this.clone = this.element.removeChild(this.element.children[0]).outerHTML;
				this.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + this.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');

				this.data.forEach(function (data, index) {
					this.element.insertAdjacentHTML(
						'beforeend',
						this.clone.replace(
							this.pattern, '$1' + this.attribute.path + '.' + index + '$6'
						)
					);
				}, this);

				this.view.addAll(this.element.getElementsByTagName('*'));
			} else if (this.element.children.length > this.data.length) {
				while (this.element.children.length > this.data.length) {
					this.view.removeAll(this.element.lastChild.getElementsByTagName('*'));
					this.view.removeOne(this.element.lastChild);
					this.element.removeChild(this.element.lastChild);
				}
			} else if (this.element.children.length < this.data.length) {
				while (this.element.children.length < this.data.length) {
					this.element.insertAdjacentHTML(
						'beforeend',
						this.clone.replace(
							this.pattern, '$1' + this.attribute.path + '.' + this.element.children.length + '$6'
						)
					);
					this.view.addOne(this.element.lastChild);
					this.view.addAll(this.element.lastChild.getElementsByTagName('*'));
				}
			}
		},
		value: function () {
			if (this.change) return;
			if (this.element.type === 'button' || this.element.type === 'reset') return this.change = true;

			this.change = function () {
				this.data = this.element.type !== 'radio' && this.element.type !== 'checked' ? this.element.value : this.element.checked;
			};

			this.element.addEventListener('change', this.change.bind(this), true);
			this.element.addEventListener('keyup', this.change.bind(this), true);
		},
		html: function () {
			this.element.innerHTML = this.data;
			this.view.addAll(this.element.getElementsByTagName('*'));
		},
		css: function () {
			var css = this.data;
			if (this.attribute.cmds.length > 1) css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
			this.element.style.cssText += css;
		},
		class: function () {
			var className = this.attribute.cmds.slice(1).join('-');
			this.element.classList.toggle(className, this.data);
		},
		text: function () {
			this.element.innerText = this.data;
		},
		enable: function () {
			this.element.disabled = !this.data;
		},
		disable: function () {
			this.element.disabled = this.data;
		},
		show: function () {
			this.element.hidden = !this.data;
		},
		hide: function () {
			this.element.hidden = this.data;
		},
		write: function () {
			this.element.readOnly = !this.data;
		},
		read: function () {
			this.element.readOnly = this.data;
		},
		selected: function () {
			this.element.selectedIndex = this.data;
		},
		default: function () {
			var path = this.toCamelCase(this.attribute.cmds);
			this.setByPath(this.element, path, this.data);
		}
	};

	Unit$1.prototype.unrenderMethods = {
		on: function () {
			var eventName = this.attribute.cmds[1];
			this.element.removeEventListener(eventName, this.data, false);
		},
		each: function () {
			while (this.element.lastChild) {
				this.element.removeChild(this.element.lastChild);
			}
		},
		value: function () {
			this.element.removeEventListener('change', this.change.bind(this));
			this.element.removeEventListener('keyup', this.change.bind(this));
		},
		html: function () {
			this.element.innerHTML = 'undefined';
		},
		text: function () {
			this.element.innerText = 'undefined';
		},
		default: function () {

		}
	};

	Unit$1.prototype.unrender = function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.unrenderMethod();
		});

		return self;
	};

	Unit$1.prototype.render = function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.renderMethod();
		});

		return self;
	};

	Unit$1.prototype.create = function (options) {
		this.view = options.view;
		this.model = options.model;
		this.data = options.data;
		this.element = options.element;
		this.attribute = options.attribute;
		this.modifiers = options.modifiers;

		this.renderMethod = (this.renderMethods[this.attribute.cmds[0]] || this.renderMethods['default']).bind(this);
		this.unrenderMethod = (this.unrenderMethods[this.attribute.cmds[0]] || this.unrenderMethods['default']).bind(this);

		Object.defineProperty(this, 'data', {
			enumerable: true,
			configurable: true,
			get: function () {
				var data = this.model.get(this.attribute.path);

				this.modifiers.forEach(function (modifier) {
					data = modifier.call(data);
				});

				return data;
			},
			set: function (value) {
				return this.model.set(this.attribute.path, value);
			}
		});

		this.renderMethod();

		return this;
	};

	var unit = function (options) {
		return new Unit$1().create(options);
	};

	var Model = model;
	var View = view;
	var Unit = unit;

	function Binder$2 (options, callback) {
		var self = this;

		self.view = new View();
		self.model = new Model();

		self._model = options.model || {};
		self._view = (options.view.shadowRoot || options.view).querySelectorAll('*');

		self.name = options.name;
		self.modifiers = options.modifiers || {};

		self.model.listener(function (path, data) {

			if (data === undefined) {
				self.view.unrenderAll('^' + path + '.*');
			} else {
				self.view.renderAll('^' + path);
			}

		});

		self.view.listener(function (element, attribute) {

			self.view.data.get(attribute.path).push(Unit({
				view: self.view,
				model: self.model,
				element: element,
				attribute: attribute,
				modifiers: attribute.modifiers.map(function (modifier) {
					return self.modifiers[modifier];
				})
			}));

		});

		if (typeof options.model === 'function') {

			self._model.call(self, function (model$$1) {

				self._model = model$$1;
				self.model.run(self._model);
				self.view.run(self._view);

				if (callback) {
					return callback.call(self);
				}

			});

		} else {

			self.model.run(self._model);
			self.view.run(self._view);

			if (callback) {
				return callback.call(self);
			}

		}

	}

	var index$2 = Binder$2;

	// https://gist.github.com/Wind4/3baa40b26b89b686e4f2

	var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

	var uuid = function () {
		var chars = CHARS, uuid = [];

		// rfc4122, version 4 form
		var r;

		// rfc4122 requires these characters
		uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
		uuid[14] = '4';

		// Fill in random data. At i==19 set the high bits of clock sequence as per rfc4122, sec. 4.1.5
		for (var i = 0; i < 36; i++) {
			if (!uuid[i]) {
				r = 0 | Math.random() * 16;
				uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
			}
		}

		return uuid.join('');
	};

	var Binder$1 = index$2;
	var Uuid = uuid;

	function Component$1 (options) {
		if (!options) throw new Error('Component missing options');
		if (!options.name) throw new Error('Component missing options.name');
		if (!options.template) throw new Error('Component missing options.template');

		var self = this;

		self.name = options.name;
		self.model = options.model;
		self.modifiers = options.modifiers;
		self.currentScript = (document._currentScript || document.currentScript);
		self.template = self._template(options.template);

		self.created = options.created ? options.created.bind(self) : undefined;
		self.attached = options.attached ? options.attached.bind(self) : undefined;
		self.detached = options.detached ? options.detached.bind(self) : undefined;
		self.attributed = options.attributed ? options.attributed.bind(self) : undefined;

		self.proto = self._define(self.name, {
			attachedCallback: {
				value: self.attached
			},
			detachedCallback: {
				value: self.detached
			},
			attributeChangedCallback: {
				value: self.attributed
			},
			createdCallback: {
				value: function () {
					self.element = this;
					self.uuid = Uuid();
					self.element.appendChild(document.importNode(self.template.content, true));

					if (self.model) {

						self.binder = new Binder$1({
							name: self.uuid,
							model: self.model,
							view: self.element,
							modifiers: self.modifiers
						}, function () {
							self.model = this.model.data;
							self.view = this.view.data;

							if (self.created) {
								self.created(self);
							}

						});

					} else {

						if (self.created) {
							self.created(self);
						}

					}

				}
			}
		});

	}

	Component$1.prototype._comment = function (method) {
		if (typeof method !== 'function') throw new Error('Comment must be a function');
		var comment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;
		var match = comment.exec(method.toString());
		if (!match) throw new Error('Comment missing');
		return match[1];
	};

	Component$1.prototype._dom = function (string) {
		var temporary = document.createElement('div');
		temporary.innerHTML = string;
		return temporary.children[0];
	};

	Component$1.prototype._template = function (template) {

		if (template.constructor.name === 'Function') {

			template = this._comment(template);
			template = this._dom(template);

		} else if (template.constructor.name === 'String') {

			if (/<|>/.test(template)) {
				template = this._dom(template);
			} else {
				template = this.currentScript.ownerDocument.querySelector(template);
			}

		}

		return template;
	};

	Component$1.prototype._define = function (name, options) {
		return document.registerElement(name, {
			prototype: Object.create(HTMLElement.prototype, options)
		});
	};

	var index = Component$1;

	function Router$1 (options) {
		var self = this;

		self.external = options.external;
		self.routes = options.routes || [];
		self.hash = options.hash === null || options.hash === undefined ? false : options.hash;

		self.cache = {};
		self.state = {};
		self.base = options.base;
		self.origin = window.location.origin;
		self.root = options.root || '' + (self.hash ? '/#/' : '/');

		self.loaded = function () {

			if (!self.base) {
				self.base = document.querySelector('base');
				self.base = self.base ? self.base.getAttribute('href') : '/';
				self.base = self.base === '' ? '/' : self.base;
				self.base = self.base[self.base.length-1] === '/' ? self.base.slice(0, -1) : self.base;
			}

			self.view = document.querySelector('j-view') || document.querySelector('[j-view]');
			self.navigate(window.location.href, true);
			window.removeEventListener('DOMContentLoaded', self.loaded);

		};

		self.popstate = function (e) {
			self.navigate(e.state || window.location.href, true);
		};

		self.click = function (e) {
			if (e.metaKey || e.ctrlKey || e.shiftKey) return;

			// ensure target is anchor tag use shadow dom if available
			var target = e.path ? e.path[0] : e.target;
			while (target && 'A' !== target.nodeName) target = target.parentNode;
			if (!target || 'A' !== target.nodeName) return;
			var href = target.getAttribute('href');

			// if external is true then default action
			if (self.external) {
				if (self.external.constructor.name === 'Function' && self.external(href)) return;
				else if (self.external.constructor.name === 'RegExp' && self.external.test(href)) return;
				else if (self.external.constructor.name === 'String' && new RegExp(self.external).test(href)) return;
			}

			// check non acceptable attributes
			if (target.hasAttribute('download') || target.hasAttribute('external')) return;

			// check non acceptable href
			if (href.indexOf('mailto:') !== -1) return;
			if (href.indexOf('tel:') !== -1) return;
			if (href.indexOf('file:') !== -1) return;
			if (href.indexOf('ftp:') !== -1) return;

			e.preventDefault();
			self.navigate(href);
		};

		window.addEventListener('DOMContentLoaded', self.loaded, true);
		window.addEventListener('popstate', self.popstate, true);
		window.addEventListener('click', self.click, true);

		return self;
	}

	Router$1.prototype.scroll = function (x, y) {
		window.scroll(x, y);
		return this;
	};

	Router$1.prototype.normalize = function (path) {
		path = decodeURI(path).replace(/\/{2,}/g, '/')
		.replace(/(http(s)?:\/)/, '$1/')
		.replace(/\?.*/, '');

		return 	path = path === '' ? '/' : path;
	};

	Router$1.prototype.join = function () {
		return this.normalize(Array.prototype.join.call(arguments, '/'));
	};

	Router$1.prototype.url = function (path) {
		var url = {};

		url.root = this.root;
		url.origin = this.origin;

		url.base = this.normalize(this.base);

		url.path = path;
		url.path = url.path.indexOf(url.origin) === 0 ? url.path.replace(url.origin, '') : url.path;
		url.path = url.base !== '/' ? url.path.replace(url.base, '') : url.path;
		url.path = url.path.indexOf(url.root) === 0 ? url.path.replace(url.root, '/') : url.path;
		url.path = this.normalize(url.path);
		url.path = url.path[0] === '/' ? url.path : '/' + url.path;

		url.href = this.join(url.origin, url.base, url.root, url.path);

		return url;
	};

	Router$1.prototype.render = function (route) {
		var component = this.cache[route.component];

		if (route.title) {
			document.title = route.title;
		}

		if (route.cache === true || route.cache === undefined) {

			component = this.cache[route.component];

			if (!component) {
				component = this.cache[route.component] = document.createElement(route.component);
			}

		} else {
			component = document.createElement(route.component);
		}

		if (this.view.firstChild) {
			this.view.removeChild(this.view.firstChild);
		}

		this.view.appendChild(component);

		return this;
	};

	Router$1.prototype.add = function (route) {

		if (route.constructor.name === 'Object') {
			this.routes.push(route);
		} else if (route.constructor.name === 'Array') {
			this.routes = this.routes.concat(route);
		}

		return this;
	};

	Router$1.prototype.remove = function (path) {

		for (var i = 0, l = this.routes.length; i < l; i++) {

			if (path === this.routes[i].path) {
				this.routes.splice(i, 1);
				break;
			}

		}

		return this;
	};

	Router$1.prototype.redirect = function (path) {
		window.location.href = path;
		return this;
	};

	Router$1.prototype.get = function (path) {

		for (var i = 0, l = this.routes.length; i < l; i++) {
			var route = this.routes[i];

			if (!route.path) {
				continue;
			} else if (route.path.constructor.name === 'String') {
				if (route.path === path) return route;
			} else if (route.path.constructor.name === 'RegExp') {
				if (route.path.test(path)) return route;
			} else if (route.path.constructor.name === 'Function') {
				if (route.path(path)) return route;
			}

		}

	};

	Router$1.prototype.navigate = function (data, replace) {

		if (typeof data === 'string') {
			this.state.url = this.url(data);
			this.state.route = this.get(this.state.url.path);
			this.state.title = this.state.route.title;
		} else {
			this.state = data;
		}

		window.history[replace ? 'replaceState' : 'pushState'](this.state, this.state.route.title, this.state.url.href);

		if (this.state.route.redirect) {
			this.redirect(this.state.route);
		} else {
			this.render(this.state.route);
		}

		if (!replace) {
			this.scroll(0, 0);
		}

		return this;
	};

	var index$4 = Router$1;

	function Http$1 () {}

	Http$1.prototype.mime = {
		html: 'text/html',
		text: 'text/plain',
		xml: 'application/xml, text/xml',
		json: 'application/json, text/javascript',
		urlencoded: 'application/x-www-form-urlencoded',
		script: 'text/javascript, application/javascript, application/x-javascript'
	};

	Http$1.prototype.serialize = function (data) {
		var string = '';

		for (var name in data) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return string;
	};

	Http$1.prototype.fetch = function (options) {
		var self = this;

		if (!options) throw new Error('fetch: requires options');
		if (!options.action) throw new Error('fetch: requires options.action');
		if (!options.method) options.method = 'GET';
		if (!options.headers) options.headers = {};

		if (options.data) {
			if (options.method === 'GET') {
				options.action = options.action + '?' + self.serialize(options.data);
				options.data = null;
			} else {
				options.requestType = options.requestType ? options.requestType.toLowerCase() : '';
				options.responseType = options.responseType ? options.responseType.toLowerCase() : '';

				switch (options.requestType) {
					case 'script': options.contentType = self.mime.script; break;
					case 'json': options.contentType = self.self.mime.json; break;
					case 'xml': options.contentType = self.mime.xm; break;
					case 'html': options.contentType = self.mime.html; break;
					case 'text': options.contentType = self.mime.text; break;
					default: options.contentType = self.mime.urlencoded;
				}

				switch (options.responseType) {
					case 'script': options.accept = self.mime.script; break;
					case 'json': options.accept = self.mime.json; break;
					case 'xml': options.accept = self.mime.xml; break;
					case 'html': options.accept = self.mime.html; break;
					case 'text': options.accept = self.mime.text; break;
				}

				if (options.contentType === self.mime.json) options.data = JSON.stringify(options.data);
				if (options.contentType === self.mime.urlencoded) options.data = self.serialize(options.data);
			}
		}

		var xhr = new XMLHttpRequest();
		xhr.open(options.method.toUpperCase(), options.action, true, options.username, options.password);

		if (options.mimeType) xhr.overrideMimeType(options.mimeType);
		if (options.withCredentials) xhr.withCredentials = options.withCredentials;

		if (options.accept) options.headers['Accept'] = options.accept;
		if (options.contentType) options.headers['Content-Type'] = options.contentType;

		if (options.headers) {
			for (var name in options.headers) {
				xhr.setRequestHeader(name, options.headers[name]);
			}
		}

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 400) {
					return options.success(xhr);
				} else {
					return options.error(xhr);
				}
			}
		};

		xhr.send(options.data);
	};

	var http = Http$1;

	/*
		@banner
		name: jenie
		version: 1.1.3
		author: alexander elias
	*/

	var Component = index;
	var Binder = index$2;
	var Router = index$4;
	var Http = http;

	var sStyle = 'j-view, j-view > :first-child { display: block; }';
	var eStyle = document.createElement('style');
	var nStyle = document.createTextNode(sStyle);

	eStyle.appendChild(nStyle);
	document.head.appendChild(eStyle);

	document.registerElement('j-view', {
		prototype: Object.create(HTMLElement.prototype)
	});

	var jenie_b = {
		module: {},
		modules: {},
		services: {},
		http: function () {
			return this.http = new Http();
		},
		router: function (options) {
			return this.router = new Router(options);
		},
		component: function (options) {
			return new Component(options);
		},
		binder: function (options, callback) {
			return new Binder(options, callback);
		},
		script: function () {
			return (document._currentScript || document.currentScript);
		},
		document: function () {
			return (document._currentScript || document.currentScript).ownerDocument;
		},
		query: function (query) {
			return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
		}
	};

	return jenie_b;

})));
