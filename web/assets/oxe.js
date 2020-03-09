function _await(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _empty() {}

function _awaitIgnored(value, direct) {
  if (!direct) {
    return value && value.then ? value.then(_empty) : Promise.resolve();
  }
}

function _invokeIgnored(body) {
  var result = body();

  if (result && result.then) {
    return result.then(_empty);
  }
}

function _async(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

function _invoke(body, then) {
  var result = body();

  if (result && result.then) {
    return result.then(then);
  }

  return then(result);
}

function _settle(pact, state, value) {
  if (!pact.s) {
    if (value instanceof _Pact) {
      if (value.s) {
        if (state & 1) {
          state = value.s;
        }

        value = value.v;
      } else {
        value.o = _settle.bind(null, pact, state);
        return;
      }
    }

    if (value && value.then) {
      value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
      return;
    }

    pact.s = state;
    pact.v = value;
    var observer = pact.o;

    if (observer) {
      observer(pact);
    }
  }
}

var _Pact = function () {
  function _Pact() {}

  _Pact.prototype.then = function (onFulfilled, onRejected) {
    var result = new _Pact();
    var state = this.s;

    if (state) {
      var callback = state & 1 ? onFulfilled : onRejected;

      if (callback) {
        try {
          _settle(result, 1, callback(this.v));
        } catch (e) {
          _settle(result, 2, e);
        }

        return result;
      } else {
        return this;
      }
    }

    this.o = function (_this) {
      try {
        var value = _this.v;

        if (_this.s & 1) {
          _settle(result, 1, onFulfilled ? onFulfilled(value) : value);
        } else if (onRejected) {
          _settle(result, 1, onRejected(value));
        } else {
          _settle(result, 2, value);
        }
      } catch (e) {
        _settle(result, 2, e);
      }
    };

    return result;
  };

  return _Pact;
}();

function _isSettledPact(thenable) {
  return thenable instanceof _Pact && thenable.s & 1;
}

function _for(test, update, body) {
  var stage;

  for (;;) {
    var shouldContinue = test();

    if (_isSettledPact(shouldContinue)) {
      shouldContinue = shouldContinue.v;
    }

    if (!shouldContinue) {
      return result;
    }

    if (shouldContinue.then) {
      stage = 0;
      break;
    }

    var result = body();

    if (result && result.then) {
      if (_isSettledPact(result)) {
        result = result.s;
      } else {
        stage = 1;
        break;
      }
    }

    if (update) {
      var updateValue = update();

      if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
        stage = 2;
        break;
      }
    }
  }

  var pact = new _Pact();

  var reject = _settle.bind(null, pact, 2);

  (stage === 0 ? shouldContinue.then(_resumeAfterTest) : stage === 1 ? result.then(_resumeAfterBody) : updateValue.then(_resumeAfterUpdate)).then(void 0, reject);
  return pact;

  function _resumeAfterBody(value) {
    result = value;

    do {
      if (update) {
        updateValue = update();

        if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
          updateValue.then(_resumeAfterUpdate).then(void 0, reject);
          return;
        }
      }

      shouldContinue = test();

      if (!shouldContinue || _isSettledPact(shouldContinue) && !shouldContinue.v) {
        _settle(pact, 1, result);

        return;
      }

      if (shouldContinue.then) {
        shouldContinue.then(_resumeAfterTest).then(void 0, reject);
        return;
      }

      result = body();

      if (_isSettledPact(result)) {
        result = result.v;
      }
    } while (!result || !result.then);

    result.then(_resumeAfterBody).then(void 0, reject);
  }

  function _resumeAfterTest(shouldContinue) {
    if (shouldContinue) {
      result = body();

      if (result && result.then) {
        result.then(_resumeAfterBody).then(void 0, reject);
      } else {
        _resumeAfterBody(result);
      }
    } else {
      _settle(pact, 1, result);
    }
  }

  function _resumeAfterUpdate() {
    if (shouldContinue = test()) {
      if (shouldContinue.then) {
        shouldContinue.then(_resumeAfterTest).then(void 0, reject);
      } else {
        _resumeAfterTest(shouldContinue);
      }
    } else {
      _settle(pact, 1, result);
    }
  }
}

function _continueIgnored(value) {
  if (value && value.then) {
    return value.then(_empty);
  }
}

function _continue(value, then) {
  return value && value.then ? value.then(then) : then(value);
}

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = global || self, global.Oxe = factory());
})(this, function () {
  'use strict';

  var STYLE = document.createElement('style');
  var SHEET = STYLE.sheet;
  STYLE.setAttribute('title', 'oxe');
  STYLE.setAttribute('type', 'text/css');
  var Style = Object.freeze({
    style: STYLE,
    sheet: SHEET,
    add: function add(data) {
      this.sheet.insertRule(data);
    },
    append: function append(data) {
      this.style.appendChild(document.createTextNode(data));
    },
    setup: function setup(option) {
      try {
        var _this2 = this;

        option = option || {};

        if (option.style) {
          _this2.append(option.style);
        }

        document.head.appendChild(_this2.style);
        return _await();
      } catch (e) {
        return Promise.reject(e);
      }
    }
  });

  function traverse(data, path, end) {
    var keys = typeof path === 'string' ? path.split('.') : path;
    var length = keys.length - (end || 0);
    var result = data;

    for (var _index = 0; _index < length; _index++) {
      result = result[keys[_index]];
    }

    return result;
  }

  var Batcher = Object.freeze({
    reads: [],
    writes: [],
    options: {
      time: 1000 / 60,
      pending: false
    },
    setup: function setup() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      this.options.time = options.time || this.options.time;
    },
    tick: function tick(callback) {
      window.requestAnimationFrame(callback.bind(this));
    },
    schedule: function schedule() {
      if (this.options.pending) return;
      this.options.pending = true;
      this.tick(this.flush);
    },
    flush: function flush(time) {
      var task;

      while (task = this.reads.shift()) {
        if (task) {
          task();
        }

        if (performance.now() - time > this.options.time) {
          return this.tick(this.flush);
        }
      }

      while (task = this.writes.shift()) {
        if (task) {
          task();
        }

        if (performance.now() - time > this.options.time) {
          return this.tick(this.flush);
        }
      }

      if (this.reads.length === 0 && this.writes.length === 0) {
        this.options.pending = false;
      } else if (performance.now() - time > this.options.time) {
        this.tick(this.flush);
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
      if (!data.read && !data.write) return;
      data.context = data.context || {};
      data.context.read = true;
      data.context.write = true;
      self.reads.push(data.read ? function () {
        if (this.read) {
          return data.read.call(data.context, data.context);
        }
      }.bind(data.context, data.context) : null);
      self.writes.push(data.write ? function () {
        if (this.write) {
          return data.write.call(data.context, data.context);
        }
      }.bind(data.context, data.context) : null);
      self.schedule();
    }
  });

  function Piper(binder, data) {
    if (binder.type === 'on') {
      return data;
    }

    if (!binder.pipes.length) {
      return data;
    }

    var source = binder.container.methods;

    if (!Object.keys(source).length) {
      return data;
    }

    for (var i = 0, l = binder.pipes.length; i < l; i++) {
      var path = binder.pipes[i];
      var method = traverse(source, path);

      if (method instanceof Function) {
        data = method.call(binder.container, data);
      } else {
        console.warn("Oxe.piper - pipe ".concat(path, " invalid"));
      }
    }

    return data;
  }

  function Class(binder) {
    var data, name;
    return {
      read: function read() {
        data = binder.data;

        if (binder.names.length > 1) {
          name = binder.names.slice(1).join('-');
        }
      },
      write: function write() {
        if (data === undefined || data === null) {
          if (name) {
            binder.target.classList.remove(name);
          } else {
            binder.target.setAttribute('class', '');
          }
        } else {
          if (name) {
            binder.target.classList.toggle(name, data);
          } else {
            binder.target.setAttribute('class', data);
          }
        }
      }
    };
  }

  function Default(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (data === undefined || data === null) {
          data = '';
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = data.toString();
        }

        if (data === binder.target[binder.type]) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.setAttribute(binder.type, data);
        binder.target[binder.type] = data;
      }
    };
  }

  function Disable(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (data === binder.target.disabled) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.disabled = data;
      }
    };
  }

  function Each(binder) {
    var self = this;
    if (binder.meta.pending) return;else binder.meta.pending = true;
    var data;

    var read = function read() {
      data = binder.data || [];

      if (!binder.meta.setup) {
        binder.meta.keys = [];
        binder.meta.counts = [];
        binder.meta.setup = false;
        binder.meta.pending = false;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.templateString = binder.target.innerHTML;
        binder.meta.fragment = document.createDocumentFragment();
        binder.meta.templateLength = binder.target.childNodes.length;

        while (binder.target.firstChild) {
          binder.target.removeChild(binder.target.firstChild);
        }

        binder.meta.setup = true;
      }

      binder.meta.keys = data ? Object.keys(data) : [];
      binder.meta.targetLength = binder.meta.keys.length;

      if (binder.meta.currentLength === binder.meta.targetLength) {
        binder.meta.pending = false;
        this.write = false;
      }
    };

    var write = function write() {
      if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
          var count = binder.meta.templateLength;

          while (count--) {
            var node = binder.target.lastChild;
            binder.target.removeChild(node);
            Promise.resolve().then(self.remove.bind(self, node)).catch(console.error);
          }

          binder.meta.currentLength--;
        }
      } else if (binder.meta.currentLength < binder.meta.targetLength) {
        while (binder.meta.currentLength < binder.meta.targetLength) {
          var _index2 = binder.meta.currentLength;
          var key = binder.meta.keys[_index2];
          var variablePattern = new RegExp("\\[".concat(binder.names[1], "\\]"), 'g');
          var indexPattern = new RegExp("({{)?\\[".concat(binder.names[2], "\\](}})?"), 'g');
          var keyPattern = new RegExp("({{)?\\[".concat(binder.names[3], "\\](}})?"), 'g');
          var clone = binder.meta.templateString.replace(variablePattern, "".concat(binder.path, ".").concat(key)).replace(indexPattern, _index2).replace(keyPattern, key);
          var parsed = new DOMParser().parseFromString(clone, 'text/html').body;

          var _node = void 0;

          while (_node = parsed.firstChild) {
            binder.meta.fragment.appendChild(_node);
            Promise.resolve().then(self.add.bind(self, _node, binder.container, binder.scope)).catch(console.error);
          }

          binder.meta.currentLength++;
        }

        binder.target.appendChild(binder.meta.fragment);
      }

      binder.meta.pending = false;
    };

    return {
      read: read,
      write: write
    };
  }

  function Enable(binder) {
    var data;
    return {
      read: function read() {
        data = !binder.data;

        if (data === binder.target.disabled) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.disabled = data;
      }
    };
  }

  function Hide(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (data === binder.target.hidden) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.hidden = data;
      }
    };
  }

  function Href(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data || '';

        if (data === binder.target.href) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.href = data;
      }
    };
  }

  function Html(binder) {
    var self = this;
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (data === undefined || data === null) {
          data = '';
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = String(data);
        }
      },
      write: function write() {
        while (binder.target.firstChild) {
          var node = binder.target.removeChild(binder.target.firstChild);
          self.remove(node);
        }

        var fragment = document.createDocumentFragment();
        var parser = document.createElement('div');
        parser.innerHTML = data;

        while (parser.firstElementChild) {
          self.add(parser.firstElementChild, {
            container: binder.container,
            scope: binder.container.scope
          });
          fragment.appendChild(parser.firstElementChild);
        }

        binder.target.appendChild(fragment);
      }
    };
  }

  function Label(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (data === undefined || data === null) {
          data = '';
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = data.toString();
        }

        if (data === binder.target.getAttribute('label')) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.setAttribute('label', data);
      }
    };
  }

  function On(binder) {
    var data;
    binder.target[binder.names[1]] = null;
    return {
      read: function read() {
        data = binder.data;

        if (typeof data !== 'function') {
          console.warn("Oxe - binder ".concat(binder.name, "=\"").concat(binder.value, "\" invalid type function required"));
          return;
        }

        if (binder.meta.method) {
          binder.target.removeEventListener(binder.names[1], binder.meta.method);
        }

        binder.meta.method = function (events) {
          var parameters = [];

          for (var i = 0, l = binder.pipes.length; i < l; i++) {
            var path = binder.pipes[i];
            var parameter = traverse(binder.container.model, path);
            parameters.push(parameter);
          }

          parameters.push(events);
          Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);
        };

        binder.target.addEventListener(binder.names[1], binder.meta.method);
      }
    };
  }

  function Read(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (data === binder.target.readOnly) {
          this.write = false;
          return;
        }
      },
      write: function write() {
        binder.target.readOnly = data;
      }
    };
  }

  function Require(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (data === binder.target.required) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.required = data;
      }
    };
  }

  var reset = _async(function (binder, event) {
    var _this3 = this;

    event.preventDefault();
    var elements = event.target.querySelectorAll('*');

    for (var i = 0, l = elements.length; i < l; i++) {
      var element = elements[i];
      var name = element.nodeName;
      var type = element.type;

      if (!type && name !== 'TEXTAREA' || type === 'submit' || type === 'button' || !type) {
        return;
      }

      var _binder = _this3.get(element, 'o-value');

      if (!_binder) {
        if (type === 'select-one' || type === 'select-multiple') {
          element.selectedIndex = null;
        } else if (type === 'radio' || type === 'checkbox') {
          element.checked = false;
        } else {
          element.value = null;
        }
      } else if (type === 'select-one') {
        _binder.data = null;
      } else if (type === 'select-multiple') {
        _binder.data = [];
      } else if (type === 'radio' || type === 'checkbox') {
        _binder.data = false;
      } else {
        _binder.data = '';
      }
    }

    var method = binder.data;
    return _invokeIgnored(function () {
      if (typeof method === 'function') {
        return _awaitIgnored(method.call(binder.container, event));
      }
    });
  });

  function Reset(binder) {
    if (binder.meta.method) {
      binder.target.removeEventListener('reset', binder.meta.method, false);
    } else {
      binder.meta.method = reset.bind(this, binder);
      binder.target.addEventListener('reset', binder.meta.method, false);
    }
  }

  function Show(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (!data === binder.target.hidden) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.hidden = !data;
      }
    };
  }

  function Style$1(binder) {
    var data, name, names;
    return {
      read: function read() {
        data = binder.data;

        if (binder.names.length > 1) {
          name = '';
          names = binder.names.slice(1);

          for (var i = 0, l = names.length; i < l; i++) {
            if (i === 0) {
              name = names[i].toLowerCase();
            } else {
              name += names[i].charAt(0).toUpperCase() + names[i].slice(1).toLowerCase();
            }
          }
        }
      },
      write: function write() {
        if (binder.names.length > 1) {
          if (data) {
            binder.target.style[name] = data;
          } else {
            binder.target.style[name] = '';
          }
        } else {
          if (data) {
            binder.target.style.cssText = data;
          } else {
            binder.target.style.cssText = '';
          }
        }
      }
    };
  }

  var submit = _async(function (binder, event) {
    var _this4 = this;

    event.preventDefault();
    var data = {};
    var elements = event.target.querySelectorAll('*');

    for (var i = 0, l = elements.length; i < l; i++) {
      var element = elements[i];

      if (!element.type && element.nodeName !== 'TEXTAREA' || element.type === 'submit' || element.type === 'button' || !element.type) {
        return;
      }

      var attribute = element.attributes['o-value'];

      var b = _this4.get(attribute);

      console.warn('todo: need to get a value for selects');
      var value = b ? b.data : element.files ? element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0] : element.value;
      var name = element.name || (b ? b.values[b.values.length - 1] : null);
      if (!name) return;
      data[name] = value;
    }

    return _invoke(function () {
      if (typeof binder.data === 'function') {
        return _awaitIgnored(binder.data.call(binder.container, data, event));
      }
    }, function () {
      if ('o-reset' in event.target.attributes) {
        event.target.reset();
      }
    });
  });

  function Submit(binder) {
    var self = this;
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (typeof data !== 'function') {
          return console.warn("Oxe - binder ".concat(binder.name, "=\"").concat(binder.value, "\" invalid type function required"));
        }

        if (binder.meta.method) {
          console.log('remove method');
          binder.target.removeEventListener('submit', binder.meta.method);
        }

        binder.meta.method = submit.bind(self, binder);
        binder.target.addEventListener('submit', binder.meta.method);
      }
    };
  }

  function Text(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (data === undefined || data === null) {
          data = '';
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = data.toString();
        }

        if (data === binder.target.textContent) {
          this.write = false;
          return;
        }
      },
      write: function write() {
        binder.target.textContent = data;
      }
    };
  }

  function Match(source, target) {
    if (source === target) {
      return true;
    }

    if (source === null || source === undefined) {
      return false;
    }

    if (target === null || target === undefined) {
      return false;
    }

    if (_typeof(source) !== _typeof(target)) {
      return false;
    }

    if (source.constructor !== target.constructor) {
      return false;
    }

    if (_typeof(source) !== 'object' || _typeof(target) !== 'object') {
      return source === target;
    }

    var sourceKeys = Object.keys(source);
    var targetKeys = Object.keys(target);

    if (sourceKeys.length !== targetKeys.length) {
      return false;
    }

    for (var i = 0; i < sourceKeys.length; i++) {
      var name = sourceKeys[i];

      if (!Match(source[name], target[name])) {
        return false;
      }
    }

    return true;
  }

  function Index(items, item) {
    for (var i = 0; i < items.length; i++) {
      if (Match(items[i], item)) {
        return i;
      }
    }

    return -1;
  }

  function Includes(items, item) {
    for (var i = 0; i < items.length; i++) {
      if (Match(items[i], item)) {
        return true;
      }
    }

    return false;
  }

  function multiple(element) {
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
  }

  function Value(binder, data, e) {
    var _this5 = this;

    var self = this;
    var type = binder.target.type;
    if (binder.meta.busy) return;else binder.meta.busy = true;

    if (!binder.meta.setup) {
      binder.meta.setup = true;
      binder.target.addEventListener('input', function (e) {
        return _this5.render(binder, data, e);
      });
    }

    if (type === 'select-one' || type === 'select-multiple') {
      return {
        read: function read() {
          this.options = binder.target.options;
          this.multiple = multiple(binder.target);

          if (this.multiple && binder.data instanceof Array === false) {
            binder.data = [];
          }
        },
        write: function write() {
          var fallback = [];
          var multiple = this.multiple;
          var options = this.options;

          for (var i = 0; i < options.length; i++) {
            var option = options[i];
            var selected = option.selected;
            var optionBinder = self.get(option, 'value');
            var value = optionBinder ? optionBinder.data : option.value;

            if (option.hasAttribute('selected')) {
              fallback.push({
                option: option,
                value: value
              });
            }

            if (e) {
              if (multiple) {
                if (selected) {
                  var includes = Includes(binder.data, value);

                  if (!includes) {
                    binder.data.push(value);
                  }
                } else {
                  var _index3 = Index(binder.data, value);

                  if (_index3 !== -1) {
                    binder.data.splice(_index3, 1);
                  }
                }
              } else {
                if (selected) {
                  binder.data = value;
                  break;
                }
              }
            } else {
              if (multiple) {
                var _includes = Includes(binder.data, value);

                if (_includes) {
                  option.selected = true;
                } else {
                  option.selected = false;
                }
              } else {
                var match = Match(binder.data, value);

                if (match) {
                  option.selected = true;
                  break;
                }
              }
            }
          }

          if (this.selectedIndex === -1) {
            if (multiple) {
              for (var _i = 0; _i < fallback.length; _i++) {
                var _fallback$_i = fallback[_i],
                    _option = _fallback$_i.option,
                    _value = _fallback$_i.value;

                if (e) {
                  binder.data.push(_value);
                } else {
                  _option.selected = true;
                }
              }
            }
          }

          binder.meta.busy = false;
        }
      };
    } else if (type === 'radio') {
      return {
        read: function read() {
          this.form = binder.target.form || binder.container;
          this.query = "input[type=\"radio\"][o-value=\"".concat(binder.value, "\"]");
          this.nodes = this.form.querySelectorAll(this.query);
          this.radios = Array.prototype.slice.call(this.nodes);

          if (e) {
            binder.data = this.radios.indexOf(binder.target);
            binder.meta.busy = false;
            return this.write = false;
          }

          if (typeof binder.data !== 'number') {
            binder.meta.busy = false;
            return this.write = false;
          }
        },
        write: function write() {
          for (var i = 0, l = this.radios.length; i < l; i++) {
            var radio = this.radios[i];

            if (i === binder.data) {
              radio.checked = true;
            } else {
              radio.checked = false;
            }
          }

          binder.meta.busy = false;
        }
      };
    } else if (type === 'checkbox') {
      return {
        read: function read() {
          if (e) {
            binder.data = binder.target.checked;
            binder.meta.busy = false;
            return this.write = false;
          }

          if (typeof binder.data !== 'boolean') {
            binder.meta.busy = false;
            return this.write = false;
          }
        },
        write: function write() {
          binder.target.checked = binder.data;
          binder.meta.busy = false;
        }
      };
    } else if (type === 'file') {
      return {
        read: function read() {
          this.multiple = multiple(binder.target);
          binder.data = this.multiple ? Array.prototype.slice.call(binder.target.files) : binder.target.files[0];
          binder.meta.busy = false;
        }
      };
    } else {
      return {
        read: function read() {
          if (binder.data === binder.target.value) {
            binder.meta.busy = false;
            return this.write = false;
          }

          if (e) {
            binder.data = binder.target.value;
            binder.meta.busy = false;
            return this.write = false;
          }
        },
        write: function write() {
          binder.target.value = binder.data === undefined || binder.data === null ? '' : binder.data;
          binder.meta.busy = false;
        }
      };
    }
  }

  function Write(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (!data === binder.target.readOnly) {
          return this.write = false;
        }
      },
      write: function write() {
        binder.target.readOnly = !data;
      }
    };
  }

  var PIPE = /\s?\|\s?/;
  var PIPES = /\s?,\s?|\s+/;
  var PATH = /\s?,\s?|\s?\|\s?|\s+/;
  var Binder = Object.freeze({
    prefix: 'o-',
    syntaxEnd: '}}',
    syntaxStart: '{{',
    prefixReplace: new RegExp('^o-'),
    syntaxReplace: new RegExp('{{|}}', 'g'),
    data: new Map(),
    binders: {
      class: Class,
      css: Style$1,
      default: Default,
      disable: Disable,
      disabled: Disable,
      each: Each,
      enable: Enable,
      enabled: Enable,
      hide: Hide,
      hidden: Hide,
      href: Href,
      html: Html,
      label: Label,
      on: On,
      read: Read,
      require: Require,
      required: Require,
      reset: Reset,
      show: Show,
      showed: Show,
      style: Style$1,
      submit: Submit,
      text: Text,
      value: Value,
      write: Write
    },
    setup: function setup(options) {
      try {
        var _this7 = this;

        options = options || {};

        for (var name in _this7.binders) {
          _this7.binders[name] = _this7.binders[name].bind(_this7);
        }

        if (options.binders) {
          for (var _name in options.binders) {
            if (_name in _this7.binders === false) {
              _this7.binders[_name] = options.binders[_name].bind(_this7);
            }
          }
        }

        return _await();
      } catch (e) {
        return Promise.reject(e);
      }
    },
    get: function get(node) {
      return this.data.get(node);
    },
    render: function render(binder, data, e) {
      var type = binder.type in this.binders ? binder.type : 'default';
      var render = this.binders[type](binder, data, e);
      Batcher.batch(render);
    },
    unbind: function unbind(node) {
      return this.data.remove(node);
    },
    expression: function expression(data) {},
    bind: function bind(target, name, value, container, scope, attr) {
      value = value.replace(this.syntaxReplace, '').trim();
      name = name.replace(this.syntaxReplace, '').replace(this.prefixReplace, '').trim();

      if (name.indexOf('on') === 0) {
        name = 'on-' + name.slice(2);
      }

      var pipe = value.split(PIPE);
      var paths = value.split(PATH);
      var names = name.split('-');
      var values = pipe[0] ? pipe[0].split('.') : [];
      var pipes = pipe[1] ? pipe[1].split(PIPES) : [];
      var meta = {};
      var type = names[0];
      var path = paths[0];
      var parts = paths[0].split('.');
      var location = "".concat(scope, ".").concat(path);
      var keys = [scope].concat(parts);
      var property = parts.slice(-1)[0];
      var binder = Object.freeze({
        location: location,
        type: type,
        path: path,
        scope: scope,
        name: name,
        value: value,
        target: target,
        container: container,
        keys: keys,
        names: names,
        pipes: pipes,
        values: values,
        meta: meta,

        get data() {
          var source = traverse(container.model, parts, 1);

          if (names[0] === 'value') {
            return source[property];
          } else {
            return Piper(this, source[property]);
          }
        },

        set data(value) {
          var source = traverse(container.model, parts, 1);

          if (names[0] === 'value') {
            source[property] = Piper(this, value);
          } else {
            source[property] = value;
          }
        }

      });
      this.data.set(attr || binder.target, binder);
      this.render(binder);
    },
    remove: function remove(node) {
      var attributes = node.attributes;

      for (var i = 0; i < attributes.length; i++) {
        var attribute = attributes[i];
        this.unbind(attribute);
      }

      this.unbind(node);
      node = node.firstChild;

      while (node) {
        this.remove(node);
        node = node.nextSibling;
      }
    },
    add: function add(node, container, scope) {
      var type = node.nodeType;

      if (type === Node.TEXT_NODE) {
        var start = node.textContent.indexOf(this.syntaxStart);
        if (start === -1) return;
        if (start !== 0) node = node.splitText(start);
        var end = node.textContent.indexOf(this.syntaxEnd);
        if (end === -1) return;

        if (end + this.syntaxStart.length !== node.textContent.length) {
          var split = node.splitText(end + this.syntaxEnd.length);
          this.bind(node, 'text', node.textContent, container, scope);
          this.add(split);
        } else {
          this.bind(node, 'text', node.textContent, container, scope);
        }
      } else if (type === Node.ELEMENT_NODE) {
        var skip = false;
        var attributes = node.attributes;

        for (var i = 0; i < attributes.length; i++) {
          var attribute = attributes[i];
          var name = attribute.name,
              value = attribute.value;

          if (name.indexOf(this.prefix) === 0 || name.indexOf(this.syntaxStart) !== -1 && name.indexOf(this.syntaxEnd) !== -1 || value.indexOf(this.syntaxStart) !== -1 && value.indexOf(this.syntaxEnd) !== -1) {
            if (name.indexOf('each') === 0 || name.indexOf("".concat(this.prefix, "each")) === 0) {
              skip = true;
            }

            this.bind(node, name, value, container, scope, attribute);
          }
        }

        if (skip) return;
        node = node.firstChild;

        while (node) {
          this.add(node, container, scope);
          node = node.nextSibling;
        }
      }
    }
  });
  var BASE;

  var setup = _async(function (option) {
    option = option || {};

    if (option.base) {
      BASE = window.document.querySelector('base');

      if (!BASE) {
        BASE = window.document.createElement('base');
        window.document.head.insertBefore(BASE, window.document.head.firstElementChild);
      }

      BASE.href = option.base;
    }

    return _await();
  });

  var base = function base() {
    if (!BASE) BASE = window.document.querySelector('base');
    if (BASE) return BASE.href;
    return window.location.origin + (window.location.pathname ? window.location.pathname : '/');
  };

  var extension = function extension(data) {
    var position = data.lastIndexOf('.');
    return position > 0 ? data.slice(position + 1) : '';
  };

  var resolve = function resolve() {
    var result = [];
    var origin = window.location.origin;
    var parser = window.document.createElement('a');

    for (var i = 0, l = arguments.length; i < l; i++) {
      var path = arguments[i];
      if (!path) continue;
      parser.href = path;

      if (parser.origin === origin) {
        if (path.indexOf(origin) === 0) {
          result.push(path.slice(origin.length));
        } else {
          result.push(path);
        }
      } else {
        return path;
      }
    }

    parser.href = result.join('/').replace(/\/+/g, '/');
    return parser.pathname;
  };

  var Path = Object.freeze({
    setup: setup,
    base: base,
    extension: extension,
    resolve: resolve
  });
  var S_EXPORT = "\n    ^export\\b\n    (?:\n        \\s*(default)\\s*\n    )?\n    (?:\n        \\s*(var|let|const|function|class)\\s*\n    )?\n    (\\s*?:{\\s*)?\n    (\n        (?:\\w+\\s*,?\\s*)*\n    )?\n    (\\s*?:}\\s*)?\n".replace(/\s+/g, '');
  var S_IMPORT = "\n    import\n    (?:\n        (?:\n            \\s+(\\w+)(?:\\s+|\\s*,\\s*)\n        )\n        ?\n        (?:\n            (?:\\s+(\\*\\s+as\\s+\\w+)\\s+)\n            |\n            (?:\n                \\s*{\\s*\n                (\n                    (?:\n                        (?:\n                            (?:\\w+)\n                            |\n                            (?:\\w+\\s+as\\s+\\w+)\n                        )\n                        \\s*,?\\s*\n                    )\n                    *\n                )\n                \\s*}\\s*\n            )\n        )\n        ?\n        from\n    )\n    ?\n    \\s*\n    (?:\"|')\n    (.*?)\n    (?:'|\")\n    (?:\\s*;)?\n".replace(/\s+/g, '');
  var MODULES = {};
  var R_IMPORT = new RegExp(S_IMPORT);
  var R_EXPORT = new RegExp(S_EXPORT);
  var R_IMPORTS = new RegExp(S_IMPORT, 'g');
  var R_EXPORTS = new RegExp(S_EXPORT, 'gm');
  var R_TEMPLATES = /[^\\]`(.|[\r\n])*?[^\\]`/g;

  var transform = function transform(code, url) {
    var before = "window.Oxe.loader.data[\"".concat(url, "\"] = Promise.all([\n");
    var after = ']).then(function ($MODULES) {\n';
    var templateMatches = code.match(R_TEMPLATES) || [];

    for (var i = 0; i < templateMatches.length; i++) {
      var templateMatch = templateMatches[i];
      code = code.replace(templateMatch, templateMatch.replace(/'/g, '\\\'').replace(/^([^\\])?`/, '$1\'').replace(/([^\\])?`$/, '$1\'').replace(/\${(.*)?}/g, '\'+$1+\'').replace(/\n/g, '\\n'));
    }

    var parentImport = url.slice(0, url.lastIndexOf('/') + 1);
    var importMatches = code.match(R_IMPORTS) || [];

    for (var _i2 = 0, l = importMatches.length; _i2 < l; _i2++) {
      var importMatch = importMatches[_i2].match(R_IMPORT);

      if (!importMatch) continue;
      var rawImport = importMatch[0];
      var nameImport = importMatch[1];
      var pathImport = importMatch[4] || importMatch[5];

      if (pathImport.slice(0, 1) !== '/') {
        pathImport = Path.resolve(parentImport, pathImport);
      } else {
        pathImport = Path.resolve(pathImport);
      }

      before = before + '\twindow.Oxe.loader.load("' + pathImport + '"),\n';
      after = after + 'var ' + nameImport + ' = $MODULES[' + _i2 + '].default;\n';
      code = code.replace(rawImport, '') || [];
    }

    var hasDefault = false;
    var exportMatches = code.match(R_EXPORTS) || [];

    for (var _i3 = 0, _l = exportMatches.length; _i3 < _l; _i3++) {
      var exportMatch = exportMatches[_i3].match(R_EXPORT) || [];
      var rawExport = exportMatch[0];
      var defaultExport = exportMatch[1] || '';
      var typeExport = exportMatch[2] || '';
      var nameExport = exportMatch[3] || '';

      if (defaultExport) {
        if (hasDefault) {
          code = code.replace(rawExport, "$DEFAULT = ".concat(typeExport, " ").concat(nameExport));
        } else {
          hasDefault = true;
          code = code.replace(rawExport, "var $DEFAULT = ".concat(typeExport, " ").concat(nameExport));
        }
      }
    }

    if (hasDefault) {
      code += '\n\nreturn { default: $DEFAULT };\n';
    }

    code = '"use strict";\n' + before + after + code + '});';
    return code;
  };

  var IMPORT = function IMPORT(url) {
    return new Promise(function (resolve, reject) {
      var a = window.document.createElement('a');
      a.href = url;
      url = a.href;

      if (MODULES[url]) {
        return resolve(MODULES[url]);
      }

      var script = document.createElement('script');

      var clean = function clean() {
        script.remove();
        URL.revokeObjectURL(script.src);
      };

      script.defer = 'defer';

      if ('noModule' in script) {
        script.type = 'module';
      }

      script.onerror = function () {
        reject(new Error("failed to import: ".concat(url)));
        clean();
      };

      script.onload = function () {
        resolve(MODULES[url]);
        clean();
      };

      {
        console.log('noModule no');
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 0) {
              var code = transform(xhr.responseText, url);
              var blob = new Blob([code], {
                type: 'text/javascript'
              });
              script.src = URL.createObjectURL(blob);
              window.document.head.appendChild(script);
            } else {
              reject(new Error("failed to import: ".concat(url)));
              clean();
            }
          }
        };

        try {
          xhr.open('GET', url, true);
          xhr.send();
        } catch (_unused) {
          reject(new Error("failed to import: ".concat(url)));
          clean();
        }
      }
    });
  };

  var native = true;

  try {
    new Function('import("")');
  } catch (_unused2) {
    native = false;
  }

  var load = _async(function (url) {
    if (!url) throw new Error('Oxe.loader.load - url argument required');
    url = Path.resolve(url);

    if (native) {
      console.log('native import');
      return new Function('url', 'return import(url)')(url);
    } else {
      console.log('not native import');
      return IMPORT(url);
    }
  });

  var setup$1 = _async(function () {
    var _this8 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var loads = options.loads;
    return loads ? Promise.all(loads.map(function (load) {
      return _this8.load(load);
    })) : _await();
  });

  var Loader = Object.freeze({
    data: MODULES,
    options: {},
    setup: setup$1,
    load: load
  });
  var methods = ['push', 'pop', 'splice', 'shift', 'unshift', 'reverse'];
  var Observer = {
    get: function get(tasks, handler, path, target, property) {
      if (target instanceof Array && methods.indexOf(property) !== -1) {
        tasks.push(handler.bind(null, target, path.slice(0, -1)));
      }

      return target[property];
    },
    set: function set(tasks, handler, path, target, property, value) {
      target[property] = this.create(value, handler, path + property, tasks);

      if (tasks.length) {
        Promise.resolve().then(function () {
          var task;

          while (task = tasks.shift()) {
            task();
          }
        }).catch(console.error);
      }

      return true;
    },
    create: function create(source, handler, path, tasks) {
      path = path || '';
      tasks = tasks || [];
      tasks.push(handler.bind(null, source, path));

      if (source instanceof Object === false && source instanceof Array === false) {
        if (!path && tasks.length) {
          Promise.resolve().then(function () {
            var task;

            while (task = tasks.shift()) {
              task();
            }
          }).catch(console.error);
        }

        return source;
      }

      path = path ? path + '.' : '';

      if (source instanceof Array) {
        for (var key = 0; key < source.length; key++) {
          tasks.push(handler.bind(null, source[key], path + key));
          source[key] = this.create(source[key], handler, path + key, tasks);
        }
      }

      if (source instanceof Object) {
        for (var _key in source) {
          tasks.push(handler.bind(null, source[_key], path + _key));
          source[_key] = this.create(source[_key], handler, path + _key, tasks);
        }
      }

      if (!path && tasks.length) {
        Promise.resolve().then(function () {
          var task;

          while (task = tasks.shift()) {
            task();
          }
        }).catch(console.error);
      }

      return new Proxy(source, {
        get: this.get.bind(this, tasks, handler, path),
        set: this.set.bind(this, tasks, handler, path)
      });
    }
  };

  if (window.Reflect === undefined) {
    window.Reflect = window.Reflect || {};

    window.Reflect.construct = function (parent, args, child) {
      var target = child === undefined ? parent : child;
      var prototype = target.prototype || Object.prototype;
      var copy = Object.create(prototype);
      return Function.prototype.apply.call(parent, copy, args) || copy;
    };
  }

  function extend(extender, extending) {
    var construct = function construct() {
      var instance = window.Reflect.construct(extending, [], this.constructor);
      extender.call(instance);
      return instance;
    };

    var prototypes = Object.getOwnPropertyDescriptors(extender.prototype);
    construct.prototype = Object.create(extending.prototype);
    Object.defineProperties(construct.prototype, prototypes);
    Object.defineProperty(construct.prototype, 'constructor', {
      enumerable: false,
      writable: true,
      value: construct
    });
    return construct;
  }

  var setup$2 = _async(function () {
    var _this9 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var components = options.components;
    return components ? Promise.all(components.map(function (component) {
      if (typeof component === 'string') {
        return Loader.load(component).then(function (load) {
          return _this9.define(load.default);
        });
      } else {
        return _this9.define(component);
      }
    })) : _await();
  });

  var style = function style(_style, name) {
    _style = _style.replace(/\n|\r|\t/g, '');
    _style = _style.replace(/:host/g, name);

    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
      var matches = _style.match(/--\w+(?:-+\w+)*:\s*.*?;/g) || [];

      for (var i = 0, l = matches.length; i < l; i++) {
        var match = matches[i];
        var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
        var pattern = new RegExp('var\\(' + rule[1] + '\\)', 'g');
        _style = _style.replace(rule[0], '');
        _style = _style.replace(pattern, rule[2]);
      }
    }

    return _style;
  };

  var slot = function slot(element, fragment) {
    var fragmentSlots = fragment.querySelectorAll('slot[name]');
    var defaultSlot = fragment.querySelector('slot:not([name])');

    for (var i = 0, l = fragmentSlots.length; i < l; i++) {
      var fragmentSlot = fragmentSlots[i];
      var name = fragmentSlot.getAttribute('name');
      var elementSlot = element.querySelector('[slot="' + name + '"]');

      if (elementSlot) {
        fragmentSlot.parentNode.replaceChild(elementSlot, fragmentSlot);
      } else {
        fragmentSlot.parentNode.removeChild(fragmentSlot);
      }
    }

    if (defaultSlot) {
      if (element.children.length) {
        while (element.firstChild) {
          defaultSlot.parentNode.insertBefore(element.firstChild, defaultSlot);
        }
      }

      defaultSlot.parentNode.removeChild(defaultSlot);
    }
  };

  var fragment = function fragment(element, template, adopt) {
    var fragment = document.createDocumentFragment();
    var clone = template.cloneNode(true);
    var child = clone.firstElementChild;

    while (child) {
      if (!adopt) {
        Binder.add(child, element, element.scope);
      }

      fragment.appendChild(child);
      child = clone.firstElementChild;
    }

    return fragment;
  };

  var render = function render(element, template, adopt, shadow) {
    if (!template) return;
    var fragment = this.fragment(element, template);
    var root;

    if (shadow && 'attachShadow' in document.body) {
      root = element.attachShadow({
        mode: 'open'
      });
    } else if (shadow && 'createShadowRoot' in document.body) {
      root = element.createShadowRoot();
    } else {
      if (fragment) {
        this.slot(element, fragment);
      }

      root = element;
    }

    if (fragment) {
      root.appendChild(fragment);
    }

    if (adopt) {
      var child = root.firstElementChild;

      while (child) {
        Binder.add(child, element, element.scope);
        child = child.nextElementSibling;
      }
    }
  };

  var define = function define(options) {
    var self = this;

    if (_typeof(options) !== 'object') {
      return console.warn('Oxe.component.define - invalid argument type');
    }

    if (options.constructor === Array) {
      for (var i = 0, l = options.length; i < l; i++) {
        self.define(options[i]);
      }

      return;
    }

    if (!options.name) {
      return console.warn('Oxe.component.define - requires name');
    }

    options.count = 0;
    options.model = options.model || {};
    options.adopt = options.adopt || false;
    options.methods = options.methods || {};
    options.shadow = options.shadow || false;
    options.name = options.name.toLowerCase();
    options.attributes = options.attributes || [];

    if (typeof options.style === 'string') {
      options.style = this.style(options.style, options.name);
      Style.append(options.style);
    }

    if (typeof options.template === 'string') {
      options.template = new DOMParser().parseFromString(options.template, 'text/html').body;
    }

    var OElement = function OElement() {
      var scope = "".concat(options.name, "-").concat(options.count++);

      var handler = function handler(data, path) {
        var location = "".concat(scope, ".").concat(path);
        Binder.data.forEach(function (binder) {
          if (binder.location === location) {
            Binder.render(binder, data);
          }
        });
      };

      var model = Observer.create(options.model, handler);
      Object.defineProperties(this, {
        scope: {
          enumerable: true,
          value: scope
        },
        model: {
          enumerable: true,
          value: model
        },
        methods: {
          enumerable: true,
          value: options.methods
        }
      });

      if (options.properties) {
        Object.defineProperties(this, options.properties);
      }
    };

    if (options.prototype) {
      Object.assign(OElement.prototype, options.prototype);
    }

    OElement.prototype.observedAttributes = options.attributes;

    OElement.prototype.attributeChangedCallback = function () {
      if (options.attributed) options.attributed.apply(this, arguments);
    };

    OElement.prototype.adoptedCallback = function () {
      if (options.adopted) options.adopted.apply(this, arguments);
    };

    OElement.prototype.disconnectedCallback = function () {
      if (options.detached) options.detached.apply(this, arguments);
    };

    OElement.prototype.connectedCallback = function () {
      if (this.created) {
        if (options.attached) {
          options.attached.call(this);
        }
      } else {
        this.created = true;
        self.render(this, options.template, options.adopt, options.shadow);

        if (options.created && options.attached) {
          Promise.resolve().then(options.created.bind(this)).then(options.attached.bind(this));
        } else if (options.created) {
          Promise.resolve().then(options.created.bind(this));
        } else if (options.attached) {
          Promise.resolve().then(options.attached.bind(this));
        }
      }
    };

    window.customElements.define(options.name, extend(OElement, HTMLElement));
  };

  var Component = Object.freeze({
    setup: setup$2,
    style: style,
    slot: slot,
    fragment: fragment,
    render: render,
    define: define
  });
  console.warn('options function would need to be deprected');
  var Fetcher = Object.freeze({
    options: {},
    mime: {
      xml: 'text/xml; charset=utf-8',
      html: 'text/html; charset=utf-8',
      text: 'text/plain; charset=utf-8',
      json: 'application/json; charset=utf-8',
      js: 'application/javascript; charset=utf-8'
    },
    types: ['json', 'text', 'blob', 'formData', 'arrayBuffer'],
    setup: function setup(options) {
      try {
        var _this11 = this;

        options = options || {};
        _this11.options.path = options.path;
        _this11.options.origin = options.origin;
        _this11.options.request = options.request;
        _this11.options.response = options.response;
        _this11.options.acceptType = options.acceptType;
        _this11.options.headers = options.headers || {};
        _this11.options.method = options.method || 'get';
        _this11.options.credentials = options.credentials;
        _this11.options.contentType = options.contentType;
        _this11.options.responseType = options.responseType;
        return _await();
      } catch (e) {
        return Promise.reject(e);
      }
    },
    serialize: function serialize(data) {
      try {
        var query = '';

        for (var name in data) {
          query = query.length > 0 ? query + '&' : query;
          query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
        }

        return query;
      } catch (e) {
        return Promise.reject(e);
      }
    },
    fetch: function fetch(options) {
      try {
        var _exit4 = false;

        var _this13 = this;

        var data = Object.assign({}, options);
        data.path = data.path || _this13.options.path;
        data.origin = data.origin || _this13.options.origin;
        if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
        if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length - 1) === '/') data.origin = data.origin.slice(0, -1);
        if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;
        if (!data.method) throw new Error('Oxe.fetcher - requires method option');
        if (!data.url) throw new Error('Oxe.fetcher - requires url or origin and path option');
        if (!data.headers && _this13.options.headers) data.headers = _this13.options.headers;
        if (typeof data.method === 'string') data.method = data.method.toUpperCase() || _this13.options.method;
        if (!data.acceptType && _this13.options.acceptType) data.acceptType = _this13.options.acceptType;
        if (!data.contentType && _this13.options.contentType) data.contentType = _this13.options.contentType;
        if (!data.responseType && _this13.options.responseType) data.responseType = _this13.options.responseType;
        if (!data.credentials && _this13.options.credentials) data.credentials = _this13.options.credentials;
        if (!data.mode && _this13.options.mode) data.mode = _this13.options.mode;
        if (!data.cache && _this13.options.cache) data.cahce = _this13.options.cache;
        if (!data.redirect && _this13.options.redirect) data.redirect = _this13.options.redirect;
        if (!data.referrer && _this13.options.referrer) data.referrer = _this13.options.referrer;
        if (!data.referrerPolicy && _this13.options.referrerPolicy) data.referrerPolicy = _this13.options.referrerPolicy;
        if (!data.signal && _this13.options.signal) data.signal = _this13.options.signal;
        if (!data.integrity && _this13.options.integrity) data.integrity = _this13.options.integrity;
        if (!data.keepAlive && _this13.options.keepAlive) data.keepAlive = _this13.options.keepAlive;

        if (data.contentType) {
          data.headers = data.headers || {};

          switch (data.contentType) {
            case 'js':
              data.headers['Content-Type'] = _this13.mime.js;
              return;

            case 'xml':
              data.headers['Content-Type'] = _this13.mime.xml;
              return;

            case 'html':
              data.headers['Content-Type'] = _this13.mime.html;
              return;

            case 'json':
              data.headers['Content-Type'] = _this13.mime.json;
              return;

            default:
              data.headers['Content-Type'] = data.contentType;
          }
        }

        if (data.acceptType) {
          data.headers = data.headers || {};

          switch (data.acceptType) {
            case 'js':
              data.headers['Accept'] = _this13.mime.js;
              return;

            case 'xml':
              data.headers['Accept'] = _this13.mime.xml;
              return;

            case 'html':
              data.headers['Accept'] = _this13.mime.html;
              return;

            case 'json':
              data.headers['Accept'] = _this13.mime.json;
              return;

            default:
              data.headers['Accept'] = data.acceptType;
          }
        }

        return _invoke(function () {
          if (typeof _this13.options.request === 'function') {
            var copy = Object.assign({}, data);
            return _await(_this13.options.request(copy), function (result) {
              if (result === false) {
                _exit4 = true;
                return data;
              }

              if (_typeof(result) === 'object') {
                Object.assign(data, result);
              }
            });
          }
        }, function (_result) {
          return _exit4 ? _result : _invoke(function () {
            if (data.body) {
              return _invokeIgnored(function () {
                if (data.method === 'GET') {
                  var _temp2 = data.url + '?';

                  return _await(_this13.serialize(data.body), function (_this12$serialize) {
                    data.url = _temp2 + _this12$serialize;
                  });
                } else if (data.contentType === 'json') {
                  data.body = JSON.stringify(data.body);
                }
              });
            }
          }, function () {
            return _await(window.fetch(data.url, Object.assign({}, data)), function (fetched) {
              var _exit2 = false;
              data.code = fetched.status;
              data.headers = fetched.headers;
              data.message = fetched.statusText;
              return _invoke(function () {
                if (!data.responseType) {
                  data.body = fetched.body;
                } else {
                  var responseType = data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType || '';
                  var contentType = fetched.headers.get('content-type') || fetched.headers.get('Content-Type') || '';
                  var type;

                  if (responseType === 'json' && contentType.indexOf('json') !== -1) {
                    type = 'json';
                  } else {
                    type = responseType || 'text';
                  }

                  if (_this13.types.indexOf(type) === -1) throw new Error('Oxe.fetch - invalid responseType value');
                  return _await(fetched[type](), function (_fetched$type) {
                    data.body = _fetched$type;
                  });
                }
              }, function (_result2) {
                var _exit3 = false;
                if (_exit2) return _result2;
                return _invoke(function () {
                  if (_this13.options.response) {
                    var copy = Object.assign({}, data);
                    return _await(_this13.options.response(copy), function (result) {
                      if (result === false) {
                        _exit3 = true;
                        return data;
                      }

                      if (_typeof(result) === 'object') {
                        Object.assign(data, result);
                      }
                    });
                  }
                }, function (_result3) {
                  return _exit3 ? _result3 : data;
                });
              });
            });
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    },
    post: function post(data) {
      try {
        var _this15 = this;

        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'post';
        return _this15.fetch(data);
      } catch (e) {
        return Promise.reject(e);
      }
    },
    get: function get(data) {
      try {
        var _this17 = this;

        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'get';
        return _this17.fetch(data);
      } catch (e) {
        return Promise.reject(e);
      }
    },
    put: function put(data) {
      try {
        var _this19 = this;

        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'put';
        return _this19.fetch(data);
      } catch (e) {
        return Promise.reject(e);
      }
    },
    head: function head(data) {
      try {
        var _this21 = this;

        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'head';
        return _this21.fetch(data);
      } catch (e) {
        return Promise.reject(e);
      }
    },
    patch: function patch(data) {
      try {
        var _this23 = this;

        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'patch';
        return _this23.fetch(data);
      } catch (e) {
        return Promise.reject(e);
      }
    },
    delete: function _delete(data) {
      try {
        var _this25 = this;

        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'delete';
        return _this25.fetch(data);
      } catch (e) {
        return Promise.reject(e);
      }
    },
    connect: function connect(data) {
      try {
        var _this27 = this;

        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'connect';
        return _this27.fetch(data);
      } catch (e) {
        return Promise.reject(e);
      }
    }
  });
  var Events = Object.freeze({
    events: {},
    on: function on(name, method) {
      if (!(name in this.events)) this.events[name] = [];
      this.events[name].push(method);
    },
    off: function off(name, method) {
      if (!(name in this.events)) return;
      var index = this.events[name].indexOf(method);
      if (index !== -1) this.events[name].splice(index, 1);
    },
    emit: function emit(name) {
      var _this28 = this;

      if (!(name in this.events)) return;
      var methods = this.events[name];
      var args = Array.prototype.slice.call(arguments, 2);
      Promise.all(methods.map(function (method) {
        return method.apply(_this28, args);
      })).catch(console.error);
    }
  });

  function ensure(data) {
    data.query = data.query || '';
    data.scope = data.scope || document.body;
    data.position = data.position || 'beforeend';
    var element = data.scope.querySelector("".concat(data.name).concat(data.query));

    if (!element) {
      element = document.createElement(data.name);
      data.scope.insertAdjacentElement(data.position, element);
    }

    for (var i = 0, l = data.attributes.length; i < l; i++) {
      var _data$attributes$i = data.attributes[i],
          name = _data$attributes$i.name,
          value = _data$attributes$i.value;
      element.setAttribute(name, value);
    }

    return element;
  }

  var Router = Object.freeze({
    data: [],
    location: {},
    option: {
      mode: 'push',
      target: null,
      contain: false,
      folder: './routes',
      external: null,
      before: null,
      after: null
    },
    setup: function setup(option) {
      try {
        var _this30 = this;

        option = option || {};
        _this30.option.after = option.after === undefined ? _this30.option.after : option.after;
        _this30.option.before = option.before === undefined ? _this30.option.before : option.before;
        _this30.option.external = option.external === undefined ? _this30.option.external : option.external;
        _this30.option.mode = option.mode === undefined ? _this30.option.mode : option.mode;
        _this30.option.folder = option.folder === undefined ? _this30.option.folder : option.folder;
        _this30.option.target = option.target === undefined ? _this30.option.target : option.target;
        _this30.option.contain = option.contain === undefined ? _this30.option.contain : option.contain;

        if (!_this30.option.target || typeof _this30.option.target === 'string') {
          _this30.option.target = document.body.querySelector(_this30.option.target || 'o-router');
        }

        if (_this30.option.mode !== 'href') {
          window.addEventListener('popstate', _this30.state.bind(_this30), true);
          window.document.addEventListener('click', _this30.click.bind(_this30), true);
        }

        window.customElements.define('o-router', extend(function () {}, HTMLElement));
        return _await(_this30.add(option.routes), function () {
          return _awaitIgnored(_this30.route(window.location.href, {
            mode: 'replace'
          }));
        });
      } catch (e) {
        return Promise.reject(e);
      }
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
          if (routeParts[i] === '(~)') {
            return true;
          } else if (routeParts[i].indexOf('~') !== -1) {
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
      userPath = Path.resolve(userPath);
      routePath = Path.resolve(routePath);

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
          var name = part.slice(1, part.length - 1).replace('~', '');
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
      try {
        var _this32 = this;

        return function () {
          if (!data) {} else return function () {
            if (data.constructor === String) {
              var _load = data;
              var path = data;
              if (path.slice(-3) === '.js') path = path.slice(0, -3);
              if (path.slice(-5) === 'index') path = path.slice(0, -5);
              if (path.slice(-6) === 'index/') path = path.slice(0, -6);
              if (path.slice(0, 2) === './') path = path.slice(2);
              if (path.slice(0, 1) !== '/') path = '/' + path;
              if (_load.slice(-3) !== '.js') _load = _load + '.js';
              if (_load.slice(0, 2) === './') _load = _load.slice(2);
              if (_load.slice(0, 1) !== '/') _load = '/' + _load;
              if (_this32.option.folder.slice(-1) === '/') _this32.option.folder = _this32.option.folder.slice(0, -1);
              _load = _this32.option.folder + '/' + _load;

              _this32.data.push({
                path: path,
                load: _load
              });
            } else return function () {
              if (data.constructor === Object) {
                if (!data.path) {
                  throw new Error('Oxe.router.add - route path required');
                }

                if (!data.name && !data.load && !data.component) {
                  throw new Error('Oxe.router.add -  route requires name, load, or component property');
                }

                _this32.data.push(data);
              } else return _invokeIgnored(function () {
                if (data.constructor === Array) {
                  var _i4 = 0,
                      _l2 = data.length;
                  return _continueIgnored(_for(function () {
                    return _i4 < _l2;
                  }, function () {
                    return _i4++;
                  }, function () {
                    return _awaitIgnored(_this32.add(data[_i4]));
                  }));
                }
              });
            }();
          }();
        }();
      } catch (e) {
        return Promise.reject(e);
      }
    },
    load: function load(route) {
      try {
        return _invoke(function () {
          if (route.load) {
            return _await(Loader.load(route.load), function (load) {
              route = Object.assign({}, load.default, route);
            });
          }
        }, function () {
          return _invoke(function () {
            if (typeof route.component === 'string') {
              route.load = route.component;
              return _await(Loader.load(route.load), function (load) {
                route.component = load.default;
              });
            }
          }, function () {
            return route;
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    },
    remove: function remove(path) {
      try {
        var _this34 = this;

        for (var _i5 = 0, _l3 = _this34.data.length; _i5 < _l3; _i5++) {
          if (_this34.data[_i5].path === path) {
            _this34.data.splice(_i5, 1);
          }
        }

        return _await();
      } catch (e) {
        return Promise.reject(e);
      }
    },
    get: function get(path) {
      try {
        var _exit6 = false;

        var _this36 = this;

        var _i6 = 0,
            _l4 = _this36.data.length;
        return _for(function () {
          return !_exit6 && _i6 < _l4;
        }, function () {
          return _i6++;
        }, function () {
          return function () {
            if (_this36.data[_i6].path === path) {
              return _await(_this36.load(_this36.data[_i6]), function (_this35$load) {
                _this36.data[_i6] = _this35$load;
                _exit6 = true;
                return _this36.data[_i6];
              });
            }
          }();
        });
      } catch (e) {
        return Promise.reject(e);
      }
    },
    filter: function filter(path) {
      try {
        var _this38 = this;

        var _result9 = [];
        var _i7 = 0,
            _l5 = _this38.data.length;
        return _continue(_for(function () {
          return _i7 < _l5;
        }, function () {
          return _i7++;
        }, function () {
          return _invokeIgnored(function () {
            if (_this38.compare(_this38.data[_i7].path, path)) {
              return _await(_this38.load(_this38.data[_i7]), function (_this37$load) {
                _this38.data[_i7] = _this37$load;

                _result9.push(_this38.data[_i7]);
              });
            }
          });
        }), function () {
          return _result9;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    },
    find: function find(path) {
      try {
        var _exit8 = false;

        var _this40 = this;

        var _i8 = 0,
            _l6 = _this40.data.length;
        return _for(function () {
          return !_exit8 && _i8 < _l6;
        }, function () {
          return _i8++;
        }, function () {
          return function () {
            if (_this40.compare(_this40.data[_i8].path, path)) {
              return _await(_this40.load(_this40.data[_i8]), function (_this39$load) {
                _this40.data[_i8] = _this39$load;
                _exit8 = true;
                return _this40.data[_i8];
              });
            }
          }();
        });
      } catch (e) {
        return Promise.reject(e);
      }
    },
    render: function render(route) {
      try {
        var _this42 = this;

        if (!route) {
          throw new Error('Oxe.render - route argument required. Missing object option.');
        }

        if (route.title) {
          document.title = route.title;
        }

        var ensures = [];

        if (route.keywords) {
          ensures.push({
            name: 'meta',
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

        if (route.description) {
          ensures.push({
            name: 'meta',
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

        if (route.canonical) {
          ensures.push({
            name: 'link',
            query: '[rel="canonical"]',
            attributes: [{
              name: 'rel',
              value: 'canonical'
            }, {
              name: 'href',
              value: route.canonical
            }]
          });
        }

        if (ensures.length) {
          Promise.all(ensures.map(function (option) {
            return Promise.resolve().then(function () {
              option.position = 'afterbegin';
              option.scope = document.head;
              return ensure(option);
            });
          }));
        }

        if (!route.target) {
          if (!route.component) {
            Component.define(route);
            route.target = window.document.createElement(route.name);
          } else if (route.component.constructor === String) {
            route.target = window.document.createElement(route.component);
          } else if (route.component.constructor === Object) {
            Component.define(route.component);
            route.target = window.document.createElement(route.component.name);
          } else {
            throw new Error('Oxe.router.render - route requires name, load, or component property');
          }
        }

        if (_this42.option.target) {
          while (_this42.option.target.firstChild) {
            _this42.option.target.removeChild(_this42.option.target.firstChild);
          }

          _this42.option.target.appendChild(route.target);
        }

        _this42.scroll(0, 0);

        return _await();
      } catch (e) {
        return Promise.reject(e);
      }
    },
    route: function route(path, options) {
      try {
        var _this44 = this;

        options = options || {};

        if (options.query) {
          path += _this44.toQueryString(options.query);
        }

        var mode = options.mode || _this44.option.mode;

        var location = _this44.toLocationObject(path);

        return _await(_this44.find(location.pathname), function (route) {
          var _exit9 = false;

          if (!route) {
            throw new Error("Oxe.router.route - missing route ".concat(location.pathname));
          }

          location.route = route;
          location.title = location.route.title;
          location.query = _this44.toQueryObject(location.search);
          location.parameters = _this44.toParameterObject(location.route.path, location.pathname);
          return _invoke(function () {
            if (location.route && location.route.handler) {
              _exit9 = true;
              return _await(location.route.handler(location));
            }
          }, function (_result12) {
            var _exit10 = false;
            if (_exit9) return _result12;
            return _invoke(function () {
              if (location.route && location.route.redirect) {
                _exit10 = true;
                return _await(_this44.redirect(location.route.redirect));
              }
            }, function (_result13) {
              return _exit10 ? _result13 : _invoke(function () {
                if (typeof _this44.option.before === 'function') {
                  return _awaitIgnored(_this44.option.before(location));
                }
              }, function () {
                Events.emit('route:before', location);

                if (mode === 'href') {
                  return window.location.assign(location.path);
                }

                window.history[mode + 'State']({
                  path: location.path
                }, '', location.path);
                _this44.location.href = location.href;
                _this44.location.host = location.host;
                _this44.location.port = location.port;
                _this44.location.hash = location.hash;
                _this44.location.path = location.path;
                _this44.location.route = location.route;
                _this44.location.title = location.title;
                _this44.location.query = location.query;
                _this44.location.search = location.search;
                _this44.location.protocol = location.protocol;
                _this44.location.hostname = location.hostname;
                _this44.location.pathname = location.pathname;
                _this44.location.parameters = location.parameters;
                return _await(_this44.render(location.route), function () {
                  return _invoke(function () {
                    if (typeof _this44.option.after === 'function') {
                      return _awaitIgnored(_this44.option.after(location));
                    }
                  }, function () {
                    Events.emit('route:after', location);
                  });
                });
              });
            });
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    },
    state: function state(event) {
      try {
        var _this46 = this;

        var path = event && event.state ? event.state.path : window.location.href;

        _this46.route(path, {
          mode: 'replace'
        });

        return _await();
      } catch (e) {
        return Promise.reject(e);
      }
    },
    click: function click(event) {
      try {
        var _this48 = this;

        if (event.target.type || event.button !== 0 || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
          return;
        }

        var target = event.path ? event.path[0] : event.target;
        var parent = target.parentElement;

        if (_this48.option.contain) {
          while (parent) {
            if (parent.nodeName === 'O-ROUTER') {
              break;
            } else {
              parent = parent.parentElement;
            }
          }

          if (parent.nodeName !== 'O-ROUTER') {
            return;
          }
        }

        while (target && 'A' !== target.nodeName) {
          target = target.parentElement;
        }

        if (!target || 'A' !== target.nodeName) {
          return;
        }

        if (target.hasAttribute('download') || target.hasAttribute('external') || target.hasAttribute('o-external') || target.href.indexOf('tel:') === 0 || target.href.indexOf('ftp:') === 0 || target.href.indexOf('file:') === 0 || target.href.indexOf('mailto:') === 0 || target.href.indexOf(window.location.origin) !== 0 || target.hash !== '' && target.origin === window.location.origin && target.pathname === window.location.pathname) return;
        if (_this48.option.external && (_this48.option.external.constructor === RegExp && _this48.option.external.test(target.href) || _this48.option.external.constructor === Function && _this48.option.external(target.href) || _this48.option.external.constructor === String && _this48.option.external === target.href)) return;
        event.preventDefault();

        if (_this48.location.href !== target.href) {
          _this48.route(target.href);
        }

        return _await();
      } catch (e) {
        return Promise.reject(e);
      }
    }
  });
  document.head.insertAdjacentHTML('afterbegin', '<style>:not(:defined){visibility:hidden;}o-router,o-router>:first-child{display:block;}</style>');
  var setup$3 = document.querySelector('script[o-setup]');
  var url = setup$3 ? setup$3.getAttribute('o-setup') : '';
  if (setup$3) Loader.load(url);
  var SETUP = false;
  var GLOBAL = {};
  var index = Object.freeze({
    global: GLOBAL,
    component: Component,
    batcher: Batcher,
    fetcher: Fetcher,
    binder: Binder,
    loader: Loader,
    router: Router,
    style: Style,
    path: Path,
    setup: function setup() {
      var _this49 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (SETUP) return;else SETUP = true;
      options.listener = options.listener || {};
      return Promise.all([this.path.setup(options.path), this.style.setup(options.style), this.binder.setup(options.binder), this.loader.setup(options.loader), this.fetcher.setup(options.fetcher)]).then(function () {
        if (options.listener.before) {
          return options.listener.before();
        }
      }).then(function () {
        if (options.component) {
          return _this49.component.setup(options.component);
        }
      }).then(function () {
        if (options.router) {
          return _this49.router.setup(options.router);
        }
      }).then(function () {
        if (options.listener.after) {
          return options.listener.after();
        }
      });
    }
  });
  return index;
});