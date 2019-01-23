/*
	Name: oxe
	Version: 4.8.1
	License: MPL-2.0
	Author: Alexander Elias
	Email: alex.steven.elis@gmail.com
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = global || self, global.Oxe = factory());
})(this, function () {
  'use strict';

  var _Fetcher;

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

  var Batcher = {
    reads: [],
    writes: [],
    time: 1000 / 30,
    pending: false,
    setup: function setup(options) {
      options = options || {};
      this.time = options.time || this.time;
    },
    tick: function tick(callback) {
      return window.requestAnimationFrame(callback);
    },
    schedule: function schedule() {
      if (this.pending) return;
      this.pending = true;
      this.tick(this.flush.bind(this, null));
    },
    flush: function flush(time) {
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
    },
    remove: function remove(tasks, task) {
      var index = tasks.indexOf(task);
      return !!~index && !!tasks.splice(index, 1);
    },
    clear: function clear(task) {
      return this.remove(this.reads, task) || this.remove(this.writes, task);
    },
    batch: function batch(data) {
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
  };

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

    Batcher.batch(unrender);
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

  var Utility = {
    PREFIX: /o-/,
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

            if (attribute.name.indexOf('o-') === 0) {
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
    }
  };
  var Methods = {
    data: {},
    get: function get(path) {
      return Utility.getByPath(this.data, path);
    },
    set: function set(path, data) {
      return Utility.setByPath(this.data, path, data);
    }
  };

  function Class$1(binder) {
    var data, name;
    return {
      write: function write() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        name = binder.names.slice(1).join('-');
        binder.element.classList.toggle(name, data);
      }
    };
  }

  function Css$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);

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
          data = Model.get(binder.keys);
          data = Binder.piper(binder, data);

          if (data === undefined || data === null) {
            Model.set(binder.keys, '');
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
      Batcher.batch(render);
    }
  }

  function Disable$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
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
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
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
          Binder.bind(clone, binder.container, binder.scope);
          binder.fragment.appendChild(clone);
          elementLength++;

          if (elementLength === dataLength) {
            add = true;
          }

          if (binder.element.nodeName === 'SELECT' && binder.element.attributes['o-value']) {
            var name = binder.element.attributes['o-value'].name;
            var value = binder.element.attributes['o-value'].value;
            var select = Binder.create({
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
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
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
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
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
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);

        if (data === undefined || data === null) {
          Model.set(binder.keys, '');
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
        data = Methods.get(binder.keys);

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
              var parameter = Model.get(keys);
              parameters.push(parameter);
            }

            Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);
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
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
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
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
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
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (!data === binder.element.hidden) return false;
      },
      write: function write() {
        binder.element.hidden = !data;
      }
    };
  }

  function Style(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
      },
      write: function write() {
        if (!data) {
          return;
        } else if (data.constructor === Object) {
          for (var name in data) {
            var value = data[name];

            if (value === null || value === undefined) {
              delete binder.element.style[name];
            } else {
              binder.element.style[name] = value;
            }
          }
        }
      }
    };
  }

  function Text(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);

        if (data === undefined || data === null) {
          Model.set(binder.keys, '');
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

  function Value(binder) {
    var self = this;
    var type = binder.element.type;
    var name = binder.element.nodeName;
    var data, multiple;

    if (name === 'SELECT') {
      var elements;
      return {
        read: function read() {
          data = Model.get(binder.keys);
          data = Binder.piper(binder, data);
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
              Model.set(binder.keys, elements[index].value || '');
            }
          }
        }
      };
    } else if (type === 'radio') {
      var _elements;

      return {
        read: function read() {
          data = Model.get(binder.keys);

          if (data === undefined) {
            Model.set(binder.keys, 0);
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
            Model.set(binder.keys, 0);
          }
        }
      };
    } else if (type === 'file') {
      return {
        read: function read() {
          data = Model.get(binder.keys);

          if (data === undefined) {
            Model.set(binder.keys, []);
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
          data = Model.get(binder.keys);

          if (typeof data !== 'boolean') {
            Model.set(binder.keys, false);
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
            var select = Binder.elements.get(parent).get('value');
            self.default(select);
          }

          data = Model.get(binder.keys);

          if (data === undefined || data === null) {
            Model.set(binder.keys, '');
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
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
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
    style: Style,
    text: Text,
    value: Value,
    write: Write
  };
  var Binder = {
    data: {},
    elements: new Map(),
    create: function create(data) {
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
    },
    get: function get(data) {
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
    },
    add: function add(binder) {
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
    },
    remove: function remove(binder) {
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
    },
    piper: function piper(binder, data) {
      if (!binder.pipes.length) {
        return data;
      }

      var methods = Methods.get(binder.scope);

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
    },
    each: function each(path, callback) {
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
    },
    skipChildren: function skipChildren(element) {
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
    },
    eachElement: function eachElement(element, callback) {
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
    },
    eachAttribute: function eachAttribute(element, callback) {
      var attributes = element.attributes;

      for (var i = 0, l = attributes.length; i < l; i++) {
        var attribute = attributes[i];

        if (attribute.name.indexOf('o-') === 0 && attribute.name !== 'o-scope' && attribute.name !== 'o-reset' && attribute.name !== 'o-action' && attribute.name !== 'o-method' && attribute.name !== 'o-enctype') {
          callback.call(this, attribute);
        }
      }
    },
    unbind: function unbind(element, container, scope) {
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
    },
    bind: function bind(element, container, scope) {
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
  };

  function Style$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
      },
      write: function write() {
        if (!data) {
          return;
        } else if (data.constructor === Object) {
          for (var name in data) {
            delete binder.element.style[name];
          }
        }
      }
    };
  }

  function Text$1(binder) {
    return {
      write: function write() {
        binder.element.innerText = '';
      }
    };
  }

  function Value$1(binder) {
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

  function Write$1(binder) {
    return {
      write: function write() {
        binder.element.readOnly = true;
      }
    };
  }

  var Unrender = {
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
    style: Style$1,
    text: Text$1,
    value: Value$1,
    write: Write$1
  };

  var listener = function listener(data, path, type) {
    var method = data === undefined ? Unrender : Render;

    if (type === 'length') {
      var scope = path.split('.').slice(0, 1).join('.');
      var part = path.split('.').slice(1).join('.');
      if (!(scope in Binder.data)) return;
      if (!(part in Binder.data[scope])) return;
      if (!(0 in Binder.data[scope][part])) return;
      var binder = Binder.data[scope][part][0];
      method.default(binder);
    } else {
      Binder.each(path, function (binder) {
        method.default(binder);
      });
    }
  };

  var Model = {
    GET: 2,
    SET: 3,
    REMOVE: 4,
    ran: false,
    data: Observer.create({}, listener),
    traverse: function traverse(type, keys, value) {
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
    },
    get: function get(keys) {
      return this.traverse(this.GET, keys);
    },
    remove: function remove(keys) {
      return this.traverse(this.REMOVE, keys);
    },
    set: function set(keys, value) {
      return this.traverse(this.SET, keys, value);
    }
  };

  function Update(element, attribute) {
    return new Promise(function ($return, $error) {
      if (!element) return $error(new Error('Oxe - requires element argument'));
      if (!attribute) return $error(new Error('Oxe - requires attribute argument'));
      var binder = Binder.elements.get(element).get(attribute);

      var read = function read() {
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
          var original = Model.get(binder.keys);

          if (data && _typeof(data) === 'object' && data.constructor === original.constructor) {
            for (var key in data) {
              if (data[key] !== original[key]) {
                Model.set(binder.keys, data);
                break;
              }
            }
          } else if (original !== data) {
            Model.set(binder.keys, data);
          }
        }
      };

      Batcher.batch({
        read: read
      });
      return $return();
    });
  }

  function Change(event) {
    if (event.target.hasAttribute('o-value')) {
      var update = Update(event.target, 'value');
    }
  }

  var Fetcher = (_Fetcher = {
    head: null,
    method: 'get',
    mime: {
      xml: 'text/xml; charset=utf-8',
      html: 'text/html; charset=utf-8',
      text: 'text/plain; charset=utf-8',
      json: 'application/json; charset=utf-8',
      js: 'application/javascript; charset=utf-8'
    },
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
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
        return $return();
      }.bind(this));
    },
    serialize: function serialize(data) {
      return new Promise(function ($return, $error) {
        var query = '';

        for (var name in data) {
          query = query.length > 0 ? query + '&' : query;
          query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
        }

        return $return(query);
      });
    },
    fetch: function fetch(options) {
      return new Promise(function ($return, $error) {
        var data, copy, result, fetchOptions, fetched, _copy, _result;

        data = Object.assign({}, options);
        data.path = data.path || this.path;
        data.origin = data.origin || this.origin;
        if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
        if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length - 1) === '/') data.origin = data.origin.slice(0, -1);
        if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;
        if (!data.url) return $error(new Error('Oxe.fetcher - requires url or origin and path option'));
        if (!data.method) return $error(new Error('Oxe.fetcher - requires method option'));
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

        if (data.contentType) {
          data.head = data.head || {};

          switch (data.contentType) {
            case 'js':
              data.head['Content-Type'] = this.mime.js;
              break;

            case 'xml':
              data.head['Content-Type'] = this.mime.xml;
              break;

            case 'html':
              data.head['Content-Type'] = this.mime.html;
              break;

            case 'json':
              data.head['Content-Type'] = this.mime.json;
              break;

            default:
              data.head['Content-Type'] = data.contentType;
          }
        }

        if (data.acceptType) {
          data.head = data.head || {};

          switch (data.acceptType) {
            case 'js':
              data.head['Accept'] = this.mime.js;
              break;

            case 'xml':
              data.head['Accept'] = this.mime.xml;
              break;

            case 'html':
              data.head['Accept'] = this.mime.html;
              break;

            case 'json':
              data.head['Accept'] = this.mime.json;
              break;

            default:
              data.head['Accept'] = data.acceptType;
          }
        }

        if (typeof this.request === 'function') {
          copy = Object.assign({}, data);
          return Promise.resolve(this.request(copy)).then(function ($await_36) {
            try {
              result = $await_36;

              if (result === false) {
                return $return(data);
              }

              if (_typeof(result) === 'object') {
                Object.assign(data, result);
              }

              return $If_1.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_1() {
          if (data.body) {
            if (data.method === 'GET') {
              return Promise.resolve(this.serialize(data.body)).then(function ($await_37) {
                try {
                  data.url = data.url + '?' + $await_37;
                  return $If_5.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            } else {
              if (data.contentType === 'json') {
                data.body = JSON.stringify(data.body);
              }

              return $If_5.call(this);
            }

            function $If_5() {
              return $If_2.call(this);
            }
          }

          function $If_2() {
            fetchOptions = Object.assign({}, data);

            if (fetchOptions.head) {
              fetchOptions.headers = fetchOptions.head;
              delete fetchOptions.head;
            }

            return Promise.resolve(window.fetch(data.url, fetchOptions)).then(function ($await_38) {
              try {
                fetched = $await_38;
                data.code = fetched.status;
                data.message = fetched.statusText;

                if (!data.responseType) {
                  data.body = fetched.body;
                  return $If_3.call(this);
                } else {
                  return Promise.resolve(fetched[data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType]()).then(function ($await_39) {
                    try {
                      data.body = $await_39;
                      return $If_3.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_3() {
                  if (this.response) {
                    _copy = Object.assign({}, data);
                    return Promise.resolve(this.response(_copy)).then(function ($await_40) {
                      try {
                        _result = $await_40;

                        if (_result === false) {
                          return $return(data);
                        }

                        if (_typeof(_result) === 'object') {
                          Object.assign(data, _result);
                        }

                        return $If_4.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_4() {
                    return $return(data);
                  }

                  return $If_4.call(this);
                }
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          return $If_2.call(this);
        }

        return $If_1.call(this);
      }.bind(this));
    },
    post: function post(data) {
      return new Promise(function ($return, $error) {
        data.method = 'post';
        return $return(this.fetch(data));
      }.bind(this));
    },
    get: function get(data) {
      return new Promise(function ($return, $error) {
        data.method = 'get';
        return $return(this.fetch(data));
      }.bind(this));
    },
    put: function put(data) {
      return new Promise(function ($return, $error) {
        data.method = 'put';
        return $return(this.fetch(data));
      }.bind(this));
    }
  }, _defineProperty(_Fetcher, "head", function head(data) {
    return new Promise(function ($return, $error) {
      data.method = 'head';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "patch", function patch(data) {
    return new Promise(function ($return, $error) {
      data.method = 'patch';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "delete", function _delete(data) {
    return new Promise(function ($return, $error) {
      data.method = 'delete';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "options", function options(data) {
    return new Promise(function ($return, $error) {
      data.method = 'options';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "connect", function connect(data) {
    return new Promise(function ($return, $error) {
      data.method = 'connect';
      return $return(this.fetch(data));
    }.bind(this));
  }), _Fetcher);

  function Submit(event) {
    return new Promise(function ($return, $error) {
      var element, binder, method, model, data, options, oaction, omethod, oenctype, result;
      element = event.target;
      binder = Binder.elements.get(element).get('submit');
      method = Methods.get(binder.keys);
      model = Model.get(binder.scope);
      data = Utility.formData(element, model);
      return Promise.resolve(method.call(binder.container, data, event)).then(function ($await_41) {
        try {
          options = $await_41;

          if (_typeof(options) === 'object') {
            oaction = element.getAttribute('o-action');
            omethod = element.getAttribute('o-method');
            oenctype = element.getAttribute('o-enctype');
            options.url = options.url || oaction;
            options.method = options.method || omethod;
            options.contentType = options.contentType || oenctype;
            return Promise.resolve(Fetcher.fetch(options)).then(function ($await_42) {
              try {
                result = $await_42;

                if (options.handler) {
                  return Promise.resolve(options.handler(result)).then(function ($await_43) {
                    try {
                      return $If_7.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_7() {
                  return $If_6.call(this);
                }

                return $If_7.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_6() {
            if (element.hasAttribute('o-reset') || _typeof(options) === 'object' && options.reset) {
              element.reset();
            }

            return $return();
          }

          return $If_6.call(this);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    });
  }

  function Input(event) {
    if (event.target.type !== 'checkbox' && event.target.type !== 'radio' && event.target.type !== 'option' && event.target.nodeName !== 'SELECT' && event.target.hasAttribute('o-value')) {
      var update = Update(event.target, 'value');
    }
  }

  function Reset(event) {
    return new Promise(function ($return, $error) {
      var element = event.target;
      var binder = Binder.elements.get(element).get('submit');
      var model = Model.get(binder.scope);
      Utility.formReset(element, model);
      return $return();
    });
  }

  var BASE = window.PATH_BASE || null;
  var Path = {
    get base() {
      if (BASE) return BASE;
      var base = window.document.querySelector('base');
      if (base) return base.href;
      return window.location.origin + (window.location.pathname ? window.location.pathname : '/');
    },

    setup: function setup(option) {
      return new Promise(function ($return, $error) {
        option = option || {};

        if (option.base) {
          var base = window.document.querySelector('base');

          if (!base) {
            base = window.document.createElement('base');
            window.document.head.insertBefore(base, window.document.head.firstElementChild);
          }

          base.href = option.base;
          BASE = BASE || base.href;
        }

        return $return();
      });
    },
    extension: function extension(data) {
      var position = data.lastIndexOf('.');
      return position > 0 ? data.slice(position + 1) : '';
    },
    clean: function clean(data) {
      var origin = window.location.origin;
      var hash = window.location.hash.length;
      var search = window.location.search.length;
      var protocol = window.location.protocol + '//';

      if (data.slice(0, origin.length) === origin) {
        data = data.slice(origin.length);
      }

      if (data.slice(0, protocol.length) === protocol) {
        data = data.slice(protocol.length);
      }

      if (data.slice(-hash) === hash) {
        data = data.slice(0, -hash.length);
      }

      if (data.slice(-search.length) === search) {
        data = data.slice(0, -search.length);
      }

      return data || '/';
    },
    normalize: function normalize(data) {
      var parser = window.document.createElement('a');
      data = this.clean(data);
      data = data.replace(/\/+/g, '/');
      parser.href = data;
      return parser.pathname ? parser.pathname : '/';
    },
    join: function join() {
      if (!arguments.length) {
        throw new Error('Oxe.path.join - argument required');
      }

      var result = [];

      for (var i = 0, l = arguments.length; i < l; i++) {
        result.push(arguments[i]);
      }

      return this.normalize(result.join('/'));
    }
  };
  var Transformer = {
    innerHandler: function innerHandler(character, index, string) {
      if (string[index - 1] === '\\') return;
      if (character === '\'') return '\\\'';
      if (character === '\"') return '\\"';
      if (character === '\t') return '\\t';
      if (character === '\r') return '\\r';
      if (character === '\n') return '\\n';
      if (character === '\w') return '\\w';
      if (character === '\b') return '\\b';
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

      for (var index = 0; index < string.length; index++) {
        var character = string[index];

        if (character === '`' && string[index - 1] !== '\\') {
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
          if (value = this.innerHandler(character, index, string)) {
            string = this.updateString(value, index, string);
            index = this.updateIndex(value, index);
          }
        }
      }

      string = string.replace(/\${(.*?)}/g, '\'+$1+\'');

      if (starts === ends) {
        return string;
      } else {
        throw new Error('import transformer missing backtick');
      }
    },
    exp: /export\s+default\s*(var|let|const)?/,
    imps: /import(?:\s+(?:\*\s+as\s+)?\w+\s+from)?\s+(?:'|").*?(?:'|");?\n?/g,
    imp: /import(?:\s+(?:\*\s+as\s+)?(\w+)\s+from)?\s+(?:'|")(.*?)(?:'|");?\n?/,
    module: function module(code, url) {
      var before = 'return Promise.all([\n';
      var after = ']).then(function ($MODULES) {\n';
      var parentImport = url.slice(0, url.lastIndexOf('/') + 1);
      var imps = code.match(this.imps) || [];

      for (var i = 0, l = imps.length; i < l; i++) {
        var imp = imps[i].match(this.imp);
        var rawImport = imp[0];
        var nameImport = imp[1];
        var pathImport = imp[2];

        if (pathImport.slice(0, 1) !== '/') {
          pathImport = Path.normalize(parentImport + '/' + pathImport);
        } else {
          pathImport = Path.normalize(pathImport);
        }

        before = before + '\t$LOADER.load("' + pathImport + '"),\n';
        after = after + 'var ' + nameImport + ' = $MODULES[' + i + '].default;\n';
        code = code.replace(rawImport, '');
      }

      if (this.exp.test(code)) {
        code = code.replace(this.exp, 'var $DEFAULT = ');
        code = code + '\n\nreturn { default: $DEFAULT };\n';
      }

      code = '"use strict";\n' + before + after + code + '});';
      return code;
    }
  };
  var Loader = {
    data: {},
    type: 'esm',
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        var self = this;
        options = options || options;
        this.type = options.type || this.type;

        if (options.loads) {
          return $return(Promise.all(options.loads.map(function (load) {
            return self.load(load);
          })));
        }

        return $return();
      }.bind(this));
    },
    load: function load() {
      var $args = arguments;
      return new Promise(function ($return, $error) {
        var url, type, data, code;

        if (_typeof($args[0]) === 'object') {
          url = $args[0]['url'];
          type = $args[0]['type'];
        } else {
          url = $args[0];
          type = $args[1] || this.type;
        }

        if (!url) {
          return $error(new Error('Oxe.loader.load - url argument required'));
        }

        url = Path.normalize(url);

        if (url in this.data) {
          return $return(this.data[url]);
        }

        return Promise.resolve(window.fetch(url)).then(function ($await_44) {
          try {
            data = $await_44;

            if (data.status == 404) {
              return $error(new Error('Oxe.loader.load - not found ' + url));
            }

            if (data.status < 200 || data.status > 300 && data.status != 304) {
              return $error(new Error(data.statusText));
            }

            return Promise.resolve(data.text()).then(function ($await_45) {
              try {
                code = $await_45;

                if (type === 'es' || type === 'est') {
                  code = Transformer.template(code);
                }

                if (type === 'es' || type === 'esm') {
                  code = Transformer.module(code, url);
                }

                code = new Function('window', 'document', '$LOADER', code);
                return $return(this.data[url] = code(window, window.document, this));
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  };
  var Events = {
    events: {},
    on: function on(name, method) {
      if (!(name in this.events)) {
        this.events[name] = [];
      }

      this.events[name].push(method);
    },
    off: function off(name, method) {
      if (name in this.events) {
        var _index = this.events[name].indexOf(method);

        if (_index !== -1) {
          this.events[name].splice(_index, 1);
        }
      }
    },
    emit: function emit(name) {
      if (name in this.events) {
        var methods = this.events[name];
        var args = Array.prototype.slice.call(arguments, 1);

        for (var i = 0, l = methods.length; i < l; i++) {
          methods[i].apply(this, args);
        }
      }
    }
  };
  var Component = {
    data: {},
    compiled: false,
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};

        if (options.components && options.components.length) {
          for (var i = 0, l = options.components.length; i < l; i++) {
            this.define(options.components[i]);
          }
        }

        return $return();
      }.bind(this));
    },
    renderSlot: function renderSlot(target, source, scope) {
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
    },
    renderStyle: function renderStyle(style, scope) {
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
    },
    render: function render(element, options) {
      var self = this;
      element.setAttribute('o-scope', element.scope);

      if (self.compiled && element.parentElement.nodeName === 'O-ROUTER') {
        Binder.bind(element, element, element.scope);
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
        Binder.bind(clone, element, element.scope);

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
    },
    define: function define(options) {
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
            return Model.get(this.scope);
          },
          set: function set(data) {
            data = data && _typeof(data) === 'object' ? data : {};
            return Model.set(this.scope, data);
          }
        };
        options.properties.methods = {
          enumerable: true,
          get: function get() {
            return Methods.get(this.scope);
          }
        };
        Object.defineProperties(instance, options.properties);
        Model.set(instance.scope, options.model);
        Methods.set(instance.scope, options.methods);
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
  };
  var events = Object.create(Events);
  var Router = {
    on: events.on.bind(events),
    off: events.off.bind(events),
    emit: events.emit.bind(events),
    data: [],
    ran: false,
    location: {},
    mode: 'push',
    element: null,
    contain: false,
    compiled: false,
    folder: './routes',
    compareParts: function compareParts(routePath, userPath, split) {
      var compareParts = [];
      var routeParts = routePath.split(split);
      var userParts = userPath.split(split);

      if (userParts.length > 1 && userParts[userParts.length - 1] === '') {
        userParts.pop();
      }

      if (routeParts.length > 1 && routeParts[routeParts.length - 1] === '') {
        routeParts.pop();
      }

      for (var i = 0, l = routeParts.length; i < l; i++) {
        if (routeParts[i].slice(0, 1) === '(' && routeParts[i].slice(-1) === ')') {
          if (routeParts[i] === '(*)') {
            return true;
          } else if (routeParts[i].indexOf('*') !== -1) {
            if (userParts[i]) {
              compareParts.push(userParts[i]);
            }
          } else {
            compareParts.push(userParts[i]);
          }
        } else if (routeParts[i] !== userParts[i]) {
          return false;
        } else {
          compareParts.push(routeParts[i]);
        }
      }

      if (compareParts.join(split) === userParts.join(split)) {
        return true;
      } else {
        return false;
      }
    },
    compare: function compare(routePath, userPath) {
      var base = Path.normalize(Path.base);
      userPath = Path.normalize(userPath);
      routePath = Path.normalize(routePath);

      if (userPath.slice(0, base.length) !== base) {
        userPath = Path.join(base, userPath);
      }

      if (routePath.slice(0, base.length) !== base) {
        routePath = Path.join(base, routePath);
      }

      if (this.compareParts(routePath, userPath, '/')) {
        return true;
      }

      if (this.compareParts(routePath, userPath, '-')) {
        return true;
      }

      return false;
    },
    toParameterObject: function toParameterObject(routePath, userPath) {
      var result = {};
      if (!routePath || !userPath || routePath === '/' || userPath === '/') return result;
      var userParts = userPath.split(/\/|-/);
      var routeParts = routePath.split(/\/|-/);

      for (var i = 0, l = routeParts.length; i < l; i++) {
        var part = routeParts[i];

        if (part.slice(0, 1) === '(' && part.slice(-1) === ')') {
          var name = part.slice(1, part.length - 1).replace('*', '');
          result[name] = userParts[i];
        }
      }

      return result;
    },
    toQueryString: function toQueryString(data) {
      var result = '?';

      for (var key in data) {
        var value = data[key];
        result += key + '=' + value + '&';
      }

      if (result.slice(-1) === '&') {
        result = result.slice(0, -1);
      }

      return result;
    },
    toQueryObject: function toQueryObject(path) {
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
    },
    toLocationObject: function toLocationObject(href) {
      var location = {};
      var parser = document.createElement('a');
      parser.href = href;
      location.href = parser.href;
      location.host = parser.host;
      location.port = parser.port;
      location.hash = parser.hash;
      location.search = parser.search;
      location.protocol = parser.protocol;
      location.hostname = parser.hostname;
      location.pathname = parser.pathname[0] === '/' ? parser.pathname : '/' + parser.pathname;
      location.path = location.pathname + location.search + location.hash;
      return location;
    },
    scroll: function scroll(x, y) {
      window.scroll(x, y);
    },
    back: function back() {
      window.history.back();
    },
    forward: function forward() {
      window.history.forward();
    },
    redirect: function redirect(path) {
      window.location.href = path;
    },
    add: function add(data) {
      return new Promise(function ($return, $error) {
        var path, load, i, l;

        if (!data) {
          return $return();
        } else {
          if (data.constructor === String) {
            path = data;

            if (path.slice(-3) === '.js') {
              path = path.slice(0, -3);
            }

            load = path;

            if (path.slice(-5) === 'index') {
              path = path.slice(0, -5);
            }

            if (path.slice(-6) === 'index/') {
              path = path.slice(0, -6);
            }

            if (path.slice(0, 2) === './') {
              path = path.slice(2);
            }

            if (path.slice(0, 1) !== '/') {
              path = '/' + path;
            }

            load = load + '.js';
            load = Path.join(this.folder, load);
            this.data.push({
              path: path,
              load: load
            });
            return $If_9.call(this);
          } else {
            if (data.constructor === Object) {
              if (!data.path) {
                return $error(new Error('Oxe.router.add - route path required'));
              }

              if (!data.load && !data.component) {
                return $error(new Error('Oxe.router.add -  route.component or route.load required'));
              }

              this.data.push(data);
              return $If_10.call(this);
            } else {
              if (data.constructor === Array) {
                i = 0, l = data.length;
                var $Loop_12_trampoline;

                function $Loop_12_step() {
                  i++;
                  return $Loop_12;
                }

                function $Loop_12() {
                  if (i < l) {
                    return Promise.resolve(this.add(data[i])).then(function ($await_46) {
                      try {
                        return $Loop_12_step;
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }, $error);
                  } else return [1];
                }

                return ($Loop_12_trampoline = function (q) {
                  while (q) {
                    if (q.then) return void q.then($Loop_12_trampoline, $error);

                    try {
                      if (q.pop) {
                        if (q.length) return q.pop() ? $Loop_12_exit.call(this) : q;else q = $Loop_12_step;
                      } else q = q.call(this);
                    } catch (_exception) {
                      return $error(_exception);
                    }
                  }
                }.bind(this))($Loop_12);

                function $Loop_12_exit() {
                  return $If_11.call(this);
                }
              }

              function $If_11() {
                return $If_10.call(this);
              }

              return $If_11.call(this);
            }

            function $If_10() {
              return $If_9.call(this);
            }
          }

          function $If_9() {
            return $If_8.call(this);
          }
        }

        function $If_8() {
          return $return();
        }

        return $If_8.call(this);
      }.bind(this));
    },
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};
        this.base = options.base === undefined ? this.base : options.base;
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

        if (!this.element) {
          return $error(new Error('Oxe.router.render - missing o-router element'));
        }

        return Promise.resolve(this.add(options.routes)).then(function ($await_47) {
          try {
            return Promise.resolve(this.route(window.location.href, {
              mode: 'replace'
            })).then(function ($await_48) {
              try {
                return $return();
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }, $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    },
    load: function load(route) {
      return new Promise(function ($return, $error) {
        var load, _load;

        if (route.load) {
          return Promise.resolve(Loader.load(route.load)).then(function ($await_49) {
            try {
              load = $await_49;
              route = Object.assign({}, load.default, route);
              return $If_14.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_14() {
          if (typeof route.component === 'string') {
            return Promise.resolve(Loader.load(route.load)).then(function ($await_50) {
              try {
                _load = $await_50;
                route.component = _load.default;
                return $If_15.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_15() {
            return $return(route);
          }

          return $If_15.call(this);
        }

        return $If_14.call(this);
      });
    },
    remove: function remove(path) {
      return new Promise(function ($return, $error) {
        for (var i = 0, l = this.data.length; i < l; i++) {
          if (this.data[i].path === path) {
            this.data.splice(i, 1);
          }
        }

        return $return();
      }.bind(this));
    },
    get: function get(path) {
      return new Promise(function ($return, $error) {
        var i, l;
        i = 0, l = this.data.length;
        var $Loop_16_trampoline;

        function $Loop_16_step() {
          i++;
          return $Loop_16;
        }

        function $Loop_16() {
          if (i < l) {
            if (this.data[i].path === path) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_51) {
                try {
                  this.data[i] = $await_51;
                  return $return(this.data[i]);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $Loop_16_step;
          } else return [1];
        }

        return ($Loop_16_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_16_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_16_exit.call(this) : q;else q = $Loop_16_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_16);

        function $Loop_16_exit() {
          return $return();
        }
      }.bind(this));
    },
    filter: function filter(path) {
      return new Promise(function ($return, $error) {
        var result, i, l;
        result = [];
        i = 0, l = this.data.length;
        var $Loop_19_trampoline;

        function $Loop_19_step() {
          i++;
          return $Loop_19;
        }

        function $Loop_19() {
          if (i < l) {
            if (this.compare(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_52) {
                try {
                  this.data[i] = $await_52;
                  result.push(this.data[i]);
                  return $If_21.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_21() {
              return $Loop_19_step;
            }

            return $If_21.call(this);
          } else return [1];
        }

        return ($Loop_19_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_19_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_19_exit.call(this) : q;else q = $Loop_19_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_19);

        function $Loop_19_exit() {
          return $return(result);
        }
      }.bind(this));
    },
    find: function find(path) {
      return new Promise(function ($return, $error) {
        var i, l;
        i = 0, l = this.data.length;
        var $Loop_22_trampoline;

        function $Loop_22_step() {
          i++;
          return $Loop_22;
        }

        function $Loop_22() {
          if (i < l) {
            if (this.compare(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_53) {
                try {
                  this.data[i] = $await_53;
                  return $return(this.data[i]);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $Loop_22_step;
          } else return [1];
        }

        return ($Loop_22_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_22_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_22_exit.call(this) : q;else q = $Loop_22_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_22);

        function $Loop_22_exit() {
          return $return();
        }
      }.bind(this));
    },
    render: function render(route) {
      return new Promise(function ($return, $error) {
        if (!route) {
          return $error(new Error('Oxe.render - route argument required. Missing object option.'));
        }

        if (!route.component && !route.element) {
          return $error(new Error('Oxe.render - route property required. Missing component or element option.'));
        }

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
            Component.define(route.component);

            if (this.compiled) {
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
        return $return();
      }.bind(this));
    },
    route: function route(path, options) {
      return new Promise(function ($return, $error) {
        var mode, location, route;
        options = options || {};

        if (options.query) {
          path += this.toQueryString(options.query);
        }

        mode = options.mode || this.mode;
        location = this.toLocationObject(path);
        return Promise.resolve(this.find(location.pathname)).then(function ($await_54) {
          try {
            route = $await_54;

            if (!route) {
              return $error(new Error("Oxe.router.route - missing route ".concat(location.pathname)));
            }

            location.route = route;
            location.title = location.route.title;
            location.query = this.toQueryObject(location.search);
            location.parameters = this.toParameterObject(location.route.path, location.pathname);

            if (location.route && location.route.handler) {
              return Promise.resolve(location.route.handler(location)).then($return, $error);
            }

            if (location.route && location.route.redirect) {
              return Promise.resolve(this.redirect(location.route.redirect)).then($return, $error);
            }

            function $If_26() {
              if (typeof this.before === 'function') {
                return Promise.resolve(this.before(location)).then(function ($await_57) {
                  try {
                    return $If_27.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_27() {
                this.emit('route:before', location);

                if (mode === 'href' || this.compiled) {
                  return $return(window.location.assign(location.path));
                }

                window.history[mode + 'State']({
                  path: location.path
                }, '', location.path);
                this.location = location;
                return Promise.resolve(this.render(location.route)).then(function ($await_58) {
                  try {
                    if (typeof this.after === 'function') {
                      return Promise.resolve(this.after(location)).then(function ($await_59) {
                        try {
                          return $If_28.call(this);
                        } catch ($boundEx) {
                          return $error($boundEx);
                        }
                      }.bind(this), $error);
                    }

                    function $If_28() {
                      this.emit('route:after', location);
                      return $return();
                    }

                    return $If_28.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              return $If_27.call(this);
            }

            if (typeof this.before === 'function') {
              return Promise.resolve(this.before(location)).then(function ($await_57) {
                try {
                  return $If_27.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_27() {
              this.emit('route:before', location);

              if (mode === 'href' || this.compiled) {
                return $return(window.location.assign(location.path));
              }

              window.history[mode + 'State']({
                path: location.path
              }, '', location.path);
              this.location = location;
              return Promise.resolve(this.render(location.route)).then(function ($await_58) {
                try {
                  if (typeof this.after === 'function') {
                    return Promise.resolve(this.after(location)).then(function ($await_59) {
                      try {
                        return $If_28.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_28() {
                    this.emit('route:after', location);
                    return $return();
                  }

                  return $If_28.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $If_27.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  };

  function Click(event) {
    if (event.button !== 0 || event.defaultPrevented || event.target.nodeName === 'INPUT' || event.target.nodeName === 'BUTTON' || event.target.nodeName === 'SELECT' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    var target = event.path ? event.path[0] : event.target;
    var parent = target.parentNode;

    if (Router.contain) {
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
    if (Router.external && (Router.external.constructor === RegExp && Router.external.test(target.href) || Router.external.constructor === Function && Router.external(target.href) || Router.external.constructor === String && Router.external === target.href)) return;
    event.preventDefault();

    if (Router.location.href !== target.href) {
      Router.route(target.href).catch(console.error);
    }
  }

  function State(event) {
    var path = event && event.state ? event.state.path : window.location.href;
    var route = Router.route(path, {
      mode: 'replace'
    });
  }

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
    var options = oSetup.getAttribute('o-setup').split(/\s+|\s*,+\s*/);
    var meta = document.querySelector('meta[name="oxe"]');

    if (meta && meta.hasAttribute('compiled')) {
      Router.compiled = true;
      Component.compiled = true;
    }

    if (!options[0]) {
      throw new Error('Oxe - script attribute o-setup requires path');
    }

    Loader.type = options[1] || 'esm';
    Promise.resolve(Loader.load(options[0]));
  }

  var GLOBAL = {};
  var SETUP = false;
  var index = {
    get global() {
      return GLOBAL;
    },

    get window() {
      return window;
    },

    get document() {
      return window.document;
    },

    get body() {
      return window.document.body;
    },

    get head() {
      return window.document.head;
    },

    get location() {
      return this.router.location;
    },

    get currentScript() {
      return window.document._currentScript || window.document.currentScript;
    },

    get ownerDocument() {
      return (window.document._currentScript || window.document.currentScript).ownerDocument;
    },

    get render() {
      return Render;
    },

    get methods() {
      return Methods;
    },

    get utility() {
      return Utility;
    },

    get batcher() {
      return Batcher;
    },

    get binder() {
      return Binder;
    },

    get fetcher() {
      return Fetcher;
    },

    get component() {
      return Component;
    },

    get router() {
      return Router;
    },

    get model() {
      return Model;
    },

    get loader() {
      return Loader;
    },

    get path() {
      return Path;
    },

    setup: function setup(data) {
      return new Promise(function ($return, $error) {
        if (SETUP) return $return();else SETUP = true;
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

            Promise.resolve().then(before).then(Reset.bind(null, event)).then(after);
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

            Promise.resolve().then(before).then(Submit.bind(null, event)).then(after);
          }
        }, true);

        if (data.listener.before) {
          return Promise.resolve(data.listener.before()).then(function ($await_60) {
            try {
              return $If_29.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_29() {
          if (data.path) {
            return Promise.resolve(this.path.setup(data.path)).then(function ($await_61) {
              try {
                return $If_30.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_30() {
            if (data.fetcher) {
              return Promise.resolve(this.fetcher.setup(data.fetcher)).then(function ($await_62) {
                try {
                  return $If_31.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_31() {
              if (data.loader) {
                return Promise.resolve(this.loader.setup(data.loader)).then(function ($await_63) {
                  try {
                    return $If_32.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_32() {
                if (data.component) {
                  return Promise.resolve(this.component.setup(data.component)).then(function ($await_64) {
                    try {
                      return $If_33.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_33() {
                  if (data.router) {
                    return Promise.resolve(this.router.setup(data.router)).then(function ($await_65) {
                      try {
                        return $If_34.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_34() {
                    if (data.listener.after) {
                      return Promise.resolve(data.listener.after()).then(function ($await_66) {
                        try {
                          return $If_35.call(this);
                        } catch ($boundEx) {
                          return $error($boundEx);
                        }
                      }.bind(this), $error);
                    }

                    function $If_35() {
                      return $return();
                    }

                    return $If_35.call(this);
                  }

                  return $If_34.call(this);
                }

                return $If_33.call(this);
              }

              return $If_32.call(this);
            }

            return $If_31.call(this);
          }

          return $If_30.call(this);
        }

        return $If_29.call(this);
      }.bind(this));
    }
  };
  return index;
});