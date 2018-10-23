/*
	Name: oxe
	Version: 3.15.4
	License: MPL-2.0
	Author: Alexander Elias
	Email: alex.steven.elis@gmail.com
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _awaitIgnored(value, direct) {
	if (!direct) {
		return Promise.resolve(value).then(_empty);
	}
}function _invoke(body, then) {
	var result = body();
	if (result && result.then) {
		return result.then(then);
	}return then(result);
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
	} catch (e) {}
	return function (f) {
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

	var Update = _async(function (element, attribute) {

		if (!element) throw new Error('Oxe - requires element argument');
		if (!attribute) throw new Error('Oxe - requires attribute argument');

		var binder = Binder$2.elements.get(element).get(attribute);

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
				var original = Model$2.get(binder.keys);

				if (data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && data.constructor === original.constructor) {
					for (var key in data) {
						if (data[key] !== original[key]) {
							Model$2.set(binder.keys, data);
							break;
						}
					}
				} else if (original !== data) {
					Model$2.set(binder.keys, data);
				}
			}
		};

		Batcher$1.batch({ read: read });
	});

	var Observer = {
		splice: function splice() {
			var startIndex = arguments[0];
			var deleteCount = arguments[1];
			var addCount = arguments.length > 2 ? arguments.length - 2 : 0;

			if (typeof startIndex !== 'number' || typeof deleteCount !== 'number') {
				return [];
			}

			// handle negative startIndex
			if (startIndex < 0) {
				startIndex = this.length + startIndex;
				startIndex = startIndex > 0 ? startIndex : 0;
			} else {
				startIndex = startIndex < this.length ? startIndex : this.length;
			}

			// handle negative deleteCount
			if (deleteCount < 0) {
				deleteCount = 0;
			} else if (deleteCount > this.length - startIndex) {
				deleteCount = this.length - startIndex;
			}

			var totalCount = this.$meta.length;
			var key = void 0,
			    index = void 0,
			    value = void 0,
			    updateCount = void 0;
			var argumentIndex = 2;
			var argumentsCount = arguments.length - argumentIndex;
			var result = this.slice(startIndex, deleteCount);

			updateCount = totalCount - 1 - startIndex;

			if (updateCount > 0) {
				index = startIndex;
				while (updateCount--) {
					key = index++;

					if (argumentsCount && argumentIndex < argumentsCount) {
						value = arguments[argumentIndex++];
					} else {
						value = this.$meta[index];
					}

					this.$meta[key] = Observer.create(value, this.$meta.listener, this.$meta.path + key);
					this.$meta.listener(this.$meta[key], this.$meta.path + key, key);
				}
			}

			if (addCount > 0) {
				while (addCount--) {
					key = this.length;
					this.$meta[key] = Observer.create(arguments[argumentIndex++], this.$meta.listener, this.$meta.path + key);
					Observer.defineProperty(this, key);this.$meta.listener(this.length, this.$meta.path.slice(0, -1), 'length');
					this.$meta.listener(this.$meta[key], this.$meta.path + key, key);
				}
			}

			if (deleteCount > 0) {
				while (deleteCount--) {
					this.$meta.length--;
					this.length--;
					key = this.length;
					this.$meta.listener(key, this.$meta.path.slice(0, -1), 'length');
					this.$meta.listener(undefined, this.$meta.path + key, key);
				}
			}

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
						// if (key !== undefined && value !== undefined) {
						if (_value !== this[key]) {
							var result = self.create(_value, this.$meta.listener, this.$meta.path + key);

							this.$meta[key] = result;
							self.defineProperty(this, key);

							this.$meta.listener(result, this.$meta.path + key, key);

							return result;
						}
						// } else {

						// if (!key || key.constructor !== this.constructor) {
						// 	return this;
						// } else if (key.constructor === Array) {
						// 	for () {
						// 		this.$set(name, value);
						// 	}
						// } else if (key.constructor === Object) {
						// 	for (let name in key) {
						// 		this.$set(name, key[name]);
						// 	}
						// }
						//
						// return this;
						// }
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

	var Batcher = function () {
		function Batcher() {
			_classCallCheck(this, Batcher);

			this.reads = [];
			this.writes = [];
			this.time = 1000 / 30;
			this.pending = false;
			// this.mr = 0;
			// this.mw = 0;
			// this.tr = 0;
			// this.tw = 0;
			// this.tp = 0;
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
				if (!this.pending) {
					this.pending = true;
					this.tick(this.flush.bind(this, null));
				}
			}
		}, {
			key: 'flush',
			value: function flush(position, time) {

				if (!this.reads.length && !this.writes.length) {
					this.pending = false;
					return;
				}

				var i = void 0;

				if (position === null) {

					for (i = 0; i < this.reads.length; i++) {
						// this.tr++;
						this.reads[i]();

						// max read time
						if (performance.now() - time > this.time) {
							// this.mr++;
							this.reads.splice(0, i + 1);
							return this.tick(this.flush.bind(this, i + 1));
						}
					}

					this.reads.splice(0, i + 1);
				}

				for (i = 0; i < this.writes.length; i++) {
					// this.tw++;
					this.writes[i]();

					// position of max read time
					if (i === position) {
						// this.tp++;
						this.writes.splice(0, i + 1);
						return this.flush(null, time);
					}

					// max write time
					if (performance.now() - time > this.time) {
						// this.mw++;
						this.writes.splice(0, i + 1);
						return this.tick(this.flush.bind(this, i + 1));
					}
				}

				this.writes.splice(0, i + 1);
				this.flush(null, time);
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

				if (data.read) {

					var read = function read() {
						var result = void 0;

						if (data.context) {
							result = data.read.call(data.context);
						} else {
							result = data.read();
						}

						if (data.write && result !== false) {
							var write = void 0;

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

	function TextAttributeUnrender(binder) {
		return {
			write: function write() {
				binder.element.innerText = '';
			}
		};
	}

	var Unrender$1 = {
		alt: function alt(opt) {
			Batcher$1.write(function () {
				opt.element.alt = '';
			});
		},
		each: function each(opt) {
			Batcher$1.write(function () {
				var element = void 0;

				while (element = opt.element.lastElementChild) {
					opt.element.removeChild(element);
				}
			});
		},
		href: function href(opt) {
			Batcher$1.write(function () {
				opt.element.href = '';
			});
		},
		class: function _class(opt) {
			Batcher$1.write(function () {
				var className = opt.names.slice(1).join('-');
				opt.element.classList.remove(className);
			});
		},
		html: function html(opt) {
			Batcher$1.write(function () {
				var element = void 0;

				while (element = opt.element.lastElementChild) {
					opt.element.removeChild(element);
				}
			});
		},
		on: function on(opt) {
			opt.element.removeEventListener(opt.names[1], opt.cache, false);
		},
		css: function css(opt) {
			Batcher$1.write(function () {
				opt.element.style.cssText = '';
			});
		},
		required: function required(opt) {
			Batcher$1.write(function () {
				opt.element.required = false;
			});
		},
		src: function src(opt) {
			Batcher$1.write(function () {
				opt.element.src = '';
			});
		},


		text: TextAttributeUnrender,

		value: function value(opt) {
			Batcher$1.write(function () {
				var i, l, query, element, elements;

				if (opt.element.nodeName === 'SELECT') {

					elements = opt.element.options;

					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];
						element.selected = false;
					}
				} else if (opt.element.type === 'radio') {

					query = 'input[type="radio"][o-value="' + opt.path + '"]';
					elements = opt.element.parentNode.querySelectorAll(query);

					for (i = 0, l = elements.length; i < l; i++) {
						element = elements[i];

						if (i === 0) {
							element.checked = true;
						} else {
							element.checked = false;
						}
					}
				} else if (opt.element.type === 'checkbox') {

					opt.element.checked = false;
					opt.element.value = false;
				} else {
					opt.element.value = '';
				}
			});
		},
		default: function _default(binder) {

			if (binder.type in this) {
				var unrender = this[binder.type](binder);

				if (unrender) {
					unrender.context = unrender.context || {};
					Batcher$1.batch(unrender);
				}
			} else {
				var data = void 0;

				Batcher$1.batch({
					read: function read() {
						data = Model.get(binder.keys);

						if (binder.element[binder.type] === data) {
							return;
						}

						data = Binder.piper(binder, data);
					},
					write: function write() {
						binder.element[binder.type] = data;
					}
				});
			}
		}
	};

	var Utility = {

		PREFIX: /data-o-|o-/,
		ROOT: /^(https?:)?\/?\//,

		DOT: /\.+/,
		PIPE: /\s?\|\s?/,
		PIPES: /\s?,\s?|\s+/,
		VARIABLE_START: '(\\|*\\,*\\s*)',
		VARIABLE_END: '([^a-zA-z]|$)',

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

				data[values[0]] = this.getByPath(model, values);
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
						var attribute = node.attributes[i];if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {
							attribute.value = attribute.value.replace(pattern, '$1' + path + '.' + key + '$2');
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
				if (window.document.readyState !== 'interactive' && window.document.readyState !== 'complete') {
					window.document.addEventListener('DOMContentLoaded', function _() {
						callback();
						window.document.removeEventListener('DOMContentLoaded', _);
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

	function Class(binder) {
		var data = void 0,
		    name = void 0;

		return {
			write: function write() {
				data = Model$2.get(binder.keys);
				data = Binder$2.piper(binder, data);
				name = binder.names.slice(1).join('-');
				binder.element.classList.toggle(name, data);
			}
		};
	}

	function Css(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (binder.element.style.cssText === data) return false;

				if (binder.names.length > 1) {
					data = binder.names.slice(1).join('-') + ': ' + data + ';';
				}

				data = Binder$2.piper(binder, data);

				if (binder.element.style.cssText === data) return false;
			},
			write: function write() {
				binder.element.style.cssText = data;
			}
		};
	}

	function Default(binder) {
		var render = void 0;
		var data = void 0;

		if (binder.type in this) {
			render = this[binder.type](binder);
		} else {
			render = {
				read: function read() {
					data = Model$2.get(binder.keys);

					if (binder.element[binder.type] === data) {
						return;
					}

					data = Binder$2.piper(binder, data);
				},
				write: function write() {
					binder.element[binder.type] = data;
				}
			};
		}

		Batcher$1.batch(render);
	}

	function Disable(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (binder.element.disabled === data) return false;

				data = Binder$2.piper(binder, data);

				if (binder.element.disabled === data) return false;
			},
			write: function write() {
				binder.element.disabled = data;
			}
		};
	}

	function Each(binder) {
		var self = this;

		if (!binder.cache) binder.cache = binder.element.removeChild(binder.element.firstElementChild);

		return {
			write: function write() {
				var key = void 0,
				    keys = void 0,
				    data = void 0,
				    length = void 0;

				data = Model$2.get(binder.keys);

				if (!data || (typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') return;

				data = Binder$2.piper(binder, data);

				if (!data || (typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') return;

				if (data.constructor === Array) {
					length = data.length;
				}

				if (data.constructor === Object) {
					keys = Object.keys(data);
					length = keys.length;
				}

				if (binder.element.children.length > length) {
					binder.element.removeChild(binder.element.lastElementChild);
				} else if (binder.element.children.length < length) {
					var clone = binder.cache.cloneNode(true);

					if (data.constructor === Array) key = binder.element.children.length;
					if (data.constructor === Object) key = keys[binder.element.children.length];

					Utility.replaceEachVariable(clone, binder.names[1], binder.path, key);
					Binder$2.bind(clone, binder.container);
					binder.element.appendChild(clone);
				}

				if (binder.element.children.length !== data.length) {
					self.default(binder);
				}
			}
		};
	}

	function Enable(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (binder.element.disabled === !data) return false;

				data = Binder$2.piper(binder, data);

				if (binder.element.disabled === !data) return false;
			},
			write: function write() {
				binder.element.disabled = !data;
			}
		};
	}

	function Hide(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (binder.element.hidden === data) return false;

				data = Binder$2.piper(binder, data);

				if (binder.element.hidden === data) return false;
			},
			write: function write() {
				binder.element.hidden = data;
			}
		};
	}

	function Html(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (binder.element.innerHTML === data) return false;

				data = Binder$2.piper(binder, data);

				if (binder.element.innerHTML === data) return false;
			},
			write: function write() {
				binder.element.innerHTML = data;
			}
		};
	}

	function On(binder) {
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
							var parameter = Model$2.get(keys);
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

	function Read(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (binder.element.readOnly === data) {
					return false;
				}

				data = Binder$2.piper(binder, data);
			},
			write: function write() {
				binder.element.readOnly = data;
			}
		};
	}

	function Required(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (binder.element.required === data) {
					return false;
				}

				data = Binder$2.piper(binder, data);
			},
			write: function write() {
				binder.element.required = data;
			}
		};
	}

	function Show(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (!data === binder.element.hidden) {
					return false;
				}

				data = Binder$2.piper(binder, data);
			},
			write: function write() {
				binder.element.hidden = !data;
			}
		};
	}

	function Text(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (data === undefined) {
					Model$2.set(binder.keys, '');
					return false;
				} else if (data === null) {
					return false;
				} else if (data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
					data = JSON.stringify(data);
				} else if (data && typeof data !== 'string') {
					data = String(data);
				}

				data = Binder$2.piper(binder, data);
			},
			write: function write() {
				binder.element.innerText = data;
			}
		};
	}

	function Value(binder) {
		var self = this;
		var type = binder.element.type;
		var name = binder.element.nodeName;

		var data = void 0,
		    multiple = void 0;

		if (name === 'SELECT') {
			var elements = void 0;

			return {
				read: function read() {
					data = Model$2.get(binder.keys);
					elements = binder.element.options;
					multiple = binder.element.multiple;

					if (multiple) return false;

					// if (multiple && data.constructor !== Array) {
					// 	throw new Error(`Oxe - invalid multiple select value type ${binder.keys.join('.')} array required`);
					// }
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
							Model$2.set(binder.keys, elements[index].value || '');
						}
					}
				}
			};
		} else if (type === 'radio') {
			var _elements = void 0;

			return {
				read: function read() {
					data = Model$2.get(binder.keys);

					if (data === undefined) {
						Model$2.set(binder.keys, 0);
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
						Model$2.set(binder.keys, 0);
					}
				}
			};
		} else if (type === 'file') {
			return {
				read: function read() {
					data = Model$2.get(binder.keys);

					if (data === undefined) {
						Model$2.set(binder.keys, []);
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
					data = Model$2.get(binder.keys);

					if (typeof data !== 'boolean') {
						Model$2.set(binder.keys, false);
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
					data = Model$2.get(binder.keys);

					if (name === 'OPTION' && binder.element.selected) {
						var parent = binder.element.parentElement;
						var select = Binder$2.elements.get(parent).get('value');
						self.default(select);
					}

					if (data === undefined) {
						Model$2.set(binder.keys, '');
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

	function Write(binder) {
		var data = void 0;

		return {
			read: function read() {
				data = Model$2.get(binder.keys);

				if (!data === binder.element.readOnly) {
					return false;
				}

				data = Binder$2.piper(binder, data);
			},
			write: function write() {
				binder.element.readOnly = !data;
			}
		};
	}

	var Render = {
		class: Class,
		css: Css,
		default: Default,
		disable: Disable,
		each: Each,
		enable: Enable,
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

	var Binder$1 = function () {
		function Binder$1() {
			_classCallCheck(this, Binder$1);

			this.data = {};
			this.elements = new Map();
		}

		_createClass(Binder$1, [{
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
					throw new Error('Oxe - duplicate attribute ' + binder.names[0]);
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
			key: 'checkChildren',
			value: function checkChildren(element) {

				if (element.nodeName === '#document-fragment') {
					return true;
				}

				if (element.nodeName === 'STYLE' && element.nodeName === 'SCRIPT' && element.nodeName === 'OBJECT' && element.nodeName === 'IFRAME') {
					return false;
				}

				for (var i = 0, l = element.attributes.length; i < l; i++) {
					var attribute = element.attributes[i];

					if (attribute.name.indexOf('o-each') === 0 || attribute.name.indexOf('data-o-each') === 0) {
						return false;
					}
				}

				return true;
			}
		}, {
			key: 'eachElement',
			value: function eachElement(element, container, scope, callback) {

				if (element.nodeName !== 'O-ROUTER' && element.nodeName !== 'TEMPLATE' && element.nodeName !== '#document-fragment' && !element.hasAttribute('o-scope') && !element.hasAttribute('o-setup') && !element.hasAttribute('o-router') && !element.hasAttribute('o-compiled') && !element.hasAttribute('o-external') && !element.hasAttribute('data-o-scope') && !element.hasAttribute('data-o-setup') && !element.hasAttribute('data-o-router') && !element.hasAttribute('data-o-compiled') && !element.hasAttribute('data-o-external')) {
					callback.call(this, element);
				}

				if (this.checkChildren(element)) {

					for (var i = 0, l = element.children.length; i < l; i++) {
						var child = element.children[i];
						this.eachElement(child, container, scope, callback);
					}
				}
			}
		}, {
			key: 'eachAttribute',
			value: function eachAttribute(element, callback) {

				for (var i = 0, l = element.attributes.length; i < l; i++) {
					var attribute = element.attributes[i];

					if ((attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) && attribute.name !== 'o-reset' && attribute.name !== 'o-action' && attribute.name !== 'o-method' && attribute.name !== 'o-enctype' && attribute.name !== 'data-o-reset' && attribute.name !== 'data-o-action' && attribute.name !== 'data-o-method' && attribute.name !== 'data-o-enctype') {
						callback.call(this, attribute);
					}
				}
			}
		}, {
			key: 'unbind',
			value: function unbind(element, container) {
				container = container || element;

				var scope = container.getAttribute('o-scope') || container.getAttribute('data-o-scope');

				if (!scope) throw new Error('Oxe - bind requires container element scope attribute');

				this.eachElement(element, container, scope, function (child) {
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
			value: function bind(element, container) {
				container = container || element;

				var scope = container.getAttribute('o-scope') || container.getAttribute('data-o-scope');

				if (!scope) throw new Error('Oxe - bind requires container element scope attribute');

				this.eachElement(element, container, scope, function (child) {
					this.eachAttribute(child, function (attribute) {

						var binder = this.create({
							scope: scope,
							element: child,
							container: container,
							name: attribute.name,
							value: attribute.value
						});

						this.add(binder);
						Render.default(binder);
					});
				});
			}
		}]);

		return Binder$1;
	}();

	var Binder$2 = new Binder$1();

	var Model$1 = function () {
		function Model$1() {
			_classCallCheck(this, Model$1);

			this.GET = 2;
			this.SET = 3;
			this.REMOVE = 4;
			this.ran = false;
			this.data = Observer.create({}, this.listener.bind(this));
		}

		_createClass(Model$1, [{
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
					var scope = path.split('.').slice(0, 1).join('.');
					var part = path.split('.').slice(1).join('.');

					if (!(scope in Binder$2.data)) return;
					if (!(part in Binder$2.data[scope])) return;
					if (!(0 in Binder$2.data[scope][part])) return;

					var binder = Binder$2.data[scope][part][0];

					method.default(binder);
				} else {
					Binder$2.each(path, function (binder) {
						method.default(binder);
					});
				}
			}
		}]);

		return Model$1;
	}();

	var Model$2 = new Model$1();

	function Change(e) {

		if (e.target.hasAttribute('o-value')) {
			Update(e.target, 'value').catch(console.error);
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

				if (!data.url) throw new Error('Oxe.fetcher - requires url option');
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

	function Submit(e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		if (!submit) return;else e.preventDefault();

		var binder = Binder$2.elements.get(element).get('submit');
		var method = Methods$1.get(binder.keys);
		var model = Model$2.get(binder.scope);

		var data = Utility.formData(element, model);

		Promise.resolve().then(_async(function () {
			return _await(method.call(binder.container, data, e), function (options) {
				return _invoke(function () {
					if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
						var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
						var _method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
						var enctype = element.getAttribute('o-enctype') || element.getAttribute('data-o-enctype');

						options.url = options.url || action;
						options.method = options.method || _method;
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
					if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object' && options.reset || element.hasAttribute('o-reset') || element.hasAttribute('data-o-reset')) {
						element.reset();
					}
				});
			});
		})).catch(console.error);
	}

	function Input(e) {
		if (e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.type !== 'option' && e.target.nodeName !== 'SELECT' && e.target.hasAttribute('o-value')) {
			Update(e.target, 'value').catch(console.error);
		}
	}

	function Reset(e) {
		var element = e.target;
		var reset = element.hasAttribute('o-reset') || element.hasAttribute('data-o-reset');

		if (!reset) return;else e.preventDefault();

		var binder = Binder$2.elements.get(element).get('submit');
		var elements = element.querySelectorAll('[o-value]');
		var model = Model$2.get(binder.scope);

		Utility.formReset(element, model);
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

			for (var index = 0; index < string.length; index++) {
				var char = string[index];

				if (char === '`' && string[index - 1] !== '\\') {

					if (isInner) {
						ends++;
						value = '\'';
						isInner = false;
						string = this.updateString(value, index, string);
						index = this.updateIndex(value, index);
					} else {
						starts++;
						value = '\'';
						isInner = true;
						string = this.updateString(value, index, string);
						index = this.updateIndex(value, index);
					}
				} else if (isInner) {

					if (value = this.innerHandler(char, index, string)) {
						string = this.updateString(value, index, string);
						index = this.updateIndex(value, index);
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

					var index = this.events[name].indexOf(method);

					if (index !== -1) {
						this.events[name].splice(index, 1);
					}
				}
			}
		}, {
			key: 'emit',
			value: function emit(name) {

				if (name in this.events) {

					var methods = this.events[name];
					var args = Array.prototype.slice.call(arguments, 1);

					for (var i = 0, l = methods.length; i < l; i++) {
						methods[i].apply(this, args);
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
					var load;
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
					var listener;
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
			value: function renderSlot(target, source) {
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

				if (defaultSlot && source.children.length) {

					while (source.firstChild) {
						defaultSlot.parentNode.insertBefore(source.firstChild, defaultSlot);
					}
				}

				if (defaultSlot) {
					defaultSlot.parentNode.removeChild(defaultSlot);
				}
			}

			// renderTemplate (template) {
			// 	const fragment = document.createDocumentFragment();
			//
			// 	if (template) {
			//
			// 		if (typeof template === 'string') {
			// 			const temporary = document.createElement('div');
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
			key: 'created',
			value: function created(element, options) {
				var self = this;
				var scope = options.name + '-' + options.count++;

				Object.defineProperties(element, {
					scope: {
						value: scope,
						enumerable: true
					},
					status: {
						value: 'created',
						enumerable: true
					}
				});

				element.setAttribute('o-scope', scope);

				Model$2.set(scope, options.model);
				Methods$1.set(scope, options.methods);

				if (!self.compiled || self.compiled && element.parentNode.nodeName !== 'O-ROUTER') {
					var template = document.createElement('template');
					var style = self.renderStyle(options.style, scope);

					if (typeof options.template === 'string') {
						template.innerHTML = style + options.template;
					} else {
						template.innerHTML = style;
						template.appendChild(options.template);
					}

					var clone = document.importNode(template.content, true);

					Binder$2.bind(clone, element);

					if (options.shadow && 'attachShadow' in document.body) {
						element.attachShadow({ mode: 'open' }).appendChild(clone);
					} else if (options.shadow && 'createShadowRoot' in document.body) {
						element.createShadowRoot().appendChild(clone);
					} else {
						self.renderSlot(clone, element);
						element.appendChild(clone);
					}
				}

				if (options.created) {
					options.created.call(element);
				}
			}
		}, {
			key: 'attached',
			value: function attached(element, options) {
				if (options.attached) {
					options.attached.call(element);
				}
			}
		}, {
			key: 'detached',
			value: function detached(element, options) {
				if (options.detached) {
					options.detached.call(element);
				}
			}
		}, {
			key: 'define',
			value: function define(options) {
				var self = this;

				if (!options.name) {
					throw new Error('Oxe.component.define - requires name');
				}

				if (options.name in self.data) {
					throw new Error('Oxe.component.define - component defined');
				}

				self.data[options.name] = options;

				options.count = 0;
				options.compiled = false;
				options.style = options.style || '';
				options.model = options.model || {};
				options.methods = options.methods || {};
				options.shadow = options.shadow || false;
				options.template = options.template || '';
				options.properties = options.properties || {};

				options.properties.status = {
					enumerable: true,
					configurable: true,
					value: 'define'
				};

				options.properties.model = {
					enumerable: true,
					configurable: true,
					get: function get() {
						return Model$2.get(this.scope);
					},
					set: function set(data) {
						data = data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' ? data : {};
						return Model$2.set(this.scope, data);
					}
				};

				options.properties.methods = {
					enumerable: true,
					get: function get() {
						return Methods$1.get(this.scope);
					}
				};

				options.proto = Object.create(HTMLElement.prototype, options.properties);

				options.proto.attributeChangedCallback = options.attributed;

				options.proto.createdCallback = function () {
					self.created(this, options);
				};

				options.proto.attachedCallback = function () {
					self.attached(this, options);
				};

				options.proto.detachedCallback = function () {
					self.detached(this, options);
				};

				return document.registerElement(options.name, {
					prototype: options.proto
				});
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
			_this11.element = null;
			_this11.contain = false;
			_this11.compiled = false;
			return _this11;
		}

		_createClass(Router, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};

				this.after = options.after === undefined ? this.after : options.after;
				this.before = options.before === undefined ? this.before : options.before;
				this.element = options.element === undefined ? this.element : options.element;
				this.contain = options.contain === undefined ? this.contain : options.contain;
				this.external = options.external === undefined ? this.external : options.external;
				// this.validate = options.validate === undefined ? this.validate : options.validate;

				if (options.routes) {
					this.add(options.routes);
				}

				this.route(window.location.href, { replace: true });
			}
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
			value: function toLocationObject() {
				return {
					port: window.location.port || '',
					host: window.location.host || '',
					hash: window.location.hash || '',
					href: window.location.href || '',
					origin: window.location.origin || '',
					search: window.location.search || '',
					pathname: window.location.pathname || '',
					hostname: window.location.hostname || '',
					protocol: window.location.protocol || '',
					username: window.location.username || '',
					password: window.location.password || ''
				};
			}

			// validate () {
			//
			// }

		}, {
			key: 'render',
			value: function render(route) {
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

					if (!this.element) {
						this.element = this.element || 'o-router';

						if (typeof this.element === 'string') {
							this.element = document.body.querySelector(this.element);
						}

						if (!this.element) {
							throw new Error('Oxe.router.render - missing o-router element');
						}
					}

					if (!route.element) {

						if (route.load) {
							Loader$1.load(route.load);
						}

						if (!route.component) {
							throw new Error('Oxe.router.render - missing route component');
						} else if (route.component.constructor.name === 'String') {
							route.element = document.createElement(route.component);
						} else if (route.component.constructor.name === 'Object') {

							Component$1.define(route.component);

							if (this.compiled) {
								route.element = this.element.firstChild;
							} else {
								route.element = document.createElement(route.component.name);
							}
						}
					}

					if (!this.compiled) {

						while (this.element.firstChild) {
							this.element.removeChild(this.element.firstChild);
						}

						this.element.appendChild(route.element);
					}

					this.scroll(0, 0);
					this.emit('routed');
				}.bind(this));
			}
		}, {
			key: 'route',
			value: function (_route) {
				function route(_x, _x2) {
					return _route.apply(this, arguments);
				}

				route.toString = function () {
					return _route.toString();
				};

				return route;
			}(function (path, options) {
				options = options || {};

				if (options.query) {
					path += this.toQueryString(options.query);
				}

				// todo might need to be moved to the end
				if (!this.compiled) {
					window.history[options.replace ? 'replaceState' : 'pushState']({ path: path }, '', path);
				}

				var location = this.toLocationObject();

				location.route = this.find(location.pathname);

				if (!location.route) {
					throw new Error('Oxe.router.route - route not found');
				}

				location.title = location.route.title || '';
				location.query = this.toQueryObject(location.search);
				location.parameters = this.toParameterObject(location.route.path, location.pathname);

				// if (this.auth || location.route.auth && typeof this.validate === 'function') {
				// 	const data = this.validate(location);
				// 	if (!data.valid) return this.route(data.path);
				// }

				if (typeof this.before === 'function') {
					var result = this.before(location);
					if (result === false) return;
				}

				if (location.route.handler) {
					return route.handler(location.route);
				}

				if (location.route.redirect) {
					return this.redirect(location.route.redirect);
				}

				this.location = location;
				this.emit('routing');
				this.render(location.route);
			})
		}]);

		return Router;
	}(Events);

	var Router$1 = new Router();

	function Click(e) {

		// ignore canceled events, modified clicks, and right clicks
		if (e.button !== 0) return;
		if (e.defaultPrevented) return;
		if (e.target.nodeName === 'INPUT') return;
		if (e.target.nodeName === 'BUTTON') return;
		if (e.target.nodeName === 'SELECT') return;
		if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

		// if shadow dom use
		var target = e.path ? e.path[0] : e.target;
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

		if (Router$1.location.href !== target.href) {
			Router$1.route(target.href);
		}

		if (!Router$1.compiled) {
			e.preventDefault();
		}
	}

	function State(e) {

		var path = e && e.state ? e.state.path : window.location.href;

		Router$1.route(path, { replace: true });
	}

	function Load(e) {
		var element = e.target;

		if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
			return;
		}

		var path = Path.resolve(element.src || element.href);
		var load = this.data[path];

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

	// OPTIMIZE wait until polyfill are ready then allow setup

	var eStyle = document.createElement('style');
	var tStyle = document.createTextNode('\n\to-router, o-router > :first-child {\n\t\tdisplay: block;\n\t\tanimation: o-transition 150ms ease-in-out;\n\t}\n\t@keyframes o-transition {\n\t\t0% { opacity: 0; }\n\t\t100% { opacity: 1; }\n\t}\n');

	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(tStyle);
	document.head.appendChild(eStyle);

	document.addEventListener('load', Load, true);
	document.addEventListener('input', Input, true);
	document.addEventListener('reset', Reset, true);
	document.addEventListener('click', Click, true);
	document.addEventListener('submit', Submit, true);
	document.addEventListener('change', Change, true);
	window.addEventListener('popstate', State, true);

	document.registerElement('o-router', {
		prototype: Object.create(HTMLElement.prototype)
	});

	var oSetup = document.querySelector('script[o-setup]');

	if (oSetup) {

		var currentCount = 0;
		var requiredCount = 0;

		var loaded = function loaded() {
			if (currentCount !== requiredCount) return;

			var args = oSetup.getAttribute('o-setup').split(/\s*,\s*/);
			var meta = document.querySelector('meta[name="oxe"]');

			if (meta && meta.hasAttribute('compiled')) {
				args[1] = 'null';
				args[2] = 'script';
				Router$1.compiled = true;
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
				var _index = document.createElement('script');

				_index.setAttribute('src', args[0]);
				_index.setAttribute('async', 'true');
				_index.setAttribute('type', 'module');

				document.head.appendChild(_index);
			}
		};

		var loader = function loader(url, callback) {
			var polly = document.createElement('script');

			polly.setAttribute('async', 'true');
			polly.setAttribute('src', url);
			polly.addEventListener('load', function () {
				currentCount++;
				callback();
			}, true);

			document.head.appendChild(polly);
		};

		var features = [];
		var isNotFetch = !('fetch' in window);
		var isNotAssign = !('assign' in Object);
		var isNotPromise = !('Promise' in window);
		var isNotCustomElement = !('registerElement' in document) || !('content' in document.createElement('template'));

		if (isNotFetch) features.push('fetch');
		if (isNotPromise) features.push('Promise');
		if (isNotAssign) features.push('Object.assign');

		if (isNotPromise || isNotFetch || isNotAssign) {
			requiredCount++;
			loader('https://cdn.polyfill.io/v2/polyfill.min.js?features=' + features.join(','), loaded);
		}

		if (isNotCustomElement) {
			requiredCount++;
			loader('https://cdnjs.cloudflare.com/ajax/libs/document-register-element/1.7.2/document-register-element.js', loaded);
		}

		loaded();
	}

	var Oxe = function () {
		function Oxe() {
			_classCallCheck(this, Oxe);

			this.g = {};
			this.compiled = true;
		}

		_createClass(Oxe, [{
			key: 'setup',
			value: _async(function (data) {
				var _this12 = this;

				if (_this12._setup) {
					return;
				} else {
					_this12._setup = true;
				}

				data = data || {};

				if (data.listener && data.listener.before) {
					data.listener.before();
				}

				if (data.general) {
					_this12.general.setup(data.general);
				}

				if (data.fetcher) {
					_this12.fetcher.setup(data.fetcher);
				}

				if (data.loader) {
					_this12.loader.setup(data.loader);
				}

				if (data.component) {
					_this12.component.setup(data.component);
				}

				if (data.router) {
					_this12.router.setup(data.router);
				}

				if (data.listener && data.listener.after) {
					data.listener.after();
				}
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
				return Binder$2;
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
				return Model$2;
			}
		}]);

		return Oxe;
	}();

	var index = new Oxe();

	return index;
});