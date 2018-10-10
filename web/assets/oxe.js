var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _awaitIgnored(value, direct) {
	if (!direct) {
		return Promise.resolve(value).then(_empty);
	}
}function _invoke(body, then) {
	var result = body();if (result && result.then) {
		return result.then(then);
	}return then(result);
}function _invokeIgnored(body) {
	var result = body();if (result && result.then) {
		return result.then(_empty);
	}
}function _empty() {}function _await(value, then, direct) {
	if (direct) {
		return then ? then(value) : value;
	}
	value = Promise.resolve(value);return then ? value.then(then) : value;
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
function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, factory) {
	(typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define('Oxe', factory) : global.Oxe = factory();
})(this, function () {
	'use strict';

	var Methods = {
		data: {}
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

	var Batcher = function (_Events) {
		_inherits(Batcher, _Events);

		function Batcher(options) {
			_classCallCheck(this, Batcher);

			var _this = _possibleConstructorReturn(this, (Batcher.__proto__ || Object.getPrototypeOf(Batcher)).call(this));

			_this.reads = [];
			_this.writes = [];
			_this.fps = 1000 / 60;
			_this.pending = false;

			_this.setup(options);
			return _this;
		}

		_createClass(Batcher, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};
				options.fps = options.fps === undefined || options.fps === null ? this.fps : options.fps;
			}

			// adds a task to the read batch

		}, {
			key: 'read',
			value: function read(method, context) {
				var task = context ? method.bind(context) : method;
				this.reads.push(task);
				this.schedule();
				return task;
			}

			// adds a task to the write batch

		}, {
			key: 'write',
			value: function write(method, context) {
				var task = context ? method.bind(context) : method;
				this.writes.push(task);
				this.schedule();
				return task;
			}
		}, {
			key: 'tick',
			value: function tick(callback) {
				window.requestAnimationFrame(callback);
			}

			// schedules a new read/write batch if one is not pending

		}, {
			key: 'schedule',
			value: function schedule() {
				if (!this.pending) {
					this.pending = true;
					this.tick(this.flush.bind(this));
				}
			}
		}, {
			key: 'flush',
			value: function flush(time) {
				var count;

				try {
					count = this.runReads(this.reads, time);
					this.runWrites(this.writes, count);
				} catch (e) {
					if (this.events.error && this.events.error.length) {
						this.emit('error', e);
					} else {
						throw e;
					}
				}

				this.pending = false;

				if (this.reads.length || this.writes.length) {
					this.schedule();
				}
			}
		}, {
			key: 'runWrites',
			value: function runWrites(tasks, count) {
				var task;

				while (task = tasks.shift()) {

					task();

					if (count && tasks.length === count) {
						return;
					}
				}
			}
		}, {
			key: 'runReads',
			value: function runReads(tasks, time) {
				var task;

				while (task = tasks.shift()) {

					task();

					if (this.fps && performance.now() - time > this.fps) {
						return tasks.length;
					}
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
		}]);

		return Batcher;
	}(Events);

	var Batcher$1 = new Batcher();

	var Utility = {

		PATH: /\s*\|.*/,
		PREFIX: /(data-)?o-/,
		ROOT: /^(https?:)?\/?\//,
		TYPE: /(data-)?o-|-.*$/g,
		SPLIT_MODIFIERS: /\s|\s?,\s?/,

		binderNormalize: function binderNormalize(data) {
			return !data ? '' : data.replace(/\s+$/, '').replace(/^\s+/, '').replace(/\.{2,}/g, '.').replace(/\|{2,}/g, '|').replace(/\,{2,}/g, ',').replace(/\s{2,}/g, ' ').replace(/\s?\|\s?/, '|');
		},
		binderName: function binderName(data) {
			return data.replace(this.PREFIX, '');
		},
		binderType: function binderType(data) {
			return data.replace(this.TYPE, '');
		},
		binderNames: function binderNames(data) {
			return data.replace(this.PREFIX, '').split('-');
		},
		binderValues: function binderValues(data) {
			data = this.binderNormalize(data);
			var index = data.indexOf('|');
			return index === -1 ? data.split('.') : data.slice(0, index).split('.');
		},
		binderModifiers: function binderModifiers(data) {
			data = this.binderNormalize(data);
			var index = data.indexOf('|');
			return index === -1 ? [] : data.slice(index + 1).split(this.SPLIT_MODIFIERS);
		},
		binderPath: function binderPath(data) {
			return this.binderNormalize(data).replace(this.PATH, '');
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

			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = elements[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var element = _step2.value;

					if (element.nodeName === 'OPTION') continue;

					var path = element.getAttribute('o-value');

					if (!path) continue;

					path = path.replace(/\s*\|.*/, '');
					var name = path.split('.').slice(-1);

					data[name] = this.getByPath(model, path);
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			return data;
		},
		walker: function walker(node, callback) {
			callback(node);
			node = node.firstChild;
			while (node) {
				this.walker(node, callback);
				node = node.nextSibling;
			}
		},
		replaceEachVariable: function replaceEachVariable(element, variable, path, key) {
			var self = this;
			var iindex = '$index';
			var vindex = '$' + variable;
			// const pattern = new RegExp('\\$index|\\$' + variable, 'ig');

			self.walker(element, function (node) {
				if (node.nodeType === 3) {
					if (node.nodeValue === vindex || node.nodeValue === iindex) {
						node.nodeValue = key;
					}
				} else if (node.nodeType === 1) {
					for (var i = 0, l = node.attributes.length; i < l; i++) {
						var attribute = node.attributes[i];

						if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {

							// attribute.value = attribute.value.replace(pattern, key);
							// if (value === variable || value.indexOf(variable) === 0) {
							// attribute.value = path + '.' + key + attribute.value.slice(variable.length);
							// }

							var value = attribute.value;
							var length = value.length;
							var last = length - 1;
							var result = [];

							var item = '';

							for (var index = 0; index < length; index++) {
								var char = value[index];

								if (char === '$' && value.slice(index, iindex.length) === iindex) {
									item += key;
									index = index + iindex.length - 1;
								} else if (char === '$' && value.slice(index, vindex.length) === vindex) {
									item += key;
									index = index + vindex.length - 1;
								} else {
									item += char;
								}

								if (char === ' ' || char === '|' || char === ',' || index === last) {

									if (item.indexOf(variable) === 0) {
										var tail = item.slice(variable.length);
										result.push(path + '.' + key + tail);
									} else {
										result.push(item);
									}

									item = '';
								}
							}

							attribute.value = result.join('');
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

	/*
 	TODO:
 		sort reverse
 		test array methods
 		figure out a way to not update removed items
 */

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
					Observer.defineProperty(this, key);
					this.$meta.listener(this.length, this.$meta.path.slice(0, -1), 'length');
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
						// 	for (let value of key) {
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

	var Model = function (_Events2) {
		_inherits(Model, _Events2);

		function Model() {
			_classCallCheck(this, Model);

			var _this2 = _possibleConstructorReturn(this, (Model.__proto__ || Object.getPrototypeOf(Model)).call(this));

			_this2.GET = 2;
			_this2.SET = 3;
			_this2.REMOVE = 4;
			_this2.ran = false;

			_this2.data = Observer.create({}, _this2.listener);
			return _this2;
		}

		_createClass(Model, [{
			key: 'traverse',
			value: function traverse(type, keys, value) {

				if (typeof keys === 'string') {
					keys = [keys];
				}

				var data = this.data;
				var result;
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
			value: function listener(data, path) {
				var type = data === undefined ? 'unrender' : 'render';
				Binder$1.each(path, function (binder) {
					Binder$1[type](binder);
				});
			}
		}]);

		return Model;
	}(Events);

	var Model$1 = new Model();

	// TODO dynamic for list dont handle selected

	var Render = {
		required: function required(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.required === data) {
					return;
				}

				data = Utility.binderModifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.required = data;
				});
			});
		},
		disable: function disable(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.disabled === data) {
					return;
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.disabled = data;
				});
			});
		},
		enable: function enable(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.disabled === !data) {
					return;
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.disabled = !data;
				});
			});
		},
		hide: function hide(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.hidden === data) {
					return;
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.hidden = data;
				});
			});
		},
		show: function show(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.hidden === !data) {
					return;
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.hidden = !data;
				});
			});
		},
		read: function read(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.readOnly === data) {
					return;
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.readOnly = data;
				});
			});
		},
		write: function write(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.readOnly === !data) {
					return;
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.readOnly = !data;
				});
			});
		},
		html: function html(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.innerHTML === data) {
					return;
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.innerHTML = data;
				});
			});
		},
		class: function _class(opt) {
			Batcher$1.write(function () {
				var data = Model$1.get(opt.keys);
				var name = opt.names.slice(1).join('-');
				data = Binder$1.modifyData(opt, data);
				opt.element.classList.toggle(name, data);
			});
		},
		on: function on(opt) {
			Batcher$1.write(function () {
				var data = Utility.getByPath(Methods.data, opt.scope + '.' + opt.path);

				if (typeof data !== 'function') return;

				if (opt.cache) {
					opt.element.removeEventListener(opt.names[1], opt.cache);
				} else {
					opt.cache = function (e) {
						return Promise.resolve().then(function () {
							var parameters = [e];

							for (var i = 0, l = opt.modifiers.length; i < l; i++) {
								var keys = opt.modifiers[i].split('.');
								keys.unshift(opt.scope);
								var parameter = Oxe.model.get(keys);
								parameters.push(parameter);
							}

							return data.apply(opt.container, parameters);
						}).catch(console.error);
					};
				}

				opt.element.addEventListener(opt.names[1], opt.cache);
			});
		},
		css: function css(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element.style.cssText === data) {
					return;
				}

				if (opt.names.length > 1) {
					data = opt.names.slice(1).join('-') + ': ' + data + ';';
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.style.cssText = data;
				});
			});
		},
		text: function text(opt) {
			Batcher$1.read(function () {
				var data = void 0;

				data = Model$1.get(opt.keys);
				data = data === undefined || data === null ? '' : data;

				if (data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
					data = JSON.stringify(data);
				} else if (data && typeof data !== 'string') {
					data = String(data);
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element.innerText = data;
				});
			});
		},
		each: function each(opt) {
			var self = this;

			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);
				var isArray = data ? data.constructor === Array : false;
				var isObject = data ? data.constructor === Object : false;

				if (!data || (typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
					return;
				} else if (isArray && opt.element.children.length === data.length) {
					return;
				} else if (isObject && opt.element.children.length === Object.keys(data).length) {
					return;
				}

				if (!opt.cache) {
					opt.cache = opt.element.removeChild(opt.element.firstElementChild);
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {

					if (isObject) {
						data = Object.keys(data);
					}

					while (opt.element.children.length !== data.length) {

						if (opt.element.children.length > data.length) {
							opt.element.removeChild(opt.element.children[opt.element.children.length - 1]);
						} else if (opt.element.children.length < data.length) {
							var key = void 0;
							var clone = opt.cache.cloneNode(true);

							if (isArray) {
								key = opt.element.children.length;
							} else if (isObject) {
								key = data[opt.element.children.length];
							}

							Utility.replaceEachVariable(clone, opt.names[1], opt.path, key);
							Binder$1.bind(clone, opt.container);

							opt.element.appendChild(clone);
						}
					}

					/*
     	check if select element with o-value
     	perform a re-render of the o-value
     	becuase of o-each is async
     */
					if (opt.element.nodeName === 'SELECT' && opt.element.attributes['o-value'] || opt.element.attributes['data-o-value']) {
						var name = opt.element.attributes['o-value'] || opt.element.attributes['data-o-value'];
						var value = opt.element.attributes['o-value'].value || opt.element.attributes['data-o-value'].value;
						var keys = [opt.scope].concat(value.split('|')[0].split('.'));

						self.value({
							setup: true,
							keys: keys,
							name: name,
							value: value,
							container: opt.scope,
							element: opt.element
						});
					}
				});
			});
		},
		value: function value(opt) {
			Batcher$1.read(function () {

				var type = opt.element.type;
				var name = opt.element.nodeName;
				var attribute = void 0,
				    query = void 0,
				    multiple = void 0;
				var i = void 0,
				    l = void 0,
				    data = void 0,
				    element = void 0,
				    elements = void 0;

				if (opt.setup) {
					opt.setup = false;

					data = Model$1.get(opt.keys);

					if (name === 'SELECT') {
						elements = opt.element.options;
						multiple = opt.element.multiple;
						data = data === undefined ? multiple ? [] : '' : data;

						for (var _i = 0, _l = elements.length; _i < _l; _i++) {
							if (!elements[_i].disabled) {
								if (elements[_i].selected) {
									if (multiple) {
										data.push(elements[_i].value || elements[_i].innerText || '');
									} else {
										data = elements[_i].value || elements[_i].innerText || '';
										break;
									}
								} else if (_i === _l - 1 && !multiple) {
									data = elements[0].value || elements[0].innerText || '';
								}
							}
						}
					} else if (type === 'radio') {
						data = data === undefined ? 0 : data;
						query = 'input[type="radio"][o-value="' + opt.value + '"]';
						elements = opt.container.querySelectorAll(query);

						for (i = 0, l = elements.length; i < l; i++) {
							element = elements[i];
							if (i === data) {
								element.checked = true;
							} else {
								element.checked = false;
							}
						}
					} else if (type === 'file') {
						data = data === undefined ? [] : data;

						for (i = 0, l = data.length; i < l; i++) {
							opt.element.files[i] = data[i];
						}
					} else if (type === 'checkbox') {
						attribute = 'checked';
						data = data === undefined ? false : data;
					} else {
						attribute = 'value';
						data = data === undefined ? '' : data;
					}

					if (attribute) {
						opt.element[attribute] = data;
					}
				} else {

					if (name === 'SELECT') {
						data = opt.element.multiple ? [] : '';

						var _iteratorNormalCompletion3 = true;
						var _didIteratorError3 = false;
						var _iteratorError3 = undefined;

						try {
							for (var _iterator3 = opt.element.options[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
								var _element = _step3.value;

								if (_element.selected) {
									if (opt.element.multiple) {
										data.push(_element.value || _element.innerText);
									} else {
										data = _element.value || _element.innerText;
										break;
									}
								}
							}
						} catch (err) {
							_didIteratorError3 = true;
							_iteratorError3 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion3 && _iterator3.return) {
									_iterator3.return();
								}
							} finally {
								if (_didIteratorError3) {
									throw _iteratorError3;
								}
							}
						}
					} else if (type === 'radio') {
						query = 'input[type="radio"][o-value="' + opt.value + '"]';
						elements = opt.container.querySelectorAll(query);

						for (i = 0, l = elements.length; i < l; i++) {
							element = elements[i];
							if (opt.element === element) {
								data = i;
								element.checked = true;
							} else {
								element.checked = false;
							}
						}
					} else if (type === 'file') {
						data = data || [];
						for (i = 0, l = opt.element.files.length; i < l; i++) {
							data[i] = opt.element.files[i];
						}
					} else if (type === 'checkbox') {
						data = opt.element.checked;
					} else {
						data = opt.element.value;
					}
				}

				if (data !== undefined) {
					Model$1.set(opt.keys, data);
				}
			});
		},
		default: function _default(opt) {
			Batcher$1.read(function () {
				var data = Model$1.get(opt.keys);

				if (opt.element[opt.type] === data) {
					return;
				}

				data = Binder$1.modifyData(opt, data);

				Batcher$1.write(function () {
					opt.element[opt.type] = data;
				});
			});
		}
	};

	var Unrender = {
		alt: function alt(opt) {
			Batcher$1.write(function () {
				opt.element.alt = '';
			});
		},
		each: function each(opt) {
			Batcher$1.write(function () {
				var element;

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
				var element;

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
		text: function text(opt) {
			Batcher$1.write(function () {
				opt.element.innerText = '';
			});
		},
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
		default: function _default(opt) {}
	};

	var Binder = function () {
		function Binder() {
			_classCallCheck(this, Binder);

			this.data = {};
			this.values = [];
			this.submits = [];
		}

		_createClass(Binder, [{
			key: 'set',
			value: function set(opt) {
				opt = opt || {};

				if (opt.name === undefined) throw new Error('Oxe.binder.set - missing name');
				if (opt.value === undefined) throw new Error('Oxe.binder.set - missing value');
				if (opt.element === undefined) throw new Error('Oxe.binder.set - missing element');
				if (opt.container === undefined) throw new Error('Oxe.binder.set - missing container');

				opt.scope = opt.scope || opt.container.getAttribute('o-scope');
				// opt.value = opt.value || opt.element.getAttribute(opt.name);
				opt.path = opt.path || Utility.binderPath(opt.value);

				opt.type = opt.type || Utility.binderType(opt.name);
				opt.names = opt.names || Utility.binderNames(opt.name);
				opt.values = opt.values || Utility.binderValues(opt.value);
				opt.modifiers = opt.modifiers || Utility.binderModifiers(opt.value);

				opt.keys = opt.keys || [opt.scope].concat(opt.values);

				if (opt.name === 'o-value' || opt.name === 'data-o-value') {
					opt.setup = true;
				}

				// if (opt.name.indexOf('o-each') === 0 || opt.name.indexOf('data-o-each') === 0) {
				// 	opt.cache = opt.element.removeChild(opt.element.firstElementChild);
				// }

				return opt;
			}
		}, {
			key: 'get',
			value: function get(opt) {
				var items;

				if (opt.name === 'o-value') {
					items = this.values;
				} else if (opt.name === 'o-submit') {
					items = this.submits;
				} else {

					if (!(opt.scope in this.data)) {
						return null;
					}

					if (!(opt.path in this.data[opt.scope])) {
						return null;
					}

					items = this.data[opt.scope][opt.path];
				}

				var _iteratorNormalCompletion4 = true;
				var _didIteratorError4 = false;
				var _iteratorError4 = undefined;

				try {
					for (var _iterator4 = items[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
						var item = _step4.value;

						if (item.element === opt.element && item.name === opt.name) {
							return item;
						}
					}
				} catch (err) {
					_didIteratorError4 = true;
					_iteratorError4 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion4 && _iterator4.return) {
							_iterator4.return();
						}
					} finally {
						if (_didIteratorError4) {
							throw _iteratorError4;
						}
					}
				}

				return null;
			}
		}, {
			key: 'add',
			value: function add(opt) {
				var items;

				if (opt.name === 'o-value') {
					items = this.values;
				} else if (opt.name === 'o-submit') {
					items = this.submits;
				} else {

					if (!(opt.scope in this.data)) {
						this.data[opt.scope] = {};
					}

					if (!(opt.path in this.data[opt.scope])) {
						this.data[opt.scope][opt.path] = [];
					}

					items = this.data[opt.scope][opt.path];
				}

				items.push(opt);
			}
		}, {
			key: 'remove',
			value: function remove(opt) {
				var items;

				if (opt.name === 'o-value') {
					items = this.values;
				} else if (opt.name === 'o-submit') {
					items = this.submits;
				} else {
					if (!(opt.scope in this.data)) {
						return;
					}

					if (!(opt.path in this.data[opt.scope])) {
						return;
					}

					items = this.data[opt.scope][opt.path];
				}

				for (var i = 0, l = items.length; i < l; i++) {
					if (items[i].element === opt.element) {
						return items.splice(i, 1);
					}
				}
			}
		}, {
			key: 'each',
			value: function each(path, callback) {
				var scope, paths;

				var paths = path.split('.');
				var scope = paths[0];
				var binderPaths = this.data[scope];
				var relativePath = paths.slice(1).join('.');

				for (var binderPath in binderPaths) {
					if (relativePath === '' || binderPath.indexOf(relativePath) === 0 && (binderPath === relativePath || binderPath.charAt(relativePath.length) === '.')) {
						var binders = binderPaths[binderPath];
						for (var i = 0, l = binders.length; i < l; i++) {
							var binder = binders[i];
							callback(binder);
						}
					}
				}
			}
		}, {
			key: 'unrender',
			value: function unrender(opt) {
				if (opt.type in Unrender) {
					Unrender[opt.type](opt);
				}
			}
		}, {
			key: 'render',
			value: function render(opt) {
				if (opt.type in Render) {
					Render[opt.type](opt);
				} else {
					Render.default(opt);
				}
			}
		}, {
			key: 'modifyData',
			value: function modifyData(opt, data) {

				if (!opt.modifiers.length) {
					return data;
				}

				if (!Methods.data[opt.scope]) {
					return data;
				}

				var _iteratorNormalCompletion5 = true;
				var _didIteratorError5 = false;
				var _iteratorError5 = undefined;

				try {
					for (var _iterator5 = opt.modifiers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
						var modifier = _step5.value;

						var scope = Methods.data[opt.scope];

						if (scope) {
							data = scope[modifier].call(opt.container, data);
						}
					}
				} catch (err) {
					_didIteratorError5 = true;
					_iteratorError5 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion5 && _iterator5.return) {
							_iterator5.return();
						}
					} finally {
						if (_didIteratorError5) {
							throw _iteratorError5;
						}
					}
				}

				return data;
			}
		}, {
			key: 'skipChildren',
			value: function skipChildren(element) {

				if (element.nodeName === 'STYLE' && element.nodeName === 'SCRIPT' && element.nodeName === 'OBJECT' && element.nodeName === 'IFRAME') {
					return true;
				}

				var _iteratorNormalCompletion6 = true;
				var _didIteratorError6 = false;
				var _iteratorError6 = undefined;

				try {
					for (var _iterator6 = element.attributes[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
						var attribute = _step6.value;

						if (attribute.name.indexOf('o-each') === 0 || attribute.name.indexOf('data-o-each') === 0) {
							return true;
						}
					}
				} catch (err) {
					_didIteratorError6 = true;
					_iteratorError6 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion6 && _iterator6.return) {
							_iterator6.return();
						}
					} finally {
						if (_didIteratorError6) {
							throw _iteratorError6;
						}
					}
				}

				return false;
			}
		}, {
			key: 'eachElement',
			value: function eachElement(element, scope, callback) {
				var sid = scope.getAttribute('o-scope') || scope.getAttribute('data-o-scope');
				var eid = element.getAttribute('o-scope') || element.getAttribute('data-o-scope');
				var idCheck = eid ? eid === sid : true;

				if (element.nodeName !== 'O-ROUTER' && !element.hasAttribute('o-scope') && !element.hasAttribute('o-setup') && !element.hasAttribute('o-router') && !element.hasAttribute('o-compiled') && !element.hasAttribute('o-external') && !element.hasAttribute('data-o-scope') && !element.hasAttribute('data-o-setup') && !element.hasAttribute('data-o-router') && !element.hasAttribute('data-o-compiled') && !element.hasAttribute('data-o-external')) {
					callback.call(this, element);
				}

				if (idCheck && this.skipChildren(element) === false) {
					var _iteratorNormalCompletion7 = true;
					var _didIteratorError7 = false;
					var _iteratorError7 = undefined;

					try {
						for (var _iterator7 = element.children[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
							var child = _step7.value;

							this.eachElement(child, scope, callback);
						}
					} catch (err) {
						_didIteratorError7 = true;
						_iteratorError7 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion7 && _iterator7.return) {
								_iterator7.return();
							}
						} finally {
							if (_didIteratorError7) {
								throw _iteratorError7;
							}
						}
					}
				}
			}
		}, {
			key: 'eachAttribute',
			value: function eachAttribute(element, callback) {
				var _iteratorNormalCompletion8 = true;
				var _didIteratorError8 = false;
				var _iteratorError8 = undefined;

				try {
					for (var _iterator8 = element.attributes[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
						var attribute = _step8.value;

						if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {
							callback.call(this, attribute);
						}
					}
				} catch (err) {
					_didIteratorError8 = true;
					_iteratorError8 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion8 && _iterator8.return) {
							_iterator8.return();
						}
					} finally {
						if (_didIteratorError8) {
							throw _iteratorError8;
						}
					}
				}
			}
		}, {
			key: 'unbind',
			value: function unbind(element, scope) {
				scope = scope || element;

				this.eachElement(element, scope, function (child) {
					this.eachAttribute(child, function (attribute) {

						var binder = this.get({
							element: child,
							container: scope,
							name: attribute.name,
							value: attribute.value,
							scope: scope.getAttribute('o-scope'),
							path: Utility.binderPath(attribute.value)
						});

						this.remove(binder);
						this.unrender(binder);
					});
				});
			}
		}, {
			key: 'bind',
			value: function bind(element, scope) {
				scope = scope || element;

				this.eachElement(element, scope, function (child) {
					this.eachAttribute(child, function (attribute) {

						var binder = this.set({
							element: child,
							container: scope,
							name: attribute.name,
							value: attribute.value
						});

						this.add(binder);
						this.render(binder);
					});
				});
			}
		}]);

		return Binder;
	}();

	var Binder$1 = new Binder();

	var Component = function () {
		function Component(options) {
			_classCallCheck(this, Component);

			this.data = {};
			this.setup(options);
		}

		_createClass(Component, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};

				if (options.components) {
					var _iteratorNormalCompletion9 = true;
					var _didIteratorError9 = false;
					var _iteratorError9 = undefined;

					try {
						for (var _iterator9 = options.components[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
							var component = _step9.value;

							this.define(component);
						}
					} catch (err) {
						_didIteratorError9 = true;
						_iteratorError9 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion9 && _iterator9.return) {
								_iterator9.return();
							}
						} finally {
							if (_didIteratorError9) {
								throw _iteratorError9;
							}
						}
					}
				}
			}
		}, {
			key: 'renderSlot',
			value: function renderSlot(target, source) {
				var targetSlots = target.querySelectorAll('slot[name]');

				var _iteratorNormalCompletion10 = true;
				var _didIteratorError10 = false;
				var _iteratorError10 = undefined;

				try {
					for (var _iterator10 = targetSlots[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
						var targetSlot = _step10.value;


						var name = targetSlot.getAttribute('name');
						var sourceSlot = source.querySelector('[slot="' + name + '"]');

						if (sourceSlot) {
							targetSlot.parentNode.replaceChild(sourceSlot, targetSlot);
						} else {
							targetSlot.parentNode.removeChild(targetSlot);
						}
					}
				} catch (err) {
					_didIteratorError10 = true;
					_iteratorError10 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion10 && _iterator10.return) {
							_iterator10.return();
						}
					} finally {
						if (_didIteratorError10) {
							throw _iteratorError10;
						}
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
		}, {
			key: 'renderTemplate',
			value: function renderTemplate(template) {
				var fragment = document.createDocumentFragment();

				if (template) {
					if (typeof template === 'string') {
						var temporary = document.createElement('div');

						temporary.innerHTML = template;

						while (temporary.firstChild) {
							fragment.appendChild(temporary.firstChild);
						}
					} else {
						fragment.appendChild(template);
					}
				}

				return fragment;
			}
		}, {
			key: 'renderStyle',
			value: function renderStyle(style, scope) {

				if (!style) return;

				if (window.CSS && window.CSS.supports) {

					if (!window.CSS.supports('(--t: black)')) {
						var matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

						var _iteratorNormalCompletion11 = true;
						var _didIteratorError11 = false;
						var _iteratorError11 = undefined;

						try {
							for (var _iterator11 = matches[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
								var match = _step11.value;


								var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
								var pattern = new RegExp('var\\(' + rule[1] + '\\)', 'g');

								style = style.replace(rule[0], '');
								style = style.replace(pattern, rule[2]);
							}
						} catch (err) {
							_didIteratorError11 = true;
							_iteratorError11 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion11 && _iterator11.return) {
									_iterator11.return();
								}
							} finally {
								if (_didIteratorError11) {
									throw _iteratorError11;
								}
							}
						}
					}

					if (!window.CSS.supports(':scope')) {
						style = style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
					}

					if (!window.CSS.supports(':host')) {
						style = style.replace(/\:host/g, '[o-scope="' + scope + '"]');
					}
				}

				var estyle = document.createElement('style');
				var nstyle = document.createTextNode(style);

				estyle.appendChild(nstyle);

				return estyle;
			}
		}, {
			key: 'created',
			value: function created(element, options) {
				var self = this;
				var scope = options.name + '-' + options.count++;

				Object.defineProperties(element, {
					scope: {
						enumerable: true,
						value: scope
					},
					status: {
						enumerable: true,
						value: 'created'
					}
				});

				element.setAttribute('o-scope', scope);

				Model$1.set(scope, options.model || {});
				Methods.data[scope] = options.methods;

				if (!self.compiled || self.compiled && element.parentNode.nodeName !== 'O-ROUTER') {
					var eTemplate = self.renderTemplate(options.template);
					var eStyle = self.renderStyle(options.style, scope);

					if (eStyle) {
						eTemplate.insertBefore(eStyle, eTemplate.firstChild);
					}

					if (options.shadow && 'attachShadow' in document.body) {
						element.attachShadow({ mode: 'open' }).appendChild(eTemplate);
					} else if (options.shadow && 'createShadowRoot' in document.body) {
						element.createShadowRoot().appendChild(eTemplate);
					} else {
						self.renderSlot(eTemplate, element);
						element.appendChild(eTemplate);
					}
				}

				Binder$1.bind(element);

				if (options.created) {
					options.created.call(element);
				}
			}
		}, {
			key: 'attached',
			value: function attached(element, options) {
				// Binder.bind(element);

				if (options.attached) {
					options.attached.call(element);
				}
			}
		}, {
			key: 'detached',
			value: function detached(element, options) {
				// Binder.unbind(element);

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
				options.model = options.model || {};
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
						return Model$1.get(this.scope);
					},
					set: function set(data) {
						data = data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' ? data : {};
						return Model$1.set(this.scope, data);
					}
				};

				options.properties.methods = {
					enumerable: true,
					get: function get() {
						return Methods.data[this.scope];
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

	var General = function () {
		function General(options) {
			_classCallCheck(this, General);

			this.setup(options);
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

	var Fetcher = function () {
		function Fetcher(options) {
			_classCallCheck(this, Fetcher);

			this.mime = {
				xml: 'text/xml; charset=utf-8',
				html: 'text/html; charset=utf-8',
				text: 'text/plain; charset=utf-8',
				json: 'application/json; charset=utf-8',
				js: 'application/javascript; charset=utf-8'
			};

			this.setup(options);
		}

		_createClass(Fetcher, [{
			key: 'setup',
			value: function setup(options) {
				options = options || {};

				this.head = options.head || null;
				this.method = options.method || 'get';

				this.request = options.request;
				this.response = options.response;
				this.acceptType = options.acceptType;
				this.contentType = options.contentType;
				this.responseType = options.responseType;
				this.credentials = options.credentials;
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
				var _this3 = this;

				var data = Object.assign({}, options);

				if (!data.url) throw new Error('Oxe.fetcher - requires url option');
				if (!data.method) throw new Error('Oxe.fetcher - requires method option');

				if (!data.head && _this3.head) data.head = _this3.head;
				if (typeof data.method === 'string') data.method = data.method.toUpperCase() || _this3.method;

				if (!data.acceptType && _this3.acceptType) data.acceptType = _this3.acceptType;
				if (!data.contentType && _this3.contentType) data.contentType = _this3.contentType;
				if (!data.responseType && _this3.responseType) data.responseType = _this3.responseType;

				// omit, same-origin, or include
				if (!data.credentials && _this3.credentials) data.credentials = _this3.credentials;

				// cors, no-cors, or same-origin
				if (!data.mode && _this3.mode) data.mode = _this3.mode;

				// default, no-store, reload, no-cache, force-cache, or only-if-cached
				if (!data.cache && _this3.cache) data.cahce = _this3.cache;

				// follow, error, or manual
				if (!data.redirect && _this3.redirect) data.redirect = _this3.redirect;

				// no-referrer, client, or a URL
				if (!data.referrer && _this3.referrer) data.referrer = _this3.referrer;

				// no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, unsafe-url
				if (!data.referrerPolicy && _this3.referrerPolicy) data.referrerPolicy = _this3.referrerPolicy;

				if (!data.signal && _this3.signal) data.signal = _this3.signal;
				if (!data.integrity && _this3.integrity) data.integrity = _this3.integrity;
				if (!data.keepAlive && _this3.keepAlive) data.keepAlive = _this3.keepAlive;

				if (data.contentType) {
					data.head = data.head || {};
					switch (data.contentType) {
						case 'js':
							data.head['Content-Type'] = _this3.mime.js;break;
						case 'xml':
							data.head['Content-Type'] = _this3.mime.xml;break;
						case 'html':
							data.head['Content-Type'] = _this3.mime.html;break;
						case 'json':
							data.head['Content-Type'] = _this3.mime.json;break;
						default:
							data.head['Content-Type'] = data.contentType;
					}
				}

				if (data.acceptType) {
					data.head = data.head || {};
					switch (data.acceptType) {
						case 'js':
							data.head['Accept'] = _this3.mime.js;break;
						case 'xml':
							data.head['Accept'] = _this3.mime.xml;break;
						case 'html':
							data.head['Accept'] = _this3.mime.html;break;
						case 'json':
							data.head['Accept'] = _this3.mime.json;break;
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

								return _await(_this3.serialize(data.body), function (_this3$serialize) {
									data.url = _temp + _this3$serialize;
								});
							} else if (data.contentType === 'json') {
								data.body = JSON.stringify(data.body);
							}
						});
					}
				}, function () {
					var _exit = false;
					return _invoke(function () {
						if (typeof _this3.request === 'function') {
							var copy = Object.assign({}, data);
							return _await(_this3.request(copy), function (result) {

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
									if (_this3.response) {
										var copy = Object.assign({}, data);
										return _await(_this3.response(copy), function (result) {

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
				var _this4 = this;

				data.method = 'post';
				return _this4.fetch(data);
			})
		}, {
			key: 'get',
			value: _async(function (data) {
				var _this5 = this;

				data.method = 'get';
				return _this5.fetch(data);
			})
		}, {
			key: 'put',
			value: _async(function (data) {
				var _this6 = this;

				data.method = 'put';
				return _this6.fetch(data);
			})
		}, {
			key: 'head',
			value: _async(function (data) {
				var _this7 = this;

				data.method = 'head';
				return _this7.fetch(data);
			})
		}, {
			key: 'patch',
			value: _async(function (data) {
				var _this8 = this;

				data.method = 'patch';
				return _this8.fetch(data);
			})
		}, {
			key: 'delete',
			value: _async(function (data) {
				var _this9 = this;

				data.method = 'delete';
				return _this9.fetch(data);
			})
		}, {
			key: 'options',
			value: _async(function (data) {
				var _this10 = this;

				data.method = 'options';
				return _this10.fetch(data);
			})
		}, {
			key: 'connect',
			value: _async(function (data) {
				var _this11 = this;

				data.method = 'connect';
				return _this11.fetch(data);
			})
		}]);

		return Fetcher;
	}();

	var Fetcher$1 = new Fetcher();

	// FIXME import export in strings cause error

	var Transformer = {

		/*
  	templates
  */

		_innerHandler: function _innerHandler(char, index, string) {
			if (string[index - 1] === '\\') return;
			if (char === '\'') return '\\\'';
			if (char === '\"') return '\\"';
			if (char === '\t') return '\\t';
			if (char === '\n') return '\\n';
		},
		_updateString: function _updateString(value, index, string) {
			return string.slice(0, index) + value + string.slice(index + 1);
		},
		_updateIndex: function _updateIndex(value, index) {
			return index + value.length - 1;
		},
		template: function template(data) {
			// NOTE: double backtick in strings or regex could possibly causes issues

			var first = data.indexOf('`');
			var second = data.indexOf('`', first + 1);

			if (first === -1 || second === -1) return data;

			var value;
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

			var i, l;

			text = 'var $EXPORT = {};\n' + text;
			text = text + '\nreturn $EXPORT;\n';

			for (i = 0, l = exps.length; i < l; i++) {
				text = text.replace(exps[i].raw, '$EXPORT.');
			}

			return text;
		},
		ast: function ast(data) {
			var ast = {};

			ast.url = data.url;
			ast.raw = data.text;
			ast.cooked = data.text;
			ast.base = ast.url.slice(0, ast.url.lastIndexOf('/') + 1);

			ast.imports = this.getImports(ast.raw, ast.base);
			ast.exports = this.getExports(ast.raw);

			ast.cooked = this.replaceImports(ast.cooked, ast.imports);
			ast.cooked = this.replaceExports(ast.cooked, ast.exports);

			return ast;
		}
	};

	var Loader = function (_Events3) {
		_inherits(Loader, _Events3);

		function Loader() {
			_classCallCheck(this, Loader);

			var _this12 = _possibleConstructorReturn(this, (Loader.__proto__ || Object.getPrototypeOf(Loader)).call(this));

			_this12.data = {};
			_this12.ran = false;
			_this12.methods = {};
			_this12.transformers = {};

			document.addEventListener('load', _this12.listener.bind(_this12), true);
			return _this12;
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
		}, {
			key: 'listener',
			value: function listener(e) {
				var element = e.target;

				if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
					return;
				}

				var path = Path.resolve(element.src || element.href);
				var load = this.data[path];

				this.ready(load);
			}
		}]);

		return Loader;
	}(Events);

	var Loader$1 = new Loader();

	/*
 	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
 */

	var Router = function (_Events4) {
		_inherits(Router, _Events4);

		function Router() {
			_classCallCheck(this, Router);

			var _this13 = _possibleConstructorReturn(this, (Router.__proto__ || Object.getPrototypeOf(Router)).call(this));

			_this13.data = [];
			_this13.location = {};

			_this13.ran = false;

			_this13.element = null;
			_this13.contain = false;
			_this13.compiled = false;

			document.addEventListener('click', _this13.clickListener.bind(_this13), true);
			window.addEventListener('popstate', _this13.stateListener.bind(_this13), true);
			return _this13;
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
		}, {
			key: 'stateListener',
			value: function stateListener(e) {
				var path = e && e.state ? e.state.path : window.location.href;
				this.route(path, { replace: true });
			}
		}, {
			key: 'clickListener',
			value: function clickListener(e) {

				// if shadow dom use
				var target = e.path ? e.path[0] : e.target;
				var parent = target.parentNode;

				if (this.contain) {

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

				if (e.metaKey || e.ctrlKey || e.shiftKey) {
					return;
				}

				// ensure target is anchor tag
				while (target && 'A' !== target.nodeName) {
					target = target.parentNode;
				}

				if (!target || 'A' !== target.nodeName) {
					return;
				}

				// check non acceptables
				if (target.hasAttribute('download') || target.hasAttribute('external') || target.hasAttribute('o-external') || target.href.indexOf('tel:') === 0 || target.href.indexOf('ftp:') === 0 || target.href.indexOf('file:') === 0 || target.href.indexOf('mailto:') === 0 || target.href.indexOf(window.location.origin) !== 0) return;

				// if external is true then default action
				if (this.external && (this.external.constructor.name === 'RegExp' && this.external.test(target.href) || this.external.constructor.name === 'Function' && this.external(target.href) || this.external.constructor.name === 'String' && this.external === target.href)) return;

				if (this.location.href !== target.href) {
					this.route(target.href);
				}

				if (!this.compiled) {
					e.preventDefault();
				}
			}
		}]);

		return Router;
	}(Events);

	var Router$1 = new Router();

	var Global = function () {
		function Global() {
			_classCallCheck(this, Global);

			this._compiled = false;
		}

		_createClass(Global, [{
			key: 'setup',
			value: function setup(data) {

				if (this._setup) {
					return;
				} else {
					this._setup = true;
				}

				data = data || {};

				if (data.listener && data.listener.before) {
					data.listener.before();
				}

				if (data.general) {
					this.general.setup(data.general);
				}

				if (data.fetcher) {
					this.fetcher.setup(data.fetcher);
				}

				if (data.loader) {
					this.loader.setup(data.loader);
				}

				if (data.component) {
					this.component.setup(data.component);
				}

				if (data.router) {
					this.router.setup(data.router);
				}

				if (data.listener && data.listener.after) {
					data.listener.after();
				}
			}
		}, {
			key: 'compiled',
			set: function set(data) {
				return this._compiled = data;
			},
			get: function get() {
				return this._compiled;
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
			key: 'global',
			get: function get() {
				return {};
			}
		}, {
			key: 'methods',
			get: function get() {
				return {
					data: {}
				};
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

		return Global;
	}();

	var Global$1 = new Global();

	function Change(e) {
		if (e.target.hasAttribute('o-value')) {

			var binder = Global$1.binder.get({
				name: 'o-value',
				element: e.target
			});

			Global$1.binder.render(binder);
		}
	}

	function Submit(e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		if (!submit) return;

		e.preventDefault();

		var binder = Global$1.binder.get({
			name: 'o-submit',
			element: element
		});

		var sScope = binder.scope;
		var eScope = binder.container;
		var model = Global$1.model.data[sScope];

		var data = Global$1.utility.formData(element, model);
		var method = Global$1.utility.getByPath(eScope.methods, submit);

		var done = _async(function (options) {
			return _invoke(function () {
				if (options && (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
					var auth = element.getAttribute('o-auth') || element.getAttribute('data-o-auth');
					var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
					var _method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
					var enctype = element.getAttribute('o-enctype') || element.getAttribute('data-o-enctype');

					options.url = options.url || action;
					options.method = options.method || _method;
					options.auth = options.auth === undefined || options.auth === null ? auth : options.auth;
					options.contentType = options.contentType === undefined || options.contentType === null ? enctype : options.contentType;

					return _awaitIgnored(Global$1.fetcher.fetch(options));
				}
			}, function () {
				if (options && (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object' && options.reset || element.hasAttribute('o-reset')) {
					element.reset();
				}
			});
		});

		Promise.resolve().then(method.bind(eScope, data, e)).then(done).catch(console.error);
	}

	function Reset(e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		var binder = Global$1.binder.get({
			name: 'o-submit',
			element: element
		});

		var scope = binder.scope;

		if (submit) {
			var elements = element.querySelectorAll('[o-value]');
			var i = elements.length;

			while (i--) {
				var path = elements[i].getAttribute('o-value');
				var keys = [scope].concat(path.split('.'));

				Global$1.model.set(keys, '');

				Global$1.binder.unrender({
					name: 'o-value',
					element: elements[i]
				}, 'view');
			}
		}
	}

	function Input(e) {
		if (e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.type !== 'option' && e.target.nodeName !== 'SELECT' && e.target.hasAttribute('o-value')) {

			var binder = Global$1.binder.get({
				name: 'o-value',
				element: e.target
			});

			Global$1.binder.render(binder);
		}
	}

	var eStyle = document.createElement('style');
	var tStyle = document.createTextNode(' \
	o-router, o-router > :first-child { \
		display: block; \
	} \
	o-router, [o-scope] { \
		animation: o-transition 150ms ease-in-out; \
	} \
	@keyframes o-transition { \
		0% { opacity: 0; } \
		100% { opacity: 1; } \
	} \
');

	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(tStyle);
	document.head.appendChild(eStyle);

	var currentCount = 0;
	var requiredCount = 0;
	var loadedCalled = false;

	var loaded = function loaded() {
		if (loadedCalled) return;
		if (currentCount !== requiredCount) return;

		loadedCalled = true;

		document.addEventListener('input', Input, true);
		document.addEventListener('reset', Reset, true);
		document.addEventListener('submit', Submit, true);
		document.addEventListener('change', Change, true);

		var element = document.querySelector('script[o-setup]');

		if (element) {

			var args = element.getAttribute('o-setup').split(/\s*,\s*/);
			var meta = document.querySelector('meta[name="oxe"]');

			if (meta && meta.hasAttribute('compiled')) {
				args[1] = 'null';
				args[2] = 'script';
				Global$1.compiled = true;
				Global$1.router.compiled = true;
				Global$1.component.compiled = true;
			}

			if (!args[0]) {
				throw new Error('Oxe - o-setup attribute requires a url');
			}

			if (args.length > 1) {
				Global$1.loader.load({
					url: args[0],
					method: args[2],
					transformer: args[1]
				});
			} else {
				var index = document.createElement('script');
				index.setAttribute('src', args[0]);
				index.setAttribute('async', 'true');
				index.setAttribute('type', 'module');
				element.insertAdjacentElement('afterend', index);
			}
		}

		document.registerElement('o-router', {
			prototype: Object.create(HTMLElement.prototype)
		});
	};

	var loader = function loader(condition, url) {
		if (condition) {
			requiredCount++;
			var polly = document.createElement('script');
			polly.setAttribute('async', 'true');
			polly.setAttribute('src', url);
			polly.addEventListener('load', function () {
				currentCount++;
				loaded();
			}, true);
			document.head.appendChild(polly);
		} else {
			loaded();
		}
	};

	var features = [];
	var isNotFetch = !('fetch' in window);
	var isNotAssign = !('assign' in Object);
	var isNotPromise = !('Promise' in window);

	if (isNotFetch) features.push('fetch');
	if (isNotPromise) features.push('Promise');
	if (isNotAssign) features.push('Object.assign');

	loader(isNotPromise || isNotFetch || isNotAssign, 'https://cdn.polyfill.io/v2/polyfill.min.js?features=' + features.join(','));

	loader(!('registerElement' in document) || !('content' in document.createElement('template')), 'https://cdnjs.cloudflare.com/ajax/libs/document-register-element/1.7.2/document-register-element.js');

	return Global$1;
});