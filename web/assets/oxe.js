var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _awaitIgnored(value, direct) {
	if (!direct) {
		return Promise.resolve(value).then(_empty);
	}
}
function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _invoke(body, then) {
	var result = body();if (result && result.then) {
		return result.then(then);
	}
	return then(result);
}function _invokeIgnored(body) {
	var result = body();if (result && result.then) {
		return result.then(_empty);
	}
}function _empty() {}function _await(value, then, direct) {
	if (direct) {
		return then ? then(value) : value;
	}value = Promise.resolve(value);return then ? value.then(then) : value;
}var _async = function () {
	try {
		if (isNaN.apply(null, {})) {
			return function (f) {
				return function () {
					try {
						return Promise.resolve(f.apply(this, arguments));
					} catch (e) {
						return Promise.reject(e);
					}
				};
			};
		}
	} catch (e) {}return function (f) {
		// Pre-ES5.1 JavaScript runtimes don't accept array-likes in Function.apply
		return function () {
			var args = [];for (var i = 0; i < arguments.length; i++) {
				args[i] = arguments[i];
			}try {
				return Promise.resolve(f.apply(this, args));
			} catch (e) {
				return Promise.reject(e);
			}
		};
	};
}();
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, factory) {
	(typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define('Oxe', factory) : global.Oxe = factory();
})(this, function () {
	'use strict';

	/*
 	TODO:
 		sort reverse
 		test array methods
 		figure out a way to not update removed items
 */

	var Reset = _async(function (event) {
		var element = event.target;
		var binder = Binder$1.elements.get(element).get('submit');
		var model = Model$1.get(binder.scope);
		Utility.formReset(element, model);
	});

	var Submit = _async(function (event) {
		var method;

		var element = event.target;
		var binder = Binder$1.elements.get(element).get('submit');
		var method = Methods$1.get(binder.keys);
		var model = Model$1.get(binder.scope);
		var data = Utility.formData(element, model);

		return _await(method.call(binder.container, data, event), function (options) {
			return _invoke(function () {
				if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
					var action = element.getAttribute('o-action');
					method = element.getAttribute('o-method');

					var enctype = element.getAttribute('o-enctype');

					options.url = options.url || action;
					options.method = options.method || method;
					options.contentType = options.contentType || enctype;

					return _await(Fetcher$1.fetch(options), function (result) {
						return _invokeIgnored(function () {
							if (options.handler) {
								return _awaitIgnored(options.handler(result));
							}
						});
					});
				}
			}, function () {
				if (element.hasAttribute('o-reset') || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object' && options.reset) {
					element.reset();
				}
			});
		});
	});

	var Update = _async(function (element, attribute) {

		if (!element) throw new Error('Oxe - requires element argument');
		if (!attribute) throw new Error('Oxe - requires attribute argument');

		var binder = Binder$1.elements.get(element).get(attribute);

		var read = function read() {
			var type = binder.element.type;
			var name = binder.element.nodeName;

			var data = void 0;

			if (name === 'SELECT') {
				var elements = binder.element.options;
				var multiple = binder.element.multiple;

				var selected = false;

				data = multiple ? [] : '';

				for (var i = 0, l = elements.length; i < l; i++) {
					var _element = elements[i];
					// NOTE might need to handle disable

					if (_element.selected) {
						selected = true;

						if (multiple) {
							data.push(_element.value);
						} else {
							data = _element.value;
							break;
						}
					}
				}

				if (elements.length && !multiple && !selected) {
					data = elements[0].value;
				}
			} else if (type === 'radio') {
				var query = 'input[type="radio"][o-value="' + binder.value + '"]';
				var _elements2 = binder.container.querySelectorAll(query);

				for (var _i = 0, _l = _elements2.length; _i < _l; _i++) {
					var _element2 = _elements2[_i];

					if (binder.element === _element2) {
						data = _i;
					}
				}
			} else if (type === 'file') {
				var files = binder.element.files;

				data = data || [];

				for (var _i2 = 0, _l2 = files.length; _i2 < _l2; _i2++) {
					var file = files[_i2];
					data.push(file);
				}
			} else if (type === 'checkbox') {
				data = binder.element.checked;
			} else {
				data = binder.element.value;
			}

			if (data !== undefined) {
				var original = Model$1.get(binder.keys);

				if (data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && data.constructor === original.constructor) {
					for (var key in data) {
						if (data[key] !== original[key]) {
							Model$1.set(binder.keys, data);
							break;
						}
					}
				} else if (original !== data) {
					Model$1.set(binder.keys, data);
				}
			}
		};

		Batcher$1.batch({ read: read });
	});

	var Observer = {
		splice: function splice() {
			var self = this;

			var startIndex = arguments[0];
			var deleteCount = arguments[1];
			var addCount = arguments.length > 2 ? arguments.length - 2 : 0;

			if (typeof startIndex !== 'number' || typeof deleteCount !== 'number') {
				return [];
			}

			// handle negative startIndex
			if (startIndex < 0) {
				startIndex = self.length + startIndex;
				startIndex = startIndex > 0 ? startIndex : 0;
			} else {
				startIndex = startIndex < self.length ? startIndex : self.length;
			}

			// handle negative deleteCount
			if (deleteCount < 0) {
				deleteCount = 0;
			} else if (deleteCount > self.length - startIndex) {
				deleteCount = self.length - startIndex;
			}

			var totalCount = self.$meta.length;
			var key = void 0,
			    index = void 0,
			    value = void 0,
			    updateCount = void 0;
			var argumentIndex = 2;
			var argumentsCount = arguments.length - argumentIndex;
			var result = self.slice(startIndex, deleteCount);

			updateCount = totalCount - 1 - startIndex;

			var promises = [];

			if (updateCount > 0) {
				index = startIndex;

				while (updateCount--) {
					key = index++;

					if (argumentsCount && argumentIndex < argumentsCount) {
						value = arguments[argumentIndex++];
					} else {
						value = self.$meta[index];
					}

					self.$meta[key] = Observer.create(value, self.$meta.listener, self.$meta.path + key);
					promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
				}
			}

			if (addCount > 0) {

				promises.push(self.$meta.listener.bind(null, self.length + addCount, self.$meta.path.slice(0, -1), 'length'));

				while (addCount--) {
					key = self.length;
					self.$meta[key] = Observer.create(arguments[argumentIndex++], self.$meta.listener, self.$meta.path + key);
					Observer.defineProperty(self, key);
					promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
				}
			}

			if (deleteCount > 0) {

				promises.push(self.$meta.listener.bind(null, self.length - deleteCount, self.$meta.path.slice(0, -1), 'length'));

				while (deleteCount--) {
					self.$meta.length--;
					self.length--;
					key = self.length;
					promises.push(self.$meta.listener.bind(null, undefined, self.$meta.path + key, key));
				}
			}

			promises.reduce(function (promise, item) {
				return promise.then(item);
			}, Promise.resolve()).catch(console.error);

			return result;
		},
		arrayProperties: function arrayProperties() {
			var self = this;

			return {
				push: {
					value: function value() {
						if (!arguments.length) return this.length;

						for (var i = 0, l = arguments.length; i < l; i++) {
							self.splice.call(this, this.length, 0, arguments[i]);
						}

						return this.length;
					}
				},
				unshift: {
					value: function value() {
						if (!arguments.length) return this.length;

						for (var i = 0, l = arguments.length; i < l; i++) {
							self.splice.call(this, 0, 0, arguments[i]);
						}

						return this.length;
					}
				},
				pop: {
					value: function value() {
						if (!this.length) return;
						return self.splice.call(this, this.length - 1, 1);
					}
				},
				shift: {
					value: function value() {
						if (!this.length) return;
						return self.splice.call(this, 0, 1);
					}
				},
				splice: {
					value: self.splice
				}
			};
		},
		objectProperties: function objectProperties() {
			var self = this;

			return {
				$get: {
					value: function value(key) {
						return this[key];
					}
				},
				$set: {
					value: function value(key, _value) {
						if (_value !== this[key]) {
							var result = self.create(_value, this.$meta.listener, this.$meta.path + key);

							this.$meta[key] = result;
							self.defineProperty(this, key);

							this.$meta.listener(result, this.$meta.path + key, key);

							return result;
						}
					}
				},
				$remove: {
					value: function value(key) {
						if (key in this) {
							if (this.constructor === Array) {
								return self.splice.call(this, key, 1);
							} else {
								var result = this[key];
								delete this.$meta[key];
								delete this[key];
								this.$meta.listener(undefined, this.$meta.path + key, key);
								return result;
							}
						}
					}
				}
			};
		},
		property: function property(key) {
			var self = this;

			return {
				enumerable: true,
				configurable: true,
				get: function get() {
					return this.$meta[key];
				},
				set: function set(value) {
					if (value !== this.$meta[key]) {
						this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);
						this.$meta.listener(this[key], this.$meta.path + key, key, this);
					}
				}
			};
		},
		defineProperty: function defineProperty(data, key) {
			return Object.defineProperty(data, key, this.property(key));
		},
		create: function create(source, listener, path) {
			var self = this;

			if (!source || source.constructor !== Object && source.constructor !== Array) {
				return source;
			}

			path = path ? path + '.' : '';

			var key = void 0,
			    length = void 0;
			var type = source.constructor;
			var target = source.constructor();
			var properties = source.constructor();

			properties.$meta = {
				value: source.constructor()
			};

			properties.$meta.value.path = path;
			properties.$meta.value.listener = listener;

			if (type === Array) {

				for (key = 0, length = source.length; key < length; key++) {
					properties.$meta.value[key] = self.create(source[key], listener, path + key);
					properties[key] = self.property(key);
				}

				var arrayProperties = self.arrayProperties();

				for (key in arrayProperties) {
					properties[key] = arrayProperties[key];
				}
			}

			if (type === Object) {

				for (key in source) {
					properties.$meta.value[key] = self.create(source[key], listener, path + key);
					properties[key] = self.property(key);
				}
			}

			var objectProperties = self.objectProperties();

			for (key in objectProperties) {
				properties[key] = objectProperties[key];
			}

			return Object.defineProperties(target, properties);
		}
	};

	function Class(binder) {
		return {
			write: function write() {
				var className = binder.names.slice(1).join('-');
				binder.element.classList.remove(className);
			}
		};
	}

	function Css(binder) {
		return {
			write: function write() {
				binder.element.style.cssText = '';
			}
		};
	}

	var Batcher = function () {
		function Batcher() {
			_classCallCheck(this, Batcher);

			this.reads = [];
			this.writes = [];
			this.time = 1000 / 30;
			this.pending = false;
		}

		_createClass(Batcher, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};
				this.time = options.time || this.time;
			}
		}, {
			key: 'tick',
			value: function tick(callback) {
				return window.requestAnimationFrame(callback);
			}

			// schedules a new read/write batch if one is not pending

		}, {
			key: 'schedule',
			value: function schedule() {
				if (this.pending) return;
				this.pending = true;
				this.tick(this.flush.bind(this, null));
			}
		}, {
			key: 'flush',
			value: function flush(time) {
				time = time || performance.now();

				var task = void 0;

				while (task = this.reads.shift()) {
					task();

					if (performance.now() - time > this.time) {
						this.tick(this.flush.bind(this, null));
						return;
					}
				}

				while (task = this.writes.shift()) {
					task();

					if (performance.now() - time > this.time) {
						this.tick(this.flush.bind(this, null));
						return;
					}
				}

				if (!this.reads.length && !this.writes.length) {
					this.pending = false;
				} else if (performance.now() - time > this.time) {
					this.tick(this.flush.bind(this, null));
				} else {
					this.flush(time);
				}
			}
		}, {
			key: 'remove',
			value: function remove(tasks, task) {
				var index = tasks.indexOf(task);
				return !!~index && !!tasks.splice(index, 1);
			}
		}, {
			key: 'clear',
			value: function clear(task) {
				return this.remove(this.reads, task) || this.remove(this.writes, task);
			}
		}, {
			key: 'batch',
			value: function batch(data) {
				var self = this;

				// let read;
				// let write;
				//
				// if (data.context) {
				// 	read = data.read.bind(data.context, data.shared);
				// 	write = data.write.bind(data.context, data.shared);
				// } else {
				// 	read = data.read;
				// 	write = data.write;
				// }
				//
				// if (read) self.reads.push(read);
				// if (write) self.writes.push(write);
				//
				// self.schedule();

				if (data.read) {

					var read = function read() {
						var result = void 0;
						var write = void 0;

						if (data.context) {
							result = data.read.call(data.context);
						} else {
							result = data.read();
						}

						if (data.write && result !== false) {

							if (data.context) {
								write = data.write.bind(data.context);
							} else {
								write = data.write;
							}

							self.writes.push(write);
							self.schedule();
						}
					};

					self.reads.push(read);
					self.schedule();
				} else if (data.write) {
					var write = void 0;

					if (data.context) {
						write = data.write.bind(data.context, data.shared);
					} else {
						write = data.write;
					}

					self.writes.push(write);
					self.schedule();
				}

				return data;
			}
		}]);

		return Batcher;
	}();

	var Batcher$1 = new Batcher();

	/*
 	console.log('read ', Oxe.batcher.tr);
 	console.log('write ', Oxe.batcher.tw);
 	console.log('position ', Oxe.batcher.tp);
 	Oxe.batcher.tr = 0;
 	Oxe.batcher.tw = 0;
 	Oxe.batcher.tp = 0;
 */

	function Default(binder) {
		var unrender = void 0;

		if (binder.type in this) {
			unrender = this[binder.type](binder);
		} else {
			unrender = {
				read: function read() {
					if (binder.element[binder.type] === '') {
						return false;
					}
				},
				write: function write() {
					binder.element[binder.type] = '';
				}
			};
		}

		Batcher$1.batch(unrender);
	}

	function Disable(binder) {
		return {
			write: function write() {
				binder.element.disabled = false;
			}
		};
	}

	function Each(binder) {
		return {
			write: function write() {
				var element = void 0;

				while (element = binder.element.lastElementChild) {
					binder.element.removeChild(element);
				}
			}
		};
	}

	function Enable(binder) {
		return {
			write: function write() {
				binder.element.disabled = true;
			}
		};
	}

	function Hide(binder) {
		return {
			write: function write() {
				binder.element.hidden = false;
			}
		};
	}

	function Html(binder) {
		return {
			write: function write() {
				var element = void 0;

				while (element = binder.element.lastElementChild) {
					binder.element.removeChild(element);
				}
			}
		};
	}

	function On(binder) {
		return {
			write: function write() {
				binder.element.removeEventListener(binder.names[1], binder.cache, false);
			}
		};
	}

	function Read(binder) {
		return {
			write: function write() {
				binder.element.readOnly = false;
			}
		};
	}

	function Required(binder) {
		return {
			write: function write() {
				binder.element.required = false;
			}
		};
	}

	function Show(binder) {
		return {
			write: function write() {
				binder.element.hidden = true;
			}
		};
	}

	function Text(binder) {
		return {
			write: function write() {
				binder.element.innerText = '';
			}
		};
	}

	function Value(binder) {
		return {
			write: function write() {
				var i = void 0,
				    l = void 0,
				    query = void 0,
				    element = void 0,
				    elements = void 0;

				if (binder.element.nodeName === 'SELECT') {

					elements = binder.element.options;

					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];
						element.selected = false;
					}
				} else if (binder.element.type === 'radio') {

					query = 'input[type="radio"][o-value="' + binder.path + '"]';
					elements = binder.element.parentNode.querySelectorAll(query);

					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];

						if (i === 0) {
							element.checked = true;
						} else {
							element.checked = false;
						}
					}
				} else if (binder.element.type === 'checkbox') {

					binder.element.checked = false;
					binder.element.value = false;
				} else {
					binder.element.value = '';
				}
			}
		};
	}

	function Write(binder) {

		return {
			write: function write() {
				binder.element.readOnly = true;
			}
		};
	}

	var Unrender$1 = {
		class: Class,
		css: Css,
		default: Default,
		disable: Disable,
		disabled: Disable,
		each: Each,
		enable: Enable,
		enabled: Enable,
		hide: Hide,
		html: Html,
		on: On,
		read: Read,
		required: Required,
		show: Show,
		text: Text,
		value: Value,
		write: Write
	};

	var Utility = {

		PREFIX: /data-o-|o-/,
		ROOT: /^(https?:)?\/?\//,

		DOT: /\.+/,
		PIPE: /\s?\|\s?/,
		PIPES: /\s?,\s?|\s+/,
		VARIABLE_START: '(^|(\\|+|\\,+|\\s))',
		VARIABLE_END: '(?:)',
		// VARIABLE_END: '([^a-zA-z1-9]|$)',

		binderNames: function binderNames(data) {
			data = data.split(this.PREFIX)[1];
			return data ? data.split('-') : [];
		},
		binderValues: function binderValues(data) {
			data = data.split(this.PIPE)[0];
			return data ? data.split('.') : [];
		},
		binderPipes: function binderPipes(data) {
			data = data.split(this.PIPE)[1];
			return data ? data.split(this.PIPES) : [];
		},
		ensureElement: function ensureElement(data) {
			data.query = data.query || '';
			data.scope = data.scope || document.body;

			var element = data.scope.querySelector('' + data.name + data.query);

			if (!element) {
				element = document.createElement(data.name);

				if (data.position === 'afterbegin') {
					data.scope.insertBefore(element, data.scope.firstChild);
				} else if (data.position === 'beforeend') {
					data.scope.appendChild(element);
				} else {
					data.scope.appendChild(element);
				}
			}

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = data.attributes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var attribute = _step.value;

					element.setAttribute(attribute.name, attribute.value);
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			return element;
		},
		formData: function formData(form, model) {
			var elements = form.querySelectorAll('[o-value]');
			var data = {};

			for (var i = 0, l = elements.length; i < l; i++) {
				var element = elements[i];

				if (element.nodeName === 'OPTION') continue;

				var value = element.getAttribute('o-value');

				if (!value) continue;

				var values = this.binderValues(value);

				data[values[values.length - 1]] = this.getByPath(model, values);
			}

			return data;
		},
		formReset: function formReset(form, model) {
			var elements = form.querySelectorAll('[o-value]');

			for (var i = 0, l = elements.length; i < l; i++) {
				var element = elements[i];

				if (element.nodeName === 'OPTION') continue;

				var value = element.getAttribute('o-value');

				if (!value) continue;

				var values = this.binderValues(value);

				this.setByPath(model, values, '');
			}
		},
		walker: function walker(node, callback) {
			callback(node);
			// node = node.firstElementChild;
			node = node.firstChild;
			while (node) {
				this.walker(node, callback);
				// node = node.nextElementSibling;
				node = node.nextSibling;
			}
		},
		replaceEachVariable: function replaceEachVariable(element, variable, path, key) {
			var self = this;
			var pattern = new RegExp(this.VARIABLE_START + variable + this.VARIABLE_END, 'g');

			self.walker(element, function (node) {
				if (node.nodeType === 3) {
					if (node.nodeValue === '$' + variable || node.nodeValue === '$index') {
						node.nodeValue = key;
					}
				} else if (node.nodeType === 1) {
					for (var i = 0, l = node.attributes.length; i < l; i++) {
						var attribute = node.attributes[i];
						if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {
							attribute.value = attribute.value.replace(pattern, '$1' + path + '.' + key);
							// attribute.value = attribute.value.replace(pattern, `$1${path}.${key}$2`);
						}
					}
				}
			});
		},
		traverse: function traverse(data, path, callback) {
			var keys = typeof path === 'string' ? path.split('.') : path;
			var last = keys.length - 1;

			for (var i = 0; i < last; i++) {
				var key = keys[i];

				if (!(key in data)) {
					if (typeof callback === 'function') {
						callback(data, key, i, keys);
					} else {
						return undefined;
					}
				}

				data = data[key];
			}

			return {
				data: data,
				key: keys[last]
			};
		},
		setByPath: function setByPath(data, path, value) {
			var keys = typeof path === 'string' ? path.split('.') : path;
			var last = keys.length - 1;

			for (var i = 0; i < last; i++) {
				var key = keys[i];

				if (!(key in data)) {

					if (isNaN(keys[i + 1])) {
						data[key] = {};
					} else {
						data[key] = [];
					}
				}

				data = data[key];
			}

			return data[keys[last]] = value;
		},
		getByPath: function getByPath(data, path) {
			var keys = typeof path === 'string' ? path.split('.') : path;
			var last = keys.length - 1;

			for (var i = 0; i < last; i++) {
				var key = keys[i];

				if (!(key in data)) {
					return undefined;
				} else {
					data = data[key];
				}
			}

			return data[keys[last]];
		},
		joinDot: function joinDot() {
			return Array.prototype.join.call(arguments, '.').replace(/\.{2,}/g, '.');
		},


		// getScope (element) {
		//
		// 	if (!element) {
		// 		return;
		// 	}
		//
		// 	if (element.hasAttribute('o-scope') || element.hasAttribute('data-o-scope')) {
		// 		return element;
		// 	}
		//
		// 	if (element.parentNode) {
		// 		return this.getScope(element.parentNode);
		// 	}
		//
		// 	// console.warn('Oxe.utility - could not find container scope');
		// },

		ready: function ready(callback) {
			if (callback) {
				if (document.readyState !== 'interactive' && document.readyState !== 'complete') {
					document.addEventListener('DOMContentLoaded', function _() {
						callback();
						document.removeEventListener('DOMContentLoaded', _);
					}, true);
				} else {
					callback();
				}
			}
		}
	};

	var Methods = function () {
		function Methods() {
			_classCallCheck(this, Methods);

			this.data = {};
		}

		_createClass(Methods, [{
			key: 'get',
			value: function get(path) {
				return Utility.getByPath(this.data, path);
			}
		}, {
			key: 'set',
			value: function set(path, data) {
				return Utility.setByPath(this.data, path, data);
			}
		}]);

		return Methods;
	}();

	var Methods$1 = new Methods();

	function Class$1(binder) {
		var data = void 0,
		    name = void 0;

		return {
			write: function write() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);
				name = binder.names.slice(1).join('-');
				binder.element.classList.toggle(name, data);
			}
		};
	}

	function Css$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);

				if (binder.names.length > 1) {
					data = binder.names.slice(1).join('-') + ': ' + data + ';';
				}

				if (data === binder.element.style.cssText) {
					return false;
				}
			},
			write: function write() {
				binder.element.style.cssText = data;
			}
		};
	}

	function Default$1(binder) {
		var render = void 0;

		if (binder.type in this) {
			render = this[binder.type](binder);
		} else {
			var data = void 0;

			render = {
				read: function read() {
					data = Model$1.get(binder.keys);
					data = Binder$1.piper(binder, data);

					if (data === undefined || data === null) {
						Model$1.set(binder.keys, '');
						return false;
					} else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
						data = JSON.stringify(data);
					} else if (typeof data !== 'string') {
						data = data.toString();
					}

					if (data === binder.element[binder.type]) {
						return false;
					}
				},
				write: function write() {
					binder.element[binder.type] = data;
				}
			};
		}

		if (render) {
			Batcher$1.batch(render);
		}
	}

	function Disable$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);
				if (data === binder.element.disabled) return false;
			},
			write: function write() {
				binder.element.disabled = data;
			}
		};
	}

	function Each$1(binder) {

		if (!binder.cache && !binder.element.children.length) {
			return;
		}

		if (!binder.fragment) {
			binder.fragment = document.createDocumentFragment();
		}

		if (!binder.cache) {
			binder.cache = binder.element.removeChild(binder.element.firstElementChild);
		}

		var self = this,
		    data = void 0,
		    add = void 0,
		    remove = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);

				if (!data || (typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') return false;

				var isArray = data.constructor === Array;
				var keys = isArray ? [] : Object.keys(data);
				var dataLength = isArray ? data.length : keys.length;
				var elementLength = binder.fragment.children.length + binder.element.children.length;

				if (elementLength === dataLength) {
					return false;
				} else if (elementLength > dataLength) {
					remove = true;
					elementLength--;
				} else if (elementLength < dataLength) {
					var clone = document.importNode(binder.cache, true);
					var variable = isArray ? elementLength : keys[elementLength];

					Utility.replaceEachVariable(clone, binder.names[1], binder.path, variable);
					Binder$1.bind(clone, binder.container, binder.scope);
					binder.fragment.appendChild(clone);
					elementLength++;

					if (elementLength === dataLength) {
						add = true;
					}

					/*
     	check if select element with o-value
     	perform a re-render of the o-value
     	becuase of o-each is async
     */

					if (binder.element.nodeName === 'SELECT' && binder.element.attributes['o-value']) {
						var name = binder.element.attributes['o-value'].name;
						var value = binder.element.attributes['o-value'].value;
						var select = Binder$1.create({
							name: name,
							value: value,
							scope: binder.scope,
							element: binder.element,
							container: binder.container
						});
						self.default(select);
					}
				}

				if (elementLength < dataLength) {
					self.default(binder);
					return false;
				}
			},
			write: function write() {
				if (remove) {
					binder.element.removeChild(binder.element.lastElementChild);
				} else if (add) {
					binder.element.appendChild(binder.fragment);
				}
			}
		};
	}

	function Enable$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);
				if (!data === binder.element.disabled) return false;
			},
			write: function write() {
				binder.element.disabled = !data;
			}
		};
	}

	function Hide$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);
				if (data === binder.element.hidden) return false;
			},
			write: function write() {
				binder.element.hidden = data;
			}
		};
	}

	function Html$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);

				if (data === undefined || data === null) {
					Model$1.set(binder.keys, '');
					return false;
				} else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
					data = JSON.stringify(data);
				} else if (typeof data !== 'string') {
					data = String(data);
				}

				if (data === binder.element.innerHTML) {
					return false;
				}
			},
			write: function write() {
				binder.element.innerHTML = data;
			}
		};
	}

	function On$1(binder) {
		var data = void 0;

		return {
			write: function write() {
				data = Methods$1.get(binder.keys);

				if (typeof data !== 'function') {
					console.warn('Oxe - attribute o-on="' + binder.keys.join('.') + '" invalid type function required');
					return false;
				}

				if (!binder.cache) {
					binder.cache = function (e) {
						var parameters = [e];

						for (var i = 0, l = binder.pipes.length; i < l; i++) {
							var keys = binder.pipes[i].split('.');
							keys.unshift(binder.scope);
							var parameter = Model$1.get(keys);
							parameters.push(parameter);
						}

						Promise.resolve().then(data.bind(binder.container).apply(null, parameters)).catch(console.error);
					};
				}

				binder.element.removeEventListener(binder.names[1], binder.cache);
				binder.element.addEventListener(binder.names[1], binder.cache);
			}
		};
	}

	function Read$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);
				if (data === binder.element.readOnly) return false;
			},
			write: function write() {
				binder.element.readOnly = data;
			}
		};
	}

	function Required$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);
				if (data === binder.element.required) return false;
			},
			write: function write() {
				binder.element.required = data;
			}
		};
	}

	function Show$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);
				if (!data === binder.element.hidden) return false;
			},
			write: function write() {
				binder.element.hidden = !data;
			}
		};
	}

	function Text$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);

				if (data === undefined || data === null) {
					Model$1.set(binder.keys, '');
					return false;
				} else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
					data = JSON.stringify(data);
				} else if (typeof data !== 'string') {
					data = data.toString();
				}

				if (data === binder.element.innerText) {
					return false;
				}
			},
			write: function write() {
				binder.element.innerText = data;
			}
		};
	}

	function Value$1(binder) {
		var self = this;
		var type = binder.element.type;
		var name = binder.element.nodeName;

		var data = void 0,
		    multiple = void 0;

		if (name === 'SELECT') {
			var elements = void 0;

			return {
				read: function read() {
					data = Model$1.get(binder.keys);
					data = Binder$1.piper(binder, data);

					elements = binder.element.options;
					multiple = binder.element.multiple;

					if (multiple && data.constructor !== Array) {
						throw new Error('Oxe - invalid multiple select value type ' + binder.keys.join('.') + ' array required');
					}

					if (multiple) return false;
				},
				write: function write() {
					var index = 0;
					var selected = false;

					// NOTE might need to handle disable
					for (var i = 0, l = elements.length; i < l; i++) {
						var element = elements[i];

						if (element.value === data) {
							selected = true;
							element.setAttribute('selected', '');
						} else if (element.hasAttribute('selected')) {
							index = i;
							element.removeAttribute('selected');
						} else {
							element.removeAttribute('selected');
						}
					}

					if (elements.length && !selected) {
						elements[index].setAttribute('selected', '');
						if (data !== (elements[index].value || '')) {
							Model$1.set(binder.keys, elements[index].value || '');
						}
					}
				}
			};
		} else if (type === 'radio') {
			var _elements = void 0;

			return {
				read: function read() {
					data = Model$1.get(binder.keys);

					if (data === undefined) {
						Model$1.set(binder.keys, 0);
						return false;
					}

					_elements = binder.container.querySelectorAll('input[type="radio"][o-value="' + binder.value + '"]');
				},
				write: function write() {
					var checked = false;

					for (var i = 0, l = _elements.length; i < l; i++) {
						var element = _elements[i];

						if (i === data) {
							checked = true;
							element.checked = true;
						} else {
							element.checked = false;
						}
					}

					if (!checked) {
						_elements[0].checked = true;
						Model$1.set(binder.keys, 0);
					}
				}
			};
		} else if (type === 'file') {
			return {
				read: function read() {
					data = Model$1.get(binder.keys);

					if (data === undefined) {
						Model$1.set(binder.keys, []);
						return false;
					}

					if (!data || data.constructor !== Array) {
						console.warn('Oxe - file attribute invalid type');
						return false;
					}
				},
				write: function write() {
					for (var i = 0, l = data.length; i < l; i++) {
						if (data[i] !== binder.element.files[i]) {
							if (data[i]) {
								binder.element.files[i] = data[i];
							} else {
								console.warn('Oxe - file remove not implemented');
							}
						}
					}
				}
			};
		} else if (type === 'checkbox') {
			return {
				read: function read() {
					data = Model$1.get(binder.keys);

					if (typeof data !== 'boolean') {
						Model$1.set(binder.keys, false);
						return false;
					}

					if (data === binder.element.checked) {
						return false;
					}
				},
				write: function write() {
					binder.element.checked = data;
				}
			};
		} else {
			return {
				read: function read() {

					if (name === 'OPTION' && binder.element.selected) {
						var parent = binder.element.parentElement;
						var select = Binder$1.elements.get(parent).get('value');
						self.default(select);
					}

					data = Model$1.get(binder.keys);

					if (data === undefined || data === null) {
						Model$1.set(binder.keys, '');
						return false;
					}

					if (data === binder.element.value) {
						return false;
					}
				},
				write: function write() {
					binder.element.value = data;
				}
			};
		}
	}

	function Write$1(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$1.get(binder.keys);
				data = Binder$1.piper(binder, data);
				if (!data === binder.element.readOnly) return false;
			},
			write: function write() {
				binder.element.readOnly = !data;
			}
		};
	}

	var Render = {
		class: Class$1,
		css: Css$1,
		default: Default$1,
		disable: Disable$1,
		disabled: Disable$1,
		each: Each$1,
		enable: Enable$1,
		enabled: Enable$1,
		hide: Hide$1,
		html: Html$1,
		on: On$1,
		read: Read$1,
		required: Required$1,
		show: Show$1,
		text: Text$1,
		value: Value$1,
		write: Write$1
	};

	var Binder = function () {
		function Binder() {
			_classCallCheck(this, Binder);

			this.data = {};
			this.elements = new Map();
		}

		_createClass(Binder, [{
			key: 'create',
			value: function create(data) {
				var binder = {};

				if (data.name === undefined) throw new Error('Oxe.binder.create - missing name');
				if (data.value === undefined) throw new Error('Oxe.binder.create - missing value');
				if (data.scope === undefined) throw new Error('Oxe.binder.create - missing scope');
				if (data.element === undefined) throw new Error('Oxe.binder.create - missing element');
				if (data.container === undefined) throw new Error('Oxe.binder.create - missing container');

				binder.name = data.name;
				binder.value = data.value;
				binder.scope = data.scope;
				binder.element = data.element;
				binder.container = data.container;

				binder.names = data.names || Utility.binderNames(data.name);
				binder.pipes = data.pipes || Utility.binderPipes(data.value);
				binder.values = data.values || Utility.binderValues(data.value);

				binder.context = {};
				binder.path = binder.values.join('.');
				binder.type = binder.type || binder.names[0];
				binder.keys = [binder.scope].concat(binder.values);

				return binder;
			}
		}, {
			key: 'get',
			value: function get(data) {
				var binder = void 0;

				if (typeof data === 'string') {
					binder = {};
					binder.scope = data.split('.').slice(0, 1).join('.');
					binder.path = data.split('.').slice(1).join('.');
				} else {
					binder = data;
				}

				if (!(binder.scope in this.data)) {
					return null;
				}

				if (!(binder.path in this.data[binder.scope])) {
					return null;
				}

				var items = this.data[binder.scope][binder.path];

				for (var i = 0, l = items.length; i < l; i++) {
					var item = items[i];

					if (item.element === binder.element && item.name === binder.name) {
						return item;
					}
				}

				return null;
			}
		}, {
			key: 'add',
			value: function add(binder) {

				if (!this.elements.has(binder.element)) {
					this.elements.set(binder.element, new Map());
				}

				if (!this.elements.get(binder.element).has(binder.names[0])) {
					this.elements.get(binder.element).set(binder.names[0], binder);
				} else {
					return false;
					// throw new Error(`Oxe - duplicate attribute ${binder.scope} ${binder.names[0]} ${binder.value}`);
				}

				if (!(binder.scope in this.data)) {
					this.data[binder.scope] = {};
				}

				if (!(binder.path in this.data[binder.scope])) {
					this.data[binder.scope][binder.path] = [];
				}

				this.data[binder.scope][binder.path].push(binder);
			}
		}, {
			key: 'remove',
			value: function remove(binder) {

				if (this.elements.has(binder.element)) {

					if (this.elements.get(binder.element).has(binder.names[0])) {
						this.elements.get(binder.element).remove(binder.names[0]);
					}

					if (this.elements.get(binder.elements).length === 0) {
						this.elements.remove(binder.elements);
					}
				}

				if (!(binder.scope in this.data)) {
					return;
				}

				if (!(binder.path in this.data[binder.scope])) {
					return;
				}

				var items = this.data[binder.scope][binder.path];

				for (var i = 0, l = items.length; i < l; i++) {

					if (items[i].element === binder.element) {
						return items.splice(i, 1);
					}
				}
			}
		}, {
			key: 'each',
			value: function each(path, callback) {
				var paths = typeof path === 'string' ? path.split('.') : path;
				var scope = paths[0];

				var binderPaths = this.data[scope];
				if (!binderPaths) return;
				var relativePath = paths.slice(1).join('.');

				for (var binderPath in binderPaths) {

					if (relativePath === '' || binderPath.indexOf(relativePath) === 0 && (binderPath === relativePath || binderPath.charAt(relativePath.length) === '.')) {
						var binders = binderPaths[binderPath];

						for (var c = 0, t = binders.length; c < t; c++) {
							callback(binders[c]);
						}
					}
				}
			}

			// make async

		}, {
			key: 'piper',
			value: function piper(binder, data) {

				if (!binder.pipes.length) {
					return data;
				}

				var methods = Methods$1.get(binder.scope);

				if (!methods) {
					return data;
				}

				for (var i = 0, l = binder.pipes.length; i < l; i++) {
					var method = binder.pipes[i];

					if (method in methods) {
						data = methods[method].call(binder.container, data);
					} else {
						throw new Error('Oxe - pipe method ' + method + ' not found in scope ' + binder.scope);
					}
				}

				return data;
			}
		}, {
			key: 'skipChildren',
			value: function skipChildren(element) {

				if (element.nodeName === '#document-fragment') {
					return false;
				}

				if (element.nodeName === 'STYLE' && element.nodeName === 'SCRIPT' && element.nodeName === 'OBJECT' && element.nodeName === 'IFRAME') {
					return true;
				}

				for (var i = 0, l = element.attributes.length; i < l; i++) {
					var attribute = element.attributes[i];

					if (attribute.name.indexOf('o-each') === 0) {
						return true;
					}
				}

				return false;
			}
		}, {
			key: 'eachElement',
			value: function eachElement(element, callback) {

				if (element.nodeName !== 'SLOT' && element.nodeName !== 'O-ROUTER' && element.nodeName !== 'TEMPLATE' && element.nodeName !== '#document-fragment') {
					callback.call(this, element);
				}

				if (!this.skipChildren(element)) {
					element = element.firstElementChild;

					while (element) {
						this.eachElement(element, callback);
						element = element.nextElementSibling;
					}
				}
			}
		}, {
			key: 'eachAttribute',
			value: function eachAttribute(element, callback) {
				var attributes = element.attributes;

				for (var i = 0, l = attributes.length; i < l; i++) {
					var attribute = attributes[i];

					if (attribute.name.indexOf('o-') === 0 && attribute.name !== 'o-scope' && attribute.name !== 'o-reset' && attribute.name !== 'o-action' && attribute.name !== 'o-method' && attribute.name !== 'o-enctype') {
						callback.call(this, attribute);
					}
				}
			}
		}, {
			key: 'unbind',
			value: function unbind(element, container, scope) {

				if (!scope) throw new Error('Oxe - unbind requires scope argument');
				if (!element) throw new Error('Oxe - unbind requires element argument');
				if (!container) throw new Error('Oxe - unbind requires container argument');

				this.eachElement(element, function (child) {
					this.eachAttribute(child, function (attribute) {

						var binder = this.get({
							scope: scope,
							element: child,
							container: container,
							name: attribute.name,
							value: attribute.value
						});

						this.remove(binder);
						Unrender.default(binder);
					});
				});
			}
		}, {
			key: 'bind',
			value: function bind(element, container, scope) {

				if (!scope) throw new Error('Oxe - bind requires scope argument');
				if (!element) throw new Error('Oxe - bind requires element argument');
				if (!container) throw new Error('Oxe - bind requires container argument');

				this.eachElement(element, function (child) {
					this.eachAttribute(child, function (attribute) {

						var binder = this.create({
							scope: scope,
							element: child,
							container: container,
							name: attribute.name,
							value: attribute.value
						});

						var result = this.add(binder);

						if (result !== false) {
							Render.default(binder);
						}
					});
				});
			}
		}]);

		return Binder;
	}();

	var Binder$1 = new Binder();

	var Model = function () {
		function Model() {
			_classCallCheck(this, Model);

			this.GET = 2;
			this.SET = 3;
			this.REMOVE = 4;
			this.ran = false;
			this.data = Observer.create({}, this.listener.bind(this));
		}

		_createClass(Model, [{
			key: 'traverse',
			value: function traverse(type, keys, value) {
				var result = void 0;

				if (typeof keys === 'string') {
					keys = keys.split('.');
				}

				var data = this.data;
				var key = keys[keys.length - 1];

				for (var i = 0, l = keys.length - 1; i < l; i++) {

					if (!(keys[i] in data)) {

						if (type === this.GET || type === this.REMOVE) {
							return undefined;
						} else if (type === this.SET) {
							data.$set(keys[i], isNaN(keys[i + 1]) ? {} : []);
						}
					}

					data = data[keys[i]];
				}

				if (type === this.SET) {
					result = data.$set(key, value);
				} else if (type === this.GET) {
					result = data[key];
				} else if (type === this.REMOVE) {
					result = data[key];
					data.$remove(key);
				}

				return result;
			}
		}, {
			key: 'get',
			value: function get(keys) {
				return this.traverse(this.GET, keys);
			}
		}, {
			key: 'remove',
			value: function remove(keys) {
				return this.traverse(this.REMOVE, keys);
			}
		}, {
			key: 'set',
			value: function set(keys, value) {
				return this.traverse(this.SET, keys, value);
			}
		}, {
			key: 'listener',
			value: function listener(data, path, type) {
				var method = data === undefined ? Unrender$1 : Render;

				if (type === 'length') {
					var _scope = path.split('.').slice(0, 1).join('.');
					var part = path.split('.').slice(1).join('.');

					if (!(_scope in Binder$1.data)) return;
					if (!(part in Binder$1.data[_scope])) return;
					if (!(0 in Binder$1.data[_scope][part])) return;

					var binder = Binder$1.data[_scope][part][0];

					method.default(binder);
				} else {
					Binder$1.each(path, function (binder) {
						method.default(binder);
					});
				}
			}
		}]);

		return Model;
	}();

	var Model$1 = new Model();

	function Change(event) {
		if (event.target.hasAttribute('o-value')) {
			Promise.resolve().then(function () {
				return Update(event.target, 'value');
			}).catch(console.error);
		}
	}

	var Fetcher = function () {
		function Fetcher() {
			_classCallCheck(this, Fetcher);

			this.head = null;
			this.method = 'get';
			this.mime = {
				xml: 'text/xml; charset=utf-8',
				html: 'text/html; charset=utf-8',
				text: 'text/plain; charset=utf-8',
				json: 'application/json; charset=utf-8',
				js: 'application/javascript; charset=utf-8'
			};
		}

		_createClass(Fetcher, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};
				this.head = options.head || this.head;
				this.method = options.method || this.method;
				this.path = options.path;
				this.origin = options.origin;
				this.request = options.request;
				this.response = options.response;
				this.acceptType = options.acceptType;
				this.credentials = options.credentials;
				this.contentType = options.contentType;
				this.responseType = options.responseType;
			}
		}, {
			key: 'serialize',
			value: _async(function (data) {
				var query = '';

				for (var name in data) {
					query = query.length > 0 ? query + '&' : query;
					query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
				}

				return query;
			})
		}, {
			key: 'fetch',
			value: _async(function (options) {
				var _this = this;

				var data = Object.assign({}, options);

				data.path = data.path || _this.path;
				data.origin = data.origin || _this.origin;

				if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
				if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length - 1) === '/') data.origin = data.origin.slice(0, -1);
				if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;

				if (!data.url) throw new Error('Oxe.fetcher - requires url or origin and path option');

				if (!data.method) throw new Error('Oxe.fetcher - requires method option');

				if (!data.head && _this.head) data.head = _this.head;
				if (typeof data.method === 'string') data.method = data.method.toUpperCase() || _this.method;

				if (!data.acceptType && _this.acceptType) data.acceptType = _this.acceptType;
				if (!data.contentType && _this.contentType) data.contentType = _this.contentType;
				if (!data.responseType && _this.responseType) data.responseType = _this.responseType;

				// omit, same-origin, or include
				if (!data.credentials && _this.credentials) data.credentials = _this.credentials;

				// cors, no-cors, or same-origin
				if (!data.mode && _this.mode) data.mode = _this.mode;

				// default, no-store, reload, no-cache, force-cache, or only-if-cached
				if (!data.cache && _this.cache) data.cahce = _this.cache;

				// follow, error, or manual
				if (!data.redirect && _this.redirect) data.redirect = _this.redirect;

				// no-referrer, client, or a URL
				if (!data.referrer && _this.referrer) data.referrer = _this.referrer;

				// no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, unsafe-url
				if (!data.referrerPolicy && _this.referrerPolicy) data.referrerPolicy = _this.referrerPolicy;

				if (!data.signal && _this.signal) data.signal = _this.signal;
				if (!data.integrity && _this.integrity) data.integrity = _this.integrity;
				if (!data.keepAlive && _this.keepAlive) data.keepAlive = _this.keepAlive;

				if (data.contentType) {
					data.head = data.head || {};
					switch (data.contentType) {
						case 'js':
							data.head['Content-Type'] = _this.mime.js;break;
						case 'xml':
							data.head['Content-Type'] = _this.mime.xml;break;
						case 'html':
							data.head['Content-Type'] = _this.mime.html;break;
						case 'json':
							data.head['Content-Type'] = _this.mime.json;break;
						default:
							data.head['Content-Type'] = data.contentType;
					}
				}

				if (data.acceptType) {
					data.head = data.head || {};
					switch (data.acceptType) {
						case 'js':
							data.head['Accept'] = _this.mime.js;break;
						case 'xml':
							data.head['Accept'] = _this.mime.xml;break;
						case 'html':
							data.head['Accept'] = _this.mime.html;break;
						case 'json':
							data.head['Accept'] = _this.mime.json;break;
						default:
							data.head['Accept'] = data.acceptType;
					}
				}

				// IDEA for auth tokens
				// if (data.head) {
				// 	for (let name in data.head) {
				// 		if (typeof data.head[name] === 'function') {
				// 			data.head[name] = await data.head[name]();
				// 		}
				// 	}
				// }

				return _invoke(function () {
					if (data.body) {
						return _invokeIgnored(function () {
							if (data.method === 'GET') {
								var _temp = data.url + '?';

								return _await(_this.serialize(data.body), function (_this$serialize) {
									data.url = _temp + _this$serialize;
								});
							} else if (data.contentType === 'json') {
								data.body = JSON.stringify(data.body);
							}
						});
					}
				}, function () {
					var _exit = false;
					return _invoke(function () {
						if (typeof _this.request === 'function') {
							var copy = Object.assign({}, data);
							return _await(_this.request(copy), function (result) {

								if (result === false) {
									_exit = true;
									return data;
								}

								if ((typeof result === 'undefined' ? 'undefined' : _typeof(result)) === 'object') {
									Object.assign(data, result);
								}
							});
						}
					}, function (_result) {
						if (_exit) return _result;


						var fetchOptions = Object.assign({}, data);

						if (fetchOptions.head) {
							fetchOptions.headers = fetchOptions.head;
							delete fetchOptions.head;
						}

						return _await(window.fetch(data.url, fetchOptions), function (fetched) {

							data.code = fetched.status;
							data.message = fetched.statusText;

							return _invoke(function () {
								if (!data.responseType) {
									data.body = fetched.body;
								} else {
									return _await(fetched[data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType](), function (_fetched) {
										data.body = _fetched;
									});
								}
							}, function () {
								var _exit2 = false;
								return _invoke(function () {
									if (_this.response) {
										var copy = Object.assign({}, data);
										return _await(_this.response(copy), function (result) {

											if (result === false) {
												_exit2 = true;
												return data;
											}

											if ((typeof result === 'undefined' ? 'undefined' : _typeof(result)) === 'object') {
												Object.assign(data, result);
											}
										});
									}
								}, function (_result2) {
									return _exit2 ? _result2 : data;
								});
							});
						});
					});
				});
			})
		}, {
			key: 'post',
			value: _async(function (data) {
				var _this2 = this;

				data.method = 'post';
				return _this2.fetch(data);
			})
		}, {
			key: 'get',
			value: _async(function (data) {
				var _this3 = this;

				data.method = 'get';
				return _this3.fetch(data);
			})
		}, {
			key: 'put',
			value: _async(function (data) {
				var _this4 = this;

				data.method = 'put';
				return _this4.fetch(data);
			})
		}, {
			key: 'head',
			value: _async(function (data) {
				var _this5 = this;

				data.method = 'head';
				return _this5.fetch(data);
			})
		}, {
			key: 'patch',
			value: _async(function (data) {
				var _this6 = this;

				data.method = 'patch';
				return _this6.fetch(data);
			})
		}, {
			key: 'delete',
			value: _async(function (data) {
				var _this7 = this;

				data.method = 'delete';
				return _this7.fetch(data);
			})
		}, {
			key: 'options',
			value: _async(function (data) {
				var _this8 = this;

				data.method = 'options';
				return _this8.fetch(data);
			})
		}, {
			key: 'connect',
			value: _async(function (data) {
				var _this9 = this;

				data.method = 'connect';
				return _this9.fetch(data);
			})
		}]);

		return Fetcher;
	}();

	var Fetcher$1 = new Fetcher();

	function Input(event) {
		if (event.target.type !== 'checkbox' && event.target.type !== 'radio' && event.target.type !== 'option' && event.target.nodeName !== 'SELECT' && event.target.hasAttribute('o-value')) {
			Promise.resolve().then(function () {
				return Update(event.target, 'value');
			}).catch(console.error);
		}
	}

	var Path = {
		extension: function extension(data) {
			var position = data.lastIndexOf('.');
			return position > 0 ? data.slice(position + 1) : '';
		},
		join: function join() {
			return Array.prototype.join.call(arguments, '/').replace(/\/{2,}/g, '/').replace(/^(https?:\/)/, '$1/');
		},
		base: function base(href) {
			var base = window.document.querySelector('base');

			if (href) {

				if (base) {
					base.href = href;
				} else {
					base = window.document.createElement('base');
					base.href = href;
					window.document.head.insertBefore(base, window.document.head.firstElementChild);
				}
			}

			return base ? base.href : window.location.origin + window.location.pathname;
		},
		resolve: function resolve(path, base) {
			var result = [];

			path = path.replace(window.location.origin, '');

			if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0 || path.indexOf('//') === 0) {
				return path;
			}

			if (path.charAt(0) !== '/') {
				base = base || this.base();
				path = base + '/' + path;
				path = path.replace(window.location.origin, '');
			}

			path = path.replace(/\/{2,}/, '/');
			path = path.replace(/^\//, '');
			path = path.replace(/\/$/, '');

			var paths = path.split('/');

			for (var i = 0, l = paths.length; i < l; i++) {

				if (paths[i] === '.' || paths[i] === '') {
					continue;
				} else if (paths[i] === '..') {

					if (i > 0) {
						result.splice(i - 1, 1);
					}
				} else {
					result.push(paths[i]);
				}
			}

			return '/' + result.join('/');
		}
	};

	// FIXME import export in strings cause error
	// FIXME double backtick in template strings or regex could possibly causes issues

	var Transformer = {

		/*
  	templates
  */

		innerHandler: function innerHandler(char, index, string) {
			if (string[index - 1] === '\\') return;
			if (char === '\'') return '\\\'';
			if (char === '\"') return '\\"';
			if (char === '\t') return '\\t';
			if (char === '\n') return '\\n';
		},
		updateString: function updateString(value, index, string) {
			return string.slice(0, index) + value + string.slice(index + 1);
		},
		updateIndex: function updateIndex(value, index) {
			return index + value.length - 1;
		},
		template: function template(data) {

			var first = data.indexOf('`');
			var second = data.indexOf('`', first + 1);

			if (first === -1 || second === -1) return data;

			var value = void 0;
			var ends = 0;
			var starts = 0;
			var string = data;
			var isInner = false;

			for (var _index = 0; _index < string.length; _index++) {
				var char = string[_index];

				if (char === '`' && string[_index - 1] !== '\\') {

					if (isInner) {
						ends++;
						value = '\'';
						isInner = false;
						string = this.updateString(value, _index, string);
						_index = this.updateIndex(value, _index);
					} else {
						starts++;
						value = '\'';
						isInner = true;
						string = this.updateString(value, _index, string);
						_index = this.updateIndex(value, _index);
					}
				} else if (isInner) {

					if (value = this.innerHandler(char, _index, string)) {
						string = this.updateString(value, _index, string);
						_index = this.updateIndex(value, _index);
					}
				}
			}

			string = string.replace(/\${(.*?)}/g, '\'+$1+\'');

			if (starts === ends) {
				return string;
			} else {
				throw new Error('Oxe - Transformer missing backtick');
			}
		},


		/*
  	modules
  */

		patterns: {
			// lines: /(.*(?:;|\n))/g,
			// line: /(.*\s*{.*\s*.*\s*}.*)|((?:\/\*|`|'|").*\s*.*\s*(?:"|'|`|\*\/))|(.*(?:;|\n))/g,
			exps: /export\s+(?:default|var|let|const)?\s+/g,
			imps: /import(?:\s+(?:\*\s+as\s+)?\w+\s+from)?\s+(?:'|").*?(?:'|")/g,
			imp: /import(?:\s+(?:\*\s+as\s+)?(\w+)\s+from)?\s+(?:'|")(.*?)(?:'|")/
		},

		getImports: function getImports(text, base) {
			var result = [];
			var imps = text.match(this.patterns.imps) || [];

			for (var i = 0, l = imps.length; i < l; i++) {
				var imp = imps[i].match(this.patterns.imp);

				result[i] = {
					raw: imp[0],
					name: imp[1],
					url: Path.resolve(imp[2], base),
					extension: Path.extension(imp[2])
				};

				if (!result[i].extension) {
					result[i].url = result[i].url + '.js';
				}
			}

			return result;
		},
		getExports: function getExports(text) {
			var result = [];
			var exps = text.match(this.patterns.exps) || [];

			for (var i = 0, l = exps.length; i < l; i++) {
				var exp = exps[i];

				result[i] = {
					raw: exp,
					default: exp.indexOf('default') !== -1
				};
			}

			return result;
		},
		replaceImports: function replaceImports(text, imps) {

			if (!imps.length) {
				return text;
			}

			for (var i = 0, l = imps.length; i < l; i++) {
				var imp = imps[i];

				var pattern = (imp.name ? 'var ' + imp.name + ' = ' : '') + '$LOADER.data[\'' + imp.url + '\'].result';

				text = text.replace(imp.raw, pattern);
			}

			return text;
		},
		replaceExports: function replaceExports(text, exps) {

			if (!exps.length) {
				return text;
			}

			if (exps.length === 1) {
				return text.replace(exps[0].raw, 'return ');
			}

			text = 'var $EXPORT = {};\n' + text;
			text = text + '\nreturn $EXPORT;\n';

			for (var i = 0, l = exps.length; i < l; i++) {
				text = text.replace(exps[i].raw, '$EXPORT.');
			}

			return text;
		},
		ast: function ast(data) {
			var result = {};

			result.url = data.url;
			result.raw = data.text;
			result.cooked = data.text;
			result.base = result.url.slice(0, result.url.lastIndexOf('/') + 1);

			result.imports = this.getImports(result.raw, result.base);
			result.exports = this.getExports(result.raw);

			result.cooked = this.replaceImports(result.cooked, result.imports);
			result.cooked = this.replaceExports(result.cooked, result.exports);

			return result;
		}
	};

	var Events = function () {
		function Events() {
			_classCallCheck(this, Events);

			this.events = {};
		}

		_createClass(Events, [{
			key: 'on',
			value: function on(name, method) {

				if (!(name in this.events)) {
					this.events[name] = [];
				}

				this.events[name].push(method);
			}
		}, {
			key: 'off',
			value: function off(name, method) {

				if (name in this.events) {

					var _index2 = this.events[name].indexOf(method);

					if (_index2 !== -1) {
						this.events[name].splice(_index2, 1);
					}
				}
			}
		}, {
			key: 'emit',
			value: function emit(name) {

				if (name in this.events) {

					var methods = this.events[name];
					var _args = Array.prototype.slice.call(arguments, 1);

					for (var i = 0, l = methods.length; i < l; i++) {
						methods[i].apply(this, _args);
					}
				}
			}
		}]);

		return Events;
	}();

	var Loader = function (_Events) {
		_inherits(Loader, _Events);

		function Loader() {
			_classCallCheck(this, Loader);

			var _this10 = _possibleConstructorReturn(this, (Loader.__proto__ || Object.getPrototypeOf(Loader)).call(this));

			_this10.data = {};
			_this10.ran = false;
			_this10.methods = {};
			_this10.transformers = {};
			return _this10;
		}

		_createClass(Loader, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};

				this.methods = options.methods || this.methods;
				this.transformers = options.transformers || this.transformers;

				if (options.loads) {
					var load = void 0;
					while (load = options.loads.shift()) {
						this.load(load);
					}
				}
			}
		}, {
			key: 'execute',
			value: function execute(data) {
				var text = '\'use strict\';\n\n' + (data.ast ? data.ast.cooked : data.text);
				var code = new Function('$LOADER', 'window', text);
				data.result = code(this, window);
			}
		}, {
			key: 'ready',
			value: function ready(data) {
				if (data && data.listener && data.listener.length) {
					var listener = void 0;
					while (listener = data.listener.shift()) {
						listener(data);
					}
				}
			}
		}, {
			key: 'fetch',
			value: function fetch(data) {
				var self = this;
				var fetch = new XMLHttpRequest();

				fetch.onreadystatechange = function () {

					if (fetch.readyState === 4) {

						if (fetch.status >= 200 && fetch.status < 300 || fetch.status == 304) {
							data.text = fetch.responseText;

							if (data.extension === 'js') {

								if (data.transformer) {
									self.transform(data, function () {
										self.execute(data);
										self.ready(data);
									});
								} else {
									self.execute(data);
									self.ready(data);
								}
							} else {
								self.ready(data);
							}
						} else {
							throw new Error(fetch.responseText);
						}
					}
				};

				fetch.open('GET', data.url);
				fetch.send();
			}
		}, {
			key: 'transform',
			value: function transform(data, callback) {

				if (data.transformer === 'es' || data.transformer === 'est') {
					data.text = Transformer.template(data.text);
				}

				if (data.transformer === 'es' || data.transformer === 'esm') {
					data.ast = Transformer.ast(data);
				}

				if (data.ast && data.ast.imports.length) {

					var count = 0;
					var total = data.ast.imports.length;

					var listener = function listener() {
						count++;

						if (count === total) {
							callback();
						}
					};

					for (var i = 0; i < total; i++) {
						this.load({
							listener: listener,
							method: data.method,
							url: data.ast.imports[i].url,
							transformer: data.transformer
						});
					}
				} else {
					callback();
				}
			}
		}, {
			key: 'attach',
			value: function attach(data) {
				var element = document.createElement(data.tag);

				data.attributes['o-load'] = 'true';

				for (var name in data.attributes) {
					element.setAttribute(name, data.attributes[name]);
				}

				document.head.appendChild(element);
			}
		}, {
			key: 'js',
			value: function js(data) {
				if (data.method === 'fetch' || data.transformer === 'es' || data.transformer === 'est' || data.transformer === 'esm') {
					this.fetch(data);
				} else if (data.method === 'script') {
					this.attach({
						tag: 'script',
						attributes: {
							type: 'text/javascript',
							src: data.url,
							async: 'true'
						}
					});
				} else {
					this.attach({
						tag: 'script',
						attributes: {
							type: 'module',
							src: data.url,
							async: 'true'
						}
					});
				}
			}
		}, {
			key: 'css',
			value: function css(data) {
				if (data.method === 'fetch') {
					this.fetch(data);
				} else {
					this.attach({
						tag: 'link',
						attributes: {
							href: data.url,
							type: 'text/css',
							rel: 'stylesheet'
						}
					});
				}
			}
		}, {
			key: 'load',
			value: function load(data, listener) {

				if (typeof data === 'string') {
					data = { url: data };
				} else {
					listener = data.listener;
				}

				data.url = Path.resolve(data.url);

				if (data.url in this.data) {
					var load = this.data[data.url];

					if (load.listener.length) {

						if (listener) {
							load.listener.push(listener);
						}
					} else {

						if (listener) {
							load.listener.push(listener);
						}

						this.ready(load);
					}

					return;
				}

				this.data[data.url] = data;

				data.extension = data.extension || Path.extension(data.url);

				data.listener = listener ? [listener] : [];
				data.method = data.method || this.methods[data.extension];
				data.transformer = data.transformer || this.transformers[data.extension];

				if (data.extension === 'js') {
					this.js(data);
				} else if (data.extension === 'css') {
					this.css(data);
				} else {
					this.fetch(data);
				}
			}
		}]);

		return Loader;
	}(Events);

	var Loader$1 = new Loader();

	/*
 	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
 */

	var Component = function () {
		function Component() {
			_classCallCheck(this, Component);

			this.data = {};
			this.compiled = false;
		}

		_createClass(Component, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};

				if (options.components && options.components.length) {
					for (var i = 0, l = options.components.length; i < l; i++) {
						this.define(options.components[i]);
					}
				}
			}
		}, {
			key: 'renderSlot',
			value: function renderSlot(target, source, scope) {
				var targetSlots = target.querySelectorAll('slot[name]');

				for (var i = 0, l = targetSlots.length; i < l; i++) {
					var targetSlot = targetSlots[i];
					var name = targetSlot.getAttribute('name');
					var sourceSlot = source.querySelector('[slot="' + name + '"]');

					if (sourceSlot) {
						targetSlot.parentNode.replaceChild(sourceSlot, targetSlot);
					} else {
						targetSlot.parentNode.removeChild(targetSlot);
					}
				}

				var defaultSlot = target.querySelector('slot:not([name])');

				if (defaultSlot) {

					if (source.children.length) {
						defaultSlot.parentNode.setAttribute('slot', 'default');

						while (source.firstChild) {
							defaultSlot.parentNode.insertBefore(source.firstChild, defaultSlot);
						}
					}

					defaultSlot.parentNode.removeChild(defaultSlot);
				}
			}

			// renderTemplate (template) {
			// 	let fragment = document.createDocumentFragment();
			//
			// 	if (template) {
			//
			// 		if (typeof template === 'string') {
			// 			let temporary = document.createElement('div');
			//
			// 			temporary.innerHTML = template;
			//
			// 			while (temporary.firstChild) {
			// 				fragment.appendChild(temporary.firstChild);
			// 			}
			//
			// 		} else {
			// 			fragment.appendChild(template);
			// 		}
			//
			// 	}
			//
			// 	return fragment;
			// }

		}, {
			key: 'renderStyle',
			value: function renderStyle(style, scope) {

				if (!style) return '';

				if (window.CSS && window.CSS.supports) {

					if (!window.CSS.supports('(--t: black)')) {
						var matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

						for (var i = 0, l = matches.length; i < l; i++) {
							var match = matches[i];
							var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
							var pattern = new RegExp('var\\(' + rule[1] + '\\)', 'g');
							style = style.replace(rule[0], '');
							style = style.replace(pattern, rule[2]);
						}
					}

					if (!window.CSS.supports(':scope')) {
						style = style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
					}

					if (!window.CSS.supports(':host')) {
						style = style.replace(/\:host/g, '[o-scope="' + scope + '"]');
					}
				}

				return '<style>' + style + '</style>';
			}
		}, {
			key: 'render',
			value: function render(element, options) {
				var self = this;

				element.setAttribute('o-scope', self.scope);

				Model$1.set(self.scope, options.model);
				Methods$1.set(self.scope, options.methods);

				if (self.compiled && element.parentElement.nodeName === 'O-ROUTER') {

					Binder$1.bind(element, element, scope);
				} else {

					var template = document.createElement('template');
					var style = self.renderStyle(options.style, scope);

					if (typeof options.template === 'string') {
						template.innerHTML = style + options.template;
					} else {
						template.innerHTML = style;
						template.appendChild(options.template);
					}

					// element.templateContent = template.content;
					var clone = document.importNode(template.content, true);
					// Binder.bind(clone.querySelectorAll('*'), element, scope);
					Binder$1.bind(clone, element, scope);

					if (options.shadow) {
						if ('attachShadow' in document.body) {
							element.attachShadow({ mode: 'open' }).appendChild(clone);
						} else if ('createShadowRoot' in document.body) {
							element.createShadowRoot().appendChild(clone);
						}
					} else {
						self.renderSlot(clone, element);
						element.appendChild(clone);
					}
				}
			}
		}, {
			key: 'define',
			value: function define(options) {
				var self = this;

				if (!options.name) throw new Error('Oxe.component.define - requires name');
				if (options.name in self.data) throw new Error('Oxe.component.define - component defined');

				self.data[options.name] = options;

				options.count = 0;
				options.compiled = false;
				options.style = options.style || '';
				options.model = options.model || {};
				options.methods = options.methods || {};
				options.shadow = options.shadow || false;
				options.template = options.template || '';
				options.properties = options.properties || {};

				options.construct = function () {
					// let instance = Object.create(options.construct.prototype);
					// HTMLElement.apply(instance);

					options.properties.scope = {
						enumerable: true,
						value: options.name + '-' + options.count++
					};

					options.properties.model = {
						enumerable: true,
						// might not want configurable
						configurable: true,
						get: function get() {
							console.log(this.scope);
							return Model$1.get(this.scope);
						},
						set: function set(data) {
							console.log(this.scope);
							data = data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' ? data : {};
							return Model$1.set(this.scope, data);
						}
					};

					options.properties.methods = {
						enumerable: true,
						get: function get() {
							return Methods$1.get(this.scope);
						}
					};

					Object.defineProperties(this, options.properties);

					var instance = Reflect.construct(HTMLElement, [], options.construct);

					self.render(instance, options);

					if (options.created) {
						options.created.call(instance);
					}

					return instance;
				};

				options.construct.prototype.attributeChangedCallback = function () {
					if (options.attributed) options.attributed.apply(this, arguments);
				};

				options.construct.prototype.adoptedCallback = function () {
					if (options.adopted) options.adopted.call(this);
				};

				options.construct.prototype.connectedCallback = function () {
					if (options.attached) {
						options.attached.call(this);
						console.warn('Oxe.component.define - attached callback deprecated please use connected');
					}

					if (options.connected) options.connected.call(this);
				};

				options.construct.prototype.disconnectedCallback = function () {
					if (options.detached) {
						options.detached.call(this);
						console.warn('Oxe.component.define - detached callback deprecated please use disconnected');
					}

					if (options.disconnected) options.disconnected.call(this);
				};

				Object.setPrototypeOf(options.construct.prototype, HTMLElement.prototype);
				Object.setPrototypeOf(options.construct, HTMLElement);

				return window.customElements.define(options.name, options.construct);
			}
		}]);

		return Component;
	}();

	var Component$1 = new Component();

	var Router = function (_Events2) {
		_inherits(Router, _Events2);

		function Router() {
			_classCallCheck(this, Router);

			var _this11 = _possibleConstructorReturn(this, (Router.__proto__ || Object.getPrototypeOf(Router)).call(this));

			_this11.data = [];
			_this11.location = {};
			_this11.ran = false;
			_this11.mode = 'push';
			_this11.element = null;
			_this11.contain = false;
			// this.pattern = new RegExp([
			//     '^(https?:)//', // protocol
			//     '(([^:/?#]*)(?::([0-9]+))?)', // host, hostname, port
			//     '(/{0,1}[^?#]*)', // pathname
			//     '(\\?[^#]*|)', // search
			//     '(#.*|)$' // hash
			// ].join(''));
			return _this11;
		}

		_createClass(Router, [{
			key: 'setup',
			value: _async(function (options) {
				var _this12 = this;

				options = options || {};

				_this12.mode = options.mode === undefined ? _this12.mode : options.mode;
				_this12.after = options.after === undefined ? _this12.after : options.after;
				_this12.before = options.before === undefined ? _this12.before : options.before;
				_this12.element = options.element === undefined ? _this12.element : options.element;
				_this12.contain = options.contain === undefined ? _this12.contain : options.contain;
				_this12.external = options.external === undefined ? _this12.external : options.external;

				if (options.routes) {
					_this12.add(options.routes);
				}

				return _awaitIgnored(_this12.route(window.location.href, { mode: 'replace' }));
			})
		}, {
			key: 'scroll',
			value: function scroll(x, y) {
				window.scroll(x, y);
			}
		}, {
			key: 'back',
			value: function back() {
				window.history.back();
			}
		}, {
			key: 'forward',
			value: function forward() {
				window.history.forward();
			}
		}, {
			key: 'redirect',
			value: function redirect(path) {
				window.location.href = path;
			}
		}, {
			key: 'add',
			value: function add(data) {
				if (!data) {
					throw new Error('Oxe.router.add - requires data parameter');
				} else if (data.constructor === Object) {
					if (!data.path) throw new Error('Oxe.router.add - route path required');
					if (!data.component) throw new Error('Oxe.router.add - route component required');
					this.data.push(data);
				} else if (data.constructor === Array) {
					for (var i = 0, l = data.length; i < l; i++) {
						this.add(data[i]);
					}
				}
			}
		}, {
			key: 'remove',
			value: function remove(path) {
				for (var i = 0, l = this.data.length; i < l; i++) {
					if (path === this.data[i].path) {
						this.data.splice(i, 1);
					}
				}
			}
		}, {
			key: 'get',
			value: function get(path) {
				for (var i = 0, l = this.data.length; i < l; i++) {
					var route = this.data[i];
					if (path === route.path) {
						return route;
					}
				}
			}
		}, {
			key: 'find',
			value: function find(path) {
				for (var i = 0, l = this.data.length; i < l; i++) {
					var route = this.data[i];
					if (this.isPath(route.path, path)) {
						return route;
					}
				}
			}
		}, {
			key: 'filter',
			value: function filter(path) {
				var result = [];

				for (var i = 0, l = this.data.length; i < l; i++) {
					var route = this.data[i];
					if (this.isPath(route.path, path)) {
						result.push(route);
					}
				}

				return result;
			}
		}, {
			key: 'isPath',
			value: function isPath(routePath, userPath) {

				if (routePath.slice(0, 1) !== '/') {
					routePath = Path.resolve(routePath);
				}

				if (!userPath) {
					return false;
				} else if (userPath.constructor.name === 'String') {
					return new RegExp('^' + routePath.replace(/{\*}/g, '(?:.*)').replace(/{(\w+)}/g, '([^\/]+)') + '(\/)?$').test(userPath || '/');
				} else if (userPath.constructor.name === 'RegExp') {
					return userPath.test(routePath);
				}
			}
		}, {
			key: 'toParameterObject',
			value: function toParameterObject(routePath, userPath) {
				var result = {};

				if (!routePath || !userPath || routePath === '/' || userPath === '/') return result;

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
			}
		}, {
			key: 'toQueryString',
			value: function toQueryString(data) {
				var result = '?';

				for (var key in data) {
					var value = data[key];
					result += key + '=' + value + '&';
				}

				if (result.slice(-1) === '&') {
					result = result.slice(0, -1);
				}

				return result;
			}
		}, {
			key: 'toQueryObject',
			value: function toQueryObject(path) {
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
			}
		}, {
			key: 'toLocationObject',
			value: function toLocationObject(href) {
				var parser = document.createElement('a');
				parser.href = href;
				return {
					href: parser.href,
					host: parser.host,
					port: parser.port,
					hash: parser.hash,
					search: parser.search,
					protocol: parser.protocol,
					hostname: parser.hostname,
					pathname: parser.pathname
				};
			}
		}, {
			key: 'render',
			value: function render(route) {
				var self = this;

				if (!route) throw new Error('Oxe.render - route argument required');

				Utility.ready(function () {

					if (route.title) {
						document.title = route.title;
					}

					if (route.description) {
						Utility.ensureElement({
							name: 'meta',
							scope: document.head,
							position: 'afterbegin',
							query: '[name="description"]',
							attributes: [{ name: 'name', value: 'description' }, { name: 'content', value: route.description }]
						});
					}

					if (route.keywords) {
						Utility.ensureElement({
							name: 'meta',
							scope: document.head,
							position: 'afterbegin',
							query: '[name="keywords"]',
							attributes: [{ name: 'name', value: 'keywords' }, { name: 'content', value: route.keywords }]
						});
					}

					if (!self.element) {
						self.element = self.element || 'o-router';

						if (typeof self.element === 'string') {
							self.element = document.body.querySelector(self.element);
						}

						if (!self.element) {
							throw new Error('Oxe.router.render - missing o-router element');
						}
					}

					if (!route.element) {

						if (route.load) {
							Loader$1.load(route.load);
						}

						if (route.component.constructor === String) {
							route.element = document.createElement(route.component);
						}

						if (route.component.constructor === Object) {

							Component$1.define(route.component);

							if (self.mode === 'compiled') {
								// if (route.component.name.toLowerCase() === self.element.firstElementChild.nodeName.toLowerCase()) {
								route.element = self.element.firstElementChild;
							} else {
								route.element = document.createElement(route.component.name);
							}
						}
					}

					if (!route.component && !route.element) {
						throw new Error('Oxe.router.render - missing route component and');
					}

					if (route.element !== self.element.firstElementChild) {

						while (self.element.firstChild) {
							self.element.removeChild(self.element.firstChild);
						}

						self.element.appendChild(route.element);
					}

					self.scroll(0, 0);
					self.emit('routed');

					if (typeof self.after === 'function') {
						Promise.resolve(self.after).catch(console.error);
					}
				});
			}
		}, {
			key: 'route',
			value: _async(function (path, options) {
				var _this13 = this,
				    _exit3 = false;

				options = options || {};

				var mode = options.mode || _this13.mode;
				var location = _this13.toLocationObject(path);
				var route = _this13.find(location.pathname);

				if (!route) {
					throw new Error('Oxe.router.route - route not found');
				}

				location.route = route;
				location.title = location.route.title;
				location.query = _this13.toQueryObject(location.search);
				location.parameters = _this13.toParameterObject(location.route.path, location.pathname);

				if (options.query) {
					path += _this13.toQueryString(options.query);
				}

				return _invoke(function () {
					if (typeof _this13.before === 'function') {
						return _await(_this13.before(location), function (result) {
							if (result === false) {
								_exit3 = true;
							}
						});
					}
				}, function (_result3) {
					var _exit4 = false;
					if (_exit3) return _result3;
					return _invoke(function () {
						if (location.route && location.route.handler) {
							_exit4 = true;
							return _await(location.route.handler(location));
						}
					}, function (_result4) {
						if (_exit4) return _result4;


						if (location.route && location.route.redirect) {
							return _this13.redirect(location.route.redirect);
						}

						if (mode === 'href' || mode === 'compiled') {
							return window.location.assign(path);
						} else {
							window.history[mode + 'State']({ path: path }, '', path);
						}

						_this13.location = location;
						_this13.emit('routing');
						_this13.render(location.route);
					});
				});
			})
		}]);

		return Router;
	}(Events);

	var Router$1 = new Router();

	function Click(event) {

		// ignore canceled events, modified clicks, and right clicks
		if (event.button !== 0 || event.defaultPrevented || event.target.nodeName === 'INPUT' || event.target.nodeName === 'BUTTON' || event.target.nodeName === 'SELECT' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
			return;
		}

		// if shadow dom use
		var target = event.path ? event.path[0] : event.target;
		var parent = target.parentNode;

		if (Router$1.contain) {

			while (parent) {

				if (parent.nodeName === 'O-ROUTER') {
					break;
				} else {
					parent = parent.parentNode;
				}
			}

			if (parent.nodeName !== 'O-ROUTER') {
				return;
			}
		}

		// ensure target is anchor tag
		while (target && 'A' !== target.nodeName) {
			target = target.parentNode;
		}

		if (!target || 'A' !== target.nodeName) {
			return;
		}

		// check non-acceptables
		if (target.hasAttribute('download') || target.hasAttribute('external') || target.hasAttribute('o-external') || target.href.indexOf('tel:') === 0 || target.href.indexOf('ftp:') === 0 || target.href.indexOf('file:') === 0 || target.href.indexOf('mailto:') === 0 || target.href.indexOf(window.location.origin) !== 0) return;

		// if external is true then default action
		if (Router$1.external && (Router$1.external.constructor.name === 'RegExp' && Router$1.external.test(target.href) || Router$1.external.constructor.name === 'Function' && Router$1.external(target.href) || Router$1.external.constructor.name === 'String' && Router$1.external === target.href)) return;

		event.preventDefault();

		if (Router$1.location.href !== target.href) {
			Promise.resolve().then(function () {
				return Router$1.route(target.href);
			}).catch(console.error);
		}
	}

	function State(event) {

		var path = event && event.state ? event.state.path : window.location.href;

		Promise.resolve().then(function () {
			return Router$1.route(path, { replace: true });
		}).catch(console.error);
	}

	function Load(e) {
		var element = e.target;

		if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
			return;
		}

		var path = Path.resolve(element.src || element.href);
		var load = Loader$1.data[path];

		Loader$1.ready(load);
	}

	var General = function () {
		function General() {
			_classCallCheck(this, General);

			this.compiled = false;
		}

		_createClass(General, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};

				if (options.base) {
					Path.base(options.base);
				}
			}
		}]);

		return General;
	}();

	var General$1 = new General();

	var eStyle = document.createElement('style');
	var tStyle = document.createTextNode('\n\to-router, o-router > :first-child {\n\t\tdisplay: block;\n\t\tanimation: o-transition 150ms ease-in-out;\n\t}\n\t@keyframes o-transition {\n\t\t0% { opacity: 0; }\n\t\t100% { opacity: 1; }\n\t}\n');

	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(tStyle);
	document.head.appendChild(eStyle);

	var oSetup = document.querySelector('script[o-setup]');

	if (oSetup) {

		// let currentCount = 0;
		// let requiredCount = 0;

		var loaded = function loaded() {
			// if (currentCount !== requiredCount) return;

			var args = oSetup.getAttribute('o-setup').split(/\s*,\s*/);
			var meta = document.querySelector('meta[name="oxe"]');

			if (meta && meta.hasAttribute('compiled')) {
				args[1] = 'null';
				args[2] = 'script';
				Router$1.mode = 'compiled';
				General$1.compiled = true;
				Component$1.compiled = true;
			}

			if (!args[0]) {
				throw new Error('Oxe - o-setup attribute requires a url');
			}

			if (args.length > 1) {
				Loader$1.load({
					url: args[0],
					method: args[2],
					transformer: args[1]
				});
			} else {
				var _index3 = document.createElement('script');

				_index3.setAttribute('src', args[0]);
				_index3.setAttribute('async', 'true');
				_index3.setAttribute('type', 'module');

				document.head.appendChild(_index3);
			}

			// document.registerElement('o-router', {
			// 	prototype: Object.create(HTMLElement.prototype)
			// });

			var oRouter = function oRouter() {
				return Reflect.construct(HTMLElement, [], oRouter);
			};
			Object.setPrototypeOf(oRouter.prototype, HTMLElement.prototype);
			Object.setPrototypeOf(oRouter, HTMLElement);

			window.customElements.define('o-router', oRouter);
		};

		// let features = [];
		// let isNotFetch = !('fetch' in window);
		// let isNotAssign = !('assign' in Object);
		// let isNotPromise = !('Promise' in window);
		// let isNotCustomElement = !('registerElement' in document) || !('content' in document.createElement('template'));
		//
		// if (isNotFetch) features.push('fetch');
		// if (isNotPromise) features.push('Promise');
		// if (isNotAssign) features.push('Object.assign');
		//
		// if (isNotPromise || isNotFetch || isNotAssign) {
		// 	requiredCount++;
		// 	loader('https://cdn.polyfill.io/v2/polyfill.min.js?features=' + features.join(','), loaded);
		// }
		//
		// if (isNotCustomElement) {
		// 	requiredCount++;
		// 	loader('https://cdnjs.cloudflare.com/ajax/libs/document-register-element/1.7.2/document-register-element.js', loaded);
		// }

		// loader('./assets/polly.js', function () {
		// WebComponents.waitFor(function () {
		// 	return loaded();
		// });
		// });

		loaded();
	}

	var Oxe = function () {
		function Oxe() {
			_classCallCheck(this, Oxe);

			this.g = {};
		}

		_createClass(Oxe, [{
			key: 'setup',
			value: _async(function (data) {
				var _this14 = this;

				if (_this14._setup) {
					return;
				} else {
					_this14._setup = true;
				}

				data = data || {};
				data.listener = data.listener || {};

				document.addEventListener('load', Load, true);
				document.addEventListener('input', Input, true);
				document.addEventListener('click', Click, true);
				document.addEventListener('change', Change, true);
				window.addEventListener('popstate', State, true);

				document.addEventListener('reset', function (event) {
					if (event.target.hasAttribute('o-reset')) {
						event.preventDefault();

						var before;
						var after;

						if (data.listener.reset) {
							before = typeof data.listener.reset.before === 'function' ? data.listener.reset.before.bind(null, event) : null;
							after = typeof data.listener.reset.after === 'function' ? data.listener.reset.after.bind(null, event) : null;
						}

						Promise.resolve().then(before).then(Reset.bind(null, event)).then(after).catch(console.error);
					}
				}, true);

				document.addEventListener('submit', function (event) {
					if (event.target.hasAttribute('o-submit')) {
						event.preventDefault();

						var before;
						var after;

						if (data.listener.submit) {
							before = typeof data.listener.submit.before === 'function' ? data.listener.submit.before.bind(null, event) : null;
							after = typeof data.listener.submit.after === 'function' ? data.listener.submit.after.bind(null, event) : null;
						}

						Promise.resolve().then(before).then(Submit.bind(null, event)).then(after).catch(console.error);
					}
				}, true);

				return _invoke(function () {
					if (data.listener.before) {
						return _awaitIgnored(data.listener.before());
					}
				}, function () {

					if (data.general) {
						_this14.general.setup(data.general);
					}

					if (data.fetcher) {
						_this14.fetcher.setup(data.fetcher);
					}

					if (data.loader) {
						_this14.loader.setup(data.loader);
					}

					if (data.component) {
						_this14.component.setup(data.component);
					}

					return _invoke(function () {
						if (data.router) {
							return _awaitIgnored(_this14.router.setup(data.router));
						}
					}, function () {
						return _invokeIgnored(function () {
							if (data.listener.after) {
								return _awaitIgnored(data.listener.after());
							}
						});
					});
				});
			})
		}, {
			key: 'global',
			get: function get() {
				return this.g;
			}
		}, {
			key: 'window',
			get: function get() {
				return window;
			}
		}, {
			key: 'document',
			get: function get() {
				return window.document;
			}
		}, {
			key: 'body',
			get: function get() {
				return window.document.body;
			}
		}, {
			key: 'head',
			get: function get() {
				return window.document.head;
			}
		}, {
			key: 'location',
			get: function get() {
				return this.router.location;
			}
		}, {
			key: 'currentScript',
			get: function get() {
				return window.document._currentScript || window.document.currentScript;
			}
		}, {
			key: 'ownerDocument',
			get: function get() {
				return (window.document._currentScript || window.document.currentScript).ownerDocument;
			}
		}, {
			key: 'render',
			get: function get() {
				return Render;
			}
		}, {
			key: 'methods',
			get: function get() {
				return Methods$1;
			}
		}, {
			key: 'utility',
			get: function get() {
				return Utility;
			}
		}, {
			key: 'general',
			get: function get() {
				return General$1;
			}
		}, {
			key: 'batcher',
			get: function get() {
				return Batcher$1;
			}
		}, {
			key: 'loader',
			get: function get() {
				return Loader$1;
			}
		}, {
			key: 'binder',
			get: function get() {
				return Binder$1;
			}
		}, {
			key: 'fetcher',
			get: function get() {
				return Fetcher$1;
			}
		}, {
			key: 'component',
			get: function get() {
				return Component$1;
			}
		}, {
			key: 'router',
			get: function get() {
				return Router$1;
			}
		}, {
			key: 'model',
			get: function get() {
				return Model$1;
			}
		}]);

		return Oxe;
	}();

	var index = new Oxe();

	return index;
});