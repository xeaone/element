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
			var self = this, animate;

			if (!self.data) {
				return;
			} else if (!self.clone) {

				self.variable = self.attribute.cmds.slice(1).join('.');
				self.clone = self.element.removeChild(self.element.children[0]).outerHTML;
				self.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + self.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');

				animate = function () {

					self.element.insertAdjacentHTML(
						'beforeend',
						self.clone.replace(
							self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
						)
					);

					self.view.addOne(self.element.lastChild);
					self.view.addAll(self.element.lastChild.getElementsByTagName('*'));

					if (self.element.children.length < self.data.length) {
						window.requestAnimationFrame(animate);
					}

				};

				window.requestAnimationFrame(animate);

			} else if (self.element.children.length > self.data.length) {

				animate = function () {

					if (self.element.children.length > self.data.length) {

						self.view.removeAll(self.element.lastChild.getElementsByTagName('*'));
						self.view.removeOne(self.element.lastChild);
						self.element.removeChild(self.element.lastChild);

						if (self.element.children.length > self.data.length) {
							window.requestAnimationFrame(animate);
						}

					}

				};

				window.requestAnimationFrame(animate);

			} else if (self.element.children.length < self.data.length) {

				animate = function () {

					if (self.element.children.length < self.data.length) {

						self.element.insertAdjacentHTML(
							'beforeend',
							self.clone.replace(
								self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
							)
						);

						self.view.addOne(self.element.lastChild);
						self.view.addAll(self.element.lastChild.getElementsByTagName('*'));

						if (self.element.children.length < self.data.length) {
							window.requestAnimationFrame(animate);
						}

					}

				};

				window.requestAnimationFrame(animate);

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
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.innerHTML = self.data;
				self.view.addAll(self.element.getElementsByTagName('*'));
			});
		},
		css: function () {
			var self = this;
			var css = this.data;

			if (self.attribute.cmds.length > 1) {
				css = self.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
			}

			window.requestAnimationFrame(function () {
				self.element.style.cssText += css;
			});
		},
		class: function () {
			var self = this;
			var className = self.attribute.cmds.slice(1).join('-');

			window.requestAnimationFrame(function () {
				self.element.classList.toggle(className, self.data);
			});
		},
		text: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.innerText = self.data;
			});
		},
		enable: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.disabled = !self.data;
			});
		},
		disable: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.disabled = self.data;
			});
		},
		show: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.hidden = !self.data;
			});
		},
		hide: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.hidden = self.data;
			});
		},
		write: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.readOnly = !self.data;
			});
		},
		read: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.readOnly = self.data;
			});
		},
		selected: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.selectedIndex = self.data;
			});
		},
		default: function () {
			var self = this;
			var path = self.toCamelCase(self.attribute.cmds);

			window.requestAnimationFrame(function () {
				self.setByPath(self.element, path, self.data);
			});
		}
	};

	Unit$1.prototype.unrenderMethods = {
		on: function () {
			var eventName = this.attribute.cmds[1];
			this.element.removeEventListener(eventName, this.data, false);
		},
		each: function () {
			var self = this;

			var animate = function () {
				self.element.removeChild(self.element.lastChild);
				if (self.element.lastChild) animate();
			};

			window.requestAnimationFrame(animate);
		},
		value: function () {
			this.element.removeEventListener('change', this.change.bind(this));
			this.element.removeEventListener('keyup', this.change.bind(this));
		},
		html: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.innerText = '';
			});
		},
		text: function () {
			var self = this;

			window.requestAnimationFrame(function () {
				self.element.innerText = '';
			});
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

		self.hash = !options.hash ? false : options.hash;
		self.contain = !options.contain ? false : options.contain;

		self.cache = {};
		self.state = {};
		self.base = options.base || '';
		self.origin = window.location.origin;
		self.root = options.root || '' + (self.hash ? '/#/' : '/');

		window.addEventListener('DOMContentLoaded', self.loaded.bind(self), true);
		window.addEventListener('popstate', self.popstate.bind(self), true);

	}

	Router$1.prototype.loaded = function () {
		var self = this;

		self.view = document.querySelector('j-view') || document.querySelector('[j-view]');

		self.navigate(window.location.href, true);
		(self.contain ? self.view : window).addEventListener('click', self.click.bind(self), true);

		window.removeEventListener('DOMContentLoaded', self.loaded);

	};

	Router$1.prototype.popstate = function (e) {
		var self = this;
		self.navigate(e.state || window.location.href, true);
	};

	Router$1.prototype.click = function (e) {
		var self = this;

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

	Router$1.prototype.normalize = function (path) {
		path = decodeURI(path).replace(/\/{2,}/g, '/')
		.replace(/(http(s)?:\/)/, '$1/')
		.replace(/\?.*/, '');

		return 	path = path === '' ? '/' : path;
	};

	Router$1.prototype.join = function () {
		return this.normalize(Array.prototype.join.call(arguments, '/'));
	};

	Router$1.prototype.scroll = function (x, y) {
		window.scroll(x, y);
	};

	Router$1.prototype.url = function (path) {
		var self = this;
		var url = {};

		url.base = self.base;
		url.root = self.root;
		url.origin = self.origin;

		url.path = path;

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

		url.path = self.normalize(url.path);
		url.path = url.path[0] === '/' ? url.path : '/' + url.path;

		url.href = self.join(url.origin, url.base, url.root, url.path);

		return url;
	};

	Router$1.prototype.render = function (route) {
		var self = this;
		var component = self.cache[route.component];

		if (route.title) {
			document.title = route.title;
		}

		if (route.cache === true || route.cache === undefined) {

			component = self.cache[route.component];

			if (!component) {
				component = self.cache[route.component] = document.createElement(route.component);
			}

		} else {
			component = document.createElement(route.component);
		}

		window.requestAnimationFrame(function () {

			if (self.view.firstChild) {
				self.view.removeChild(self.view.firstChild);
			}

			self.view.appendChild(component);

		});

	};

	Router$1.prototype.add = function (route) {
		var self = this;

		if (route.constructor.name === 'Object') {
			self.routes.push(route);
		} else if (route.constructor.name === 'Array') {
			self.routes = self.routes.concat(route);
		}

	};

	Router$1.prototype.remove = function (path) {
		var self = this;

		for (var i = 0, l = self.routes.length; i < l; i++) {

			if (path === self.routes[i].path) {
				return self.routes.splice(i, 1);
			}

		}

	};

	Router$1.prototype.redirect = function (path) {
		window.location.href = path;
	};

	Router$1.prototype.get = function (path) {
		var self = this;

		for (var i = 0, l = self.routes.length; i < l; i++) {
			var route = self.routes[i];

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
		var self = this;

		if (typeof data === 'string') {
			self.state.url = self.url(data);
			self.state.route = self.get(self.state.url.path);
			self.state.title = self.state.route.title || '';
		} else {
			self.state = data;
		}

		window.history[replace ? 'replaceState' : 'pushState'](self.state, self.state.route.title, self.state.url.href);

		if (self.state.route.redirect) {
			self.redirect(self.state.route);
		} else {
			self.render(self.state.route);
		}

		if (!replace) {
			self.scroll(0, 0);
		}

	};

	var index$4 = Router$1;

	function Module$1 () {
		this.modules = {};
	}

	Module$1.prototype.set = function (name, method) {
		if (name in this.modules) {
			throw new Error('module ' + name + ' is defined');
		} else {
			return this.modules[name] = method;
		}
	};

	Module$1.prototype.get = function (name) {
		if (name in this.modules) {
			return this.modules[name];
		} else {
			throw new Error('module ' + name + ' is not defined');
		}
	};

	var module$1 = Module$1;

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

	var http = Http$1;

	/*
		@banner
		name: jenie
		version: 1.1.91
		author: alexander elias
	*/

	// if (
	// 	!('registerElement' in document) &&
	// 	!('import' in document.createElement('link')) &&
	// 	!('content' in document.createElement('template'))
	// ) {
	// 	// polyfill the platform
	// 	var eScript = document.createElement('script');
	// 	eScript.src = '/webcomponents-lite.min.js';
	// 	document.body.appendChild(eScript);
	// }

	var Component = index;
	var Binder = index$2;
	var Router = index$4;
	var Module = module$1;
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
		modules: {},
		services: {},
		_module: new Module(),
		module: function (name, method) {
			if (method) {
				return this._module.set(name, method);
			} else {
				return this._module.get(name);
			}
		},
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