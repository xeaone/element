(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Jenie', factory) :
	(global.Jenie = factory());
}(this, (function () { 'use strict';

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
		var self = this;
		self.isRan = false;
		self.controller = options.controller;
	}

	Model.prototype.listener = function (data, path) {
		var self = this;
		var pattern = new RegExp('^' + path);

		if (data === undefined) {
			self.controller.view.unrender(pattern);
		} else {
			self.controller.view.render(pattern);
		}
	};

	Model.prototype.overwrite = function (data) {
		var self = this;

		self.data = data;

		Observer(
			self.data,
			self.listener.bind(self)
		);
	};

	Model.prototype.run = function () {
		var self = this;

		if (self.isRan) return;
		else self.isRan = true;

		self.data = self.controller._model;

		Observer(
			self.data,
			self.listener.bind(self)
		);
	};

	function Collection (data) {
		Object.defineProperty(this, 'data', {
			value: data || []
		});
	}

	Collection.prototype.find = function (method) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (method(this.data[i][1], this.data[i][0], i) === true) {
				return this.data[i][1];
			}
		}
	};

	Collection.prototype.get = function (key) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (key === this.data[i][0]) {
				return this.data[i][1];
			}
		}
	};

	// Collection.prototype.remove = function (key) {
	// 	for (var i = 0, l = this.data.length; i < l; i++) {
	// 		if (key === this.data[i][0]) {
	// 			return this.data.splice(i, 1)[0][1];
	// 		}
	// 	}
	// };

	Collection.prototype.remove = function (id) {
		return this.data.splice(id, 1);
	};

	Collection.prototype.has = function (key) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (key === this.data[i][0]) {
				return true;
			}
		}

		return false;
	};

	Collection.prototype.set = function (key, value) {
		for (var i = 0, l = this.data.length; i < l; i++) {
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

	Collection.prototype.forEach = function (callback) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			callback(this.data[i][1], this.data[i][0], i, this.data);
		}
	};

	function Utility () {}

	Utility.prototype.setByPath = function (collection, path, value) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			var key = keys[i];
			if (collection[key] === undefined) collection[key] = {};
			collection = collection[key];
		}

		return collection[keys[last]] = value;
	};

	Utility.prototype.getByPath = function (collection, path) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			if (!collection[keys[i]]) return undefined;
			else collection = collection[keys[i]];
		}

		return collection[keys[last]];
	};

	Utility.prototype.toCamelCase = function (data) {
		if (data.constructor.name === 'Array') data = data.join('-');
		return data.replace(/-[a-z]/ig, function (match) {
			return match[1].toUpperCase();
		});
	};

	var Utility$1 = new Utility();

	function Binder (options) {
		this.element = options.element;
		this.attribute = options.attribute;
		this.controller = options.controller;
		this.renderType = this.attribute.cmds[0] || 'default';

		if (this.renderType === 'on') {
			this.data = Utility$1.getByPath(this.controller.events, this.attribute.path).bind(this.controller.model.data);
		} else {
			this.modifiers = this.attribute.modifiers.map(function (modifier) {
				return this.controller.modifiers[modifier];
			}, this);

			this.paths = this.attribute.path.split('.');
			this.key = this.paths.slice(-1)[0];
			this.path = this.paths.slice(0, -1).join('.');
			this.data = this.path ? Utility$1.getByPath(this.controller.model.data, this.path) : this.controller.model.data;

			// dyncamically set observed property on model
			if (this.attribute.cmds[0] === 'value' && this.data && this.data[this.key] === undefined) {
				this.data.$set(this.key, null);
				this.updateModel();
			}

		}

		this.render();
	}

	Binder.prototype.setData = function (data) {
		if (this.data === undefined) return;

		if (data !== null) {
			for (var i = 0, l = this.modifiers.length; i < l; i++) {
				data = this.modifiers[i].call(data);
			}
		}

		return this.data[this.key] = data;
	};

	Binder.prototype.getData = function () {
		if (this.data === undefined) return;

		var data = this.data[this.key];

		if (data !== null) {
			for (var i = 0, l = this.modifiers.length; i < l; i++) {
				data = this.modifiers[i].call(data);
			}
		}

		return data;
	};

	Binder.prototype.updateModel = function () {
		if (this.element.type === 'checkbox') {
			this.element.value = this.element.checked;
			this.setData(this.element.checked);
		} else if (this.element.nodeName === 'SELECT' && this.element.multiple) {
			this.setData(Array.prototype.filter.call(this.element.options, function (option) {
				return option.selected;
			}).map(function (option) {
				return option.value;
			}));
		} else if (this.element.type === 'radio') {
			var elements = this.element.parentNode.querySelectorAll('input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]');
			for (var i = 0, l = elements.length, radio; i < l; i++) {
				radio = elements[i];
				if (radio === this.element) {
					this.setData(i);
				} else {
					radio.checked = false;
				}
			}
		} else {
			this.setData(this.element.value);
		}
	};

	Binder.prototype.renderMethods = {
		on: function (data) {
			var self = this;
			self.element.removeEventListener(self.attribute.cmds[1], data);
			self.element.addEventListener(self.attribute.cmds[1], data);
		},
		each: function (data) {
			var self = this;

			if (!self.clone) {
				self.variable = self.attribute.cmds.slice(1).join('.');
				self.clone = self.element.removeChild(self.element.children[0]).outerHTML;
				self.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + self.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
			}

			if (self.element.children.length > data.length) {
				while (self.element.children.length > data.length) {
					self.element.removeChild(self.element.children[self.element.children.length-1]);
				}
			} else if (self.element.children.length < data.length) {
				while (self.element.children.length < data.length) {
					self.element.insertAdjacentHTML(
						'beforeend',
						self.clone.replace(
							self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
						)
					);
				}
			}
		},
		value: function (data) {
			// NOTE triggered on every change
			if (this.isSetup) return;
			var self = this, i, l;

			if (self.element.type === 'checkbox') {
				if (self.element.checked !== data) {
					self.element.value = data;
					self.element.checked = data;
				}
			} if (self.element.nodeName === 'SELECT' && self.element.multiple) {
				if (self.element.options.length !== data.length) {
					var options = self.element.options;
					for (i = 0, l = options.length; i < l; i++) {
						var option = options[i];
						if (option.value === data[i]) {
							option.selected;
						}
					}
				}
			} else if (self.element.type === 'radio') {
				var elements = self.element.parentNode.querySelectorAll('input[type="radio"][type="radio"][j-value="' + self.attribute.value + '"]');
				for (i = 0, l = elements.length; i < l; i++) {
					var radio = elements[i];
					radio.checked = i === data;
				}
			} else {
				self.element.value = data;
			}

			self.isSetup = true;
		},
		html: function (data) {
			var self = this;
			// FIXME not rendering j-*
			self.element.innerHTML = data;
		},
		css: function (data) {
			var css = data;

			if (this.attribute.cmds.length > 1) {
				css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
			}

			this.element.style.cssText += css;
		},
		class: function (data) {
			var className = this.attribute.cmds.slice(1).join('-');
			this.element.classList.toggle(className, data);
		},
		text: function (data) {
			this.element.innerText = data;
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
		default: function (data) {
			var path = Utility$1.toCamelCase(this.attribute.cmds);
			Utility$1.setByPath(this.element, path, data);
		}
	};

	Binder.prototype.unrenderMethods = {
		on: function (data) {
			this.element.removeEventListener(this.attribute.cmds[1], data, false);
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
		var self = this;
		var data = self.renderType === 'on' ? self.data : undefined;
		self.unrenderMethods[self.renderType].call(self, data);
		return self;
	};

	Binder.prototype.render = function () {
		var self = this;
		var data = self.renderType === 'on' ? self.data : self.getData();
		if (data === undefined) return;
		self.renderMethods[self.renderType].call(self, data);
		return self;
	};

	function View (options) {
		var self = this;
		self.isRan = false;
		self.data = new Collection();
		self.controller = options.controller;
	}

	View.prototype.PATH = /\s?\|(.*?)$/;
	View.prototype.PREFIX = /(data-)?j-/;
	View.prototype.MODIFIERS = /^(.*?)\|\s?/;
	View.prototype.ATTRIBUTE_ACCEPTS = /(data-)?j-/i;
	View.prototype.ELEMENT_SKIPS = /\w+(-\w+)+|iframe|object|script|style|svg/i;

	View.prototype.attribute = function (name, value) {
		var self = this;
		var attribute = {};
		attribute.name = name;
		attribute.value = value;
		attribute.path = attribute.value.replace(self.PATH, '');
		attribute.opts = attribute.path.split('.');
		attribute.command = attribute.name.replace(self.PREFIX, '');
		attribute.cmds = attribute.command.split('-');
		attribute.key = attribute.opts.slice(-1);
		attribute.vpath = attribute.cmds[0] === 'each' ? attribute.path + '.length' : attribute.path;
		attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(self.MODIFIERS, '').split(' ');
		return attribute;
	};

	View.prototype.nodeSkipsTest = function (node) {
		if (!node) return false;
		var self = this;
		return self.ELEMENT_SKIPS.test(node.nodeName);
	};

	View.prototype.nodeAcceptsTest = function (node) {
		if (!node) return false;
		var self = this;
		var attributes = node.attributes;
		for (var i = 0, l = attributes.length; i < l; i++) {
			if (self.ATTRIBUTE_ACCEPTS.test(attributes[i].name)) {
				return true;
			}
		}
		return false;
	};

	View.prototype.eachElement = function (elements, callback) {
		var self = this;
		for (var i = 0; i < elements.length; i++) {
			if (self.nodeSkipsTest(elements[i])) {
				i += elements[i].getElementsByTagName('*').length;
				callback(elements[i]);
			} else if (self.nodeAcceptsTest(elements[i])) {
				callback(elements[i]);
			}
		}
	};

	View.prototype.eachAttribute = function (element, callback) {
		var self = this, attributes = element.attributes, attribute;
		for (var i = 0; i < attributes.length; i++) {
			attribute = attributes[i];
			if (self.ATTRIBUTE_ACCEPTS.test(attribute.name)) {
				callback(self.attribute(attribute.name, attribute.value));
			}
		}
	};

	View.prototype.unrender = function (pattern) {
		var self = this;
		self.data.forEach(function (paths, path, id) {
			if (pattern.test(path)) {

				paths.forEach(function (binder, _, id) {
					binder.unrender();
					paths.remove(id);
				});

				if (paths.size() === 0) {
					self.data.remove(id);
				}

			}
		});
	};

	View.prototype.render = function (pattern) {
		var self = this;
		self.data.forEach(function (paths, path) {
			if (pattern.test(path)) {
				paths.forEach(function (binder) {
					binder.render();
				});
			}
		});
	};

	View.prototype.addElement = function (element) {
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

	View.prototype.addElements = function (elements) {
		var self = this;
		self.eachElement(elements, function (element) {
			self.addElement(element);
		});
	};

	View.prototype.mutationListener = function (mutations) {
		var self = this, i, l, c, s, node, nodes;
		for (i = 0, l = mutations.length; i < l; i++) {
			nodes = mutations[i].addedNodes;
			for (c = 0, s = nodes.length; c < s; c++) {
				node = nodes[c];
				if (node.nodeType === 1) {
					self.addElements(node.getElementsByTagName('*'));
					self.addElement(node);
				}
			}
		}
	};

	View.prototype.inputListener = function (element) {
		var self = this, value = element.getAttribute('j-value');
		if (value) {
			var attribute = self.attribute('j-value', value);
			self.data.get(attribute.path).find(function (binder) {
				return binder.element === element;
			}).updateModel();
		}
	};

	View.prototype.run = function () {
		var self = this;

		if (self.isRan) return;
		else self.isRan = true;

		self.controller._view.addEventListener('change', function (e) {
			if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.nodeName !== 'SELECT') {
				self.inputListener.call(self, e.target);
			}
		}, true);

		self.controller._view.addEventListener('input', function (e) {
			self.inputListener.call(self, e.target);
		}, true);

		self.addElements(self.controller._view.getElementsByTagName('*'));
		self.observer = new MutationObserver(self.mutationListener.bind(self));
		self.observer.observe(self.controller._view, { childList: true, subtree: true });
	};

	function Controller (options, callback) {
		var self = this;

		self.name = options.name || '';
		self.events = options.events || {};
		self.modifiers = options.modifiers || {};

		self._model = options.model || {};
		self._view = (options.view.shadowRoot || options.view);

		self.view = new View({
			controller: self
		});

		self.model = new Model({
			controller: self
		});

		if (typeof self._model === 'function') {
			self._model.call(self, function (model) {
				self._model = model;
				self.model.run();
				self.view.run();
				if (callback) callback.call(self);
			});
		} else {
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

			if (self.model || self.events || self.modifiers) {
				self.element.controller = new Controller({
					model: self.model,
					view: self.element,
					events: self.events,
					name: self.element.uuid,
					modifiers: self.modifiers
				}, function () {
					var controller = this;
					self.element.view = controller.view.data;

					Object.defineProperty(self.element, 'model', {
						enumerable: true,
						configurable: true,
						set: function (data) {
							controller.model.overwrite(data);
							// TODO need to render view
						},
						get: function () {
							return controller.model.data;
						}
					});

					if (options.created) options.created.call(self.element);
				});
			} else if (options.created) {
				options.created.call(self.element);
			}

		};

		self.define();

	}

	Component.prototype.slotify = function () {
		var eSlots = this.element.querySelectorAll('[slot]');
		for (var i = 0, l = eSlots.length; i < l; i++) {
			var eSlot = eSlots[i];
			var sName = eSlot.getAttribute('slot');
			var tSlot = this.template.content.querySelector('slot[name='+ sName + ']');
			tSlot.parentNode.replaceChild(eSlot, tSlot);
		}
	};

	Component.prototype.toHTML = function (html) {
		var template = document.createElement('template');
		// template.insertAdjacentHTML('afterbegin', html);
		template.innerHTML = html;
		return template;
	};

	Component.prototype.toTemplate = function (template) {
		if (template.constructor.name === 'String') {
			if (/<|>/.test(template)) {
				template = this.toHTML(template);
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
		this.state = {};
		this.cache = {};
		this.location = {};
		if (options) this.loader = options.loader;
		this.setup(options);
	}

	Router.prototype = Object.create(Events.prototype);
	Router.prototype.constructor = Router;

	Router.prototype.setup = function (options) {
		options = options || {};

		this.external = options.external;
		this.container = options.container;
		this.routes = options.routes || [];
		this.view = options.view || 'j-view';

		this.started = false;
		this.base = this.createBase(options.base);
		this.hash = options.hash === undefined ? false : options.hash;
		this.trailing = options.trailing === undefined ? false : options.trailing;
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
			self.external.constructor.name === 'RegExp' && self.external.test(target.href) ||
			self.external.constructor.name === 'Function' && self.external(target.href) ||
			self.external.constructor.name === 'String' && self.external === target.href
		)) return;

		// check non acceptable attributes and href
		if (target.hasAttribute('download') ||
			target.hasAttribute('external') ||
			// target.hasAttribute('target') ||
			target.href.indexOf('mailto:') !== -1 ||
			target.href.indexOf('file:') !== -1 ||
			target.href.indexOf('tel:') !== -1 ||
			target.href.indexOf('ftp:') !== -1
		) return;

		e.preventDefault();
		self.navigate(target.href);
	};

	Router.prototype.run = function () {
		if (this.started) return;
		this.view = document.querySelector(this.view);
		(this.container || window).addEventListener('click', this.click.bind(this));
		window.addEventListener('popstate', this.popstate.bind(this));
		this.navigate(window.location.href, true);
	};

	Router.prototype.scroll = function (x, y) {
		window.scroll(x, y);
	};

	Router.prototype.rendered = function (route, callback) {
		while (this.view.lastChild) {
			this.view.removeChild(this.view.lastChild);
		}

		if (!(route.component in this.cache)) {
			this.cache[route.component] = document.createElement(route.component);
		}

		this.view.appendChild(this.cache[route.component]);

		if (callback) {
			callback.call(this);
		}
	};

	Router.prototype.render = function (route, callback) {
		var self = this;

		if (route.title) {
			document.title = route.title;
		}

		if (route.file && !(route.component in this.cache)) {
			self.loader.run(route.file.constructor === Object ? route.file : {
				file: route.file
			}, function () {
				self.rendered(route, callback);
			});
		} else {
			self.rendered(route, callback);
		}
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
			this.state.route = this.find(this.state.location.pathname) || {};
			this.state.query = this.toQueryObject(this.state.location.search) || {};
			this.state.parameters = this.toParameterObject(this.state.route.path || '', this.state.location.pathname) || {};
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

	function Loader (options) {
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
		exp: /export\s+(?:default\s*)?(?:function)?\s+(\w+)/,
	};

	Loader.prototype.setup = function (options) {
		options = options || {};
		this.esm = options.esm || false;
		this.base = this.createBase(options.base);
		if (options.loads && options.loads.length) {
			for (var i = 0, l = options.loads.length; i < l; i++) {
				this.run(options.loads[i]);
			}
		}
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

	Loader.prototype.joinPath = function () {
		return Array.prototype.join
			.call(arguments, '/')
			.replace(/\/{2,}/g, '/');
	};

	Loader.prototype.getFile = function (data, callback) {
		var self = this;

		if (data.file in self.modules && data.status) {
			if (data.status === self.LOADED) {
				if (callback) callback();
			} else if (data.status === self.LOADING) {
				if (!data.tag) {
					data.xhr.addEventListener('readystatechange', function () {
						if (data.xhr.readyState === 4) {
							if (data.xhr.status >= 200 && data.xhr.status < 400) {
								if (callback) callback(data);
							} else {
								throw data.xhr.responseText;
							}
						}
					});
				} else {
					data.element.addEventListener('load', function () {
						if (callback) callback(data);
					});
				}
			}

			return;
		}

		if (!data.tag) {
			data.xhr = new XMLHttpRequest();
			data.xhr.addEventListener('readystatechange', function () {
				if (data.xhr.readyState === 4) {
					if (data.xhr.status >= 200 && data.xhr.status < 400) {
						data.status = self.LOADED;
						data.text = data.xhr.responseText;
						if (callback) callback(data);
					} else {
						throw data.xhr.responseText;
					}
				}
			});
			data.url = self.joinPath(self.base.replace(window.location.origin, ''), data.file);
			data.xhr.open('GET', data.url);
			data.xhr.send();
		}

		data.status = self.LOADING;
	};

	Loader.prototype.interpret = function (data) {
		return (function(d, l, w) { 'use strict';
			return new Function('Loader', 'window', d)(l, w);
		}(data, this, window));
	};

	Loader.prototype.getImports = function (data) {
		var imp, imports = [];
		var imps = data.match(this.patterns.imps) || [];
		for (var i = 0, l = imps.length; i < l; i++) {
			imp = imps[i].match(this.patterns.imp);
			imports[i] = {
				raw: imp[0],
				name: imp[1],
				file: imp[2]
			};
		}
		return imports;
	};

	Loader.prototype.getExports = function (data) {
		return data.match(this.patterns.exps) || [];
	};

	Loader.prototype.handleImports = function (ast) {
		for (var i = 0, l = ast.imports.length; i < l; i++) {
			ast.cooked = ast.cooked.replace(ast.imports[i].raw, 'var ' + ast.imports[i].name + ' = Loader.modules[\'' + ast.imports[i].file + '\']');
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

	Loader.prototype.run = function (data, callback) {
		var self = this;

		if (data.constructor === String) data = { file: data };
		self.files[data.file] = data;

		self.getFile(data, function (d) {
			var ast = self.toAst(d.text);

			if (self.esm || data.esm) {
				if (ast.imports.length) {
					var meta = {
						count: 0,
						imports: ast.imports,
						total: ast.imports.length,
						listener: function () {
							if (++meta.count === meta.total) {
								meta.interpreted = self.interpret(ast.cooked);
								if (data.execute) meta.interpreted();
								if (callback) callback();
							}
						}
					};

					for (var i = 0, l = meta.imports.length; i < l; i++) {
						self.run(meta.imports[i].file, meta.listener);
					}
				} else {
					self.modules[d.file] = self.interpret(ast.cooked);
					if (callback) callback();
				}
			} else {
				self.modules[d.file] = self.interpret(d.text);
				if (callback) callback();
			}
		});
	};

	/*
		https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
	*/

	function Http (options) {
		this.setup(options);
	}

	Http.prototype.setup = function (options) {
		options = options || {};
		this.request = options.request;
		this.response = options.response;
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
		var self = this, xhr, request, response;

		options = options || {};
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

				if (options.contentType === self.mime.json) options.data = JSON.stringify(options.data);
				if (options.contentType === self.mime.urlencoded) options.data = self.serialize(options.data);
			}
		}

		xhr = new XMLHttpRequest();

		if (typeof self.request === 'function') request = self.request(options, xhr);

		if (request === undefined || request === true) {
			xhr.open(options.method, options.action, true, options.username, options.password);

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
		version: 1.6.9
		license: mpl-2.0
		author: alexander elias
		This Source Code Form is subject to the terms of the Mozilla Public
		License, v. 2.0. If a copy of the MPL was not distributed with this
		file, You can obtain one at http://mozilla.org/MPL/2.0/.
	*/

	function Jenie () {
		var self = this;

		self.eScript = (document._currentScript || document.currentScript);
		self.http = new Http();
		self.loader = new Loader();
		self.router = new Router({ loader: self.loader });

		self.eStyle = document.createElement('style');
		self.eStyle.setAttribute('title', 'Jenie');
		self.eStyle.setAttribute('type', 'text/css');
		self.eStyle.appendChild(document.createTextNode('j-view, j-view > :first-child { display: block; }'));
		self.eScript.insertAdjacentElement('beforebegin', self.eStyle);

		document.registerElement('j-view', {
			prototype: Object.create(HTMLElement.prototype)
		});

		// j-index="index.js"
		// this.sIndex = this.eScript.getAttribute('j-index');
		// if (this.sIndex) {
		// 	this.eIndex = document.createElement('script');
		// 	this.eIndex.setAttribute('src', this.sIndex);
		// 	this.eIndex.setAttribute('async', 'false');
		// 	this.eScript.insertAdjacentElement('afterend', this.eIndex);
		// }
	}

	Jenie.prototype.setup = function (options) {
		var self = this;

		options = (typeof options === 'function' ? options.call(self) : options) || {};

		if (options.http) self.http.setup(options.http);
		if (options.loader) self.loader.setup(options.loader);
		if (options.router) self.router.setup(options.router);

		self.router.run();
	};

	Jenie.prototype.component = function (options) {
		return new Component(options);
	};

	Jenie.prototype.controller = function (options, callback) {
		return new Controller(options, callback);
	};

	Jenie.prototype.script = function () {
		return (document._currentScript || document.currentScript);
	};

	Jenie.prototype.document = function () {
		return (document._currentScript || document.currentScript).ownerDocument;
	};

	Jenie.prototype.element = function (name) {
		return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
	};

	Jenie.prototype.query = function (query) {
		return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
	};

	Jenie.prototype.comments = function (query) {
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
	};

	Jenie.prototype.escape = function (text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	};

	var jenie_b = new Jenie();

	return jenie_b;

})));
