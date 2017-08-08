(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Jenie', factory) :
	(global.Jenie = factory());
}(this, (function () { 'use strict';

	var Utility = {

		setByPath: function (collection, path, value) {
			var keys = path.split('.');
			var last = keys.length - 1;

			for (var i = 0, key; i < last; i++) {
				key = keys[i];
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

		toCamelCase: function (data) {
			if (data.constructor.name === 'Array') data = data.join('-');
			return data.replace(/-[a-z]/g, function (match) {
				return match[1].toUpperCase();
			});
		}

	};

	function Binder (options) {
		var self = this;

		self.data = options.data;
		self.view = options.view;
		self.model = options.model;
		self.events = options.events;
		self.element = options.element;
		self.attribute = options.attribute;
		self.modifiers = options.modifiers;

		self.renderMethod = (self.renderMethods[self.attribute.cmds[0]] || self.renderMethods['default']).bind(self);
		self.unrenderMethod = (self.unrenderMethods[self.attribute.cmds[0]] || self.unrenderMethods['default']).bind(self);

		Object.defineProperty(self, 'data', {
			enumerable: true,
			configurable: true,
			get: function () {
				var data = Utility.getByPath(self.model.data, self.attribute.path);

				self.modifiers.forEach(function (modifier) {
					data = modifier.call(data);
				});

				return data;
			},
			set: function (value) {

				self.modifiers.forEach(function (modifier) {
					value = modifier.call(value);
				});

				return Utility.setByPath(self.model.data, self.attribute.path, value);
			}
		});

		self.renderMethod();
	}

	Binder.prototype.renderMethods = {
		on: function () {
			var self = this;

			if (!self.eventName) {
				self.eventName = self.attribute.cmds[1];
				self.eventMethod = Utility.getByPath(self.events, self.attribute.path).bind(self.model.data);
			}

			self.element.removeEventListener(self.eventName, self.eventMethod);
			self.element.addEventListener(self.eventName, self.eventMethod);
		},
		each: function () {
			var self = this;

			self.data = self.data || [];

			if (!self.clone) {
				self.variable = self.attribute.cmds.slice(1).join('.');
				self.clone = self.element.removeChild(self.element.children[0]).outerHTML;
				self.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + self.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
			}

			if (self.element.children.length > self.data.length) {
				while (self.element.children.length > self.data.length) {
					self.view.removeAll(self.element.children[self.element.children.length-1].querySelectorAll('*'));
					self.view.removeOne(self.element.children[self.element.children.length-1]);
					self.element.removeChild(self.element.children[self.element.children.length-1]);
				}
			} else if (self.element.children.length < self.data.length) {
				while (self.element.children.length < self.data.length) {
					self.element.insertAdjacentHTML(
						'beforeend',
						self.clone.replace(
							self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
						)
					);
					self.view.addAll(self.element.children[self.element.children.length-1].querySelectorAll('*'));
					self.view.addOne(self.element.children[self.element.children.length-1]);
				}
			}

		},
		value: function () {
			var self = this;

			if (self.change) return;
			if (self.element.type === 'button' || self.element.type === 'reset') return self.change = true;

			self.change = function () {
				self.data = self.element.type !== 'radio' && self.element.type !== 'checked' ? self.element.value : self.element.checked;
			};

			self.element.addEventListener('change', self.change.bind(self), true);
			self.element.addEventListener('keyup', self.change.bind(self), true);
		},
		html: function () {
			this.element.innerHTML = this.data;
			this.view.addAll(this.element.querySelectorAll('*'));
		},
		css: function () {
			var css = this.data;

			if (this.attribute.cmds.length > 1) {
				css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
			}

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
			var path = Utility.toCamelCase(this.attribute.cmds);
			Utility.setByPath(this.element, path, this.data);
		}
	};

	Binder.prototype.unrenderMethods = {
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
			this.element.innerText = '';
		},
		text: function () {
			this.element.innerText = '';
		},
		default: function () {

		}
	};

	Binder.prototype.unrender = function () {
		this.unrenderMethod();
		return this;
	};

	Binder.prototype.render = function () {
		this.renderMethod();
		return this;
	};

	function Model () {}

	Model.prototype.join = function () {
		return Array.prototype.join
		.call(arguments, '.')
		.replace(/\.{2,}/g, '.')
		.replace(/^\.|\.$/g, '');
	};

	Model.prototype.isCollection = function (data) {
		return data && (data.constructor.name === 'Object' || data.constructor.name === 'Array');
	};

	Model.prototype.defineSplice = function (path, meta, target, argument) {
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

	Model.prototype.arrayPushUnshift = function (path, meta, target, method, argument) {
		var self = this;

		Array.prototype.forEach.call(argument, function (value) {

			value = self.defineCollection(path, value);
			Array.prototype[method].call(meta, value);
			target = self.defineProperty(path, meta, target, meta.length-1);
			self.emit(self.join(path), target);

		});

	};

	Model.prototype.arrayPopShift = function (path, meta, target, method) {
		var self = this;

		Array.prototype[method].call(meta);
		Array.prototype.pop.call(target);
		self.emit(self.join(path), target);

	};

	Model.prototype.defineArray = function (path, meta, target) {
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

	Model.prototype.defineObject = function (path, meta, target) {
		var self = this;

		return Object.defineProperties(target, {
			$set: {
				value: function (key, value) {

					if (self.isCollection(value)) {
						value = self.defineCollection(self.join(path, key), value);
					}

					meta[key] = value;
					target = self.defineProperty(path, meta, target, key);
					self.emit(self.join(path, key), target[key]);

				}
			},
			$remove: {
				value: function (key) {

					delete target[key];
					delete meta[key];
					self.emit(self.join(path, key), undefined);

				}
			}
		});

	};

	Model.prototype.defineProperty = function (path, meta, target, key) {
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

	Model.prototype.defineCollection = function (path, source) {
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

	Model.prototype.listener = function (listener) {
		this.emit = listener;
	};

	Model.prototype.run = function (data) {
		this.data = this.defineCollection('', data);
	};

	function Collection (data) {
		Object.defineProperty(this, 'data', {
			value: data || []
		});
	}

	Collection.prototype.get = function (key) {
		for (var i = 0; i < this.data.length; i++) {
			if (key === this.data[i][0]) {
				return this.data[i][1];
			}
		}
	};

	Collection.prototype.remove = function (key) {
		for (var i = 0; i < this.data.length; i++) {
			if (key === this.data[i][0]) {
				return this.data.splice(i, 1)[0][1];
			}
		}
	};

	Collection.prototype.removeById = function (id) {
		return this.data.splice(id, 1);
	};

	Collection.prototype.has = function (key) {
		for (var i = 0; i < this.data.length; i++) {
			if (key === this.data[i][0]) {
				return true;
			}
		}

		return false;
	};

	Collection.prototype.set = function (key, value) {
		for (var i = 0; i < this.data.length; i++) {
			if (key === this.data[i][0]) {
				return this.data[i][1] = value;
			}
		}

		return this.data[this.data.length] = [key, value];
	};

	Collection.prototype.push = function (value) {
		this.data[this.data.length] = [this.data.length, value];
		return value;
	};

	Collection.prototype.size = function () {
		return this.data.length;
	};

	Collection.prototype.forEach = function (callback, context) {
		context = context || null;

		for (var i = 0; i < this.data.length; i++) {
			callback.call(context, this.data[i][1], this.data[i][0], i, this.data);
		}
	};

	function View () {
		this.data = new Collection();
	}

	View.prototype.regexp = {
		PATH: /\s?\|(.*?)$/,
		PREFIX: /(data-)?j-/,
		MODIFIERS: /^(.*?)\|\s?/,
		ATTRIBUTE_ACCEPTS: /(data-)?j-/,
		ELEMENT_ACCEPTS: /(data-)?j-/,
		ELEMENT_REJECTS_CHILDREN: /(data-)?j-each/,
		ELEMENT_REJECTS: /^\w+(-\w+)+|^iframe|^object|^script|^style|^svg/
	};

	View.prototype.preview = function (element) {
		return element.outerHTML
		.replace(/\/?>([\s\S])*/, '')
		.replace(/^</, '');
	};

	View.prototype.eachElement = function (elements, callback) {
		for (var i = 0, l = elements.length; i < l; i++) {
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

	View.prototype.eachAttribute = function (element, callback) {
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

	View.prototype.unrenderAll = function (pattern) {
		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

		this.data.forEach(function (paths, path) {
			paths.forEach(function (unit) {
				if (pattern.test(path)) {
					unit.unrender();
				}
			}, this);
		}, this);
	};

	View.prototype.renderAll = function (pattern) {
		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

		this.data.forEach(function (paths, path) {
			paths.forEach(function (unit) {
				if (pattern.test(path)) {
					unit.render();
				}
			}, this);
		}, this);
	};

	View.prototype.removeOne = function (element) {
		this.data.forEach(function (paths, _, did) {
			paths.forEach(function (unit, _, pid) {

				if (element === unit.element) {

					paths.removeById(pid);

					if (paths.size() === 0) {
						this.data.removeById(did);
					}

				}

			}, this);
		}, this);
	};

	View.prototype.removeAll = function (elements) {
		Array.prototype.forEach.call(elements, function (element) {
			this.removeOne(element);
		}, this);
	};

	View.prototype.addOne = function (element) {
		this.eachAttribute(element, function (attribute) {

			if (!this.data.has(attribute.path)) {
				this.data.set(attribute.path, new Collection());
			}

			this.emit(element, attribute);
		});
	};

	View.prototype.addAll = function (elements) {
		this.eachElement(elements, function (element) {
			this.addOne(element);
		});
	};

	View.prototype.listener = function (listener) {
		this.emit = listener;
	};

	View.prototype.run = function (elements) {
		this.elements = elements;
		this.addAll(this.elements);
	};

	function Controller (options, callback) {
		var self = this;

		self.view = new View();
		self.model = new Model();

		self.events = options.events || {};
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
			self.view.data.get(attribute.path).push(new Binder({
				view: self.view,
				model: self.model,
				events: self.events,
				element: element,
				attribute: attribute,
				modifiers: attribute.modifiers.map(function (modifier) {
					return self.modifiers[modifier];
				})
			}));
		});

		if (typeof options.model === 'function') {
			self._model.call(self, function (model) {
				self._model = model;
				self.model.run(self._model);
				self.view.run(self._view);
				if (callback) return callback.call(self);
			});
		} else {
			self.model.run(self._model);
			self.view.run(self._view);
			if (callback) callback.call(self);
		}

	}

	// https://gist.github.com/Wind4/3baa40b26b89b686e4f2

	var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

	var Uuid = function (length) {
		var uuid = [], i;

		if (length) {

			for (i = 0; i < length; i++) {
				uuid[i] = chars[0 | Math.random() * length];
			}

		} else {

			// rfc4122, version 4 form
			var r;

			// rfc4122 requires these characters
			uuid[8] = '-', uuid[13] = '-', uuid[14] = '4', uuid[18] = '-', uuid[23] = '-';

			// Fill in random data. At i==19 set the high bits of clock sequence as per rfc4122, sec. 4.1.5
			for (i = 0; i < 36; i++) {
				if (!uuid[i]) {
					r = 0 | Math.random() * 16;
					uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
				}
			}

		}

		return uuid.join('');
	};

	// https://gist.github.com/jed/982883
	// function uuid (a) {
	// 	return a                 // if the placeholder was passed, return
	// 		? (                  // a random number from 0 to 15
	// 			a ^              // unless b is 8,
	// 			Math.random()	 // in which case
	// 			* 16             // a random number from
	// 			>> a / 4         // 8 to 11
	// 			).toString(16)   // in hexadecimal
	// 		: (                  // or otherwise a concatenated string:
	// 			[1e7] +          // 10000000 +
	// 			-1e3 +           // -1000 +
	// 			-4e3 +           // -4000 +
	// 			-8e3 +           // -80000000 +
	// 			-1e11            // -100000000000,
	// 			).replace(       // replacing
	// 				/[018]/g,    // zeroes, ones, and eights with
	// 				uuid         // random hex digits
	// 			);
	// }

	function Component (options) {
		var self = this;

		options = options || {};

		if (!options.name) throw new Error('Component missing options.name');
		if (!options.template) throw new Error('Component missing options.template');

		self.name = options.name;
		self.model = options.model;
		self.style = options.style;
		self.events = options.events;
		self.modifiers = options.modifiers;
		self.currentScript = (document._currentScript || document.currentScript);
		self.template = self.toTemplate(options.template);

		self.proto = Object.create(HTMLElement.prototype);

		self.proto.attachedCallback = options.attached;
		self.proto.detachedCallback = options.detached;
		self.proto.attributeChangedCallback = options.attributed;

		self.proto.createdCallback = function () {
			self.element = this;
			self.element.uuid = Uuid();

			// handle slots
			// might want to handle default slot
			// might want to overwrite content
			self.slotify();

			self.element.appendChild(
				document.importNode(self.template.content, true)
			);

			if (self.model) {
				self.element.controller = new Controller({
					model: self.model,
					view: self.element,
					events: self.events,
					name: self.element.uuid,
					modifiers: self.modifiers
				}, function () {
					self.element.view = this.view.data;
					self.element.model = this.model.data;
					if (options.created) options.created.call(self.element);
				});
			} else if (options.created) {
				options.created.call(self.element);
			}

		};

		self.define();

	}

	Component.prototype.slotify = function () {
		var self = this;
		var eSlots = self.element.querySelectorAll('[slot]');

		for (var i = 0, l = eSlots.length; i < l; i++) {
			var eSlot = eSlots[i];
			var sName = eSlot.getAttribute('slot');
			var tSlot = self.template.content.querySelector('slot[name='+ sName + ']');
			tSlot.parentNode.replaceChild(eSlot, tSlot);
		}
	};

	Component.prototype.toDom = function (string) {
		var template = document.createElement('template');
		template.innerHTML = string;
		return template;
	};

	Component.prototype.toTemplate = function (template) {

		if (template.constructor.name === 'String') {
			if (/<|>/.test(template)) {
				template = this.toDom(template);
			} else {
				template = this.currentScript.ownerDocument.querySelector(template);
			}
		}

		return template;
	};

	Component.prototype.define = function () {
		document.registerElement(this.name, {
			prototype: this.proto
		});
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
		options = options || {};

		Events.call(this);

		this.state = {};
		this.cache = {};
		this.origin = window.location.origin;

		this.external = options.external;
		this.routes = options.routes || [];
		this.view = options.view || 'j-view';

		this.hash = !options.hash ? false : options.hash;
		this.contain = !options.contain ? false : options.contain;

		this.base = options.base || '';

		Object.defineProperty(this, 'root', {
			enumerable: true,
			get: function () {
				return this.hash ? '/#/' : '/';
			}
		});

		document.registerElement('j-view', {
			prototype: Object.create(HTMLElement.prototype)
		});

	}

	Router.prototype = Object.create(Events.prototype);
	Router.prototype.constructor = Router;

	Router.prototype._popstate = function (e) {
		this.navigate(e.state || window.location.href, true);
	};

	Router.prototype._click = function (e) {
		var self = this;

		if (e.metaKey || e.ctrlKey || e.shiftKey) return;

		// ensure target is anchor tag use shadow dom if available
		var target = e.path ? e.path[0] : e.target;
		while (target && 'A' !== target.nodeName) target = target.parentNode;

		if (!target || 'A' !== target.nodeName) return;

		// if external is true then default action
		if (self.external && (
			self.external.constructor.name === 'Function' && self.external(target.href) ||
			self.external.constructor.name === 'RegExp' && self.external.test(target.href) ||
			self.external.constructor.name === 'String' && new RegExp(self.external).test(target.href)
		)) return;

		// check non acceptable attributes and href
		if (target.hasAttribute('download') ||
			target.hasAttribute('external') ||
			target.href.indexOf('mailto:') !== -1 ||
			target.href.indexOf('file:') !== -1 ||
			target.href.indexOf('tel:') !== -1 ||
			target.href.indexOf('ftp:') !== -1
		) return;

		e.preventDefault();
		self.navigate(target.href);
	};

	Router.prototype._load = function (callback) {
		this.view = typeof this.view === 'string' ? document.querySelector(this.view) : this.view;

		(this.contain ? this.view : window).addEventListener('click', this._click.bind(this));
		window.addEventListener('popstate', this._popstate.bind(this));
		window.removeEventListener('DOMContentLoaded', this._load);

		this.navigate(window.location.href, true);

		if (callback) return callback();
	};

	Router.prototype.listen = function (options, callback) {

		if (options) {
			for (var key in options) {
				this[key] = options[key];
			}
		}

		if (document.readyState === 'complete' || document.readyState === 'loaded') {
			this._load(callback);
		} else {
			window.addEventListener('DOMContentLoaded', this._load.bind(this, callback), true);
		}

	};

	Router.prototype.normalize = function (path) {
		path = decodeURI(path)
			.replace(/\/{2,}/g, '/')
			.replace(/(http(s)?:\/)/, '$1/')
			.replace(/\?.*?/, '');

		if (!this.hash) path = path.replace(/#.*?$/, '');

		return 	path = path === '' ? '/' : path;
	};

	Router.prototype.parse = function (path) {
		return new RegExp('^'+ path
			.replace(/{\*}/g, '(?:.*)')
			.replace(/{(\w+)}/g, '([^\/]+)')
			+ '(\/)?$'
		);
	};

	Router.prototype.parameters = function (routePath, userPath) {
		var name;
		var parameters = {};
		var brackets = /{|}/g;
		var pattern = /{(\w+)}/;
		var userPaths = userPath.split('/');
		var routePaths = routePath.split('/');

		for (var i = 0, l = routePaths.length, path; i < l; i++) {
			path = routePaths[i];

			if (pattern.test(path)) {
				name = path.replace(brackets, '');
				parameters[name] = userPaths[i];
			}
		}

		return parameters;
	};

	Router.prototype.join = function () {
		return this.normalize(Array.prototype.join.call(arguments, '/'));
	};

	Router.prototype.scroll = function (x, y) {
		window.scroll(x, y);
	};

	Router.prototype.url = function (path) {
		var url = {};

		url.path = path;
		url.base = this.base;
		url.root = this.root;
		url.origin = this.origin;

		if (url.path.indexOf(url.origin) === 0) {
			url.path = url.path.replace(url.origin, '');
		}

		if (url.path.indexOf(url.base) === 0) {
			url.path = url.path.replace(url.base, '');
		}

		if (url.path.indexOf(window.location.origin) === 0) {
			url.path = url.path.replace(window.location.origin, '');
		}

		if (url.path.indexOf(url.root) === 0) {
			url.path = url.path.replace(url.root, '/');
		}

		if (url.path[0] !== '/') {
			url.path = this.join(window.location.pathname.replace(this.base, ''), url.path);
		}

		url.path = this.join(url.path, '/');
		url.href = this.join(url.origin, url.base, url.root, url.path);

		return url;
	};

	Router.prototype.appendComponentElement = function (url, callback) {
		var element;

		if (/\.html$/.test(url)) {
			element = document.createElement('link');
			element.setAttribute('href', url);
			element.setAttribute('rel', 'import');
		} else if (/\.js$/.test(url)) {
			element = document.createElement('script');
			element.setAttribute('src', url);
			element.setAttribute('type', 'text/javascript');
		} else {
			throw new Error('Invalid extension type');
		}

		element.onload = callback;
		element.setAttribute('async', '');
		document.head.appendChild(element);
	};

	Router.prototype.render = function (route, callback) {
		var self = this;

		if (route.title) {
			document.title = route.title;
		}

		var appendView = function () {

			if (self.view.firstChild) {
				self.view.removeChild(self.view.firstChild);
			}

			if (!self.cache[route.component]) {
				self.cache[route.component] = document.createElement(route.component);
			}

			self.view.appendChild(self.cache[route.component]);

			if (callback) return callback();
		};

		if (route.componentUrl && !self.cache[route.component]) {
			self.appendComponentElement(route.componentUrl, appendView);
		} else {
			appendView();
		}

	};

	Router.prototype.redirect = function (path, callback) {
		window.location.href = path;
		return callback();
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
				return this.routes.splice(i, 1);
			}
		}
	};

	Router.prototype.get = function (path) {
		for (var i = 0, l = this.routes.length, route; i < l; i++) {
			route = this.routes[i];

			if (!route.path) {
				continue;
			} else if (route.path.constructor.name === 'String') {
				if (this.parse(route.path).test(path)) {
					route.parameters = this.parameters(route.path, path);
					return route;
				}
			} else if (route.path.constructor.name === 'RegExp') {
				if (route.path.test(path)) {
					return route;
				}
			} else if (route.path.constructor.name === 'Function') {
				if (route.path(path)){
					return route;
				}
			}

		}
	};

	Router.prototype.navigate = function (data, replace) {
		var self = this;

		if (typeof data === 'string') {
			self.state.url = self.url(data);
			self.state.route = self.get(self.state.url.path) || {};
			self.state.parameters = self.state.route.parameters || {};
			self.state.title = self.state.route.title || '';
		} else {
			self.state = data;
		}

		window.history[replace ? 'replaceState' : 'pushState'](self.state, self.state.route.title, self.state.url.href);

		if (self.state.route.redirect) {
			self.redirect(self.state.route, function () {
				if (!replace) self.scroll(0, 0);
				self.emit('navigated');
			});
		} else {
			self.render(self.state.route, function () {
				if (!replace) self.scroll(0, 0);
				self.emit('navigated');
			});
		}

	};

	function Module () {
		this.modules = {};
	}

	Module.prototype.load = function (paths) {
		paths.forEach(function(path) {
			var script = document.createElement('script');

			script.src = path;
			script.async = false;
			script.type = 'text/javascript';

			document.head.appendChild(script);
		});
	};

	Module.prototype.import = function (name) {
		if (name in this.modules) {
			return  typeof this.modules[name] === 'function' ? this.modules[name]() : this.modules[name];
		} else {
			throw new Error('module ' + name + ' is not defined');
		}
	};

	Module.prototype.export = function (name, dependencies, method) {
		if (name in this.modules) {
			throw new Error('module ' + name + ' is defined');
		} else {

			if (typeof dependencies === 'function') {
				method = dependencies;
				dependencies = [];
			}

			if (typeof method === 'function') {
				dependencies.forEach(function (dependency) {
					method = method.bind(null, this.import(dependency));
				}, this);
			}

			return this.modules[name] = method;
		}
	};

	function Http () {}

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
		var self = this;

		options = options ? options : {};
		options.action = options.action ? options.action : window.location.href;
		options.method = options.method ? options.method.toUpperCase() : 'GET';
		options.headers = options.headers ? options.headers : {};

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

				if (options.contentType === self.mime.json) {
					options.data = JSON.stringify(options.data);
				}

				if (options.contentType === self.mime.urlencoded) {
					options.data = self.serialize(options.data);
				}

			}

		}

		var xhr = new XMLHttpRequest();

		xhr.open(options.method, options.action, true, options.username, options.password);

		if (options.mimeType) {
			xhr.overrideMimeType(options.mimeType);
		}

		if (options.withCredentials) {
			xhr.withCredentials = options.withCredentials;
		}

		if (options.accept) {
			options.headers['Accept'] = options.accept;
		}

		if (options.contentType) {
			options.headers['Content-Type'] = options.contentType;
		}

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

	/*
		@banner
		name: jenie
		version: 1.4.1
		license: mpl-2.0
		author: alexander elias

		This Source Code Form is subject to the terms of the Mozilla Public
		License, v. 2.0. If a copy of the MPL was not distributed with this
		file, You can obtain one at http://mozilla.org/MPL/2.0/.
	*/

	function Jenie () {
		var sStyle = 'j-view, j-view > :first-child { display: block; }';
		var eStyle = document.createElement('style');
		var nStyle = document.createTextNode(sStyle);

		eStyle.appendChild(nStyle);
		document.head.appendChild(eStyle);

		this.services = {};

		this.http = new Http();
		this.module = new Module();
		this.router = new Router();

		this.setup = function (data, callback) {
			var self = this;

			if (data.module) {
				data.module.forEach(function (parameters) {
					self.module.export.apply(self, parameters);
				});
			}

			self.router.listen(data.router, function () {
				if (callback) return callback();
			});
		};

		this.component = function (options) {
			return new Component(options);
		};

		this.controller = function (options, callback) {
			return new Controller(options, callback);
		};

		this.script = function () {
			return (document._currentScript || document.currentScript);
		};

		this.document = function () {
			return (document._currentScript || document.currentScript).ownerDocument;
		};

		this.element = function (name) {
			return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
		};

		this.query = function (query) {
			return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
		};

	}

	var jenie_b = new Jenie();

	return jenie_b;

})));
