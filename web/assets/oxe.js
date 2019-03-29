function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = global || self, global.Oxe = factory());
})(this, function () {
  'use strict';

  var _Fetcher;

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
      window.cancelAnimationFrame(this.frame);
      this.frame = window.requestAnimationFrame(callback);
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
      if (!data) return;
      data.context = data.context || {};

      if (data.read) {
        var read = function read() {
          var result = data.read.call(data.context);

          if (data.write && result !== false) {
            var write = data.write.bind(data.context);
            self.writes.push(write);
            self.schedule();
          }
        };

        self.reads.push(read);
        self.schedule();
      } else if (data.write) {
        var write = data.write.bind(data.context);
        self.writes.push(write);
        self.schedule();
      }
    }
  };
  var PathPattern = '(\\$)(\\w+)($|,|\\s+|\\.|\\|)';
  var KeyPattern = '({{\\$)(\\w+)((-(key|index))?}})';
  var Utility = {
    PREFIX: /o-/,
    PIPE: /\s?\|\s?/,
    PIPES: /\s?,\s?|\s+/,
    keyPattern: new RegExp(KeyPattern, 'i'),
    keyPatternGlobal: new RegExp(KeyPattern, 'ig'),
    pathPattern: new RegExp(PathPattern, 'i'),
    pathPatternGlobal: new RegExp(PathPattern, 'ig'),
    value: function value(element) {
      var type = this.type(element);

      if ((type === 'radio' || type === 'checkbox') && (element.nodeName === 'INPUT' || element.nodeName.indexOf('-INPUT') !== -1)) {
        var name = this.name(element);
        var query = 'input[type="' + type + '"][name="' + name + '"]';
        var form = this.form(element);
        var elements = form ? this.form(element).querySelectorAll(query) : [element];
        var multiple = elements.length > 1;
        var result = multiple ? [] : undefined;

        for (var i = 0, l = elements.length; i < l; i++) {
          var _element = elements[i];
          var checked = this.checked(_element);
          if (!checked) continue;

          if (multiple) {
            result.push(this.value(_element));
          } else {
            result = this.value(_element);
            break;
          }
        }

        return result;
      } else if (element.nodeName === 'INPUT' || element.nodeName.indexOf('-INPUT') !== -1 || element.nodeName === 'OPTION' || element.nodeName.indexOf('-OPTION') !== -1 || element.nodeName === 'TEXTAREA' || element.nodeName.indexOf('-TEXTAREA') !== -1) {
        return element.value;
      } else if (element.nodeName === 'SELECT' || element.nodeName.indexOf('-SELECT') !== -1) {
        var _multiple = this.multiple(element);

        var options = element.options;

        var _result = _multiple ? [] : undefined;

        for (var _i = 0, _l = options.length; _i < _l; _i++) {
          var option = options[_i];
          var selected = this.selected(option);
          if (!selected) continue;
          var value = this.value(option);

          if (_multiple) {
            _result.push(value);
          } else {
            _result = this.value(option);
            break;
          }
        }

        return _result;
      }
    },
    form: function form(element) {
      if (element.form) {
        return element.form;
      } else {
        while (element = element.parentElement) {
          if (element.nodeName === 'FORM' || element.nodeName.indexOf('-FORM') !== -1) {
            return element;
          }
        }
      }
    },
    type: function type(element) {
      if (typeof element.type === 'string') {
        return element.type;
      } else {
        return element.getAttribute('type');
      }
    },
    name: function name(element) {
      if (typeof element.name === 'string') {
        return element.name;
      } else {
        return element.getAttribute('name');
      }
    },
    checked: function checked(element) {
      if (typeof element.checked === 'boolean') {
        return element.checked;
      } else {
        switch (element.getAttribute('checked')) {
          case undefined:
            return false;

          case 'true':
            return true;

          case null:
            return false;

          case '':
            return true;

          default:
            return false;
        }
      }
    },
    selected: function selected(element) {
      if (typeof element.selected === 'boolean') {
        return element.selected;
      } else {
        switch (element.getAttribute('selected')) {
          case undefined:
            return false;

          case 'true':
            return true;

          case null:
            return false;

          case '':
            return true;

          default:
            return false;
        }
      }
    },
    multiple: function multiple(element) {
      if (typeof element.multiple === 'boolean') {
        return element.multiple;
      } else {
        switch (element.getAttribute('multiple')) {
          case undefined:
            return false;

          case 'true':
            return true;

          case null:
            return false;

          case '':
            return true;

          default:
            return false;
        }
      }
    },
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
      var elements = form.querySelectorAll('[o-value], select[name] , input[name], textarea[name]');
      var data = {};

      for (var i = 0, l = elements.length; i < l; i++) {
        var element = elements[i];
        if (element.nodeName.indexOf('OPTION') !== -1) continue;
        var value = element.getAttribute('o-value');
        var values = this.binderValues(value);
        var name = element.getAttribute('name') || values.slice(-1)[0];

        if (data[name]) {
          if (_typeof(data[name]) !== 'object') {
            data[name] = [data[name]];
          }

          data[name].push(this.getByPath(model, values));
        } else {
          data[name] = this.getByPath(model, values);
        }
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
      var argumentIndex = 2;
      var argumentsCount = arguments.length - argumentIndex;
      var result = self.slice(startIndex, deleteCount);
      var updateCount = totalCount - 1 - startIndex;
      var promises = [];

      if (updateCount > 0) {
        var value;
        var _index = startIndex;

        while (updateCount--) {
          var key = _index++;

          if (argumentsCount && argumentIndex < argumentsCount) {
            value = arguments[argumentIndex++];
          } else {
            value = self.$meta[_index];
          }

          self.$meta[key] = Observer.create(value, self.$meta.listener, self.$meta.path + key);
          promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
        }
      }

      var length = self.length + addCount - deleteCount;

      if (self.length !== length) {
        promises.push(self.$meta.listener.bind(null, self, self.$meta.path.slice(0, -1), 'length'));
      }

      if (addCount > 0) {
        while (addCount--) {
          var _key = self.length;

          if (_key in this === false) {
            Object.defineProperty(this, _key, Observer.descriptor(_key));
          }

          self.$meta[_key] = Observer.create(arguments[argumentIndex++], self.$meta.listener, self.$meta.path + _key);
          promises.push(self.$meta.listener.bind(null, self.$meta[_key], self.$meta.path + _key, _key));
        }
      }

      if (deleteCount > 0) {
        while (deleteCount--) {
          self.$meta.length--;
          self.length--;
          var _key2 = self.length;
          promises.push(self.$meta.listener.bind(null, undefined, self.$meta.path + _key2, _key2));
        }
      }

      Promise.resolve().then(function () {
        promises.reduce(function (promise, item) {
          return promise.then(item);
        }, Promise.resolve());
      }).catch(console.error);
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
            var result = self.splice.call(this, this.length - 1, 1);
            return result[0];
          }
        },
        shift: {
          value: function value() {
            if (!this.length) return;
            var result = self.splice.call(this, 0, 1);
            return result[0];
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
              if (key in this === false) {
                Object.defineProperty(this, key, self.descriptor(key));
              }

              this.$meta[key] = self.create(_value, this.$meta.listener, this.$meta.path + key);
              this.$meta.listener(this.$meta[key], this.$meta.path + key, key, this);
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
    descriptor: function descriptor(key) {
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
            this.$meta.listener(this.$meta[key], this.$meta.path + key, key, this);
          }
        }
      };
    },
    create: function create(source, listener, path) {
      if (!source || source.constructor !== Object && source.constructor !== Array) {
        return source;
      }

      path = path ? path + '.' : '';
      var type = source.constructor;
      var target = source.constructor();
      var descriptors = {};
      descriptors.$meta = {
        value: source.constructor()
      };
      descriptors.$meta.value.path = path;
      descriptors.$meta.value.listener = listener;

      if (type === Array) {
        for (var key = 0, length = source.length; key < length; key++) {
          descriptors.$meta.value[key] = this.create(source[key], listener, path + key);
          descriptors[key] = this.descriptor(key);
        }
      }

      if (type === Object) {
        for (var _key3 in source) {
          descriptors.$meta.value[_key3] = this.create(source[_key3], listener, path + _key3);
          descriptors[_key3] = this.descriptor(_key3);
        }
      }

      Object.defineProperties(target, descriptors);
      Object.defineProperties(target, this.objectProperties(source, listener, path));

      if (type === Array) {
        Object.defineProperties(target, this.arrayProperties(source, listener, path));
      }

      return target;
    }
  };
  var PathPattern$1 = new RegExp('(\\$)(\\w+)($|,|\\s+|\\.|\\|)', 'ig');
  var KeyPattern$1 = new RegExp('({{\\$)(\\w+)((-(key|index))?}})', 'ig');

  function Dynamic(binder) {
    return {
      write: function write() {
        if (binder.target.nodeType === Node.TEXT_NODE) {
          binder.target.nodeValue = binder.target.nodeValue.replace(KeyPattern$1, binder.meta.key);
        } else if (binder.target.nodeType === Node.ELEMENT_NODE) {
          console.log(binder);
          var attributes = binder.target.attributes;

          for (var i = 0, l = attributes.length; i < l; i++) {
            var attribute = attributes[i];
            attribute.value = attribute.value.replace(KeyPattern$1, "".concat(binder.meta.key));
            attribute.value = attribute.value.replace(PathPattern$1, "".concat(binder.meta.path, ".").concat(binder.meta.key, "$3"));
          }
        }
      }
    };
  }

  function Class(binder, data) {
    return {
      write: function write() {
        var name = binder.names.slice(1).join('-');
        binder.target.classList.toggle(name, data);
      }
    };
  }

  function Css(binder, data) {
    return {
      read: function read() {
        if (binder.names.length > 1) {
          data = binder.names.slice(1).join('-') + ': ' + data + ';';
        }

        if (data === binder.target.style.cssText) {
          return false;
        }
      },
      write: function write() {
        binder.target.style.cssText = data;
      }
    };
  }

  function Default(binder, data) {
    return {
      read: function read() {
        if (data === undefined || data === null) {
          return false;
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = data.toString();
        }

        if (data === binder.target[binder.type]) {
          return false;
        }
      },
      write: function write() {
        binder.target[binder.type] = data;
      }
    };
  }

  function Disable(binder, data) {
    return {
      read: function read() {
        if (data === binder.target.disabled) return false;
      },
      write: function write() {
        binder.target.disabled = data;
      }
    };
  }

  function Piper(binder, data) {
    if (!binder.pipes.length) {
      return data;
    }

    var methods = binder.container.methods;

    if (!methods) {
      return data;
    }

    for (var i = 0, l = binder.pipes.length; i < l; i++) {
      var method = binder.pipes[i];

      if (method in methods) {
        data = methods[method].call(binder.container, data);
      } else {
        throw new Error("Oxe.piper.pipe - method ".concat(method, " not found in scope ").concat(binder.scope));
      }
    }

    return data;
  }

  var DATA = new Map();
  var View = {
    get data() {
      return DATA;
    },

    target: document.body,
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};
        this.data.set('context', new Map());
        this.data.set('target', new Map());
        this.data.set('location', new Map());
        this.data.set('attribute', new Map());
        this.target = options.target || document.body;
        var observer = new MutationObserver(this.listener.bind(this));
        observer.observe(this.target, {
          subtree: true,
          childList: true
        });
        return $return();
      }.bind(this));
    },
    get: function get(type) {
      var result = this.data.get(type);

      for (var i = 1, l = arguments.length; i < l; i++) {
        var argument = arguments[i];
        result = result.get(argument);
      }

      return result;
    },
    remove: function remove(node) {
      var binders = this.data.get('node').get(node);

      for (var i = 0, l = binders.length; i < l; i++) {
        var binder = binders[i];

        var _index2 = this.data.get('location').get(binder.location).indexOf(binder);

        this.data.get('location').get(binder.location).splice(_index2, 1);
      }

      this.data.get('node').delete(node);
      this.data.get('attribute').delete(node);
    },
    add: function add(binder) {
      if (this.data.get('location').has(binder.location)) {
        this.data.get('location').get(binder.location).push(binder);
      } else {
        this.data.get('location').set(binder.location, [binder]);
      }

      if (this.data.get('target').has(binder.target)) {
        this.data.get('target').get(binder.target).push(binder);
      } else {
        this.data.get('target').set(binder.target, [binder]);
      }

      if (!this.data.get('attribute').has(binder.target)) {
        this.data.get('attribute').set(binder.target, new Map());
      }

      this.data.get('attribute').get(binder.target).set(binder.name, binder);
    },
    removeContextNode: function removeContextNode(node) {
      if (node.nodeType === Node.TEXT_NODE && !/\S/.test(node.nodeValue)) {
        return;
      }

      this.get('context').delete(node);
      this.removeContextNodes(node.childNodes);
    },
    removeContextNodes: function removeContextNodes(nodes) {
      for (var i = 0, l = nodes.length; i < l; i++) {
        this.removeContextNode(nodes[i]);
      }
    },
    addContextNode: function addContextNode(node, context) {
      if (node.nodeType === Node.TEXT_NODE && /{{\$.*}}/.test(node.nodeValue)) {
        if (context.meta) {
          console.log(node);
        }

        this.data.get('context').set(node, Object.assign({
          target: node
        }, context));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (this.hasAttribute(node, 'o-')) {
          this.data.get('context').set(node, Object.assign({
            target: node
          }, context));
        }

        if (this.hasAttribute(node, 'o-each') || this.hasAttribute(node, 'o-html')) {
          return;
        }

        for (var i = 0, l = node.childNodes.length; i < l; i++) {
          this.addContextNode(node.childNodes[i], context);
        }
      }
    },
    nodes: function nodes(_nodes) {
      for (var i = 0; i < _nodes.length; i++) {
        var node = _nodes[i];
        console.log(node);

        if (node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        if (node.nodeType === Node.TEXT_NODE) {
          var _context = this.data.get('context').get(node);

          if (_context && _context.type === 'dynamic') {
            Binder.render(_context);
          }

          continue;
        }

        var context = this.data.get('context').get(node);
        if (!context) continue;
        if (context.type === 'dynamic') Binder.render(context);
        var container = context.container;
        var attributes = node.attributes;

        for (var _i2 = 0, l = attributes.length; _i2 < l; _i2++) {
          var attribute = attributes[_i2];

          if (attribute.name.indexOf('o-') !== 0 || attribute.name === 'o-scope' || attribute.name === 'o-reset' || attribute.name === 'o-action' || attribute.name === 'o-method' || attribute.name === 'o-enctype') {
            continue;
          }

          var binder = Binder.create({
            target: node,
            container: container,
            name: attribute.name,
            value: attribute.value,
            scope: container.scope
          });
          this.add(binder);
          var data = void 0;

          if (binder.type === 'on') {
            data = Utility.getByPath(container.methods, binder.values);
          } else {
            data = Utility.getByPath(container.model, binder.values);
            data = Piper(binder, data);
          }

          Binder.render(binder, data);
        }

        this.nodes(node.childNodes);
      }
    },
    hasAttribute: function hasAttribute(node, name) {
      var attributes = node.attributes;

      for (var i = 0, l = attributes.length; i < l; i++) {
        var attribute = attributes[i];

        if (attribute.name.indexOf(name) === 0) {
          return true;
        }
      }

      return false;
    },
    listener: function listener(records) {
      for (var i = 0, l = records.length; i < l; i++) {
        var record = records[i];

        switch (record.type) {
          case 'childList':
            this.nodes(record.addedNodes);
            break;
        }
      }
    }
  };

  function Each(binder, data) {
    if (data === undefined) {
      console.log('data undefined');
      return;
    }

    if (!binder.meta.template && !binder.target.children.length) {
      return;
    }

    if (binder.meta.length === undefined) {
      binder.meta.length = 0;
    }

    if (binder.meta.template === undefined) {
      binder.meta.template = binder.target.removeChild(binder.target.firstElementChild);
    }

    return {
      read: function read() {
        this.keys = Object.keys(data);
        this.currentLength = binder.meta.length;
        this.targetLength = Array.isArray(data) ? data.length : this.keys.length;

        if (this.currentLength === this.targetLength) {
          return false;
        } else if (this.currentLength > this.targetLength) {
          this.type = 'remove';
          this.count = this.currentLength - this.targetLength;
          binder.meta.length = binder.meta.length - this.count;
        } else if (this.currentLength < this.targetLength) {
          this.type = 'add';
          this.count = this.targetLength - this.currentLength;
          binder.meta.length = binder.meta.length + this.count;
        }
      },
      write: function write() {
        if (this.currentLength === this.targetLength) {
          return false;
        } else if (this.currentLength > this.targetLength) {
          while (this.count--) {
            var element = binder.target.lastElementChild;
            binder.target.removeChild(element);
            View.removeContextNode(element);
          }
        } else if (this.currentLength < this.targetLength) {
          while (this.count--) {
            var _element2 = document.importNode(binder.meta.template, true);

            View.addContextNode(_element2, {
              meta: {
                path: binder.path,
                key: this.keys[this.currentLength++]
              },
              type: 'dynamic',
              container: binder.container,
              scope: binder.container.scope
            });
            binder.target.appendChild(_element2);
          }
        }
      }
    };
  }

  function Enable(binder, data) {
    return {
      read: function read() {
        if (!data === binder.target.disabled) return false;
      },
      write: function write() {
        binder.target.disabled = !data;
      }
    };
  }

  function Hide(binder, data) {
    return {
      read: function read() {
        if (data === binder.target.hidden) return false;
      },
      write: function write() {
        binder.target.hidden = data;
      }
    };
  }

  function Html(binder, data) {
    return {
      read: function read() {
        if (data === undefined || data === null) {
          return false;
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = String(data);
        }
      },
      write: function write() {
        while (binder.target.firstChild) {
          var node = binder.target.removeNode(binder.target.firstChild);
          View.removeContextNode(node);
        }

        var fragment = document.createDocumentFragment();
        var parser = document.createElement('div');
        parser.innerHTML = data;

        while (parser.firstElementChild) {
          View.addContextNode(parser.firstElementChild, {
            container: binder.container,
            scope: binder.container.scope
          });
          fragment.appendChild(parser.firstElementChild);
        }

        binder.target.appendChild(fragment);
      }
    };
  }

  function On(binder, data) {
    return {
      read: function read() {
        if (typeof data !== 'function') {
          console.warn("Oxe - binder o-on=\"".concat(binder.keys.join('.'), "\" invalid type function required"));
          return false;
        }

        if (binder.meta.method) {
          binder.target.removeEventListener(binder.names[1], binder.meta.method);
        } else {
          binder.meta.method = function (events) {
            var parameters = [events];

            for (var i = 0, l = binder.pipes.length; i < l; i++) {
              var keys = binder.pipes[i].split('.');
              var parameter = Utility.getByPath(binder.container.model, keys);
              parameters.push(parameter);
            }

            Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);
          };
        }

        binder.target.addEventListener(binder.names[1], binder.meta.method);
        return false;
      }
    };
  }

  function Read(binder, data) {
    return {
      read: function read() {
        if (data === binder.target.readOnly) return false;
      },
      write: function write() {
        binder.target.readOnly = data;
      }
    };
  }

  function Require(binder, data) {
    return {
      read: function read() {
        if (data === binder.target.required) return false;
      },
      write: function write() {
        binder.target.required = data;
      }
    };
  }

  function Show(binder, data) {
    return {
      read: function read() {
        if (!data === binder.target.hidden) return false;
      },
      write: function write() {
        binder.target.hidden = !data;
      }
    };
  }

  function Style(binder, data) {
    return {
      write: function write() {
        if (!data) {
          binder.target.style = '';
        } else if (data.constructor === Object) {
          for (var name in data) {
            var value = data[name];

            if (value === null || value === undefined) {
              delete binder.target.style[name];
            } else {
              binder.target.style[name] = value;
            }
          }
        }
      }
    };
  }

  function Text(binder, data) {
    return {
      read: function read() {
        if (data === undefined || data === null) {
          return false;
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = data.toString();
        }

        if (data === binder.target.innerText) {
          return false;
        }
      },
      write: function write() {
        binder.target.innerText = data;
      }
    };
  }

  function Value(binder, data) {
    var type = binder.target.type;
    var name = binder.target.nodeName;

    if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
      return {
        read: function read() {
          this.nodes = binder.target.options;
          this.multiple = Utility.multiple(binder.target);

          if (this.multiple && data.constructor !== Array) {
            throw new Error("Oxe - invalid multiple select value type ".concat(binder.keys.join('.'), " array required"));
          }
        },
        write: function write() {
          var selected = false;

          for (var i = 0, l = this.nodes.length; i < l; i++) {
            var node = this.nodes[i];
            var value = Utility.value(node);

            if (this.multiple) {
              if (Utility.selected(node) && data === undefined || data === null || data === '' || data.length === 0) {
                if (value !== undefined && value !== null && value !== '') {
                  binder.data.push(value);
                }
              } else if (data.indexOf(value) !== -1) {
                node.selected = true;
                node.setAttribute('selected', '');
              } else {
                node.selected = false;
                node.removeAttribute('selected');
              }
            } else {
              if (selected) {
                node.selected = false;
                node.removeAttribute('selected');
                continue;
              }

              if (Utility.selected(node) && data === undefined || data === null || data === '') {
                selected = true;
                binder.data = value;
              } else if (data === value) {
                selected = true;
                node.selected = true;
                node.setAttribute('selected', '');
              }
            }
          }
        }
      };
    } else if (type === 'radio') {
      return {
        read: function read() {
          if (data === undefined) {
            binder.data = 0;
            return false;
          }

          this.nodes = binder.container.querySelectorAll('input[type="radio"][o-value="' + binder.value + '"]');
        },
        write: function write() {
          var checked = false;

          for (var i = 0, l = this.nodes.length; i < l; i++) {
            var node = this.nodes[i];

            if (i === data) {
              checked = true;
              node.checked = true;
            } else {
              node.checked = false;
            }
          }

          if (!checked) {
            this.nodes[0].checked = true;
            binder.data = 0;
          }
        }
      };
    } else if (type === 'checkbox') {
      return {
        read: function read() {
          if (typeof data !== 'boolean') {
            binder.data = false;
            return false;
          }

          if (data === binder.target.checked) {
            return false;
          }
        },
        write: function write() {
          binder.target.checked = data;
        }
      };
    } else {
      return {
        read: function read() {
          if (name === 'OPTION' || name.indexOf('-OPTION') !== -1) {
            var parent = binder.target.parentElement;
            if (!parent) return false;
            var select = parent.nodeName === 'SELECT' || parent.nodeName.indexOf('-SELECT') !== -1 ? parent : parent.parentElement;
            var b = View.get(parent, 'value');
          }

          if (data === binder.target.value) {
            return false;
          }
        },
        write: function write() {
          binder.target.value = data === undefined || data === null ? '' : data;
        }
      };
    }
  }

  function Write(binder, data) {
    return {
      read: function read() {
        if (!data === binder.target.readOnly) return false;
      },
      write: function write() {
        binder.target.readOnly = !data;
      }
    };
  }

  var BINDERS = {
    get dynamic() {
      return Dynamic;
    },

    get class() {
      return Class;
    },

    get css() {
      return Css;
    },

    get default() {
      return Default;
    },

    get disable() {
      return Disable;
    },

    get disabled() {
      return Disable;
    },

    get each() {
      return Each;
    },

    get enable() {
      return Enable;
    },

    get enabled() {
      return Enable;
    },

    get hide() {
      return Hide;
    },

    get hidden() {
      return Hide;
    },

    get html() {
      return Html;
    },

    get on() {
      return On;
    },

    get read() {
      return Read;
    },

    get require() {
      return Require;
    },

    get required() {
      return Require;
    },

    get show() {
      return Show;
    },

    get showed() {
      return Show;
    },

    get style() {
      return Style;
    },

    get text() {
      return Text;
    },

    get value() {
      return Value;
    },

    get write() {
      return Write;
    }

  };
  var Binder = {
    get binders() {
      return BINDERS;
    },

    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};

        if (options.binders) {
          for (var i = 0, l = options.binders.length; i < l; i++) {
            var binder = options.binders[i];
            this.binders[binder.name] = binder;
          }
        }

        return $return();
      }.bind(this));
    },
    create: function create(data) {
      if (data.name === undefined) throw new Error('Oxe.binder.create - missing name');
      if (data.value === undefined) throw new Error('Oxe.binder.create - missing value');
      if (data.target === undefined) throw new Error('Oxe.binder.create - missing target');
      if (data.container === undefined) throw new Error('Oxe.binder.create - missing container');
      var scope = data.container.scope;
      var names = data.names || Utility.binderNames(data.name);
      var pipes = data.pipes || Utility.binderPipes(data.value);
      var values = data.values || Utility.binderValues(data.value);
      var type = names[0];
      var path = values.join('.');
      var keys = [scope].concat(values);
      var location = keys.join('.');
      var context = {};
      var meta = data.meta || {};
      return {
        get location() {
          return location;
        },

        get type() {
          return type;
        },

        get path() {
          return path;
        },

        get scope() {
          return scope;
        },

        get name() {
          return data.name;
        },

        get value() {
          return data.value;
        },

        get target() {
          return data.target;
        },

        get container() {
          return data.container;
        },

        get keys() {
          return keys;
        },

        get names() {
          return names;
        },

        get pipes() {
          return pipes;
        },

        get values() {
          return values;
        },

        get meta() {
          return meta;
        },

        get context() {
          return context;
        },

        get data() {
          return Utility.getByPath(data.container.model, values);
        },

        set data(value) {
          return Utility.setByPath(data.container.model, values, value);
        }

      };
    },
    render: function render(binder, data) {
      var type = binder.type in this.binders ? binder.type : 'default';
      var render = this.binders[type](binder, data);
      Batcher.batch(render);
    }
  };
  var Model = {
    GET: 2,
    SET: 3,
    REMOVE: 4,
    data: null,
    tasks: [],
    target: {},
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};
        this.target = options.target || this.target;
        this.data = Observer.create(this.target, this.listener.bind(this));
        return $return();
      }.bind(this));
    },
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
    },
    listener: function listener(data, path, type) {
      var paths = path.split('.');
      var part = paths.slice(1).join('.');
      var scope = paths.slice(0, 1).join('.');
      var binders = View.get('location', path);
      if (!binders || !binders.length) return;

      for (var i = 0, l = binders.length; i < l; i++) {
        var binder = binders[i];
        var piped = Piper(binder, data);
        Binder.render(binder, piped);
      }
    }
  };

  function Update(node, attribute) {
    return new Promise(function ($return, $error) {
      if (!node) return $error(new Error('Oxe.update - requires node argument'));
      if (!attribute) return $error(new Error('Oxe.update - requires attribute argument'));
      var binder = View.get('attribute', node, attribute);

      var read = function read() {
        var type = binder.target.type;
        var name = binder.target.nodeName;
        var data = Utility.value(binder.target);
        if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) ;else {
          binder.data = binder.target.value || '';
        }
        if (data && _typeof(data) === 'object' && data.constructor === binder.data.constructor) ;else if (binder.data !== data) ;
      };

      Batcher.batch({
        read: read
      });
      return $return();
    });
  }

  function Change(event) {
    if (event.target.hasAttribute('o-value')) {
      var update = Update(event.target, 'o-value');
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
        var data, copy, result, fetchOptions, fetched, _copy, _result2;

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
          return Promise.resolve(this.request(copy)).then(function ($await_40) {
            try {
              result = $await_40;

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
              return Promise.resolve(this.serialize(data.body)).then(function ($await_41) {
                try {
                  data.url = data.url + '?' + $await_41;
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

            return Promise.resolve(window.fetch(data.url, fetchOptions)).then(function ($await_42) {
              try {
                fetched = $await_42;
                data.code = fetched.status;
                data.message = fetched.statusText;

                if (!data.responseType) {
                  data.body = fetched.body;
                  return $If_3.call(this);
                } else {
                  return Promise.resolve(fetched[data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType]()).then(function ($await_43) {
                    try {
                      data.body = $await_43;
                      return $If_3.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_3() {
                  if (this.response) {
                    _copy = Object.assign({}, data);
                    return Promise.resolve(this.response(_copy)).then(function ($await_44) {
                      try {
                        _result2 = $await_44;

                        if (_result2 === false) {
                          return $return(data);
                        }

                        if (_typeof(_result2) === 'object') {
                          Object.assign(data, _result2);
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
        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'post';
        return $return(this.fetch(data));
      }.bind(this));
    },
    get: function get(data) {
      return new Promise(function ($return, $error) {
        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'get';
        return $return(this.fetch(data));
      }.bind(this));
    },
    put: function put(data) {
      return new Promise(function ($return, $error) {
        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'put';
        return $return(this.fetch(data));
      }.bind(this));
    }
  }, _defineProperty(_Fetcher, "head", function head(data) {
    return new Promise(function ($return, $error) {
      data = typeof data === 'string' ? {
        url: data
      } : data;
      data.method = 'head';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "patch", function patch(data) {
    return new Promise(function ($return, $error) {
      data = typeof data === 'string' ? {
        url: data
      } : data;
      data.method = 'patch';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "delete", function _delete(data) {
    return new Promise(function ($return, $error) {
      data = typeof data === 'string' ? {
        url: data
      } : data;
      data.method = 'delete';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "options", function options(data) {
    return new Promise(function ($return, $error) {
      data = typeof data === 'string' ? {
        url: data
      } : data;
      data.method = 'options';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "connect", function connect(data) {
    return new Promise(function ($return, $error) {
      data = typeof data === 'string' ? {
        url: data
      } : data;
      data.method = 'connect';
      return $return(this.fetch(data));
    }.bind(this));
  }), _Fetcher);
  var Methods = {
    data: {},
    get: function get(path) {
      return Utility.getByPath(this.data, path);
    },
    set: function set(path, data) {
      return Utility.setByPath(this.data, path, data);
    }
  };

  function Submit(event) {
    return new Promise(function ($return, $error) {
      var node, binder, method, model, data, options, oaction, omethod, oenctype, result;
      node = event.target;
      binder = View.get('attribute', node, 'o-submit');
      method = Methods.get(binder.keys);
      model = Model.get(binder.scope);
      data = Utility.formData(node, model);
      return Promise.resolve(method.call(binder.container, data, event)).then(function ($await_45) {
        try {
          options = $await_45;

          if (_typeof(options) === 'object') {
            oaction = node.getAttribute('o-action');
            omethod = node.getAttribute('o-method');
            oenctype = node.getAttribute('o-enctype');
            options.url = options.url || oaction;
            options.method = options.method || omethod;
            options.contentType = options.contentType || oenctype;
            return Promise.resolve(Fetcher.fetch(options)).then(function ($await_46) {
              try {
                result = $await_46;

                if (options.handler) {
                  return Promise.resolve(options.handler(result)).then(function ($await_47) {
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
            if (node.hasAttribute('o-reset') || _typeof(options) === 'object' && options.reset) {
              node.reset();
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
      var update = Update(event.target, 'o-value');
    }
  }

  function Reset(event) {
    return new Promise(function ($return, $error) {
      var node = event.target;
      var binder = View.get(node, 'o-submit');
      var model = Model.get(binder.scope);
      Utility.formReset(node, model);
      return $return();
    });
  }

  var BASE;
  var Path = {
    get base() {
      if (!BASE) BASE = window.document.querySelector('base');
      if (BASE) return BASE.href;
      return window.location.origin + (window.location.pathname ? window.location.pathname : '/');
    },

    setup: function setup(option) {
      return new Promise(function ($return, $error) {
        option = option || {};

        if (option.base) {
          BASE = window.document.querySelector('base');

          if (!BASE) {
            BASE = window.document.createElement('base');
            window.document.head.insertBefore(BASE, window.document.head.firstElementChild);
          }

          BASE.href = option.base;
        }

        return $return();
      });
    },
    extension: function extension(data) {
      var position = data.lastIndexOf('.');
      return position > 0 ? data.slice(position + 1) : '';
    },
    clean: function clean(data) {
      var hash = window.location.hash;
      var search = window.location.search;
      var origin = window.location.origin;
      var protocol = window.location.protocol + '//';

      if (data.slice(0, origin.length) === origin) {
        data = data.slice(origin.length);
      }

      if (data.slice(0, protocol.length) === protocol) {
        data = data.slice(protocol.length);
      }

      if (data.slice(-hash.length) === hash) {
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
      data = parser.pathname;
      data = data ? data : '/';

      if (data !== '/' && data.slice(-1) === '/') {
        data = data.slice(0, -1);
      }

      return data;
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
        options = options || {};
        this.type = options.type || this.type;

        if (options.loads) {
          return $return(Promise.all(options.loads.map(function (load) {
            return self.load(load);
          })));
        }

        return $return();
      }.bind(this));
    },
    fetch: function fetch(url, type) {
      return new Promise(function ($return, $error) {
        var data, code;
        return Promise.resolve(window.fetch(url)).then(function ($await_48) {
          try {
            data = $await_48;

            if (data.status == 404) {
              return $error(new Error('Oxe.loader.load - not found ' + url));
            }

            if (data.status < 200 || data.status > 300 && data.status != 304) {
              return $error(new Error(data.statusText));
            }

            return Promise.resolve(data.text()).then(function ($await_49) {
              try {
                code = $await_49;

                if (type === 'es' || type === 'est') {
                  code = Transformer.template(code);
                }

                if (type === 'es' || type === 'esm') {
                  code = Transformer.module(code, url);
                }

                code = new Function('window', 'document', '$LOADER', code);
                this.data[url] = code(window, window.document, this);
                return $return(this.data[url]);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    },
    load: function load() {
      var $args = arguments;
      return new Promise(function ($return, $error) {
        var url, type;

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

        if (url in this.data === false) {
          this.data[url] = this.fetch(url, type);
        }

        return $return(this.data[url]);
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
        var _index3 = this.events[name].indexOf(method);

        if (_index3 !== -1) {
          this.events[name].splice(_index3, 1);
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
        var self, i, l, component, load;
        self = this;
        options = options || {};

        if (options.components) {
          i = 0, l = options.components.length;
          var $Loop_9_trampoline;

          function $Loop_9_step() {
            i++;
            return $Loop_9;
          }

          function $Loop_9() {
            if (i < l) {
              component = options.components[i];

              if (typeof component === 'string') {
                return Promise.resolve(Loader.load(component)).then(function ($await_50) {
                  try {
                    load = $await_50;
                    component = load.default;
                    return $If_11.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_11() {
                self.define(component);
                return $Loop_9_step;
              }

              return $If_11.call(this);
            } else return [1];
          }

          return ($Loop_9_trampoline = function (q) {
            while (q) {
              if (q.then) return void q.then($Loop_9_trampoline, $error);

              try {
                if (q.pop) {
                  if (q.length) return q.pop() ? $Loop_9_exit.call(this) : q;else q = $Loop_9_step;
                } else q = q.call(this);
              } catch (_exception) {
                return $error(_exception);
              }
            }
          }.bind(this))($Loop_9);

          function $Loop_9_exit() {
            return $If_8.call(this);
          }
        }

        function $If_8() {
          return $return();
        }

        return $If_8.call(this);
      }.bind(this));
    },
    slot: function slot(target, source, scope) {
      var targetSlots = target.querySelectorAll('slot[name]');
      var defaultSlot = target.querySelector('slot:not([name])');

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

      if (defaultSlot) {
        if (source.children.length) {
          while (source.firstChild) {
            defaultSlot.parentNode.insertBefore(source.firstChild, defaultSlot);
          }
        }

        defaultSlot.parentNode.removeChild(defaultSlot);
      }
    },
    fragment: function fragment(template, container) {
      var fragment = document.createDocumentFragment();
      var parser = document.createElement('div');
      parser.innerHTML = template;

      while (parser.firstElementChild) {
        View.addContextNode(parser.firstElementChild, {
          container: container,
          scope: container.scope
        });
        fragment.appendChild(parser.firstElementChild);
      }

      return fragment;
    },
    style: function style(_style, scope) {
      if (!_style) return '';

      if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
        var matches = _style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

        for (var i = 0, l = matches.length; i < l; i++) {
          var match = matches[i];
          var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
          var pattern = new RegExp('var\\(' + rule[1] + '\\)', 'g');
          _style = _style.replace(rule[0], '');
          _style = _style.replace(pattern, rule[2]);
        }
      }

      if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':scope')) {
        _style = _style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
      }

      if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':host')) {
        _style = _style.replace(/\:host/g, '[o-scope="' + scope + '"]');
      }

      return '<style>' + _style + '</style>';
    },
    render: function render(element, options) {
      element.setAttribute('o-scope', element.scope);

      if (this.compiled && element.parentElement.nodeName === 'O-ROUTER') {
        return;
      }

      var style = this.style(options.style, element.scope);
      var template = style + options.template;
      var fragment = this.fragment(template, element);

      if (options.shadow) {
        if ('attachShadow' in document.body) {
          element.attachShadow({
            mode: 'open'
          }).appendChild(fragment);
        } else if ('createShadowRoot' in document.body) {
          element.createShadowRoot().appendChild(fragment);
        }
      } else {
        this.slot(fragment, element);
        element.appendChild(fragment);
      }
    },
    define: function define(options) {
      var self = this;
      if (!options.name) throw new Error('Oxe.component.define - requires name');
      if (options.name in self.data) throw new Error('Oxe.component.define - component previously defined');
      self.data[options.name] = options;
      options.count = 0;
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
            return Model.set(this.scope, data && _typeof(data) === 'object' ? data : {});
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
    target: null,
    contain: false,
    compiled: false,
    folder: './routes',
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};
        this.base = options.base === undefined ? this.base : options.base;
        this.mode = options.mode === undefined ? this.mode : options.mode;
        this.after = options.after === undefined ? this.after : options.after;
        this.folder = options.folder === undefined ? this.folder : options.folder;
        this.before = options.before === undefined ? this.before : options.before;
        this.change = options.change === undefined ? this.change : options.change;
        this.target = options.target === undefined ? this.target : options.target;
        this.contain = options.contain === undefined ? this.contain : options.contain;
        this.external = options.external === undefined ? this.external : options.external;

        if (!this.target || typeof this.target === 'string') {
          this.target = document.body.querySelector(this.target || 'o-router');
        }

        if (!this.target) return $error(new Error('Oxe.router.setup - target option required'));
        return Promise.resolve(this.add(options.routes)).then(function ($await_51) {
          try {
            return Promise.resolve(this.route(window.location.href, {
              mode: 'replace',
              setup: true
            })).then(function ($await_52) {
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
            return $If_13.call(this);
          } else {
            if (data.constructor === Object) {
              if (!data.path) {
                return $error(new Error('Oxe.router.add - route path required'));
              }

              if (!data.load && !data.component) {
                return $error(new Error('Oxe.router.add -  route.component or route.load required'));
              }

              this.data.push(data);
              return $If_14.call(this);
            } else {
              if (data.constructor === Array) {
                i = 0, l = data.length;
                var $Loop_16_trampoline;

                function $Loop_16_step() {
                  i++;
                  return $Loop_16;
                }

                function $Loop_16() {
                  if (i < l) {
                    return Promise.resolve(this.add(data[i])).then(function ($await_53) {
                      try {
                        return $Loop_16_step;
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }, $error);
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
                  return $If_15.call(this);
                }
              }

              function $If_15() {
                return $If_14.call(this);
              }

              return $If_15.call(this);
            }

            function $If_14() {
              return $If_13.call(this);
            }
          }

          function $If_13() {
            return $If_12.call(this);
          }
        }

        function $If_12() {
          return $return();
        }

        return $If_12.call(this);
      }.bind(this));
    },
    load: function load(route) {
      return new Promise(function ($return, $error) {
        var load, _load;

        if (route.load) {
          return Promise.resolve(Loader.load(route.load)).then(function ($await_54) {
            try {
              load = $await_54;
              route = Object.assign({}, load.default, route);
              return $If_18.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_18() {
          if (typeof route.component === 'string') {
            route.load = route.component;
            return Promise.resolve(Loader.load(route.load)).then(function ($await_55) {
              try {
                _load = $await_55;
                route.component = _load.default;
                return $If_19.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_19() {
            return $return(route);
          }

          return $If_19.call(this);
        }

        return $If_18.call(this);
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
        var $Loop_20_trampoline;

        function $Loop_20_step() {
          i++;
          return $Loop_20;
        }

        function $Loop_20() {
          if (i < l) {
            if (this.data[i].path === path) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_56) {
                try {
                  this.data[i] = $await_56;
                  return $return(this.data[i]);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $Loop_20_step;
          } else return [1];
        }

        return ($Loop_20_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_20_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_20_exit.call(this) : q;else q = $Loop_20_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_20);

        function $Loop_20_exit() {
          return $return();
        }
      }.bind(this));
    },
    filter: function filter(path) {
      return new Promise(function ($return, $error) {
        var result, i, l;
        result = [];
        i = 0, l = this.data.length;
        var $Loop_23_trampoline;

        function $Loop_23_step() {
          i++;
          return $Loop_23;
        }

        function $Loop_23() {
          if (i < l) {
            if (this.compare(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_57) {
                try {
                  this.data[i] = $await_57;
                  result.push(this.data[i]);
                  return $If_25.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_25() {
              return $Loop_23_step;
            }

            return $If_25.call(this);
          } else return [1];
        }

        return ($Loop_23_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_23_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_23_exit.call(this) : q;else q = $Loop_23_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_23);

        function $Loop_23_exit() {
          return $return(result);
        }
      }.bind(this));
    },
    find: function find(path) {
      return new Promise(function ($return, $error) {
        var i, l;
        i = 0, l = this.data.length;
        var $Loop_26_trampoline;

        function $Loop_26_step() {
          i++;
          return $Loop_26;
        }

        function $Loop_26() {
          if (i < l) {
            if (this.compare(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_58) {
                try {
                  this.data[i] = $await_58;
                  return $return(this.data[i]);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $Loop_26_step;
          } else return [1];
        }

        return ($Loop_26_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_26_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_26_exit.call(this) : q;else q = $Loop_26_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_26);

        function $Loop_26_exit() {
          return $return();
        }
      }.bind(this));
    },
    render: function render(route) {
      return new Promise(function ($return, $error) {
        if (!route) {
          return $error(new Error('Oxe.render - route argument required. Missing object option.'));
        }

        if (!route.component && !route.target) {
          return $error(new Error('Oxe.render - route property required. Missing component or target option.'));
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

        if (!route.target) {
          if (route.component.constructor === String) {
            route.target = window.document.createElement(route.component);
          } else if (route.component.constructor === Object) {
            Component.define(route.component);

            if (this.compiled) {
              route.target = this.target.firstElementChild;
              this.scroll(0, 0);
              return $return();
            } else {
              route.target = window.document.createElement(route.component.name);
            }
          }
        }

        while (this.target.firstChild) {
          this.target.removeChild(this.target.firstChild);
        }

        this.target.appendChild(route.target);
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
        return Promise.resolve(this.find(location.pathname)).then(function ($await_59) {
          try {
            route = $await_59;

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

            function $If_30() {
              if (typeof this.before === 'function') {
                return Promise.resolve(this.before(location)).then(function ($await_62) {
                  try {
                    return $If_31.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_31() {
                this.emit('route:before', location);

                if (mode === 'href' || this.compiled) {
                  if (!options.setup) {
                    return $return(window.location.assign(location.path));
                  }
                }

                window.history[mode + 'State']({
                  path: location.path
                }, '', location.path);
                this.location = location;
                return Promise.resolve(this.render(location.route)).then(function ($await_63) {
                  try {
                    if (typeof this.after === 'function') {
                      return Promise.resolve(this.after(location)).then(function ($await_64) {
                        try {
                          return $If_32.call(this);
                        } catch ($boundEx) {
                          return $error($boundEx);
                        }
                      }.bind(this), $error);
                    }

                    function $If_32() {
                      this.emit('route:after', location);
                      return $return();
                    }

                    return $If_32.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              return $If_31.call(this);
            }

            if (typeof this.before === 'function') {
              return Promise.resolve(this.before(location)).then(function ($await_62) {
                try {
                  return $If_31.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_31() {
              this.emit('route:before', location);

              if (mode === 'href' || this.compiled) {
                if (!options.setup) {
                  return $return(window.location.assign(location.path));
                }
              }

              window.history[mode + 'State']({
                path: location.path
              }, '', location.path);
              this.location = location;
              return Promise.resolve(this.render(location.route)).then(function ($await_63) {
                try {
                  if (typeof this.after === 'function') {
                    return Promise.resolve(this.after(location)).then(function ($await_64) {
                      try {
                        return $If_32.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_32() {
                    this.emit('route:after', location);
                    return $return();
                  }

                  return $If_32.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $If_31.call(this);
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
  var tStyle = document.createTextNode("\n\t*[hidden] {\n\t\tdisplay: none !important;\n\t}\n\to-router, o-router > :first-child {\n\t\tdisplay: block;\n\t\tanimation: o-transition var(--o-transition) ease-in-out;\n\t}\n\t@keyframes o-transition {\n\t\t0% { opacity: 0; }\n\t\t100% { opacity: 1; }\n\t}\n");
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

    if (meta && meta.getAttribute('content') === 'compiled') {
      Router.compiled = true;
      Component.compiled = true;
    }

    if (!options[0]) {
      throw new Error('Oxe - script attribute o-setup requires path');
    }

    Loader.type = options[1] || 'esm';
    Promise.resolve(Loader.load(options[0]));
  }

  var SETUP = false;
  var GLOBAL = {};
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

    get component() {
      return Component;
    },

    get batcher() {
      return Batcher;
    },

    get fetcher() {
      return Fetcher;
    },

    get methods() {
      return Methods;
    },

    get utility() {
      return Utility;
    },

    get binder() {
      return Binder;
    },

    get loader() {
      return Loader;
    },

    get router() {
      return Router;
    },

    get model() {
      return Model;
    },

    get path() {
      return Path;
    },

    get view() {
      return View;
    },

    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        if (SETUP) return $return();else SETUP = true;
        options = options || {};
        options.listener = options.listener || {};
        return Promise.resolve(this.binder.setup(options.binder)).then(function ($await_65) {
          try {
            return Promise.resolve(this.view.setup(options.view)).then(function ($await_66) {
              try {
                return Promise.resolve(this.model.setup(options.model)).then(function ($await_67) {
                  try {
                    document.addEventListener('input', Input, true);
                    document.addEventListener('click', Click, true);
                    document.addEventListener('change', Change, true);
                    window.addEventListener('popstate', State, true);
                    document.addEventListener('reset', function (event) {
                      if (event.target.hasAttribute('o-reset')) {
                        event.preventDefault();
                        var before;
                        var after;

                        if (options.listener.reset) {
                          before = typeof options.listener.reset.before === 'function' ? options.listener.reset.before.bind(null, event) : null;
                          after = typeof options.listener.reset.after === 'function' ? options.listener.reset.after.bind(null, event) : null;
                        }

                        Promise.resolve().then(before).then(Reset.bind(null, event)).then(after);
                      }
                    }, true);
                    document.addEventListener('submit', function (event) {
                      if (event.target.hasAttribute('o-submit')) {
                        event.preventDefault();
                        var before;
                        var after;

                        if (options.listener.submit) {
                          before = typeof options.listener.submit.before === 'function' ? options.listener.submit.before.bind(null, event) : null;
                          after = typeof options.listener.submit.after === 'function' ? options.listener.submit.after.bind(null, event) : null;
                        }

                        Promise.resolve().then(before).then(Submit.bind(null, event)).then(after);
                      }
                    }, true);

                    if (options.listener.before) {
                      return Promise.resolve(options.listener.before()).then(function ($await_68) {
                        try {
                          return $If_33.call(this);
                        } catch ($boundEx) {
                          return $error($boundEx);
                        }
                      }.bind(this), $error);
                    }

                    function $If_33() {
                      if (options.style) {
                        if ('transition' in options.style) {
                          window.document.documentElement.style.setProperty('--o-transition', "".concat(options.style.transition, "ms"));
                        }
                      }

                      if (options.path) {
                        return Promise.resolve(this.path.setup(options.path)).then(function ($await_69) {
                          try {
                            return $If_34.call(this);
                          } catch ($boundEx) {
                            return $error($boundEx);
                          }
                        }.bind(this), $error);
                      }

                      function $If_34() {
                        if (options.fetcher) {
                          return Promise.resolve(this.fetcher.setup(options.fetcher)).then(function ($await_70) {
                            try {
                              return $If_35.call(this);
                            } catch ($boundEx) {
                              return $error($boundEx);
                            }
                          }.bind(this), $error);
                        }

                        function $If_35() {
                          if (options.loader) {
                            return Promise.resolve(this.loader.setup(options.loader)).then(function ($await_71) {
                              try {
                                return $If_36.call(this);
                              } catch ($boundEx) {
                                return $error($boundEx);
                              }
                            }.bind(this), $error);
                          }

                          function $If_36() {
                            if (options.component) {
                              return Promise.resolve(this.component.setup(options.component)).then(function ($await_72) {
                                try {
                                  return $If_37.call(this);
                                } catch ($boundEx) {
                                  return $error($boundEx);
                                }
                              }.bind(this), $error);
                            }

                            function $If_37() {
                              if (options.router) {
                                return Promise.resolve(this.router.setup(options.router)).then(function ($await_73) {
                                  try {
                                    return $If_38.call(this);
                                  } catch ($boundEx) {
                                    return $error($boundEx);
                                  }
                                }.bind(this), $error);
                              }

                              function $If_38() {
                                if (options.listener.after) {
                                  return Promise.resolve(options.listener.after()).then(function ($await_74) {
                                    try {
                                      return $If_39.call(this);
                                    } catch ($boundEx) {
                                      return $error($boundEx);
                                    }
                                  }.bind(this), $error);
                                }

                                function $If_39() {
                                  return $return();
                                }

                                return $If_39.call(this);
                              }

                              return $If_38.call(this);
                            }

                            return $If_37.call(this);
                          }

                          return $If_36.call(this);
                        }

                        return $If_35.call(this);
                      }

                      return $If_34.call(this);
                    }

                    return $If_33.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
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
  return index;
});