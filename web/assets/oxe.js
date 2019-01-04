/*
	Name: oxe
	Version: 4.0.0
	License: MPL-2.0
	Author: Alexander Elias
	Email: alex.steven.elis@gmail.com
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports !== "undefined") {
    factory();
  } else {
    var mod = {
      exports: {}
    };
    factory();
    global.unknown = mod.exports;
  }
})(this, function () {
  "use strict";

  Function.prototype.$asyncbind = function $asyncbind(self, catcher) {
    "use strict";

    if (!Function.prototype.$asyncbind) {
      Object.defineProperty(Function.prototype, "$asyncbind", {
        value: $asyncbind,
        enumerable: false,
        configurable: true,
        writable: true
      });
    }

    if (!$asyncbind.trampoline) {
      $asyncbind.trampoline = function trampoline(t, x, s, e, u) {
        return function b(q) {
          while (q) {
            if (q.then) {
              q = q.then(b, e);
              return u ? undefined : q;
            }

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? x.call(t) : q;
                q = s;
              } else q = q.call(t);
            } catch (r) {
              return e(r);
            }
          }
        };
      };
    }

    if (!$asyncbind.LazyThenable) {
      $asyncbind.LazyThenable = function () {
        function isThenable(obj) {
          return obj && obj instanceof Object && typeof obj.then === "function";
        }

        function resolution(p, r, how) {
          try {
            var x = how ? how(r) : r;
            if (p === x) return p.reject(new TypeError("Promise resolution loop"));

            if (isThenable(x)) {
              x.then(function (y) {
                resolution(p, y);
              }, function (e) {
                p.reject(e);
              });
            } else {
              p.resolve(x);
            }
          } catch (ex) {
            p.reject(ex);
          }
        }

        function _unchained(v) {}

        function thenChain(res, rej) {
          this.resolve = res;
          this.reject = rej;
        }

        function Chained() {}

        ;
        Chained.prototype = {
          resolve: _unchained,
          reject: _unchained,
          then: thenChain
        };

        function then(res, rej) {
          var chain = new Chained();

          try {
            this._resolver(function (value) {
              return isThenable(value) ? value.then(res, rej) : resolution(chain, value, res);
            }, function (ex) {
              resolution(chain, ex, rej);
            });
          } catch (ex) {
            resolution(chain, ex, rej);
          }

          return chain;
        }

        function Thenable(resolver) {
          this._resolver = resolver;
          this.then = then;
        }

        ;

        Thenable.resolve = function (v) {
          return Thenable.isThenable(v) ? v : {
            then: function then(resolve) {
              return resolve(v);
            }
          };
        };

        Thenable.isThenable = isThenable;
        return Thenable;
      }();

      $asyncbind.EagerThenable = $asyncbind.Thenable = ($asyncbind.EagerThenableFactory = function (tick) {
        tick = tick || (typeof process === "undefined" ? "undefined" : _typeof(process)) === "object" && process.nextTick || typeof setImmediate === "function" && setImmediate || function (f) {
          setTimeout(f, 0);
        };

        var soon = function () {
          var fq = [],
              fqStart = 0,
              bufferSize = 1024;

          function callQueue() {
            while (fq.length - fqStart) {
              try {
                fq[fqStart]();
              } catch (ex) {}

              fq[fqStart++] = undefined;

              if (fqStart === bufferSize) {
                fq.splice(0, bufferSize);
                fqStart = 0;
              }
            }
          }

          return function (fn) {
            fq.push(fn);
            if (fq.length - fqStart === 1) tick(callQueue);
          };
        }();

        function Zousan(func) {
          if (func) {
            var me = this;
            func(function (arg) {
              me.resolve(arg);
            }, function (arg) {
              me.reject(arg);
            });
          }
        }

        Zousan.prototype = {
          resolve: function resolve(value) {
            if (this.state !== undefined) return;
            if (value === this) return this.reject(new TypeError("Attempt to resolve promise with self"));
            var me = this;

            if (value && (typeof value === "function" || _typeof(value) === "object")) {
              try {
                var first = 0;
                var then = value.then;

                if (typeof then === "function") {
                  then.call(value, function (ra) {
                    if (!first++) {
                      me.resolve(ra);
                    }
                  }, function (rr) {
                    if (!first++) {
                      me.reject(rr);
                    }
                  });
                  return;
                }
              } catch (e) {
                if (!first) this.reject(e);
                return;
              }
            }

            this.state = STATE_FULFILLED;
            this.v = value;
            if (me.c) soon(function () {
              for (var n = 0, l = me.c.length; n < l; n++) {
                STATE_FULFILLED(me.c[n], value);
              }
            });
          },
          reject: function reject(reason) {
            if (this.state !== undefined) return;
            this.state = STATE_REJECTED;
            this.v = reason;
            var clients = this.c;
            if (clients) soon(function () {
              for (var n = 0, l = clients.length; n < l; n++) {
                STATE_REJECTED(clients[n], reason);
              }
            });
          },
          then: function then(onF, onR) {
            var p = new Zousan();
            var client = {
              y: onF,
              n: onR,
              p: p
            };

            if (this.state === undefined) {
              if (this.c) this.c.push(client);else this.c = [client];
            } else {
              var s = this.state,
                  a = this.v;
              soon(function () {
                s(client, a);
              });
            }

            return p;
          }
        };

        function STATE_FULFILLED(c, arg) {
          if (typeof c.y === "function") {
            try {
              var yret = c.y.call(undefined, arg);
              c.p.resolve(yret);
            } catch (err) {
              c.p.reject(err);
            }
          } else c.p.resolve(arg);
        }

        function STATE_REJECTED(c, reason) {
          if (typeof c.n === "function") {
            try {
              var yret = c.n.call(undefined, reason);
              c.p.resolve(yret);
            } catch (err) {
              c.p.reject(err);
            }
          } else c.p.reject(reason);
        }

        Zousan.resolve = function (val) {
          if (val && val instanceof Zousan) return val;
          var z = new Zousan();
          z.resolve(val);
          return z;
        };

        Zousan.reject = function (err) {
          if (err && err instanceof Zousan) return err;
          var z = new Zousan();
          z.reject(err);
          return z;
        };

        Zousan.version = "2.3.3-nodent";
        return Zousan;
      })();
    }

    function boundThen() {
      return resolver.apply(self, arguments);
    }

    var resolver = this;

    switch (catcher) {
      case true:
        return new $asyncbind.Thenable(boundThen);

      case 0:
        return new $asyncbind.LazyThenable(boundThen);

      case undefined:
        boundThen.then = boundThen;
        return boundThen;

      default:
        return function () {
          try {
            return resolver.apply(self, arguments);
          } catch (ex) {
            return catcher(ex);
          }
        };
    }
  };

  function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

  function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

  function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

  function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  var Oxe = function () {
    'use strict';

    var Observer = {
      splice: function splice() {
        var self = this;
        var startIndex = arguments[0];
        var deleteCount = arguments[1];
        var addCount = arguments.length > 2 ? arguments.length - 2 : 0;

        if (typeof startIndex !== 'number' || typeof deleteCount !== 'number') {
          return [];
        }

        if (startIndex < 0) {
          startIndex = self.length + startIndex;
          startIndex = startIndex > 0 ? startIndex : 0;
        } else {
          startIndex = startIndex < self.length ? startIndex : self.length;
        }

        if (deleteCount < 0) {
          deleteCount = 0;
        } else if (deleteCount > self.length - startIndex) {
          deleteCount = self.length - startIndex;
        }

        var totalCount = self.$meta.length;
        var key, index, value, updateCount;
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
              return this.$meta[key];
            }
          },
          $set: {
            value: function value(key, _value) {
              if (_value !== this.$meta[key]) {
                self.defineProperty(this, key);
                this.$meta[key] = self.create(_value, this.$meta.listener, this.$meta.path + key);
                this.$meta.listener(this[key], this.$meta.path + key, key, this);
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
        var key, length;
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
        key: "setup",
        value: function setup(options) {
          options = options || {};
          this.time = options.time || this.time;
        }
      }, {
        key: "tick",
        value: function tick(callback) {
          return window.requestAnimationFrame(callback);
        }
      }, {
        key: "schedule",
        value: function schedule() {
          if (this.pending) return;
          this.pending = true;
          this.tick(this.flush.bind(this, null));
        }
      }, {
        key: "flush",
        value: function flush(time) {
          time = time || performance.now();
          var task;

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
        key: "remove",
        value: function remove(tasks, task) {
          var index = tasks.indexOf(task);
          return !!~index && !!tasks.splice(index, 1);
        }
      }, {
        key: "clear",
        value: function clear(task) {
          return this.remove(this.reads, task) || this.remove(this.writes, task);
        }
      }, {
        key: "batch",
        value: function batch(data) {
          var self = this;

          if (data.read) {
            var read = function read() {
              var result;
              var write;

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
            var write;

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

    function Default(binder) {
      var unrender;

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
          var element;

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
          var element;

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
          var i, l, query, element, elements;

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
        var element = data.scope.querySelector("".concat(data.name).concat(data.query));

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

        for (var i = 0, l = data.attributes.length; i < l; i++) {
          var attribute = data.attributes[i];
          element.setAttribute(attribute.name, attribute.value);
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
        node = node.firstChild;

        while (node) {
          this.walker(node, callback);
          node = node.nextSibling;
        }
      },
      replaceEachVariable: function replaceEachVariable(element, variable, path, key) {
        var self = this;
        var pattern = new RegExp(this.VARIABLE_START + variable + this.VARIABLE_END, 'g');
        self.walker(element, function (node) {
          if (node.nodeType === 3) {
            if (node.nodeValue === "$".concat(variable) || node.nodeValue === '$index') {
              node.nodeValue = key;
            }
          } else if (node.nodeType === 1) {
            for (var i = 0, l = node.attributes.length; i < l; i++) {
              var attribute = node.attributes[i];

              if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {
                attribute.value = attribute.value.replace(pattern, "$1".concat(path, ".").concat(key));
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
        key: "get",
        value: function get(path) {
          return Utility.getByPath(this.data, path);
        }
      }, {
        key: "set",
        value: function set(path, data) {
          return Utility.setByPath(this.data, path, data);
        }
      }]);

      return Methods;
    }();

    var Methods$1 = new Methods();

    function Class$1(binder) {
      var data, name;
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
      var data;
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
      var render;

      if (binder.type in this) {
        render = this[binder.type](binder);
      } else {
        var data;
        render = {
          read: function read() {
            data = Model$1.get(binder.keys);
            data = Binder$1.piper(binder, data);

            if (data === undefined || data === null) {
              Model$1.set(binder.keys, '');
              return false;
            } else if (_typeof(data) === 'object') {
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
      var data;
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
          data,
          add,
          remove;
      return {
        read: function read() {
          data = Model$1.get(binder.keys);
          data = Binder$1.piper(binder, data);
          if (!data || _typeof(data) !== 'object') return false;
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
      var data;
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
      var data;
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
      var data;
      return {
        read: function read() {
          data = Model$1.get(binder.keys);
          data = Binder$1.piper(binder, data);

          if (data === undefined || data === null) {
            Model$1.set(binder.keys, '');
            return false;
          } else if (_typeof(data) === 'object') {
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
      var data;
      return {
        write: function write() {
          data = Methods$1.get(binder.keys);

          if (typeof data !== 'function') {
            console.warn("Oxe - attribute o-on=\"".concat(binder.keys.join('.'), "\" invalid type function required"));
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
      var data;
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
      var data;
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
      var data;
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
      var data;
      return {
        read: function read() {
          data = Model$1.get(binder.keys);
          data = Binder$1.piper(binder, data);

          if (data === undefined || data === null) {
            Model$1.set(binder.keys, '');
            return false;
          } else if (_typeof(data) === 'object') {
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
      var data, multiple;

      if (name === 'SELECT') {
        var elements;
        return {
          read: function read() {
            data = Model$1.get(binder.keys);
            data = Binder$1.piper(binder, data);
            elements = binder.element.options;
            multiple = binder.element.multiple;

            if (multiple && data.constructor !== Array) {
              throw new Error("Oxe - invalid multiple select value type ".concat(binder.keys.join('.'), " array required"));
            }

            if (multiple) return false;
          },
          write: function write() {
            var index = 0;
            var selected = false;

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
        var _elements;

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
      var data;
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
        key: "create",
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
        key: "get",
        value: function get(data) {
          var binder;

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
        key: "add",
        value: function add(binder) {
          if (!this.elements.has(binder.element)) {
            this.elements.set(binder.element, new Map());
          }

          if (!this.elements.get(binder.element).has(binder.names[0])) {
            this.elements.get(binder.element).set(binder.names[0], binder);
          } else {
            return false;
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
        key: "remove",
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
        key: "each",
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
        key: "piper",
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
              throw new Error("Oxe - pipe method ".concat(method, " not found in scope ").concat(binder.scope));
            }
          }

          return data;
        }
      }, {
        key: "skipChildren",
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
        key: "eachElement",
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
        key: "eachAttribute",
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
        key: "unbind",
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
        key: "bind",
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
        key: "traverse",
        value: function traverse(type, keys, value) {
          var result;

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
        key: "get",
        value: function get(keys) {
          return this.traverse(this.GET, keys);
        }
      }, {
        key: "remove",
        value: function remove(keys) {
          return this.traverse(this.REMOVE, keys);
        }
      }, {
        key: "set",
        value: function set(keys, value) {
          return this.traverse(this.SET, keys, value);
        }
      }, {
        key: "listener",
        value: function listener(data, path, type) {
          var method = data === undefined ? Unrender$1 : Render;

          if (type === 'length') {
            var scope = path.split('.').slice(0, 1).join('.');
            var part = path.split('.').slice(1).join('.');
            if (!(scope in Binder$1.data)) return;
            if (!(part in Binder$1.data[scope])) return;
            if (!(0 in Binder$1.data[scope][part])) return;
            var binder = Binder$1.data[scope][part][0];
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

    function Update(_x, _x2) {
      return _Update.apply(this, arguments);
    }

    function _Update() {
      _Update = _asyncToGenerator(regeneratorRuntime.mark(function _callee28(element, attribute) {
        var binder, read;
        return regeneratorRuntime.wrap(function _callee28$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                if (element) {
                  _context28.next = 2;
                  break;
                }

                throw new Error('Oxe - requires element argument');

              case 2:
                if (attribute) {
                  _context28.next = 4;
                  break;
                }

                throw new Error('Oxe - requires attribute argument');

              case 4:
                binder = Binder$1.elements.get(element).get(attribute);

                read = function read() {
                  var type = binder.element.type;
                  var name = binder.element.nodeName;
                  var data;

                  if (name === 'SELECT') {
                    var elements = binder.element.options;
                    var multiple = binder.element.multiple;
                    var selected = false;
                    data = multiple ? [] : '';

                    for (var i = 0, l = elements.length; i < l; i++) {
                      var _element = elements[i];

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

                    if (data && _typeof(data) === 'object' && data.constructor === original.constructor) {
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

                Batcher$1.batch({
                  read: read
                });

              case 7:
              case "end":
                return _context28.stop();
            }
          }
        }, _callee28, this);
      }));
      return _Update.apply(this, arguments);
    }

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
        key: "setup",
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
        key: "serialize",
        value: function () {
          var _serialize = _asyncToGenerator(regeneratorRuntime.mark(function _callee(data) {
            var query, name;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    query = '';

                    for (name in data) {
                      query = query.length > 0 ? query + '&' : query;
                      query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
                    }

                    return _context.abrupt("return", query);

                  case 3:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          function serialize(_x3) {
            return _serialize.apply(this, arguments);
          }

          return serialize;
        }()
      }, {
        key: "fetch",
        value: function () {
          var _fetch = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(options) {
            var data, copy, result, fetchOptions, fetched, _copy, _result;

            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    data = Object.assign({}, options);
                    data.path = data.path || this.path;
                    data.origin = data.origin || this.origin;
                    if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
                    if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length - 1) === '/') data.origin = data.origin.slice(0, -1);
                    if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;

                    if (data.url) {
                      _context2.next = 8;
                      break;
                    }

                    throw new Error('Oxe.fetcher - requires url or origin and path option');

                  case 8:
                    if (data.method) {
                      _context2.next = 10;
                      break;
                    }

                    throw new Error('Oxe.fetcher - requires method option');

                  case 10:
                    if (!data.head && this.head) data.head = this.head;
                    if (typeof data.method === 'string') data.method = data.method.toUpperCase() || this.method;
                    if (!data.acceptType && this.acceptType) data.acceptType = this.acceptType;
                    if (!data.contentType && this.contentType) data.contentType = this.contentType;
                    if (!data.responseType && this.responseType) data.responseType = this.responseType;
                    if (!data.credentials && this.credentials) data.credentials = this.credentials;
                    if (!data.mode && this.mode) data.mode = this.mode;
                    if (!data.cache && this.cache) data.cahce = this.cache;
                    if (!data.redirect && this.redirect) data.redirect = this.redirect;
                    if (!data.referrer && this.referrer) data.referrer = this.referrer;
                    if (!data.referrerPolicy && this.referrerPolicy) data.referrerPolicy = this.referrerPolicy;
                    if (!data.signal && this.signal) data.signal = this.signal;
                    if (!data.integrity && this.integrity) data.integrity = this.integrity;
                    if (!data.keepAlive && this.keepAlive) data.keepAlive = this.keepAlive;

                    if (!data.contentType) {
                      _context2.next = 38;
                      break;
                    }

                    data.head = data.head || {};
                    _context2.t0 = data.contentType;
                    _context2.next = _context2.t0 === 'js' ? 29 : _context2.t0 === 'xml' ? 31 : _context2.t0 === 'html' ? 33 : _context2.t0 === 'json' ? 35 : 37;
                    break;

                  case 29:
                    data.head['Content-Type'] = this.mime.js;
                    return _context2.abrupt("break", 38);

                  case 31:
                    data.head['Content-Type'] = this.mime.xml;
                    return _context2.abrupt("break", 38);

                  case 33:
                    data.head['Content-Type'] = this.mime.html;
                    return _context2.abrupt("break", 38);

                  case 35:
                    data.head['Content-Type'] = this.mime.json;
                    return _context2.abrupt("break", 38);

                  case 37:
                    data.head['Content-Type'] = data.contentType;

                  case 38:
                    if (!data.acceptType) {
                      _context2.next = 52;
                      break;
                    }

                    data.head = data.head || {};
                    _context2.t1 = data.acceptType;
                    _context2.next = _context2.t1 === 'js' ? 43 : _context2.t1 === 'xml' ? 45 : _context2.t1 === 'html' ? 47 : _context2.t1 === 'json' ? 49 : 51;
                    break;

                  case 43:
                    data.head['Accept'] = this.mime.js;
                    return _context2.abrupt("break", 52);

                  case 45:
                    data.head['Accept'] = this.mime.xml;
                    return _context2.abrupt("break", 52);

                  case 47:
                    data.head['Accept'] = this.mime.html;
                    return _context2.abrupt("break", 52);

                  case 49:
                    data.head['Accept'] = this.mime.json;
                    return _context2.abrupt("break", 52);

                  case 51:
                    data.head['Accept'] = data.acceptType;

                  case 52:
                    if (!(typeof this.request === 'function')) {
                      _context2.next = 60;
                      break;
                    }

                    copy = Object.assign({}, data);
                    _context2.next = 56;
                    return this.request(copy);

                  case 56:
                    result = _context2.sent;

                    if (!(result === false)) {
                      _context2.next = 59;
                      break;
                    }

                    return _context2.abrupt("return", data);

                  case 59:
                    if (_typeof(result) === 'object') {
                      Object.assign(data, result);
                    }

                  case 60:
                    if (!data.body) {
                      _context2.next = 70;
                      break;
                    }

                    if (!(data.method === 'GET')) {
                      _context2.next = 69;
                      break;
                    }

                    _context2.t2 = data.url + '?';
                    _context2.next = 65;
                    return this.serialize(data.body);

                  case 65:
                    _context2.t3 = _context2.sent;
                    data.url = _context2.t2 + _context2.t3;
                    _context2.next = 70;
                    break;

                  case 69:
                    if (data.contentType === 'json') {
                      data.body = JSON.stringify(data.body);
                    }

                  case 70:
                    fetchOptions = Object.assign({}, data);

                    if (fetchOptions.head) {
                      fetchOptions.headers = fetchOptions.head;
                      delete fetchOptions.head;
                    }

                    _context2.next = 74;
                    return window.fetch(data.url, fetchOptions);

                  case 74:
                    fetched = _context2.sent;
                    data.code = fetched.status;
                    data.message = fetched.statusText;

                    if (data.responseType) {
                      _context2.next = 81;
                      break;
                    }

                    data.body = fetched.body;
                    _context2.next = 84;
                    break;

                  case 81:
                    _context2.next = 83;
                    return fetched[data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType]();

                  case 83:
                    data.body = _context2.sent;

                  case 84:
                    if (!this.response) {
                      _context2.next = 92;
                      break;
                    }

                    _copy = Object.assign({}, data);
                    _context2.next = 88;
                    return this.response(_copy);

                  case 88:
                    _result = _context2.sent;

                    if (!(_result === false)) {
                      _context2.next = 91;
                      break;
                    }

                    return _context2.abrupt("return", data);

                  case 91:
                    if (_typeof(_result) === 'object') {
                      Object.assign(data, _result);
                    }

                  case 92:
                    return _context2.abrupt("return", data);

                  case 93:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));

          function fetch(_x4) {
            return _fetch.apply(this, arguments);
          }

          return fetch;
        }()
      }, {
        key: "post",
        value: function () {
          var _post = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(data) {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    data.method = 'post';
                    return _context3.abrupt("return", this.fetch(data));

                  case 2:
                  case "end":
                    return _context3.stop();
                }
              }
            }, _callee3, this);
          }));

          function post(_x5) {
            return _post.apply(this, arguments);
          }

          return post;
        }()
      }, {
        key: "get",
        value: function () {
          var _get = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(data) {
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    data.method = 'get';
                    return _context4.abrupt("return", this.fetch(data));

                  case 2:
                  case "end":
                    return _context4.stop();
                }
              }
            }, _callee4, this);
          }));

          function get(_x6) {
            return _get.apply(this, arguments);
          }

          return get;
        }()
      }, {
        key: "put",
        value: function () {
          var _put = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(data) {
            return regeneratorRuntime.wrap(function _callee5$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    data.method = 'put';
                    return _context5.abrupt("return", this.fetch(data));

                  case 2:
                  case "end":
                    return _context5.stop();
                }
              }
            }, _callee5, this);
          }));

          function put(_x7) {
            return _put.apply(this, arguments);
          }

          return put;
        }()
      }, {
        key: "head",
        value: function () {
          var _head = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(data) {
            return regeneratorRuntime.wrap(function _callee6$(_context6) {
              while (1) {
                switch (_context6.prev = _context6.next) {
                  case 0:
                    data.method = 'head';
                    return _context6.abrupt("return", this.fetch(data));

                  case 2:
                  case "end":
                    return _context6.stop();
                }
              }
            }, _callee6, this);
          }));

          function head(_x8) {
            return _head.apply(this, arguments);
          }

          return head;
        }()
      }, {
        key: "patch",
        value: function () {
          var _patch = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(data) {
            return regeneratorRuntime.wrap(function _callee7$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    data.method = 'patch';
                    return _context7.abrupt("return", this.fetch(data));

                  case 2:
                  case "end":
                    return _context7.stop();
                }
              }
            }, _callee7, this);
          }));

          function patch(_x9) {
            return _patch.apply(this, arguments);
          }

          return patch;
        }()
      }, {
        key: "delete",
        value: function () {
          var _delete2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(data) {
            return regeneratorRuntime.wrap(function _callee8$(_context8) {
              while (1) {
                switch (_context8.prev = _context8.next) {
                  case 0:
                    data.method = 'delete';
                    return _context8.abrupt("return", this.fetch(data));

                  case 2:
                  case "end":
                    return _context8.stop();
                }
              }
            }, _callee8, this);
          }));

          function _delete(_x10) {
            return _delete2.apply(this, arguments);
          }

          return _delete;
        }()
      }, {
        key: "options",
        value: function () {
          var _options = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(data) {
            return regeneratorRuntime.wrap(function _callee9$(_context9) {
              while (1) {
                switch (_context9.prev = _context9.next) {
                  case 0:
                    data.method = 'options';
                    return _context9.abrupt("return", this.fetch(data));

                  case 2:
                  case "end":
                    return _context9.stop();
                }
              }
            }, _callee9, this);
          }));

          function options(_x11) {
            return _options.apply(this, arguments);
          }

          return options;
        }()
      }, {
        key: "connect",
        value: function () {
          var _connect = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(data) {
            return regeneratorRuntime.wrap(function _callee10$(_context10) {
              while (1) {
                switch (_context10.prev = _context10.next) {
                  case 0:
                    data.method = 'connect';
                    return _context10.abrupt("return", this.fetch(data));

                  case 2:
                  case "end":
                    return _context10.stop();
                }
              }
            }, _callee10, this);
          }));

          function connect(_x12) {
            return _connect.apply(this, arguments);
          }

          return connect;
        }()
      }]);

      return Fetcher;
    }();

    var Fetcher$1 = new Fetcher();

    function Submit(_x13) {
      return _Submit.apply(this, arguments);
    }

    function _Submit() {
      _Submit = _asyncToGenerator(regeneratorRuntime.mark(function _callee29(event) {
        var element, binder, method, model, data, options, action, enctype, result;
        return regeneratorRuntime.wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                element = event.target;
                binder = Binder$1.elements.get(element).get('submit');
                method = Methods$1.get(binder.keys);
                model = Model$1.get(binder.scope);
                data = Utility.formData(element, model);
                _context29.next = 7;
                return method.call(binder.container, data, event);

              case 7:
                options = _context29.sent;

                if (!(_typeof(options) === 'object')) {
                  _context29.next = 21;
                  break;
                }

                action = element.getAttribute('o-action');
                method = element.getAttribute('o-method');
                enctype = element.getAttribute('o-enctype');
                options.url = options.url || action;
                options.method = options.method || method;
                options.contentType = options.contentType || enctype;
                _context29.next = 17;
                return Fetcher$1.fetch(options);

              case 17:
                result = _context29.sent;

                if (!options.handler) {
                  _context29.next = 21;
                  break;
                }

                _context29.next = 21;
                return options.handler(result);

              case 21:
                if (element.hasAttribute('o-reset') || _typeof(options) === 'object' && options.reset) {
                  element.reset();
                }

              case 22:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee29, this);
      }));
      return _Submit.apply(this, arguments);
    }

    function Input(event) {
      if (event.target.type !== 'checkbox' && event.target.type !== 'radio' && event.target.type !== 'option' && event.target.nodeName !== 'SELECT' && event.target.hasAttribute('o-value')) {
        Promise.resolve().then(function () {
          return Update(event.target, 'value');
        }).catch(console.error);
      }
    }

    function Reset(_x14) {
      return _Reset.apply(this, arguments);
    }

    function _Reset() {
      _Reset = _asyncToGenerator(regeneratorRuntime.mark(function _callee30(event) {
        var element, binder, model;
        return regeneratorRuntime.wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                element = event.target;
                binder = Binder$1.elements.get(element).get('submit');
                model = Model$1.get(binder.scope);
                Utility.formReset(element, model);

              case 4:
              case "end":
                return _context30.stop();
            }
          }
        }, _callee30, this);
      }));
      return _Reset.apply(this, arguments);
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
    var Transformer = {
      innerHandler: function innerHandler(char, index, string) {
        if (string[index - 1] === '\\') return;
        if (char === '\'') return '\\\'';
        if (char === '\"') return '\\"';
        if (char === '\t') return '\\t';
        if (char === '\r') return '\\r';
        if (char === '\n') return '\\n';
        if (char === '\w') return '\\w';
        if (char === '\b') return '\\b';
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
        var value;
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
      patterns: {
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
        key: "on",
        value: function on(name, method) {
          if (!(name in this.events)) {
            this.events[name] = [];
          }

          this.events[name].push(method);
        }
      }, {
        key: "off",
        value: function off(name, method) {
          if (name in this.events) {
            var _index2 = this.events[name].indexOf(method);

            if (_index2 !== -1) {
              this.events[name].splice(_index2, 1);
            }
          }
        }
      }, {
        key: "emit",
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
        var _this;

        _classCallCheck(this, Loader);

        _this = _possibleConstructorReturn(this, _getPrototypeOf(Loader).call(this));
        _this.data = {};
        _this.ran = false;
        _this.methods = {};
        _this.transformers = {};
        return _this;
      }

      _createClass(Loader, [{
        key: "setup",
        value: function () {
          var _setup = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(options) {
            var self;
            return regeneratorRuntime.wrap(function _callee11$(_context11) {
              while (1) {
                switch (_context11.prev = _context11.next) {
                  case 0:
                    self = this;
                    options = options || {};
                    self.methods = options.methods || self.methods;
                    self.transformers = options.transformers || self.transformers;

                    if (!options.loads) {
                      _context11.next = 6;
                      break;
                    }

                    return _context11.abrupt("return", Promise.all(options.loads.map(function (load) {
                      return self.load(load);
                    })));

                  case 6:
                  case "end":
                    return _context11.stop();
                }
              }
            }, _callee11, this);
          }));

          function setup(_x15) {
            return _setup.apply(this, arguments);
          }

          return setup;
        }()
      }, {
        key: "execute",
        value: function () {
          var _execute = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(data) {
            var text, code;
            return regeneratorRuntime.wrap(function _callee12$(_context12) {
              while (1) {
                switch (_context12.prev = _context12.next) {
                  case 0:
                    text = '\'use strict\';\n\n' + (data.ast ? data.ast.cooked : data.text);
                    code = new Function('$LOADER', 'window', text);
                    data.result = code(this, window);

                  case 3:
                  case "end":
                    return _context12.stop();
                }
              }
            }, _callee12, this);
          }));

          function execute(_x16) {
            return _execute.apply(this, arguments);
          }

          return execute;
        }()
      }, {
        key: "transform",
        value: function () {
          var _transform = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(data) {
            var self;
            return regeneratorRuntime.wrap(function _callee13$(_context13) {
              while (1) {
                switch (_context13.prev = _context13.next) {
                  case 0:
                    self = this;

                    if (data.transformer === 'es' || data.transformer === 'est') {
                      data.text = Transformer.template(data.text);
                    }

                    if (data.transformer === 'es' || data.transformer === 'esm') {
                      data.ast = Transformer.ast(data);
                    }

                    if (!(data.ast && data.ast.imports.length)) {
                      _context13.next = 5;
                      break;
                    }

                    return _context13.abrupt("return", Promise.all(data.ast.imports.map(function (imp) {
                      return self.load({
                        url: imp.url,
                        method: data.method,
                        transformer: data.transformer
                      });
                    })));

                  case 5:
                  case "end":
                    return _context13.stop();
                }
              }
            }, _callee13, this);
          }));

          function transform(_x17) {
            return _transform.apply(this, arguments);
          }

          return transform;
        }()
      }, {
        key: "fetch",
        value: function () {
          var _fetch2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee14(data) {
            var result;
            return regeneratorRuntime.wrap(function _callee14$(_context14) {
              while (1) {
                switch (_context14.prev = _context14.next) {
                  case 0:
                    _context14.next = 2;
                    return window.fetch(data.url);

                  case 2:
                    result = _context14.sent;

                    if (!(result.status >= 200 && result.status < 300 || result.status == 304)) {
                      _context14.next = 9;
                      break;
                    }

                    _context14.next = 6;
                    return result.text();

                  case 6:
                    data.text = _context14.sent;
                    _context14.next = 10;
                    break;

                  case 9:
                    throw new Error(result.statusText);

                  case 10:
                  case "end":
                    return _context14.stop();
                }
              }
            }, _callee14, this);
          }));

          function fetch(_x18) {
            return _fetch2.apply(this, arguments);
          }

          return fetch;
        }()
      }, {
        key: "attach",
        value: function () {
          var _attach = _asyncToGenerator(regeneratorRuntime.mark(function _callee15(data) {
            return regeneratorRuntime.wrap(function _callee15$(_context15) {
              while (1) {
                switch (_context15.prev = _context15.next) {
                  case 0:
                    return _context15.abrupt("return", new Promise(function (resolve, reject) {
                      var element = document.createElement(data.tag);

                      for (var name in data.attributes) {
                        element.setAttribute(name, data.attributes[name]);
                      }

                      element.onload = resolve;
                      element.onerror = reject;
                      document.head.appendChild(element);
                    }));

                  case 1:
                  case "end":
                    return _context15.stop();
                }
              }
            }, _callee15, this);
          }));

          function attach(_x19) {
            return _attach.apply(this, arguments);
          }

          return attach;
        }()
      }, {
        key: "js",
        value: function () {
          var _js = _asyncToGenerator(regeneratorRuntime.mark(function _callee16(data) {
            return regeneratorRuntime.wrap(function _callee16$(_context16) {
              while (1) {
                switch (_context16.prev = _context16.next) {
                  case 0:
                    if (!(data.method === 'fetch' || data.transformer === 'es' || data.transformer === 'est' || data.transformer === 'esm')) {
                      _context16.next = 9;
                      break;
                    }

                    _context16.next = 3;
                    return this.fetch(data);

                  case 3:
                    if (!data.transformer) {
                      _context16.next = 6;
                      break;
                    }

                    _context16.next = 6;
                    return this.transform(data);

                  case 6:
                    _context16.next = 8;
                    return this.execute(data);

                  case 8:
                    return _context16.abrupt("return", _context16.sent);

                  case 9:
                    if (!(data.method === 'script')) {
                      _context16.next = 13;
                      break;
                    }

                    _context16.next = 12;
                    return this.attach({
                      tag: 'script',
                      attributes: {
                        src: data.url,
                        type: 'text/javascript'
                      }
                    });

                  case 12:
                    return _context16.abrupt("return", _context16.sent);

                  case 13:
                    _context16.next = 15;
                    return this.attach({
                      tag: 'script',
                      attributes: {
                        src: data.url,
                        type: 'module'
                      }
                    });

                  case 15:
                  case "end":
                    return _context16.stop();
                }
              }
            }, _callee16, this);
          }));

          function js(_x20) {
            return _js.apply(this, arguments);
          }

          return js;
        }()
      }, {
        key: "css",
        value: function () {
          var _css = _asyncToGenerator(regeneratorRuntime.mark(function _callee17(data) {
            return regeneratorRuntime.wrap(function _callee17$(_context17) {
              while (1) {
                switch (_context17.prev = _context17.next) {
                  case 0:
                    if (!(data.method === 'fetch')) {
                      _context17.next = 5;
                      break;
                    }

                    _context17.next = 3;
                    return this.fetch(data);

                  case 3:
                    _context17.next = 7;
                    break;

                  case 5:
                    _context17.next = 7;
                    return this.attach({
                      tag: 'link',
                      attributes: {
                        href: data.url,
                        type: 'text/css',
                        rel: 'stylesheet'
                      }
                    });

                  case 7:
                  case "end":
                    return _context17.stop();
                }
              }
            }, _callee17, this);
          }));

          function css(_x21) {
            return _css.apply(this, arguments);
          }

          return css;
        }()
      }, {
        key: "load",
        value: function () {
          var _load = _asyncToGenerator(regeneratorRuntime.mark(function _callee18(data) {
            return regeneratorRuntime.wrap(function _callee18$(_context18) {
              while (1) {
                switch (_context18.prev = _context18.next) {
                  case 0:
                    if (typeof data === 'string') {
                      data = {
                        url: data
                      };
                    }

                    data.url = Path.resolve(data.url);

                    if (!(data.url in this.data)) {
                      _context18.next = 6;
                      break;
                    }

                    _context18.next = 5;
                    return this.data[data.url].promise();

                  case 5:
                    return _context18.abrupt("return", this.data[data.url].result);

                  case 6:
                    this.data[data.url] = data;
                    data.extension = data.extension || Path.extension(data.url);
                    data.method = data.method || this.methods[data.extension];
                    data.transformer = data.transformer || this.transformers[data.extension];

                    if (data.extension === 'js') {
                      data.promise = this.js.bind(this, data);
                    } else if (data.extension === 'css') {
                      data.promise = this.css.bind(this, data);
                    } else {
                      data.promise = this.fetch.bind(this, data);
                    }

                    _context18.next = 13;
                    return data.promise();

                  case 13:
                    return _context18.abrupt("return", data.result);

                  case 14:
                  case "end":
                    return _context18.stop();
                }
              }
            }, _callee18, this);
          }));

          function load(_x22) {
            return _load.apply(this, arguments);
          }

          return load;
        }()
      }]);

      return Loader;
    }(Events);

    var Loader$1 = new Loader();

    var Component = function () {
      function Component() {
        _classCallCheck(this, Component);

        this.data = {};
        this.compiled = false;
      }

      _createClass(Component, [{
        key: "setup",
        value: function setup(options) {
          options = options || {};

          if (options.components && options.components.length) {
            for (var i = 0, l = options.components.length; i < l; i++) {
              this.define(options.components[i]);
            }
          }
        }
      }, {
        key: "renderSlot",
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
      }, {
        key: "renderStyle",
        value: function renderStyle(style, scope) {
          if (!style) return '';

          if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
            var matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

            for (var i = 0, l = matches.length; i < l; i++) {
              var match = matches[i];
              var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
              var pattern = new RegExp('var\\(' + rule[1] + '\\)', 'g');
              style = style.replace(rule[0], '');
              style = style.replace(pattern, rule[2]);
            }
          }

          if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':scope')) {
            style = style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
          }

          if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':host')) {
            style = style.replace(/\:host/g, '[o-scope="' + scope + '"]');
          }

          return '<style type="text/css">' + style + '</style>';
        }
      }, {
        key: "render",
        value: function render(element, options) {
          var self = this;
          element.setAttribute('o-scope', element.scope);

          if (self.compiled && element.parentElement.nodeName === 'O-ROUTER') {
            Binder$1.bind(element, element, element.scope);
          } else {
            var template = document.createElement('template');
            var style = self.renderStyle(options.style, element.scope);

            if (typeof options.template === 'string') {
              template.innerHTML = style + options.template;
            } else {
              template.innerHTML = style;
              template.appendChild(options.template);
            }

            var clone = document.importNode(template.content, true);
            Binder$1.bind(clone, element, element.scope);

            if (options.shadow) {
              if ('attachShadow' in document.body) {
                element.attachShadow({
                  mode: 'open'
                }).appendChild(clone);
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
        key: "define",
        value: function define(options) {
          var self = this;
          if (!options.name) throw new Error('Oxe.component.define - requires name');
          if (options.name in self.data) throw new Error('Oxe.component.define - component previously defined');
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
            var instance = window.Reflect.construct(HTMLElement, [], this.constructor);
            options.properties.created = {
              value: false,
              enumerable: true,
              configurable: true
            };
            options.properties.scope = {
              enumerable: true,
              value: options.name + '-' + options.count++
            };
            options.properties.model = {
              enumerable: true,
              get: function get() {
                return Model$1.get(this.scope);
              },
              set: function set(data) {
                data = data && _typeof(data) === 'object' ? data : {};
                return Model$1.set(this.scope, data);
              }
            };
            options.properties.methods = {
              enumerable: true,
              get: function get() {
                return Methods$1.get(this.scope);
              }
            };
            Object.defineProperties(instance, options.properties);
            Model$1.set(instance.scope, options.model);
            Methods$1.set(instance.scope, options.methods);
            return instance;
          };

          options.construct.prototype.attributeChangedCallback = function () {
            if (options.attributed) options.attributed.apply(this, arguments);
          };

          options.construct.prototype.adoptedCallback = function () {
            if (options.adopted) options.adopted.call(this);
          };

          options.construct.prototype.connectedCallback = function () {
            if (!this.created) {
              self.render(this, options);
              Object.defineProperty(this, 'created', {
                value: true,
                enumerable: true,
                configurable: false
              });

              if (options.created) {
                options.created.call(this);
              }
            }

            if (options.attached) {
              options.attached.call(this);
            }
          };

          options.construct.prototype.disconnectedCallback = function () {
            if (options.detached) {
              options.detached.call(this);
            }
          };

          Object.setPrototypeOf(options.construct.prototype, HTMLElement.prototype);
          Object.setPrototypeOf(options.construct, HTMLElement);
          window.customElements.define(options.name, options.construct);
        }
      }]);

      return Component;
    }();

    var Component$1 = new Component();

    var Router = function (_Events2) {
      _inherits(Router, _Events2);

      function Router() {
        var _this2;

        _classCallCheck(this, Router);

        _this2 = _possibleConstructorReturn(this, _getPrototypeOf(Router).call(this));
        _this2.data = [];
        _this2.ran = false;
        _this2.location = {};
        _this2.mode = 'push';
        _this2.element = null;
        _this2.contain = false;
        _this2.folder = './routes';
        _this2.parser = document.createElement('a');
        return _this2;
      }

      _createClass(Router, [{
        key: "isPath",
        value: function isPath(routePath, userPath) {
          userPath = userPath || '/';

          if (routePath === 'index' || routePath === '/index') {
            routePath = '/';
          }

          if (userPath === 'index' || userPath === '/index') {
            userPath = '/';
          }

          if (routePath.slice(0, 1) !== '/') {
            routePath = Path.resolve(routePath);
          }

          if (userPath.constructor === String) {
            var userParts = userPath.split('/');
            var routeParts = routePath.split('/');

            for (var i = 0, l = routeParts.length; i < l; i++) {
              if (routeParts[i].indexOf('{') === 0 && routeParts[i].indexOf('}') === routeParts[i].length - 1) {
                continue;
              } else if (routeParts[i] !== userParts[i]) {
                return false;
              }
            }

            return true;
          }

          if (userPath.constructor === RegExp) {
            return userPath.test(routePath);
          }
        }
      }, {
        key: "toParameterObject",
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
        key: "toQueryString",
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
        key: "toQueryObject",
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
        key: "toLocationObject",
        value: function toLocationObject(href) {
          var location = {};
          this.parser.href = href;
          location.href = this.parser.href;
          location.host = this.parser.host;
          location.port = this.parser.port;
          location.hash = this.parser.hash;
          location.search = this.parser.search;
          location.protocol = this.parser.protocol;
          location.hostname = this.parser.hostname;
          location.pathname = this.parser.pathname[0] === '/' ? this.parser.pathname : '/' + this.parser.pathname;
          location.path = location.pathname + location.search + location.hash;
          return location;
        }
      }, {
        key: "scroll",
        value: function scroll(x, y) {
          window.scroll(x, y);
        }
      }, {
        key: "back",
        value: function back() {
          window.history.back();
        }
      }, {
        key: "forward",
        value: function forward() {
          window.history.forward();
        }
      }, {
        key: "redirect",
        value: function redirect(path) {
          window.location.href = path;
        }
      }, {
        key: "setup",
        value: function () {
          var _setup2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee19(options) {
            return regeneratorRuntime.wrap(function _callee19$(_context19) {
              while (1) {
                switch (_context19.prev = _context19.next) {
                  case 0:
                    options = options || {};
                    this.mode = options.mode === undefined ? this.mode : options.mode;
                    this.after = options.after === undefined ? this.after : options.after;
                    this.folder = options.folder === undefined ? this.folder : options.folder;
                    this.before = options.before === undefined ? this.before : options.before;
                    this.change = options.change === undefined ? this.change : options.change;
                    this.element = options.element === undefined ? this.element : options.element;
                    this.contain = options.contain === undefined ? this.contain : options.contain;
                    this.external = options.external === undefined ? this.external : options.external;

                    if (!this.element || typeof this.element === 'string') {
                      this.element = document.body.querySelector(this.element || 'o-router');
                    }

                    if (this.element) {
                      _context19.next = 12;
                      break;
                    }

                    throw new Error('Oxe.router.render - missing o-router element');

                  case 12:
                    _context19.next = 14;
                    return this.add(options.routes);

                  case 14:
                    _context19.next = 16;
                    return this.route(window.location.href, {
                      mode: 'replace'
                    });

                  case 16:
                  case "end":
                    return _context19.stop();
                }
              }
            }, _callee19, this);
          }));

          function setup(_x23) {
            return _setup2.apply(this, arguments);
          }

          return setup;
        }()
      }, {
        key: "load",
        value: function () {
          var _load2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee20(route) {
            var _load3;

            return regeneratorRuntime.wrap(function _callee20$(_context20) {
              while (1) {
                switch (_context20.prev = _context20.next) {
                  case 0:
                    if (!route.load) {
                      _context20.next = 5;
                      break;
                    }

                    _context20.next = 3;
                    return Loader$1.load(route.load);

                  case 3:
                    _load3 = _context20.sent;
                    route = Object.assign({}, _load3, route);

                  case 5:
                    if (route.component) {
                      route.component.route = route;
                    }

                    return _context20.abrupt("return", route);

                  case 7:
                  case "end":
                    return _context20.stop();
                }
              }
            }, _callee20, this);
          }));

          function load(_x24) {
            return _load2.apply(this, arguments);
          }

          return load;
        }()
      }, {
        key: "add",
        value: function () {
          var _add = _asyncToGenerator(regeneratorRuntime.mark(function _callee21(data) {
            var load, i, l;
            return regeneratorRuntime.wrap(function _callee21$(_context21) {
              while (1) {
                switch (_context21.prev = _context21.next) {
                  case 0:
                    if (data) {
                      _context21.next = 4;
                      break;
                    }

                    return _context21.abrupt("return");

                  case 4:
                    if (!(data.constructor === String)) {
                      _context21.next = 9;
                      break;
                    }

                    load = data;
                    this.data.push({
                      path: data,
                      load: this.folder + '/' + load + '.js'
                    });
                    _context21.next = 23;
                    break;

                  case 9:
                    if (!(data.constructor === Object)) {
                      _context21.next = 15;
                      break;
                    }

                    if (data.path) {
                      _context21.next = 12;
                      break;
                    }

                    throw new Error('Oxe.router.add - route path required');

                  case 12:
                    this.data.push(data);
                    _context21.next = 23;
                    break;

                  case 15:
                    if (!(data.constructor === Array)) {
                      _context21.next = 23;
                      break;
                    }

                    i = 0, l = data.length;

                  case 17:
                    if (!(i < l)) {
                      _context21.next = 23;
                      break;
                    }

                    _context21.next = 20;
                    return this.add(data[i]);

                  case 20:
                    i++;
                    _context21.next = 17;
                    break;

                  case 23:
                  case "end":
                    return _context21.stop();
                }
              }
            }, _callee21, this);
          }));

          function add(_x25) {
            return _add.apply(this, arguments);
          }

          return add;
        }()
      }, {
        key: "remove",
        value: function () {
          var _remove = _asyncToGenerator(regeneratorRuntime.mark(function _callee22(path) {
            var i, l;
            return regeneratorRuntime.wrap(function _callee22$(_context22) {
              while (1) {
                switch (_context22.prev = _context22.next) {
                  case 0:
                    for (i = 0, l = this.data.length; i < l; i++) {
                      if (this.data[i].path === path) {
                        this.data.splice(i, 1);
                      }
                    }

                  case 1:
                  case "end":
                    return _context22.stop();
                }
              }
            }, _callee22, this);
          }));

          function remove(_x26) {
            return _remove.apply(this, arguments);
          }

          return remove;
        }()
      }, {
        key: "get",
        value: function () {
          var _get2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee23(path) {
            var i, l;
            return regeneratorRuntime.wrap(function _callee23$(_context23) {
              while (1) {
                switch (_context23.prev = _context23.next) {
                  case 0:
                    i = 0, l = this.data.length;

                  case 1:
                    if (!(i < l)) {
                      _context23.next = 10;
                      break;
                    }

                    if (!(this.data[i].path === path)) {
                      _context23.next = 7;
                      break;
                    }

                    _context23.next = 5;
                    return this.load(this.data[i]);

                  case 5:
                    this.data[i] = _context23.sent;
                    return _context23.abrupt("return", this.data[i]);

                  case 7:
                    i++;
                    _context23.next = 1;
                    break;

                  case 10:
                  case "end":
                    return _context23.stop();
                }
              }
            }, _callee23, this);
          }));

          function get(_x27) {
            return _get2.apply(this, arguments);
          }

          return get;
        }()
      }, {
        key: "find",
        value: function () {
          var _find = _asyncToGenerator(regeneratorRuntime.mark(function _callee24(path) {
            var i, l;
            return regeneratorRuntime.wrap(function _callee24$(_context24) {
              while (1) {
                switch (_context24.prev = _context24.next) {
                  case 0:
                    i = 0, l = this.data.length;

                  case 1:
                    if (!(i < l)) {
                      _context24.next = 10;
                      break;
                    }

                    if (!this.isPath(this.data[i].path, path)) {
                      _context24.next = 7;
                      break;
                    }

                    _context24.next = 5;
                    return this.load(this.data[i]);

                  case 5:
                    this.data[i] = _context24.sent;
                    return _context24.abrupt("return", this.data[i]);

                  case 7:
                    i++;
                    _context24.next = 1;
                    break;

                  case 10:
                  case "end":
                    return _context24.stop();
                }
              }
            }, _callee24, this);
          }));

          function find(_x28) {
            return _find.apply(this, arguments);
          }

          return find;
        }()
      }, {
        key: "render",
        value: function () {
          var _render = _asyncToGenerator(regeneratorRuntime.mark(function _callee25(route) {
            return regeneratorRuntime.wrap(function _callee25$(_context25) {
              while (1) {
                switch (_context25.prev = _context25.next) {
                  case 0:
                    if (route) {
                      _context25.next = 2;
                      break;
                    }

                    throw new Error('Oxe.render - route argument required. Missing object option.');

                  case 2:
                    if (!(!route.component && !route.element)) {
                      _context25.next = 4;
                      break;
                    }

                    throw new Error('Oxe.render - route property required. Missing component or element option.');

                  case 4:
                    if (route.title) {
                      document.title = route.title;
                    }

                    if (route.description) {
                      Utility.ensureElement({
                        name: 'meta',
                        scope: document.head,
                        position: 'afterbegin',
                        query: '[name="description"]',
                        attributes: [{
                          name: 'name',
                          value: 'description'
                        }, {
                          name: 'content',
                          value: route.description
                        }]
                      });
                    }

                    if (route.keywords) {
                      Utility.ensureElement({
                        name: 'meta',
                        scope: document.head,
                        position: 'afterbegin',
                        query: '[name="keywords"]',
                        attributes: [{
                          name: 'name',
                          value: 'keywords'
                        }, {
                          name: 'content',
                          value: route.keywords
                        }]
                      });
                    }

                    if (!route.element) {
                      if (route.component.constructor === String) {
                        route.element = document.createElement(route.component);
                      } else if (route.component.constructor === Object) {
                        Component$1.define(route.component);

                        if (this.mode === 'compiled') {
                          route.element = this.element.firstElementChild;
                        } else {
                          route.element = document.createElement(route.component.name);
                        }
                      }
                    }

                    if (route.element !== this.element.firstElementChild) {
                      while (this.element.firstChild) {
                        this.element.removeChild(this.element.firstChild);
                      }

                      this.element.appendChild(route.element);
                    }

                    this.scroll(0, 0);

                  case 10:
                  case "end":
                    return _context25.stop();
                }
              }
            }, _callee25, this);
          }));

          function render(_x29) {
            return _render.apply(this, arguments);
          }

          return render;
        }()
      }, {
        key: "route",
        value: function () {
          var _route = _asyncToGenerator(regeneratorRuntime.mark(function _callee26(path, options) {
            var mode, location, route;
            return regeneratorRuntime.wrap(function _callee26$(_context26) {
              while (1) {
                switch (_context26.prev = _context26.next) {
                  case 0:
                    options = options || {};

                    if (options.query) {
                      path += this.toQueryString(options.query);
                    }

                    mode = options.mode || this.mode;
                    location = this.toLocationObject(path);
                    _context26.next = 6;
                    return this.find(location.pathname);

                  case 6:
                    route = _context26.sent;

                    if (route) {
                      _context26.next = 9;
                      break;
                    }

                    throw new Error("Oxe.router.route - missing route ".concat(location.pathname));

                  case 9:
                    location.route = route;
                    location.title = location.route.title;
                    location.query = this.toQueryObject(location.search);
                    location.parameters = this.toParameterObject(location.route.path, location.pathname);

                    if (!(location.route && location.route.handler)) {
                      _context26.next = 17;
                      break;
                    }

                    _context26.next = 16;
                    return location.route.handler(location);

                  case 16:
                    return _context26.abrupt("return", _context26.sent);

                  case 17:
                    if (!(location.route && location.route.redirect)) {
                      _context26.next = 19;
                      break;
                    }

                    return _context26.abrupt("return", this.redirect(location.route.redirect));

                  case 19:
                    if (!(typeof this.before === 'function')) {
                      _context26.next = 22;
                      break;
                    }

                    _context26.next = 22;
                    return this.before(location);

                  case 22:
                    this.emit('route:before', location);

                    if (!(mode === 'href' || mode === 'compiled')) {
                      _context26.next = 25;
                      break;
                    }

                    return _context26.abrupt("return", window.location.assign(location.path));

                  case 25:
                    window.history[mode + 'State']({
                      path: location.path
                    }, '', location.path);
                    this.location = location;
                    _context26.next = 29;
                    return this.render(location.route);

                  case 29:
                    if (!(typeof this.after === 'function')) {
                      _context26.next = 32;
                      break;
                    }

                    _context26.next = 32;
                    return this.after(location);

                  case 32:
                    this.emit('route:after', location);

                  case 33:
                  case "end":
                    return _context26.stop();
                }
              }
            }, _callee26, this);
          }));

          function route(_x30, _x31) {
            return _route.apply(this, arguments);
          }

          return route;
        }()
      }]);

      return Router;
    }(Events);

    var Router$1 = new Router();

    function Click(event) {
      if (event.button !== 0 || event.defaultPrevented || event.target.nodeName === 'INPUT' || event.target.nodeName === 'BUTTON' || event.target.nodeName === 'SELECT' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

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

      while (target && 'A' !== target.nodeName) {
        target = target.parentNode;
      }

      if (!target || 'A' !== target.nodeName) {
        return;
      }

      if (target.hasAttribute('download') || target.hasAttribute('external') || target.hasAttribute('o-external') || target.href.indexOf('tel:') === 0 || target.href.indexOf('ftp:') === 0 || target.href.indexOf('file:') === 0 || target.href.indexOf('mailto:') === 0 || target.href.indexOf(window.location.origin) !== 0) return;
      if (Router$1.external && (Router$1.external.constructor === RegExp && Router$1.external.test(target.href) || Router$1.external.constructor === Function && Router$1.external(target.href) || Router$1.external.constructor === String && Router$1.external === target.href)) return;
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
        return Router$1.route(path, {
          mode: 'replace'
        });
      }).catch(console.error);
    }

    var General = function () {
      function General() {
        _classCallCheck(this, General);

        this.compiled = false;
      }

      _createClass(General, [{
        key: "setup",
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
    var tStyle = document.createTextNode("\n\to-router, o-router > :first-child {\n\t\tdisplay: block;\n\t\tanimation: o-transition 150ms ease-in-out;\n\t}\n\t@keyframes o-transition {\n\t\t0% { opacity: 0; }\n\t\t100% { opacity: 1; }\n\t}\n");
    eStyle.setAttribute('type', 'text/css');
    eStyle.appendChild(tStyle);
    document.head.appendChild(eStyle);

    if (!window.Reflect || !window.Reflect.construct) {
      window.Reflect = window.Reflect || {};

      window.Reflect.construct = function (parent, args, child) {
        var target = child === undefined ? parent : child;
        var prototype = target.prototype || Object.prototype;
        var copy = Object.create(prototype);
        return Function.prototype.apply.call(parent, copy, args) || copy;
      };
    }

    var ORouter = function ORouter() {
      return window.Reflect.construct(HTMLElement, [], this.constructor);
    };

    Object.setPrototypeOf(ORouter.prototype, HTMLElement.prototype);
    Object.setPrototypeOf(ORouter, HTMLElement);
    window.customElements.define('o-router', ORouter);
    var oSetup = document.querySelector('script[o-setup]');

    if (oSetup) {
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
        throw new Error('Oxe - script attribute o-setup requires url');
      }

      if (args.length > 1) {
        Loader$1.load({
          url: args[0],
          method: args[2],
          transformer: args[1]
        }).catch(console.error);
      } else {
        var _index3 = document.createElement('script');

        _index3.setAttribute('src', args[0]);

        _index3.setAttribute('async', 'true');

        _index3.setAttribute('type', 'module');

        document.head.appendChild(_index3);
      }
    }

    var Oxe = function () {
      function Oxe() {
        _classCallCheck(this, Oxe);

        this.g = {};
      }

      _createClass(Oxe, [{
        key: "setup",
        value: function () {
          var _setup3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee27(data) {
            return regeneratorRuntime.wrap(function _callee27$(_context27) {
              while (1) {
                switch (_context27.prev = _context27.next) {
                  case 0:
                    if (!this._setup) {
                      _context27.next = 4;
                      break;
                    }

                    return _context27.abrupt("return");

                  case 4:
                    this._setup = true;

                  case 5:
                    data = data || {};
                    data.listener = data.listener || {};
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

                    if (!data.listener.before) {
                      _context27.next = 16;
                      break;
                    }

                    _context27.next = 16;
                    return data.listener.before();

                  case 16:
                    if (data.general) {
                      this.general.setup(data.general);
                    }

                    if (data.fetcher) {
                      this.fetcher.setup(data.fetcher);
                    }

                    if (!data.loader) {
                      _context27.next = 21;
                      break;
                    }

                    _context27.next = 21;
                    return this.loader.setup(data.loader);

                  case 21:
                    if (!data.component) {
                      _context27.next = 24;
                      break;
                    }

                    _context27.next = 24;
                    return this.component.setup(data.component);

                  case 24:
                    if (!data.router) {
                      _context27.next = 27;
                      break;
                    }

                    _context27.next = 27;
                    return this.router.setup(data.router);

                  case 27:
                    if (!data.listener.after) {
                      _context27.next = 30;
                      break;
                    }

                    _context27.next = 30;
                    return data.listener.after();

                  case 30:
                  case "end":
                    return _context27.stop();
                }
              }
            }, _callee27, this);
          }));

          function setup(_x32) {
            return _setup3.apply(this, arguments);
          }

          return setup;
        }()
      }, {
        key: "global",
        get: function get() {
          return this.g;
        }
      }, {
        key: "window",
        get: function get() {
          return window;
        }
      }, {
        key: "document",
        get: function get() {
          return window.document;
        }
      }, {
        key: "body",
        get: function get() {
          return window.document.body;
        }
      }, {
        key: "head",
        get: function get() {
          return window.document.head;
        }
      }, {
        key: "location",
        get: function get() {
          return this.router.location;
        }
      }, {
        key: "currentScript",
        get: function get() {
          return window.document._currentScript || window.document.currentScript;
        }
      }, {
        key: "ownerDocument",
        get: function get() {
          return (window.document._currentScript || window.document.currentScript).ownerDocument;
        }
      }, {
        key: "render",
        get: function get() {
          return Render;
        }
      }, {
        key: "methods",
        get: function get() {
          return Methods$1;
        }
      }, {
        key: "utility",
        get: function get() {
          return Utility;
        }
      }, {
        key: "general",
        get: function get() {
          return General$1;
        }
      }, {
        key: "batcher",
        get: function get() {
          return Batcher$1;
        }
      }, {
        key: "loader",
        get: function get() {
          return Loader$1;
        }
      }, {
        key: "binder",
        get: function get() {
          return Binder$1;
        }
      }, {
        key: "fetcher",
        get: function get() {
          return Fetcher$1;
        }
      }, {
        key: "component",
        get: function get() {
          return Component$1;
        }
      }, {
        key: "router",
        get: function get() {
          return Router$1;
        }
      }, {
        key: "model",
        get: function get() {
          return Model$1;
        }
      }]);

      return Oxe;
    }();

    var index = new Oxe();
    return index;
  }();
});