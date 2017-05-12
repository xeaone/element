(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Jenie', factory) :
	(global.Jenie = factory());
}(this, (function () { 'use strict';

	var utility = {
		GET: 2,
		SET: 3,

		is: function (variable, name) {
			return variable && variable.constructor.name === name;
		},

		isCollection: function (variable) {
			return variable !== null && typeof variable === 'object';
		},

		// router start
		has: function (string, search) {
			return string.indexOf(search) !== -1;
		},

		// view/model start
		toCamelCase: function (data) {
			if (data.constructor.name === 'Array') data = data.join('-');
			return data.replace(/-[a-z]/g, function (match) {
				return match[1].toUpperCase();
			});
		},

		toDashCase: function (data) {
			if (data.constructor.name === 'Array') data = data.join('');
			return data.replace(/[A-Z]/g, function (match) {
				return '-' + match.toLowerCase();
			});
		}

	};

	function Events$1 () {}

	Events$1.prototype.on = function (name, callback) {
		if (!this.events[name]) this.events[name] = [];
		this.events[name].push(callback);
	};

	Events$1.prototype.off = function (name, callback) {
		if (!this.events[name]) return;
		var index = this.events[name].indexOf(callback);
		if (this.events[name].indexOf(callback) > -1) this.events[name].splice(index, 1);
	};

	Events$1.prototype.emit = function (name) {
		if (!this.events[name]) return;
		var args = [].slice.call(arguments, 1);
		var events = this.events[name].slice();
		for (var i = 0, l = events.length; i < l; i++) events[i].apply(this, args);
	};

	var events = Events$1;

	var Utility = utility;
	var Events = events;

	function Model$1 () {}

	Model$1.prototype = Object.create(Events.prototype);
	Model$1.prototype.constructor = Model$1;

	Model$1.prototype.join = function () {
		return Array.prototype.join
		.call(arguments, '.')
		.replace(/\.{2,}/g, '.')
		.replace(/^\.|\.$/g, '');
	};

	Model$1.prototype.each = function (data, callback, index) {
		Object.keys(data).slice(index).forEach(function (key) {
			callback.call(this, data[key], key, data);
		}, this);
	};

	Model$1.prototype.every = function (data, callback, index, emit, path) {
		if (Utility.isCollection(data)) {
			this.each(data, function (value, key) {
				this.every(value, callback, 0, true, this.join(path, key));
			}, index);
		}

		if (emit) callback.call(this, data, path || '');
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

	Model$1.prototype.ins = function (data, key, value) {
		data._meta[key] = value;

		this.define(value, this.join(data._path, key), true);
		this.defineProperty(data, key);

		this.emit('*', this.join(data._path, key), value);
		this.emit('*', this.join(data._path), data);
	};

	Model$1.prototype.del = function (data, key) {
		if (Utility.is(data, 'Object')) {
			var item = data[key];
			delete data._meta[key];
			delete data[key];

			this.every(item, function (value, path) {
				path = this.join(data._path, key, path);
				this.emit('*', path, undefined);
			});

			this.emit('*', this.join(data._path, key), undefined);
		} else if (Utility.is(data, 'Array')) {
			data._meta.splice(key, 1);
			data.splice(data.length-1, 1);

			this.every(data, function (value, path) {
				path = this.join(data._path, path);

				// updateS _path to match index change
				if (Utility.isCollection(value)) value._path = path;
				this.emit('*', path, value);
			}, parseInt(key));

			this.emit('*', this.join(data._path, data.length), undefined);
			this.emit('*', this.join(data._path), data);
		}
	};

	Model$1.prototype.defineProperty = function (data, key) {
		Object.defineProperty(data, key, {
			enumerable: true,
			configurable: true,
			get: function () {
				return this._meta[key];
			},
			set: function (value) {
				if (value === undefined) {
					this.del(key);
				} else {
					this.ins(key, value);
				}
			}
		});
	};

	Model$1.prototype.define = function (data, path, emit) {
		if (!Utility.isCollection(data)) return;

		var self = this;

		Object.defineProperties(data, {
			_meta: {
				writable: true,
				configurable: true,
				value: data.constructor()
			},
			_path: {
				writable: true,
				configurable: true,
				value: path || ''
			},
			ins: {
				value: self.ins.bind(self, data)
			},
			del: {
				value: self.del.bind(self, data)
			}
		});

		Object.keys(data).forEach(function (key) {
			if (data[key] === undefined) return;

			data._meta[key] = data[key];

			this.define(data[key], this.join(path || '', key), emit);
			this.defineProperty(data, key);

			if (emit) this.emit('*', this.join(path || '', key), data[key]);
		}, this);

	};

	Model$1.prototype.setup = function (data) {
		this.data = data;
		this.define(this.data, null, true);
		return this;
	};

	Model$1.prototype.create = function () {
		this.events = {};
		return this;
	};

	var model = function (data) {
		return new Model$1().create(data);
	};

	var Utility$1 = utility;

	var attributes = {
		on: function () {
			var eventName = this.attribute.cmds[1];
			this.element.removeEventListener(eventName, this.data, false);
			this.element.addEventListener(eventName, this.data, false);
		},
		each: function () {
			if (this.length === undefined) {
				this.length = this.data.length;
				this.variable = this.attribute.cmds.slice(1).join('.');
				this.clone = this.element.removeChild(this.element.children[0]).outerHTML;
				this.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + this.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');

				this.data.forEach(function (data, index) {
					this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, '$1' + this.attribute.path + '.' + index + '$6'));
				}, this);

				this.view.add(this.element.getElementsByTagName('*'), true);
			} else if (this.length > this.data.length) {
				this.length--;
				this.element.removeChild(this.element.lastChild);
			} else if (this.length < this.data.length) {
				this.length++;
				this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, '$1' + this.attribute.path + '.' + (this.length-1) + '$6'));
				this.view.addOne(this.element.lastChild, true);
				this.view.add(this.element.lastChild.getElementsByTagName('*'), true);
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
			this.view.add(this.element.getElementsByTagName('*'), true);
		},
		css: function () {
			var css = this.data;
			if (this.attribute.cmds.length > 1) css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
			this.element.style.cssText += css;
			// if (this.attribute.cmds.length > 1) this.data = this.attribute.cmds.slice(1).join('-') + ': ' +  this.data + ';';
			// this.element.style.cssText += this.data;
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
			var path = Utility$1.toCamelCase(this.attribute.cmds);
			Utility$1.setByPath(this.element, path, this.data);
		}
	};

	var index$4 = {

		sViewElement: 'j-view',

		sPrefix: '(data-)?j-',
		sValue: '(data-)?j-value',
		sFor: '(data-)?j-for-(.*?)=',

		sAccepts: '(data-)?j-',
		sRejects: '^\w+(-\w+)+|^iframe|^object|^script',

		rPath: /\s?\|(.*?)$/,
		rPrefix: /(data-)?j-/,
		rValue: /(data-)?j-value/,
		rModifier: /^(.*?)\|\s?/,
		rFor: /(data-)?j-for-(.*?)=/,

		rAccepts: /(data-)?j-/,
		rRejects: /^\w+(-\w+)+|^iframe|^object|^script/,

		rAttributeAccepts: /(data-)?j-/,

		rElementAccepts: /(data-)?j-/,
		rElementRejectsChildren: /(data-)?j-each/,
		rElementRejects: /^\w+(-\w+)+|^iframe|^object|^script/

	};

	function Unit$1 () {}

	Unit$1.prototype.unrender = function () {
		// this.element.parentNode.removeChild(this.element);
		return this;
	};

	Unit$1.prototype.render = function () {
		this.method();
		return this;
	};

	Unit$1.prototype.create = function (options) {
		this.view = options.view;
		this.element = options.element;
		this.attribute = options.attribute;
		this.method = options.method.bind(this);

		Object.defineProperty(this, 'data', {
			enumerable: true,
			configurable: true,
			get: options.getter,
			set: options.setter
		});

		return this;
	};

	var unit = function (options) {
		return new Unit$1().create(options);
	};

	var Attributes = attributes;
	var Global$1 = index$4;
	var Unit = unit;

	var PATH = Global$1.rPath;
	var PREFIX = Global$1.rPrefix;
	var MODIFIERS = Global$1.rModifier;
	var ATTRIBUTE_ACCEPTS = Global$1.rAttributeAccepts;
	var ELEMENT_ACCEPTS = Global$1.rElementAccepts;
	var ELEMENT_REJECTS = Global$1.rElementRejects;
	var ELEMENT_REJECTS_CHILDREN = Global$1.rElementRejectsChildren;

	function View$1 () {}

	View$1.prototype.glance = function (element) {
		return element.outerHTML
		.replace(/\/?>([\s\S])*/, '')
		.replace(/^</, '');
	};

	View$1.prototype.eachElement = function (elements, callback) {
		var element, glance;

		for (var i = 0; i < elements.length; i++) {
			element = elements[i];
			glance = this.glance(element);

			if (ELEMENT_REJECTS.test(glance)) {
				i += element.querySelectorAll('*').length;
			} else if (ELEMENT_REJECTS_CHILDREN.test(glance)) {
				i += element.querySelectorAll('*').length;
				callback(element);
			} else if (ELEMENT_ACCEPTS.test(glance)) {
				callback(element);
			}
		}
	};

	View$1.prototype.eachAttribute = function (element, callback) {
		var attributes$$1 = element.attributes, attribute;

		for (var i = 0; i < attributes$$1.length; i++) {
			attribute = {};
			attribute.name = attributes$$1[i].name;
			attribute.value = attributes$$1[i].value;

			if (ATTRIBUTE_ACCEPTS.test(attribute.name)) {
				attribute.path = attribute.value.replace(PATH, '');
				attribute.opts = attribute.path.split('.');
				attribute.command = attribute.name.replace(PREFIX, '');
				attribute.cmds = attribute.command.split('-');

				if (attribute.value.indexOf('|') === -1) {
					attribute.modifiers = [];
				} else {
					attribute.modifiers = attribute.value.replace(MODIFIERS, '').split(' ');
				}

				callback(attribute);
			}

		}
	};

	View$1.prototype.removeAll = function (pattern) {
		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

		Object.keys(this.data).forEach(function (path) {
			this.data[path].forEach(function (_, index) {
				if (pattern.test(path + '.' + index)) {
					this.data[path][index].unrender();
					this.data[path].splice(index, 1);
				}
			}, this);
		}, this);
	};

	View$1.prototype.renderAll = function (path) {
		(this.data[path] || []).forEach(function (unit$$1) {
			unit$$1.render();
		}, this);
	};

	View$1.prototype.addOne = function (element, render) {
		var self = this, unit$$1;

		self.eachAttribute(element, function (attribute) {

			if (!(attribute.path in self.data)) self.data[attribute.path] = [];

			unit$$1 = Unit({
				view: self,
				element: element,
				attribute: attribute,
				method: Attributes[attribute.cmds[0]] || Attributes['default'],
				getter: self.getter,
				setter: self.setter
			});

			if (render) unit$$1.render();

			self.data[attribute.path].push(unit$$1);

		});

		return self;
	};

	View$1.prototype.add = function (elements, render) {
		var self = this, unit$$1;

		self.eachElement(elements, function (element) {
			self.eachAttribute(element, function (attribute) {

				if (!(attribute.path in self.data)) self.data[attribute.path] = [];

				unit$$1 = Unit({
					view: self,
					element: element,
					attribute: attribute,
					method: Attributes[attribute.cmds[0]] || Attributes['default'],
					getter: self.getter,
					setter: self.setter
				});

				if (render) unit$$1.render();

				self.data[attribute.path].push(unit$$1);

			});
		});

		return self;
	};

	View$1.prototype.setup = function (options) {
		this.setter = options.setter;
		this.getter = options.getter;
		this.data = {};
		this.add(options.elements);
		return self;
	};

	View$1.prototype.create = function () {
		return this;
	};

	var view = function () {
		return new View$1().create();
	};

	var Model = model;
	var View = view;

	function Binder$2 () {}

	Binder$2.prototype.setup = function (options) {
		var self = this;

		Object.defineProperties(self, {
			name: {
				value: options.name
			},
			modifiers: {
				value: options.modifiers || {}
			},
			_view: {
				value: View()
			},
			_model: {
				value: Model()
			},
			view: {
				enumerable: true,
				get: function () {
					return self._view.data;
				}
			},
			model: {
				enumerable: true,
				get: function () {
					return self._model.data;
				}
			},
			elements: {
				get: function () {
					return (options.view.shadowRoot || options.view).querySelectorAll('*');
				}
			}
		});

		self._model.on('*', function (path, value) {
			// console.log(path);
			// console.log(value);
			// console.log('\n');

			if (value === undefined) {
				self._view.removeAll('^' + path + '.*');
			} else {
				self._view.renderAll(path);
			}

		});

		self._view.setup({
			elements: (options.view.shadowRoot || options.view).querySelectorAll('*'),
			getter: function () {
				this._data = self._model.get(this.attribute.path);

				this.attribute.modifiers.forEach(function (modifier) {
					this._data = self.modifiers[modifier].call(this._data);
				}, this);

				return this._data;
			},
			setter: function (value) {
				this._data = self._model.set(this.attribute.path, value);
			}
		});

		self._model.setup(options.model || {});

		return self;
	};

	Binder$2.prototype.create = function (options, callback) {
		var self = this;

		if (options.model && typeof options.model === 'function') {
			options.model.call(self, function (model$$1) {
				options.model = model$$1;
				self.setup(options);
				if (callback) return callback.call(self);
			});
		} else {
			self.setup(options);
			if (callback) return callback.call(self);
		}

		return self;
	};

	var index$2 = function (options, callback) {
		return new Binder$2().create(options, callback);
	};

	// https://gist.github.com/Wind4/3baa40b26b89b686e4f2

	var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

	var index$6 = function () {
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
	var Uuid = index$6;

	function Component$1 () {}

	Component$1.prototype.comment = function (method) {
		if (typeof method !== 'function') throw new Error('Comment must be a function');
		var comment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;
		var match = comment.exec(method.toString());
		if (!match) throw new Error('Comment missing');
		return match[1];
	};

	Component$1.prototype.dom = function (string) {
		var temporary = document.createElement('div');
		temporary.innerHTML = string;
		return temporary.children[0];
	};

	Component$1.prototype._template = function (template) {
		if (template.constructor.name === 'Function') {
			template = this.comment(template);
			template = this.dom(template);
		} else if (template.constructor.name === 'String') {
			if (/<|>/.test(template)) {
				template = this.dom(template);
			} else {
				template = this.currentScript.ownerDocument.querySelector(template);
			}
		}

		return template;
	};

	Component$1.prototype.define = function (name, options) {
		return document.registerElement(name, {
			prototype: Object.create(HTMLElement.prototype, options)
		});
	};

	Component$1.prototype.create = function (options) {
		if (!options) throw new Error('missing options');
		if (!options.name) throw new Error('missing options.name');
		if (!options.template) throw new Error('missing options.template');

		var self = this;

		self.name = options.name;
		self.model = options.model;
		self.modifiers = options.modifiers;
		self.currentScript = (document._currentScript || document.currentScript);
		self.template = self._template(options.template);

		if (options.created) self.created = options.created.bind(self);
		if (options.attached) self.attached = options.attached.bind(self);
		if (options.detached) self.detached = options.detached.bind(self);
		if (options.attributed) self.attributed = options.attributed.bind(self);

		self.proto = self.define(self.name, {
			attachedCallback: { value: self.attached },
			detachedCallback: { value: self.detached },
			attributeChangedCallback: { value: self.attributed },
			createdCallback: {
				value: function () {
					self.element = this;
					self.uuid = Uuid();
					self.element.appendChild(document.importNode(self.template.content, true));

					if (self.model) {
						self.binder = Binder$1({
							name: self.uuid,
							model: self.model,
							view: self.element,
							modifiers: self.modifiers
						}, function () {
							self.model = this.model;
							if (self.created) self.created.call(self);
						});
					} else {
						if (self.created) self.created.call(self);
					}

				}
			}
		});

		return self;
	};

	var index = function (options) {
		return new Component$1().create(options);
	};

	var Utility$2 = utility;

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
			if (Utility$2.has(href, 'mailto:')) return;
			if (Utility$2.has(href, 'tel:')) return;
			if (Utility$2.has(href, 'file:')) return;
			if (Utility$2.has(href, 'ftp:')) return;

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
		if (route.constructor.name === 'Object') this.routes.push(route);
		else if (route.constructor.name === 'Array') this.routes = this.routes.concat(route);
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

		for (var r, i = 0, l = this.routes.length; i < l; i++) {
			r = this.routes[i];

			if (typeof r.path === 'string') {
				if (r.path === path) {
					return r;
				}
			} else if (typeof r.path === 'function') {
				if (r.path.test(path)) {
					return r;
				}
			}

		}

		throw new Error('could not find ' + path + ' in routes');

	};

	Router$1.prototype.navigate = function (data, replace) {

		if (typeof data === 'string') {
			this.state.url = this.url(data);
			this.state.route = this.get(this.state.url.path);
		} else {
			this.state = data;
		}

		// update state with scroll position
		window.history.state.scroll = { x: window.pageXOffset, y: window.pageYOffset };
		window.history.replaceState(window.history.state, window.history.state.route.title, window.history.state.url.href);

		// add state
		window.history[replace ? 'replaceState' : 'pushState'](this.state, this.state.route.title, this.state.url.href);

		if (this.state.route.redirect) this.redirect(this.state.route);
		else this.render(this.state.route);

		if (window.history.state.scroll && (window.history.state.scroll.x !== 0 || window.history.state.scroll.y !== 0)) {
			this.scroll(window.history.state.scroll.x, window.history.state.scroll.y);
		}

		return this;
	};

	var index$8 = function (options) {
		return new Router$1(options);
	};

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

	Http$1.prototype.create = function () {
		var self = this;

		return self;
	};

	var index$10 = function () {
		return new Http$1().create();
	};

	/*
		@banner
		name: jenie
		version: 1.0.93
		author: alexander elias
	*/

	var Component = index;
	var Global = index$4;
	var Binder = index$2;
	var Router = index$8;
	var Http = index$10;

	var S_VIEW_ELEMENT = Global.sViewElement;

	document.registerElement(S_VIEW_ELEMENT, {
		prototype: Object.create(HTMLElement.prototype)
	});

	var jenie_b = {
		services: {},
		http: Http(),
		component: function (options) {
			return Component(options);
		},
		binder: function (options, callback) {
			return Binder(options, callback);
		},
		router: function (options) {
			return this.router = Router(options);
		},
		query: function (query) {
			return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
		},
		script: function () {
			return (document._currentScript || document.currentScript);
		},
		document: function () {
			return (document._currentScript || document.currentScript).ownerDocument;
		}
	};

	return jenie_b;

})));
