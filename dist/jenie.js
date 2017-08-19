(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Jenie', factory) :
	(global.Jenie = factory());
}(this, (function () { 'use strict';

	var Utility = {

		PATH: /\s?\|(.*?)$/,
		PREFIX: /(data-)?j-/,
		MODIFIERS: /^(.*?)\|\s?/,

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
		},

		attribute: function (name, value) {
			var attribute = {};
			attribute.name = name;
			attribute.value = value;
			attribute.path = attribute.value.replace(this.PATH, '');
			attribute.opts = attribute.path.split('.');
			attribute.command = attribute.name.replace(this.PREFIX, '');
			attribute.cmds = attribute.command.split('-');
			attribute.key = attribute.opts.slice(-1);
			attribute.vpath = attribute.cmds[0] === 'each' ? attribute.path + '.length' : attribute.path;
			attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(this.MODIFIERS, '').split(' ');
			return attribute;
		},

		each: function (array, method, context) {
			method = method.bind(context);
			for (var i = 0, l = array.length; i < l; i++) {
				method(array[i], i, array);
			}
			return array;
		},

	};

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

		// set the property value if getter setter previously defined and redefine is not true
		if (getter && setter && redefine === false) return setter.call(data, value);

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
					if (!arguments.length || !data.length) return data.length;

					var i = 0, l = arguments.length;

					for (i; i < l; i++) {
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
					if (!arguments.length || !data.length) return data.length;

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

					for (i, l = result.length; i < l; i++) {
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

					var i = 0, l = data.length-1, value = data[0];

					for (i; i < l; i++) {
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

	function Model () {}

	Model.prototype.setListener = function (listener) {
		this.listener = listener;
	};

	Model.prototype.setData = function (data) {
		this.data = data;
	};

	Model.prototype.run = function () {
		Observer(this.data, this.listener);
	};

	function Collection (data) {
		Object.defineProperty(this, 'data', {
			value: data || []
		});
	}

	Collection.prototype.find = function (method) {
		for (var i = 0; i < this.data.length; i++) {
			if (method(this.data[i][1], this.data[i][0], i) === true) {
				return this.data[i][1];
			}
		}
	};

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
		if (!arguments.length) return this.length;
		this.data[this.data.length] = [this.data.length, value];
		return this.data.length;
	};

	Collection.prototype.size = function () {
		return this.data.length;
	};

	Collection.prototype.forEach = function (callback, context) {
		callback = callback.bind(context);

		for (var i = 0; i < this.data.length; i++) {
			callback(this.data[i][1], this.data[i][0], i, this.data);
		}
	};

	function Binder (options) {
		this.controller = options.controller;
		this.view = options.controller.view;
		this.model = options.controller.model;
		this.events = options.controller.events;

		this.element = options.element;
		this.attribute = options.attribute;

		this.renderMethod = this.renderMethods[this.attribute.cmds[0]] || this.renderMethods['default'];
		this.unrenderMethod = this.unrenderMethods[this.attribute.cmds[0]] || this.unrenderMethods['default'];

		this.modifiers = this.attribute.modifiers.map(function (modifier) {
			return this.controller.modifiers[modifier];
		}, this);

		this.paths = this.attribute.path.split('.');
		this.key = this.paths.slice(-1)[0];
		this.path = this.paths.slice(0, -1).join('.');
		this.data = this.path ? Utility.getByPath(this.controller.model.data, this.path) : this.controller.model.data;

		this.render();
	}

	Binder.prototype.setModel = function (data) {
		if (!this.data) return;

		if (data !== undefined) {
			for (var i = 0, l = this.modifiers.length; i < l; i++) {
				data = this.modifiers[i].call(data);
			}
		}

		return this.data[this.key] = data;
	};

	Binder.prototype.getModel = function () {
		if (!this.data) return;

		var data = this.data[this.key];

		if (data !== undefined) {
			for (var i = 0, l = this.modifiers.length; i < l; i++) {
				data = this.modifiers[i].call(data);
			}
		}

		return data;
	};

	Binder.prototype.updateModel = function () {
		if (this.element.type === 'checkbox') {
			this.setModel(this.element.value = this.element.checked);
		} if (this.element.nodeName === 'SELECT' && this.element.multiple) {
			this.setModel(Array.prototype.filter.call(this.element.options, function (option) {
				return option.selected;
			}).map(function (option) {
				return option.value;
			}));
		} else if (this.element.type === 'radio') {
			Array.prototype.forEach.call(
				this.element.parentNode.querySelectorAll(
					'input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]'
				),
				function (radio, index) {
					if (radio === this.element) this.setModel(index);
					else radio.checked = false;

				},
			this);
		} else {
			this.setModel(this.element.value);
		}
	};

	Binder.prototype.renderMethods = {
		on: function () {
			if (!this.eventName) {
				this.eventName = this.attribute.cmds[1];
				this.eventMethod = Utility.getByPath(this.events, this.attribute.path).bind(this.getModel());
			}

			this.element.removeEventListener(this.eventName, this.eventMethod);
			this.element.addEventListener(this.eventName, this.eventMethod);
		},
		each: function () {
			var self = this;
			var model = self.getModel();

			if (!self.clone) {
				self.variable = self.attribute.cmds.slice(1).join('.');
				self.clone = self.element.removeChild(self.element.children[0]).outerHTML;
				self.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + self.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
			}

			if (self.element.children.length > model.length) {
				self.element.removeChild(self.element.children[self.element.children.length-1]);
				// var element = self.element.children[self.element.children.length-1];
				// var elements = element.getElementsByTagName('*');
				// self.controller.view.removeAll(elements);
				// self.controller.view.removeOne(element);
			} else if (self.element.children.length < model.length) {
				self.element.insertAdjacentHTML(
					'beforeend',
					self.clone.replace(
						self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
					)
				);
				// var element = self.element.children[self.element.children.length-1];
				// var elements = element.getElementsByTagName('*');
				// self.controller.view.addAll(elements);
				// self.controller.view.addOne(element);
			}
		},
		value: function () {
			// triggered on every change
			if (this.isSetup) return;

			var model = this.getModel();

			if (this.element.type === 'checkbox') {
				if (this.element.checked !== model) {
					this.element.value = this.element.checked = model;
				}
			} if (this.element.nodeName === 'SELECT' && this.element.multiple) {
				if (this.element.options.length !== model.length) {
					Array.prototype.forEach.call(this.element.options, function (option, index) {
						if (option.value === model[index]) {
							option.selected;
						}
					}, this);
				}
			} else if (this.element.type === 'radio') {
				Array.prototype.forEach.call(
					this.element.parentNode.querySelectorAll(
						'input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]'
					),
					function (radio, index) {
						radio.checked = index === model;
					},
				this);
			} else {
				this.element.value = model;
			}

			this.isSetup = true;
		},
		html: function () {
			this.element.innerHTML = this.getModel();
			this.view.addAll(this.element.querySelectorAll('*'));
		},
		css: function () {
			var css = this.getModel();

			if (this.attribute.cmds.length > 1) {
				css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
			}

			this.element.style.cssText += css;
		},
		class: function () {
			var className = this.attribute.cmds.slice(1).join('-');
			this.element.classList.toggle(className, this.getModel());
		},
		text: function () {
			this.element.innerText = this.getModel();
		},
		enable: function () {
			this.element.disabled = !this.getModel();
		},
		disable: function () {
			this.element.disabled = this.getModel();
		},
		show: function () {
			this.element.hidden = !this.getModel();
		},
		hide: function () {
			this.element.hidden = this.getModel();
		},
		write: function () {
			this.element.readOnly = !this.getModel();
		},
		read: function () {
			this.element.readOnly = this.getModel();
		},
		selected: function () {
			this.element.selectedIndex = this.getModel();
		},
		default: function () {
			var path = Utility.toCamelCase(this.attribute.cmds);
			Utility.setByPath(this.element, path, this.getModel());
		}
	};

	Binder.prototype.unrenderMethods = {
		on: function () {
			var eventName = this.attribute.cmds[1];
			this.element.removeEventListener(eventName, this.getModel(), false);
		},
		each: function () {
			while (this.element.lastChild) {
				this.element.removeChild(this.element.lastChild);
			}
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

	function View (options) {
		this.controller = options.controller;
		this.data = new Collection();
	}

	View.prototype.ELEMENT_ACCEPTS = /(data-)?j-/;
	View.prototype.ATTRIBUTE_ACCEPTS = /(data-)?j-/;
	View.prototype.ELEMENT_REJECTS = /^iframe/;
	View.prototype.ELEMENT_REJECTS_CHILDREN = /^\w+(-\w+)+|^object|^script|^style|^svg/;

	View.prototype.preview = function (element) {
		var html = element.outerHTML;
		html = html.slice(1, html.indexOf('>'));
		html = html.replace(/\/$/, '');
		return html;
		// return element.outerHTML
		// .replace(/\/?>([\s\S])*/, '')
		// .replace(/^</, '');
	};

	View.prototype.eachElement = function (elements, callback) {
		var element, preview, i;

		for (i = 0; i < elements.length; i++) {
			element = elements[i];
			preview = this.preview(element);
			if (this.ELEMENT_REJECTS.test(preview)) {
				i += element.getElementsByTagName('*').length;
			} else if (this.ELEMENT_REJECTS_CHILDREN.test(preview)) {
				i += element.getElementsByTagName('*').length;
				callback.call(this, element);
			} else if (this.ELEMENT_ACCEPTS.test(preview)) {
				callback.call(this, element);
			}
		}
	};

	View.prototype.eachAttribute = function (element, callback) {
		var attribute, i = 0, l = element.attributes.length;
		for (i; i < l; i++) {
			attribute = element.attributes[i];
			if (this.ATTRIBUTE_ACCEPTS.test(attribute.name)) {
				callback.call(this, Utility.attribute(attribute.name, attribute.value));
			}
		}
	};

	View.prototype.unrenderAll = function (pattern) {
		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
		this.data.forEach(function (paths, path) {
			if (pattern.test(path)) {
				paths.forEach(function (binder) {
					binder.unrender();
				}, this);
			}
		}, this);
	};

	View.prototype.renderAll = function (pattern) {
		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
		this.data.forEach(function (paths, path) {
			if (pattern.test(path)) {
				paths.forEach(function (binder) {
					binder.render();
				}, this);
			}
		}, this);
	};

	View.prototype.removeOne = function (element) {
		this.data.forEach(function (paths, _, did) {
			paths.forEach(function (binder, _, pid) {
				if (element === binder.element) {
					paths.removeById(pid);
					if (paths.size() === 0) {
						this.data.removeById(did);
					}
				}
			}, this);
		}, this);
	};

	View.prototype.removeAll = function (elements) {
		var i = 0, l = elements.length;
		for (i; i < l; i++) {
			this.removeOne(elements[i]);
		}
	};

	View.prototype.addOne = function (element) {
		var self = this;

		self.eachAttribute(element, function (attribute) {
			if (!self.data.has(attribute.vpath)) {
				self.data.set(attribute.vpath, new Collection());
			}
			self.data.get(attribute.vpath).push(new Binder({
				element: element,
				attribute: attribute,
				controller: self.controller,
			}));
		});
	};

	View.prototype.addAll = function (elements) {
		var self = this;
		self.eachElement(elements, function (element) {
			self.addOne(element);
		});
	};

	View.prototype.setListener = function (listener) {
		this.listener = listener;
	};

	View.prototype.setElement = function (element) {
		this.element = element;
		this.elements = element.getElementsByTagName('*');
	};

	View.prototype.run = function () {
		var self = this;

		self.addAll(self.elements);

		self.observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.addedNodes.length > 0) {
					mutation.addedNodes.forEach(function (node) {
						if (node.nodeType === 1) {
							self.addAll(node.getElementsByTagName('*'));
							self.addOne(node);
						}
					});
				}
			});
		});

		self.observer.observe(self.element, {
			childList: true,
			subtree: true
		});

	};

	function Controller (options, callback) {
		var self = this;

		self.view = new View({
			controller: self
		});

		self.model = new Model({
			controller: self
		});

		self.events = options.events || {};
		self.element = (options.view.shadowRoot || options.view);

		self.name = options.name;
		self.modifiers = options.modifiers || {};

		self.model.setListener(function (data, path) {
			if (data === undefined) {
				self.view.unrenderAll('^' + path + '.*');
			} else {
				self.view.renderAll('^' + path);
			}
		});

		self.inputHandler = function (element) {
			if (element.hasAttribute('j-value')) {
				var attribute = Utility.attribute('j-value', element.getAttribute('j-value'));
				self.view.data.get(attribute.path).find(function (binder) {
					return binder.element === element;
				}).updateModel();
			}
		};

		self.element.addEventListener('change', function (e) {
			if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.nodeName !== 'SELECT') {
				self.inputHandler(e.target);
			}
		}, true);

		self.element.addEventListener('input', function (e) {
			self.inputHandler(e.target);
		}, true);

		if (typeof options.model === 'function') {
			options.model.call(self, function (model) {
				self.model.setData(model || {});
				self.view.setElement(self.element);
				self.model.run();
				self.view.run();
				if (callback) callback.call(self);
			});
		} else {
			self.model.setData(options.model || {});
			self.view.setElement(self.element);
			self.model.run();
			self.view.run();
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
		Events.call(this);

		options = options || {};

		this.state = {};
		this.cache = {};
		this.location = {};

		this.external = options.external;
		this.container = options.container;
		this.routes = options.routes || [];
		this.view = options.view || 'j-view';

		this.started = false;
		this.hash = options.hash === undefined ? false : options.hash;
		this.trailing = options.trailing === undefined ? false : options.trailing;

		this.eBase = document.head.querySelector('base');

	}

	Router.prototype = Object.create(Events.prototype);
	Router.prototype.constructor = Router;

	Router.prototype.popstate = function (e) {
		this.navigate(e.state || window.location.href, true);
	};

	Router.prototype.click = function (e) {
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
			self.external.constructor.name === 'String' && self.external === target.href
		)) return;

		// check non acceptable attributes and href
		if (target.hasAttribute('download') ||
			target.hasAttribute('external') ||
			target.hasAttribute('target') ||
			target.href.indexOf('mailto:') !== -1 ||
			target.href.indexOf('file:') !== -1 ||
			target.href.indexOf('tel:') !== -1 ||
			target.href.indexOf('ftp:') !== -1
		) return;

		e.preventDefault();
		self.navigate(target.href);
	};

	Router.prototype.start = function () {
		if (this.started) return;
		this.view = document.querySelector(this.view);
		(this.container || window).addEventListener('click', this.click.bind(this));
		window.addEventListener('popstate', this.popstate.bind(this));
		this.navigate(window.location.href, true);
	};

	Router.prototype.scroll = function (x, y) {
		window.scroll(x, y);
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

			if (callback) return callback.call(self);
		};

		if (route.componentUrl && !self.cache[route.component]) {
			self.appendComponentElement(route.componentUrl, appendView);
		} else {
			appendView();
		}

	};

	Router.prototype.joinPath = function () {
		return Array.prototype.join
			.call(arguments, '/')
			.replace(/\/{2,}/g, '/')
			.replace(/^(http(s)?:\/)/, '$1/');
	};

	Router.prototype.testPath = function (routePath, userPath) {
		return new RegExp(
			'^' + routePath
			.replace(/{\*}/g, '(?:.*)')
			.replace(/{(\w+)}/g, '([^\/]+)')
			+ '(\/)?$'
		).test(userPath);
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
		for (var i = 0, l = this.routes.length, r; i < l; i++) {
			r = this.routes[i];
			if (path === r.path) {
				return r;
			}
		}
	};

	Router.prototype.getRoute = function (path) {
		for (var i = 0, l = this.routes.length, r; i < l; i++) {
			r = this.routes[i];
			if (this.testPath(r.path, path)) {
				return r;
			}
		}
	};

	Router.prototype.toParameterObject = function (routePath, userPath) {
		var name;
		var parameters = {};
		var brackets = /{|}/g;
		var pattern = /{(\w+)}/;
		var userPaths = userPath.split('/');
		var routePaths = routePath.split('/');

		routePaths.forEach(function (path, index) {
			if (pattern.test(path)) {
				name = path.replace(brackets, '');
				parameters[name] = userPaths[index];
			}
		});

		return parameters;
	};

	Router.prototype.toQueryString = function (data) {
		var query = '?';

		Object.keys(data).forEach(function (key) {
			query += key + '=' + data[key] + '&';
		});

		// return and remove trailing &
		return query.slice(-1);
	};


	Router.prototype.toQueryObject = function (path) {
		var queries = {};

		if (path) {
			path.slice(1).split('&').forEach(function (query) {
				query = query.split('=');
				queries[query[0]] = query[1];
			});
		}

		return queries;
	};

	Router.prototype.getLocation = function (path) {
		var location = {};

		location.pathname = decodeURI(path);
		location.origin = window.location.origin;
		location.base = this.eBase ? this.eBase.href : window.location.origin + '/';

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
			location.href = this.joinPath(location.base, '/#/', location.pathname);
		} else {
			location.href = this.joinPath(location.base, '/', location.pathname);
		}

		location.href += location.search;
		location.href += location.hash;

		return location;
	};

	Router.prototype.navigate = function (data, replace) {

		if (typeof data === 'string') {
			this.state.location = this.getLocation(data);
			this.state.route = this.getRoute(this.state.location.pathname) || {};
			this.state.query = this.toQueryObject(this.state.location.search) || {};
			this.state.parameters = this.toParameterObject(this.state.route.path, this.state.location.pathname) || {};
			this.state.title = this.state.route.title || '';
			this.location = this.state.location;
		} else {
			this.state = data;
		}

		window.history[replace ? 'replaceState' : 'pushState'](this.state, this.state.title, this.state.location.href);

		if (this.state.route.redirect) {
			this.redirect(this.state.route.redirect);
		} else {
			this.render(this.state.route, function () {
				if (!replace) this.scroll(0, 0);
				this.emit('navigated');
			});
		}

	};

	function Module (options) {
		options = options || {};
		this.modules = {};

		if (options.modules) {
			options.modules.forEach(function (module) {
				this.export.call(
					this,
					module.name,
					module.dependencies || module.method,
					module.dependencies ? module.method : null
				);
			}, this);
		}

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

	function Http (options) {
		options = options || {};
		this.request = options.request;
		this.response = options.response;
	}

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

		Object.keys(data).forEach(function (name) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		});

		return string;
	};

	Http.prototype.fetch = function (options) {
		var self = this, xhr, request, response;

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

		xhr = new XMLHttpRequest();

		if (typeof self.request === 'function') {
			request = self.request(options, xhr);
		}

		if (request === undefined || request === true) {

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
				Object.keys(options.headers).forEach(function (name) {
					xhr.setRequestHeader(name, options.headers[name]);
				});
			}

			xhr.onreadystatechange = function () {

				if (xhr.readyState === 4) {

					if (typeof self.response === 'function') {
						response = self.response(options, xhr);
					}

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
		version: 1.4.8
		license: mpl-2.0
		author: alexander elias

		This Source Code Form is subject to the terms of the Mozilla Public
		License, v. 2.0. If a copy of the MPL was not distributed with this
		file, You can obtain one at http://mozilla.org/MPL/2.0/.
	*/

	var sStyle = 'j-view, j-view > :first-child { display: block; }';
	var eStyle = document.createElement('style');
	var nStyle = document.createTextNode(sStyle);

	eStyle.appendChild(nStyle);
	document.head.appendChild(eStyle);

	document.registerElement('j-view', {
		prototype: Object.create(HTMLElement.prototype)
	});

	var jenie_b = {

		http: new Http(),
		module: new Module(),
		router: new Router(),

		setup: function (options) {
			options = (typeof options === 'function' ? options.call(this) : options) || {};
			if (options.http) this.http = new Http(options.http);
			if (options.module) this.module = new Module(options.module);
			if (options.router) this.router = new Router(options.router);
			this.router.start();
		},

		component: function (options) {
			return new Component(options);
		},

		controller: function (options, callback) {
			return new Controller(options, callback);
		},

		script: function () {
			return (document._currentScript || document.currentScript);
		},

		document: function () {
			return (document._currentScript || document.currentScript).ownerDocument;
		},

		element: function (name) {
			return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
		},

		query: function (query) {
			return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
		},

		comments: function (query) {
			var comments = [], node;

			var pattern = new RegExp('^' + query);
			var iterator = document.createNodeIterator((document._currentScript || document.currentScript).ownerDocument, NodeFilter.SHOW_COMMENT, NodeFilter.FILTER_ACCEPT);

			while (node = iterator.nextNode()) {
				if (query) {
					if (pattern.test(node.nodeValue)) {
						return node.nodeValue.replace(query, '');
					}
				} else {
					comments.push(node.nodeValue);
				}
			}

			return comments;
		},

		escape: function (text) {
			return text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		}

	};

	return jenie_b;

})));
