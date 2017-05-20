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
		setByPath: function (collection, path, value) {
			var keys = path.split('.');
			var last = keys.length - 1;

			for (var i = 0, key; i < last; i++) {
				key = keys[i];
				if (collection[key] === undefined) collection[key] = {};
				collection = collection[key];
			}

			return collection[keys[last]] = value;
		}
	};

	function Events$1 () {
		this.events = {};
	}

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

	function Model$1 () {
		Events.call(this);
	}

	Model$1.prototype = Object.create(Events.prototype);
	Model$1.prototype.constructor = Model$1;

	Model$1.prototype.join = function () {
		return Array.prototype.join
		.call(arguments, '.')
		.replace(/\.{2,}/g, '.')
		.replace(/^\.|\.$/g, '');
	};

	Model$1.prototype.isCollection = function (data) {
		return data && (data.constructor.name === 'Object' || data.constructor.name === 'Array');
	};

	Model$1.prototype.clone = function (source, target) {
		var self = this;

		target = target || source.constructor();

		Object.keys(source).forEach(function (key) {

			if (self.isCollection(source[key])) {
				target[key] = self.clone(source[key]);
			} else {
				target[key] = source[key];
			}

		});

		return target;
	};

	Model$1.prototype.defineSplice = function (path, data, argument) {
		var self = this;

		Array.prototype.slice.call(argument, 2).forEach(function (value) {

			if (self.isCollection(value)) value = self.observeCollection(path, value);
			Array.prototype.splice.call(data.meta, argument[0], argument[1], value);
			self.observeProperty(path, data, data.meta.length-1);
			self.emit('change', self.join(path), data);

		});

	};

	Model$1.prototype.defineSplice = function (path, data, argument) {
		var self = this;

		Array.prototype.slice.call(argument, 2).forEach(function (value) {

			if (self.isCollection(value)) value = self.observeCollection(path, value);
			Array.prototype.splice.call(data.meta, argument[0], argument[1], value);
			self.observeProperty(path, data, data.meta.length-1);
			self.emit('change', self.join(path), data);

		});

	};

	Model$1.prototype.arrayPushUnshift = function (path, data, method, argument) {
		var self = this;

		Array.prototype.forEach.call(argument, function (value) {

			if (self.isCollection(value)) value = self.observeCollection(path, value);
			Array.prototype[method].call(data.meta, value);
			self.observeProperty(path, data, data.meta.length-1);
			self.emit('change', self.join(path), data);

		});

	};

	Model$1.prototype.arrayPopShift = function (path, data, method) {
		var self = this;

		Array.prototype[method].call(data.meta);
		Array.prototype['pop'].call(data);
		self.emit('change', self.join(path), data);

	};

	Model$1.prototype.defineArray = function (path, data) {
		var self = this;

		return Object.defineProperties(data, {
			splice: {
				value: function () {
					return self.defineSplice(path, this, arguments);
				}
			},
			push: {
				value: function () {
					return self.arrayPushUnshift(path, this, 'push', arguments);
				}
			},
			unshift: {
				value: function () {
					return self.arrayPushUnshift(path, this, 'unshift', arguments);
				}
			},
			pop: {
				value: function () {
					return self.arrayPopShift(path, this, 'pop');
				}
			},
			shift: {
				value: function () {
					return self.arrayPopShift(path, this, 'shift');
				}
			}
		});

	};

	Model$1.prototype.defineObject = function (path, data) {
		var self = this;

		return Object.defineProperties(data, {
			set: {
				value: function (key, value) {

					if (this.isCollection(value)) {
						this.meta[key] = self.observeCollection(path, value);
					} else {
						this.meta[key] = value;
					}

					self.observeProperty(path, this, key);
					self.emit('change', self.join(path, key), this[key]);

				}
			},
			remove: {
				value: function (key) {

					delete this[key];
					delete this.meta[key];
					self.emit('change', self.join(path, key), undefined);

				}
			}
		});

	};

	Model$1.prototype.observeProperty = function (path, data, key) {
		var self = this;

		return Object.defineProperty(data, key, {
			enumerable: true,
			configurable: true,
			get: function () {
				return this.meta[key];
			},
			set: function (value) {

				if (value === undefined) {

					delete this[key];
					delete this.meta[key];
					self.emit('change', self.join(path, key), undefined);

				} else {

					if (self.isCollection(value)) {
						this.meta[key] = self.observeCollection(self.join(path, key), value);
					} else {
						this.meta[key] = value;
					}

					self.emit('change', self.join(path, key), this[key]);

				}

			}
		});

	};

	Model$1.prototype.observeCollection = function (path, source) {
		var self = this;

		var type = source ? source.constructor.name : '';
		if (type !== 'Object' && type !== 'Array' ) return source;

		var target = self.clone(source);

		if (type === 'Object') {
			self.defineObject(path, target);
		} else if (type === 'Array') {
			self.defineArray(path, target);
		}

		Object.defineProperty(target, 'meta', {
			writable: true,
			configurable: true,
			value: target.constructor()
		});

		Object.keys(target).forEach(function (key) {

			if (target[key] !== undefined) {

				if (self.isCollection(target[key])) {
					target[key] = self.observeCollection(self.join(path, key), target[key]);
				}

				target.meta[key] = target[key];
				self.observeProperty(path, target, key);

			}

		});

		return target;
	};

	Model$1.prototype.set = function (path, value) {
		return Utility.setByPath(this.data, path, value);
	};

	Model$1.prototype.get = function (path) {
		return Utility.getByPath(this.data, path);
	};

	Model$1.prototype.setup = function (data) {
		this.data = this.observeCollection('', data);
		return this;
	};

	Model$1.prototype.create = function () {
		this.events = {};
		return this;
	};

	var model = function (data) {
		return new Model$1().create(data);
	};

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

	var global = {

		// sViewElement: 'j-view',

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

	var Collection = collection;
	var Events$2 = events;
	var Global = global;

	var PATH = Global.rPath;
	var PREFIX = Global.rPrefix;
	var MODIFIERS = Global.rModifier;
	var ATTRIBUTE_ACCEPTS = Global.rAttributeAccepts;
	var ELEMENT_ACCEPTS = Global.rElementAccepts;
	var ELEMENT_REJECTS = Global.rElementRejects;
	var ELEMENT_REJECTS_CHILDREN = Global.rElementRejectsChildren;

	function View$1 () {
		Events$2.call(this);
	}

	View$1.prototype = Object.create(Events$2.prototype);
	View$1.prototype.constructor = View$1;

	View$1.prototype.preview = function (element) {
		return element.outerHTML
		.replace(/\/?>([\s\S])*/, '')
		.replace(/^</, '');
	};

	View$1.prototype.eachElement = function (elements, callback) {
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			var preview = this.preview(element);

			if (ELEMENT_REJECTS.test(preview)) {
				i += element.querySelectorAll('*').length;
			} else if (ELEMENT_REJECTS_CHILDREN.test(preview)) {
				i += element.querySelectorAll('*').length;
				callback.call(this, element);
			} else if (ELEMENT_ACCEPTS.test(preview)) {
				callback.call(this, element);
			}
		}
	};

	View$1.prototype.eachAttribute = function (element, callback) {
		Array.prototype.forEach.call(element.attributes, function (ea) {
			if (ATTRIBUTE_ACCEPTS.test(ea.name)) {
				var attribute = {};
				attribute.name = ea.name;
				attribute.value = ea.value;
				attribute.path = attribute.value.replace(PATH, '');
				attribute.opts = attribute.path.split('.');
				attribute.command = attribute.name.replace(PREFIX, '');
				attribute.cmds = attribute.command.split('-');
				attribute.key = attribute.opts.slice(-1);
				attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(MODIFIERS, '').split(' ');
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

			self.emit('add', element, attribute);
		});
	};

	View$1.prototype.addAll = function (elements) {
		this.eachElement(elements, function (element) {
			this.addOne(element);
		});
	};

	View$1.prototype.setup = function (elements) {
		this.elements = elements;
		this.addAll(this.elements);
		return this;
	};

	View$1.prototype.create = function () {
		this.data = new Collection();
		return this;
	};

	var view = function () {
		return new View$1().create();
	};

	var Utility$1 = utility;

	function Unit$1 () {}

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
			var path = Utility$1.toCamelCase(this.attribute.cmds);
			Utility$1.setByPath(this.element, path, this.data);
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
		this.unrenderMethod();
		return this;
	};

	Unit$1.prototype.render = function () {
		this.renderMethod();
		return this;
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

	// var Utility = require('../utility');
	var Model = model;
	var View = view;
	var Unit = unit;

	function Binder$2 () {}

	Binder$2.prototype.setup = function (options) {
		var self = this;

		self._view = View();
		self._model = Model();
		self.name = options.name;
		self.modifiers = options.modifiers || {};

		self._model.on('change', function (path, data) {		
			if (data === undefined) {
				self._view.unrenderAll('^' + path + '.*');
			} else {
				self._view.renderAll('^' + path);
			}
		});

		self._view.on('add', function (element, attribute) {
			// var path = attribute.opts.slice(0, -1).join('.');

			self._view.data.get(attribute.path).push(Unit({
				view: self._view,
				model: self._model,
				element: element,
				attribute: attribute,
				// _data: path === '' ? self._model.data : Utility.getByPath(self._model.data, path),
				modifiers: attribute.modifiers.map(function (modifier) {
					return self.modifiers[modifier];
				})
			}));

		});

		self._model.setup(options.model || {});
		self._view.setup((options.view.shadowRoot || options.view).querySelectorAll('*'));

		self.model = self._model.data;
		self.view = self._view.data;

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
		console.log('navigate');

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

	var index$4 = function (options) {
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
		return this;
	};

	var http = function () {
		return new Http$1().create();
	};

	/*
		@banner
		name: jenie
		version: 1.1.2
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
