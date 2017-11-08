(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Oxe', factory) :
	(global.Oxe = factory());
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

	var Utility = {};

	Utility.createBase = function (base) {
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
	};

	Utility.formData = function (form, model) {
		var elements = form.querySelectorAll('[o-value]');
		var data = {};

		for (var i = 0, l = elements.length; i < l; i++) {
			var element = elements[i];
			var path = element.getAttribute('o-value');
			var name = path.split('.').slice(-1);
			data[name] = Utility.getByPath(model, path);
		}

		return data;
	};

	Utility.toText = function (data) {
		if (data === undefined) return ''; // data === null ||
		if (typeof data === 'object') return JSON.stringify(data);
		else return String(data);
	};

	Utility.setByPath = function (collection, path, value) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			var key = keys[i];
			if (collection[key] === undefined) collection[key] = {};
			collection = collection[key];
		}

		return collection[keys[last]] = value;
	};

	Utility.getByPath = function (collection, path) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			if (!collection[keys[i]]) return undefined;
			else collection = collection[keys[i]];
		}

		return collection[keys[last]];
	};

	Utility.removeChildren = function (element) {
		var self = this, child;
		Global.batcher.write(function () {
			while (child = element.lastElementChild) {
				element.removeChild(child);
			}
		});
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

	Utility.getContainer = function getContainer (element, target) {
		if (element === document.body || element.nodeName === 'O-VIEW') {
			return;
		} else if (element.id && element.id.indexOf(element.nodeName.toLowerCase()) === 0) { // TODO imporove check for the full so ending number
			return element;
		} else if (element.parentElement) {
			return this.getContainer(element.parentElement, target);
		} else if (target) {
			return this.getContainer(target);
		} else {
			console.warn('Utility could not find a id');
		}
	};



	// Utility.CAMEL = /-(\w)/g,
	// Utility.toCamelCase = function (data) {
	// 	return data.replace(this.CAMEL, function (match, next) {
	// 		return next.toUpperCase();
	// 	});
	// }

	// Utility.each = function (items, method, context) {
	// 	return items.reduce(function (promise, item) {
	// 		return promise.then(function () {
	// 			return method.call(context, item);
	// 		});
	// 	}, Promise.resolve())

	// };

	var OnceBinder = {};

	OnceBinder.bind = function (element, attribute, container) {

		if (
			!container.model ||
			!this.type[attribute.cmds[0]]
		) return;

		var data = {};
		var type = attribute.cmds[0];
		var key = attribute.parentKey;

		data.element = element;
		data.attribute = attribute;
		data.container = container;

		data.model = attribute.parentPath ? Utility.getByPath(container.model, attribute.parentPath) : container.model;
		data.value = data.model[key];

		var value = this.type[type].call(this, data);

		if (value) {
			data.model.$set(key, value);
			// if (model[key] === undefined) {
			// } else if (value.constructor === Array) {
			// 	// FIXME selects not setting defaults
			// 	model[key].push.apply(null, value);
			// }
		}

	};

	OnceBinder.kind = {
		checkbox: function (data) {
			data.value = !data.value ? false : data.value;
			data.element.value = data.element.checked = data.value;
			return data.value;
		},
		select: function (data) {
			var options = data.element.options;

			data.value = data.element.multiple ? [] : data.value;

			for (var i = 0, l = options.length; i < l; i++) {
				var option = options[i];
				if (option.selected) {
					if (data.element.multiple) {
						data.value.push(option.value);
					} else {
						data.value = option.value;
						break;
					}
				}
			}

			return data.value;
		},
		radio: function (data) {
			var query = 'input[type="radio"][o-value="' + data.attribute.value + '"]';
			var elements = data.element.parentNode.querySelectorAll(query);

			for (var i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				radio.checked = i === data.value;
			}

			return data.value;
		},
		default: function (data) {
			data.value = data.value === undefined ? '' : data.value;
			data.element.value = data.value;
			return data.value;
		},
	};

	OnceBinder.type = {
		value: function (data) {
			var kind;

			if (data.element.type === 'checkbox') {
				kind = 'checkbox';
			} else if (data.element.nodeName === 'SELECT') {
				kind = 'select';
			} else if (data.element.type === 'radio') {
				kind = 'radio';
			} else {
				kind = 'default';
			}

			return this.kind[kind].call(this, data);
		}

	};

	var Batcher = {};

	Batcher.tasks = [];
	Batcher.reads = [];
	Batcher.writes = [];
	Batcher.rafCount = 0;
	Batcher.maxTaskTimeMS = 30;
	Batcher.pending = false;

	// Adds a task to the read batch
	Batcher.read = function (method, context) {
		var task = context ? method.bind(context) : method;
		this.reads.push(task);
		this.tick();
	};


	// Adds a task to the write batch
	Batcher.write = function (method, context) {
		var task = context ? method.bind(context) : method;
		this.writes.push(task);
		this.tick();
	};

	// Schedules a new read/write batch if one isn't pending.
	Batcher.tick = function () {
		var self = this;
		if (!self.pending) {
			self.flush();
		}
	};

	Batcher.flush = function (callback) {
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

	// Clears a pending 'read' or 'write' task
	Batcher.clear = function (task) {
		return this.remove(this.reads, task) || this.remove(this.writes, task);
	};

	Batcher.remove = function (tasks, task) {
		var index = tasks.indexOf(task);
		return !!~index && !!tasks.splice(index, 1);
	};

	Batcher.run = function (tasks, callback) {
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

	// TODO sanitize input/output

	function Binder (options) {

		this.element = options.element;
		this.container = options.container;
		this.attribute = options.attribute;

		this.model = this.container.model;
		this.events = this.container.events;
		this.modifiers = this.container.modifiers;
		this.type = this.attribute.cmds[0] || 'default';

		if (this.type === 'on') { // || this.type === 'submit'
			this.data = Utility.getByPath(this.events, this.attribute.path).bind(this.model);
		} else {
			Object.defineProperty(this, 'data', {
				enumerable: true,
				configurable: false,
				get: function () {
					var data = Utility.getByPath(this.model, this.attribute.path);

					if (data === undefined) {
						console.warn('Binder - undefined path \"' + this.attribute.path + '\"');
					}

					return this.modify(data);
				}
			});

		}

		this.setup();
		this.render();
	}

	Binder.prototype.modify = function (data) {
		if (!data) return data;

		for (var i = 0, l = this.attribute.modifiers.length; i < l; i++) {

			data = this.modifiers[this.attribute.modifiers[i]].call(this.model, data);

			if (data === undefined) {
				console.warn('Binder - undefined modifier \"' + this.attribute.modifiers[i] + '\"');
			}

		}

		return data;
	};

	Binder.prototype.setupMethods = {
		// submit: function () {
		// 	this._.submit = function (e) {
		// 		e.preventDefault();
		// 		var data = Utility.formData(this.element, this.model);
		// 		var action = this.element.getAttribute('o-action') || this.element.getAttribute('data-o-action');
		// 		var method = this.element.getAttribute('o-method') || this.element.getAttribute('data-o-method');
		// 		if (action) {
		// 			Global.fetcher.fetch({
		// 				data: data,
		// 				url: action,
		// 				method: method,
		// 				handler: this.data
		// 			});
		// 		} else {
		// 			this.data(data);
		// 		}
		// 	}.bind(this);
		// },
		each: function () {
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
		on: function () {
			this.element.removeEventListener(this.attribute.cmds[1], this.data);
			this.element.addEventListener(this.attribute.cmds[1], this.data);
		},
		// submit: function () {
		// 	this.element.removeEventListener('submit', this._.submit);
		// 	this.element.addEventListener('submit', this._.submit);
		// },
		each: function () {
			if (typeof this.data !== 'object') {
				return;
			} else if (this.element.children.length > this.data.length) {
				this.element.removeChild(this.element.lastElementChild);
				this.render();
			} else if (this.element.children.length < this.data.length) {
				this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, this.element.children.length));
				this.render();
			}
		},
		html: function () {
			this.element.innerHTML = this.data;
		},
		css: function (data) {
			if (this.attribute.cmds.length > 1) {
				this.data = this.attribute.cmds.slice(1).join('-') + ': ' +  this.data + ';';
			}
			this.element.style.cssText += this.data;
		},
		class: function () {
			var className = this.attribute.cmds.slice(1).join('-');
			this.element.classList.toggle(className, this.data);
		},
		text: function () {
			this.element.innerText = Utility.toText(this.data);
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
		href: function () {
			this.element.href = this.data;
		},
		src: function () {
			this.element.src = this.data;
		},
		alt: function () {
			this.element.alt = this.data;
		},
		required: function () {
			this.element.required = this.data;
		},
		default: function () {}
	};

	Binder.prototype.unrenderMethods = {
		on: function () {
			this.element.removeEventListener(this.attribute.cmds[1], this.data, false);
		},
		// submit: function () {
		// 	this.element.removeEventListener('submit', this._.submit, false);
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
			this.setupMethods[this.type].call(this);
		}
		return this;
	};

	Binder.prototype.unrender = function () {
		if (this.type in this.unrenderMethods) {
			Batcher.write(this.unrenderMethods[this.type].bind(this));
		}
		return this;
	};

	Binder.prototype.render = function () {
		if (this.type in this.renderMethods) {
			Batcher.write(this.renderMethods[this.type].bind(this));
		}
		return this;
	};

	var View = {};

	View.data = {};
	View.isRan = false;
	View.container = document.body;

	View.PATH = /\s?\|.*/;
	View.PARENT_KEY = /^.*\./;
	View.PARENT_PATH = /\.\w+$|^\w+$/;
	View.PREFIX = /(data-)?o-/;
	View.MODIFIERS = /^.*?\|\s?/;
	View.IS_ACCEPT_PATH = /(data-)?o-.*/;
	View.IS_REJECT_PATH = /(data-)?o-value.*/;

	View.isOnce = function (attribute) {
		return attribute === 'o-value'
			|| attribute === 'data-o-value';
	};

	View.isSkip = function (node) {
		return node.nodeName === 'J-VIEW'
			|| node.hasAttribute('o-view')
			|| node.hasAttribute('data-o-view');
	};

	View.isSkipChildren = function (node) {
		return node.nodeName === 'IFRAME'
			|| node.nodeName === 'OBJECT'
			|| node.nodeName === 'SCRIPT'
			|| node.nodeName === 'STYLE'
			|| node.nodeName === 'SVG';
	};

	View.isAccept = function (node) {
		var attributes = node.attributes;
		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];
			if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {
				return true;
			}
		}
		return false;
	};

	View.isAcceptAttribute = function (attribute) {
		return attribute.name.indexOf('o-') === 0
			|| attribute.name.indexOf('data-o-') === 0;
	};

	View.createAttribute = function (name, value) {
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

	View.eachAttribute = function (element, callback) {
		var attributes = element.attributes;
		for (var i = 0; i < attributes.length; i++) {
			var attribute = attributes[i];
			if (this.isAcceptAttribute(attribute)) {
				callback.call(this, this.createAttribute(attribute.name, attribute.value));
			}
		}
	};

	// View.eachElement = function (element, callback) {
	// 	var elements = element.children;
	// 	for (var i = 0; i < elements.length; i++) {
	// 		var element = elements[i];
	//
	// 		if (this.isAccept(element) && !this.isSkip(element)) {
	// 			callback.call(this, element);
	// 		}
	//
	// 		if (!this.isSkipChildren(element)) {
	// 			this.eachElement(element, callback);
	// 		}
	// 	}
	// };
	//
	// View.eachBinder = function (container, path, callback) {
	// 	this.eachElement(container, function (element) {
	// 		this.eachAttribute(element, function (attribute) {
	// 			if (attribute.path.indexOf(path) === 0) {
	// 				callback(element, attribute);
	// 			}
	// 		});
	// 	});
	// };

	View.eachAttributeAcceptPath = function (element, callback) {
		var attributes = element.attributes;
		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = attributes[i];
			if (!this.IS_REJECT_PATH.test(attribute.name) && this.IS_ACCEPT_PATH.test(attribute.name)) {
				callback.call(this, attribute.value.replace(this.PATH, ''));
			}
		}
	};

	View.eachElement = function (element, target, callback) {
		var container = Utility.getContainer(element, target);

		if (this.isAccept(element) && !this.isSkip(element)) {
			callback.call(this, element, container);
		}

		if (!this.isSkipChildren(element)) {
			for (var i = 0, l = element.children.length; i < l; i++) {
				this.eachElement(element.children[i], target, callback);
			}
		}
	};

	View.eachBinder = function (id, path, callback) {
		var paths = this.data[id];
		for (var key in paths) {
			if (key.indexOf(path) === 0) {
				var binders = paths[key];
				for (var i = 0; i < binders.length; i++) {
					callback.call(this, binders[i], i, binders, paths, key);
				}
			}
		}
	};

	View.has = function (id, path, element) {
		if (!(id in this.data) || !(path in this.data[id])) return false;
		var binders = this.data[id][path];
		for (var i = 0, l = binders.length; i < l; i++) {
			if (binders[i].element === element) return true;
		}
		return false;
	};

	View.push = function (id, path, element, container, attribute) {
		if (!(id in this.data)) this.data[id] = {};
		if (!(path in this.data[id])) this.data[id][path] = [];
		this.data[id][path].push(new Binder({
			element: element,
			container: container,
			attribute: attribute
		}));
	};

	View.add = function (addedNode, target) {
		this.eachElement(addedNode, target, function (element, container) {
			if (container && container.id) {
				this.eachAttribute(element, function (attribute) {
					if (this.isOnce(attribute.name)) {
						OnceBinder.bind(element, attribute, container);
					} else {
						var path = attribute.viewPath;
						if (!this.has(container.id, path, element)) {
							this.push(container.id, path, element, container, attribute);
						}
					}
				});
			}
		});
	};

	View.remove = function (removedNode, target) {
		this.eachElement(removedNode, target, function (element, container) {
			if (container && container.id) {
				this.eachAttributeAcceptPath(element, function (path) {
					this.eachBinder(container.id, path, function (binder, index, binders, paths, key) {
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
					this.add(addedNode, target);
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

	View.run = function () {
		if (this.isRan) return;
		else this.isRan = true;

		this.add(this.container);
		Global.mutations.push(this.mutation.bind(this));
	};

	var Model = {};

	Model.data = {};
	Model.isRan = false;
	Model.container = document.body;

	Model.overwrite = function (data) {
		Observer(
			this.data = data,
			this.observer.bind(this)
		);
	};

	Model.listener = function (element) {
		var value = element.getAttribute('o-value');
		if (value) {
			var i, l;
			var path = value.replace(/(^(\w+\.?)+).*/, '$1');
			var container = Utility.getContainer(element);

			if (!container) return;
			
			var id = container.id;

			if (element.type === 'checkbox') {
				element.value = element.checked;
				Utility.setByPath(this.data[id], path, element.checked);
			} else if (element.nodeName === 'SELECT' && element.multiple) {
				var values = [];
				var options = element.options;
				for (i = 0, l = options.length; i < l; i++) {
					var option = options[i];
					if (option.selected) {
						values.push(option.value);
					}
				}
				Utility.setByPath(this.data[id], path, values);
			} else if (element.type === 'radio') {
				var elements = element.parentNode.querySelectorAll('input[type="radio"][o-value="' + path + '"]');
				for (i = 0, l = elements.length; i < l; i++) {
					var radio = elements[i];
					if (radio === element) {
						Utility.setByPath(this.data[id], path, i);
					} else {
						radio.checked = false;
					}
				}
			} else {
				Utility.setByPath(this.data[id], path, element.value);
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

	Model.view = {};

	Model.observer = function (data, path) {
		var paths = path.split('.');
		var id = paths[0];
		var type = data === undefined ? 'unrender' : 'render';

		path = paths.slice(1).join('.');

		// if (path) {
		// 	var element = document.getElementById(id);
		// 	// var element = document.body.querySelector('#' + id);
		// 	View.eachBinder(element, path, function (e, a) {
		// 		var options = {
		// 			element: e,
		// 			attribute: a,
		// 			container: element
		// 		};
		// 		var binder = new Binder(options);
		// 	});
		// }

		View.eachBinder(id, path, function (binder) {
			binder[type]();
		});
	};

	Model.run = function () {
		if (this.isRan) return;
		else this.isRan = true;

		Observer(
			this.data,
			this.observer.bind(this)
		);

		Global.inputs.push(this.input.bind(this));
		Global.changes.push(this.change.bind(this));
	};

	var Component = {};

	Component.data = {};

	Component.currentScript = (document._currentScript || document.currentScript);

	// Component.has = function (element) {
	// 	var elements = this.data[element.id];
	// 	return elements && elements.indexOf(element) !== -1;
	// };

	Component._slots = function (element, html) {
		var eSlots = element.querySelectorAll('[slot]');
		for (var i = 0, l = eSlots.length; i < l; i++) {
			var eSlot = eSlots[i];
			var sName = eSlot.getAttribute('slot');
			var tSlot = html.content.querySelector('slot[name='+ sName + ']');
			tSlot.parentNode.replaceChild(eSlot, tSlot);
		}
	};

	Component._template = function (data) {
		var template;
		if (data.html) {
			template = document.createElement('template');
			template.innerHTML = data.html;
		} else if (data.query) {
			try {
				template = Global.ownerDocument.querySelector(data.query);
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

	Component._define = function (name, proto) {
		document.registerElement(name, {
			prototype: proto
		});
	};

	Component.define = function (options) {
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

			if (!(options.name in self.data)) {
				self.data[options.name] = [];
			}

			self.data[options.name].push(element);

			element.id = options.name + '-' + self.data[options.name].length;

			element.isBinded = false;
			element.view = View.data[element.id] = {};

			if (options.model) element.model = Model.data.$set(element.id, options.model)[element.id];
			if (options.events) element.events = Global.events.data[element.id] = options.events;
			if (options.modifiers) element.modifiers = Global.modifiers.data[element.id] = options.modifiers;

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
	Loader.files = {};
	Loader.modules = {};
	Loader.esm = false;
	Loader.est = false;
	Loader.base = Utility.createBase();

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

		if (url.indexOf('/') !== 0) {
			url = Utility.joinSlash(this.base.replace(window.location.origin, ''), url);
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
		self.files[data.url] = data;

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
	Router.hash = false;
	Router.auth = false;
	Router.isRan = false;
	Router.location = {};
	Router.view = 'o-view';
	Router.trailing = false;

	Router.setup = function (options) {
		options = options || {};
		this.auth = options.auth === undefined ? this.auth : options.auth;
		this.view = options.view === undefined ? this.view : options.view;
		this.hash = options.hash === undefined ? this.hash : options.hash;
		this.routes = options.routes === undefined ? this.routes: options.routes;
		this.external = options.external === undefined ? this.external: options.external;
		this.container = options.container === undefined ? this.container: options.container;
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

		Batcher.write(function () {
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
			Loader.load(route.url, this.batch.bind(this, route));
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
			if (Keeper.route(location.route) === false) {
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
		this._.token = window[this.type].setItem('token', token);
	};

	Keeper.setUser = function (user) {
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
			Router$1.navigate(this._.authenticated);
		} else if (typeof this._.authenticated === 'function') {
			this._.authenticated();
		}
	};

	Keeper.unauthenticate = function () {
		this.removeToken();
		this.removeUser();
		if (typeof this._.unauthenticated === 'string') {
			Router$1.navigate(this._.unauthenticated);
		} else if (typeof this._.unauthenticated === 'function') {
			this._.unauthenticated();
		}
	};

	Keeper.forbidden = function (result) {
		if (typeof this._.forbidden === 'string') {
			Router$1.navigate(this._.forbidden);
		} else if (typeof this._.forbidden === 'function') {
			this._.forbidden(result);
		}
		return false;
	};

	Keeper.unauthorized = function (result) {
		if (typeof this._.unauthorized === 'string') {
			Router$1.navigate(this._.unauthorized);
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

	var Fetcher = {};

	Fetcher.setup = function (opt) {
		opt = opt || {};
		this.auth = opt.auth || false;
		this.type = opt.type || 'text';
		this.request = opt.request || opt.request;
		this.response = opt.response || opt.response;
		return this;
	};

	Fetcher.mime = {
		xml: 'text/xml; charset=utf-8',
		html: 'text/html; charset=utf-8',
		text: 'text/plain; charset=utf-8',
		json: 'application/json; charset=utf-8',
		js: 'application/javascript; charset=utf-8'
	};

	Fetcher.serialize = function (data) {
		var string = '';

		for (var name in data) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return string;
	};

	// Fetcher.onreadystatechange = function () { };

	Fetcher.fetch = function (opt) {
		var self = this;
		var result = {};
		var xhr = new XMLHttpRequest();

		opt = opt || {};
		opt.headers = {};
		opt.error = false;
		opt.type = opt.type || this.type;
		opt.url = opt.url ? opt.url : window.location.href;
		opt.method = opt.method ? opt.method.toUpperCase() : 'GET';

		xhr.open(opt.method, opt.url, true, opt.username, opt.password);

		if (opt.type) {
			opt.acceptType = opt.acceptType || opt.type;
			opt.contentType = opt.contentType || opt.type;
			opt.responseType = opt.responseType || opt.type;
		}

		if (opt.contentType) {
			switch (opt.contentType) {
				case 'js': opt.headers['Content-Type'] = self.mime.js; break;
				case 'xml': opt.headers['Content-Type'] = self.mime.xm; break;
				case 'html': opt.headers['Content-Type'] = self.mime.html; break;
				case 'json': opt.headers['Content-Type'] = self.mime.json; break;
				default: opt.headers['Content-Type'] = self.mime.text;
			}
		}

		if (opt.acceptType) {
			switch (opt.acceptType) {
				case 'js': opt.headers['Accept'] = self.mime.js; break;
				case 'xml': opt.headers['Accept'] = self.mime.xml; break;
				case 'html': opt.headers['Accept'] = self.mime.html; break;
				case 'json': opt.headers['Accept'] = self.mime.json; break;
				default: opt.headers['Accept'] = self.mime.text;
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

		if (opt.cache) {
			opt.headers.cache = true;
		} else {
			opt.cache = false;
		}

		if (opt.headers) {
			for (var name in opt.headers) {
				xhr.setRequestHeader(name, opt.headers[name]);
			}
		}

		if (opt.data && opt.method === 'GET') {
			opt.url = opt.url + '?' + self.serialize(opt.data);
		}

		result.xhr = xhr;
		result.opt = opt;
		result.data = opt.data;

		if (self.auth && (
			result.opt.auth === true ||
			result.opt.auth === undefined
		)) {
			if (Keeper.request(result) === false) {
				return;
			}
		}

		if (self.request && self.request(result) === false) {
			return;
		}

		xhr.onreadystatechange = function () {
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
					result.data = JSON.parse(result.data || {});
				}

				if (xhr.status === 401 || xhr.status === 403) {
					if (self.auth || result.opt.auth) {
						if (Keeper.response) {
							return Keeper.response(result);
						}
					}
				}

				if (self.response && self.response(result) === false) {
					return;
				}

				if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
					if (opt.success) {
						opt.success(result);
					} else if (opt.handler) {
						opt.handler(result);
					}
				} else {
					opt.isError = true;
					if (opt.error) {
						opt.error(result);
					} else if (opt.handler) {
						opt.handler(result);
					}
				}

			}
		};

		xhr.send(opt.method !== 'GET' && opt.contentType === 'json' ? JSON.stringify(opt.data || {}) : null);

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

	var Global = Object.defineProperties({}, {
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
		global: {
			enumerable: true,
			value: {}
		},
		events: {
			enumerable: true,
			value: { data: {} }
		},
		modifiers: {
			enumerable: true,
			value: { data: {} }
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
				if (this.isSetup) return;
				else this.isSetup = true;

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

	if (window.Oxe) throw new Error('Oxe pre-defined duplicate Oxe scripts');

	var Oxe$1 = Global; // Object.defineProperties({}, Object.getOwnPropertyDescriptors(Global));


	Oxe$1.window.addEventListener('input', function (e) {
		Oxe$1.inputs.forEach(function (input) {
			input(e);
		});
	}, true);

	Oxe$1.window.addEventListener('change', function (e) {
		Oxe$1.changes.forEach(function (change) {
			change(e);
		});
	}, true);

	Oxe$1.window.addEventListener('click', function (e) {
		Oxe$1.clicks.forEach(function (click) {
			click(e);
		});
	}, true);

	Oxe$1.window.addEventListener('popstate', function (e) {
		Oxe$1.popstates.forEach(function (popstate) {
			popstate(e);
		});
	}, true);

	Oxe$1.window.addEventListener('submit', function (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');
		var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
		var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');

		if (submit) {

			var container = Utility.getContainer(element);
			var data = Utility.formData(element, container.model);
			var handler = Utility.getByPath(container.events, submit);

			if (action) {
				Global.fetcher.fetch({
					data: data,
					url: action,
					method: method,
					handler: handler
				});
			} else {
				handler(data);
			}

			e.preventDefault();
		}
	}, true);

	new window.MutationObserver(function (mutations) {
		Oxe$1.mutations.forEach(function (mutation) {
			mutation(mutations);
		});
	}).observe(Oxe$1.body, {
		childList: true,
		subtree: true
	});

	window.requestAnimationFrame(function () {
		var eStyle = Oxe$1.document.createElement('style');
		var sStyle = Oxe$1.document.createTextNode('o-view, o-view > :first-child { display: block; }');
		eStyle.setAttribute('title', 'Oxe');
		eStyle.setAttribute('type', 'text/css');
		eStyle.appendChild(sStyle);
		Oxe$1.head.appendChild(eStyle);
		Oxe$1.document.registerElement('o-view', { prototype: Object.create(HTMLElement.prototype) });
		var eScript = Oxe$1.document.querySelector('[o-index]');
		var eIndex = eScript ? eScript.getAttribute('o-index') : null;
		if (eIndex) Oxe$1.loader.load({ url: eIndex });
	});

	Oxe$1.view.run();
	Oxe$1.model.run();

	return Oxe$1;

})));
