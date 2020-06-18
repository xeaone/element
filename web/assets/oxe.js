
    /*
    	Name: oxe
    	Version: 5.2.9
    	License: MPL-2.0
    	Author: Alexander Elias
    	Email: alex.steven.elis@gmail.com
    	This Source Code Form is subject to the terms of the Mozilla Public
    	License, v. 2.0. If a copy of the MPL was not distributed with this
    	file, You can obtain one at http://mozilla.org/MPL/2.0/.
    */
    function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = global || self, global.Oxe = factory());
})(this, function () {
  'use strict';

  var methods = ['push', 'pop', 'splice', 'shift', 'unshift', 'reverse'];

  var get = function get(tasks, handler, path, target, property) {
    if (target instanceof Array && methods.indexOf(property) !== -1) {
      tasks.push(handler.bind(null, target, path.slice(0, -1)));
    }

    return target[property];
  };

  var set = function set(tasks, handler, path, target, property, value) {
    target[property] = create(value, handler, path + property, tasks);

    if (tasks.length) {
      Promise.resolve().then(function () {
        var task;

        while (task = tasks.shift()) {
          task();
        }
      }).catch(console.error);
    }

    return true;
  };

  var create = function create(source, handler, path, tasks) {
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
        source[key] = create(source[key], handler, path + key, tasks);
      }
    } else if (source instanceof Object) {
      for (var _key in source) {
        tasks.push(handler.bind(null, source[_key], path + _key));
        source[_key] = create(source[_key], handler, path + _key, tasks);
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
      get: get.bind(get, tasks, handler, path),
      set: set.bind(set, tasks, handler, path)
    });
  };

  var Observer = {
    get: get,
    set: set,
    create: create
  };

  function Traverse(data, path, end) {
    var keys = typeof path === 'string' ? path.split('.') : path;
    var length = keys.length - (end || 0);
    var result = data;

    for (var _index = 0; _index < length; _index++) {
      result = result[keys[_index]];
    }

    return result;
  }

  var reads = [];
  var writes = [];
  var options = {
    time: 1000 / 60,
    pending: false
  };

  var setup = function setup() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.options.time = options.time || this.options.time;
  };

  var tick = function tick(callback) {
    window.requestAnimationFrame(callback.bind(this));
  };

  var schedule = function schedule() {
    if (this.options.pending) return;
    this.options.pending = true;
    this.tick(this.flush);
  };

  var flush = function flush(time) {
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
  };

  var remove = function remove(tasks, task) {
    var index = tasks.indexOf(task);
    return !!~index && !!tasks.splice(index, 1);
  };

  var clear = function clear(task) {
    return this.remove(this.reads, task) || this.remove(this.writes, task);
  };

  var batch = function batch(data) {
    var self = this;
    if (!data) return;
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
  };

  var Batcher = Object.freeze({
    reads: reads,
    writes: writes,
    options: options,
    setup: setup,
    tick: tick,
    schedule: schedule,
    flush: flush,
    remove: remove,
    clear: clear,
    batch: batch
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

    for (var i = 0; i < binder.pipes.length; i++) {
      var path = binder.pipes[i];

      var _method = Traverse(source, path);

      if (_method instanceof Function) {
        data = _method.call(binder.container, data);
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
          this.write = false;
          return;
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
          this.write = false;
          return;
        }
      },
      write: function write() {
        binder.target.disabled = data;
      }
    };
  }

  function Each(binder) {
    if (binder.meta.busy) {
      console.log('busy each');
      return;
    } else binder.meta.busy = true;

    var data;

    var read = function read() {
      data = binder.data || [];

      if (!binder.meta.setup) {
        binder.meta.keys = [];
        binder.meta.counts = [];
        binder.meta.setup = false;
        binder.meta.busy = false;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.templateString = binder.target.innerHTML;
        binder.meta.templateLength = binder.target.childNodes.length;

        while (binder.target.firstChild) {
          binder.target.removeChild(binder.target.firstChild);
        }

        binder.meta.setup = true;
      }

      binder.meta.keys = data ? Object.keys(data) : [];
      binder.meta.targetLength = binder.meta.keys.length;

      if (binder.meta.currentLength === binder.meta.targetLength) {
        binder.meta.busy = false;
        this.write = false;
      }
    };

    var write = function write() {
      if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
          var count = binder.meta.templateLength;

          while (count--) {
            var _node = binder.target.lastChild;
            Promise.resolve().then(Binder$1.remove(_node));
            binder.target.removeChild(_node);
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

          var _node2 = void 0;

          while (_node2 = parsed.firstChild) {
            binder.target.appendChild(_node2);
            Promise.resolve().then(Binder$1.add(_node2, binder.container, binder.scope));
          }

          binder.meta.currentLength++;
        }
      }

      binder.meta.busy = false;
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
          this.write = false;
          return;
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
          this.write = false;
          return;
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
          this.write = false;
          return;
        }
      },
      write: function write() {
        binder.target.href = data;
      }
    };
  }

  function Html(binder) {
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
          var _node3 = binder.target.removeChild(binder.target.firstChild);

          Binder$1.remove(_node3);
        }

        var fragment = document.createDocumentFragment();
        var parser = document.createElement('div');
        parser.innerHTML = data;

        while (parser.firstElementChild) {
          Binder$1.add(parser.firstElementChild, {
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
          this.write = false;
          return;
        }
      },
      write: function write() {
        binder.target.setAttribute('label', data);
      }
    };
  }

  var on = function on(binder, event) {
    return new Promise(function ($return, $error) {
      var method;
      method = binder.data;

      if (typeof method === 'function') {
        return Promise.resolve(method.call(binder.container, event)).then(function ($await_33) {
          try {
            return $If_5.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_5() {
        return $return();
      }

      return $If_5.call(this);
    });
  };

  function On(binder) {
    var type = binder.names[1];
    binder.target[type] = null;

    if (typeof binder.data !== 'function') {
      console.warn("Oxe - binder ".concat(binder.name, "=\"").concat(binder.value, "\" invalid type function required"));
      return;
    }

    if (binder.meta.method) {
      binder.target.removeEventListener(type, binder.meta.method);
    }

    binder.meta.method = on.bind(this, binder);
    binder.target.addEventListener(type, binder.meta.method);
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
          this.write = false;
          return;
        }
      },
      write: function write() {
        binder.target.required = data;
      }
    };
  }

  var reset = function reset(binder, event) {
    return new Promise(function ($return, $error) {
      var elements, i, l, element, name, type, _binder, method;

      event.preventDefault();
      elements = event.target.querySelectorAll('*');

      for (i = 0, l = elements.length; i < l; i++) {
        element = elements[i];
        name = element.nodeName;
        type = element.type;

        if (!type && name !== 'TEXTAREA' || type === 'submit' || type === 'button' || !type) {
          continue;
        }

        _binder = Binder$1.get(element, 'o-value');

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

      method = binder.data;

      if (typeof method === 'function') {
        return Promise.resolve(method.call(binder.container, event)).then(function ($await_34) {
          try {
            return $If_6.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_6() {
        return $return();
      }

      return $If_6.call(this);
    });
  };

  function Reset(binder) {
    if (typeof binder.data !== 'function') {
      console.warn("Oxe - binder ".concat(binder.name, "=\"").concat(binder.value, "\" invalid type function required"));
      return;
    }

    if (binder.meta.method) {
      binder.target.removeEventListener('reset', binder.meta.method, false);
    }

    binder.meta.method = reset.bind(this, binder);
    binder.target.addEventListener('reset', binder.meta.method, false);
  }

  function Show(binder) {
    var data;
    return {
      read: function read() {
        data = binder.data;

        if (!data === binder.target.hidden) {
          this.write = false;
          return;
        }
      },
      write: function write() {
        binder.target.hidden = !data;
      }
    };
  }

  function Style(binder) {
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

  var submit = function submit(binder, event) {
    return new Promise(function ($return, $error) {
      var data, elements, i, l, element, attribute, b, value, name, method;
      event.preventDefault();
      data = {};
      elements = event.target.querySelectorAll('*');

      for (i = 0, l = elements.length; i < l; i++) {
        element = elements[i];

        if (!element.type && element.nodeName !== 'TEXTAREA' || element.type === 'submit' || element.type === 'button' || !element.type) {
          continue;
        }

        attribute = element.attributes['o-value'];
        b = Binder$1.get(attribute);
        console.warn('todo: need to get a value for selects');
        value = b ? b.data : element.files ? element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0] : element.value;
        name = element.name || (b ? b.values[b.values.length - 1] : null);
        if (!name) continue;
        data[name] = value;
      }

      method = binder.data;

      if (typeof method === 'function') {
        return Promise.resolve(method.call(binder.container, data, event)).then(function ($await_35) {
          try {
            return $If_7.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_7() {
        if ('o-reset' in event.target.attributes) {
          event.target.reset();
        }

        return $return();
      }

      return $If_7.call(this);
    });
  };

  function Submit(binder) {
    if (typeof binder.data !== 'function') {
      console.warn("Oxe - binder ".concat(binder.name, "=\"").concat(binder.value, "\" invalid type function required"));
      return;
    }

    if (binder.meta.method) {
      binder.target.removeEventListener('submit', binder.meta.method);
    }

    binder.meta.method = submit.bind(this, binder);
    binder.target.addEventListener('submit', binder.meta.method);
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

    var sourceType = _typeof(source);

    var targetType = _typeof(target);

    if (sourceType !== targetType) {
      return false;
    }

    if (sourceType !== 'object' || targetType !== 'object') {
      return source === target;
    }

    if (source.constructor !== target.constructor) {
      return false;
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

  function Value(binder, event) {
    var type = binder.target.type;

    if (binder.meta.busy) {
      console.log('busy value');
      return;
    } else {
      binder.meta.busy = true;
    }

    if (!binder.meta.setup) {
      binder.meta.setup = true;
      binder.target.addEventListener('input', function (event) {
        return Binder$1.render(binder, event);
      });
    }

    if (type === 'select-one' || type === 'select-multiple') {
      return {
        read: function read(ctx) {
          console.log(event);
          console.log(binder.target);
          console.log(binder.data);
          ctx.selectBinder = binder;
          ctx.select = binder.target;
          ctx.options = binder.target.options;
          ctx.multiple = binder.target.multiple;

          if (ctx.multiple && binder.data instanceof Array === false) {
            ctx.data = binder.data = [];
          } else {
            ctx.data = binder.data;
          }

          ctx.selects = [];
          ctx.unselects = [];

          var _loop = function _loop(i) {
            var node = ctx.options[i];
            var selected = node.selected;
            var attribute = node.attributes['o-value'] || node.attributes['value'];
            var option = Binder$1.get(attribute) || {
              get data() {
                return node.value;
              },

              set data(data) {
                return node.value = data;
              }

            };

            if (ctx.multiple) {
              var _index3 = Index(binder.data, option.data);

              if (event) {
                if (selected && _index3 === -1) {
                  binder.data.push(option.data);
                } else if (!selected && _index3 !== -1) {
                  binder.data.splice(_index3, 1);
                }
              } else {
                if (_index3 === -1) {
                  ctx.unselects.push(node);
                } else {
                  ctx.selects.push(node);
                }
              }
            } else {
              var match = Match(binder.data, option.data);

              if (event) {
                if (selected && !match) {
                  binder.data = option.data;
                } else if (!selected && match) {
                  return "continue";
                }
              } else {
                if (match) {
                  ctx.selects.push(node);
                } else {
                  ctx.unselects.push(node);
                }
              }
            }
          };

          for (var i = 0; i < ctx.options.length; i++) {
            var _ret = _loop(i);

            if (_ret === "continue") continue;
          }
        },
        write: function write(ctx) {
          var selects = ctx.selects,
              unselects = ctx.unselects;
          selects.forEach(function (option) {
            option.selected = true;
            console.log(option, option.selected, 'select');
          });
          unselects.forEach(function (option) {
            option.selected = false;
            console.log(option, option.selected, 'unselects');
          });
          binder.meta.busy = false;
        }
      };
    } else if (type === 'radio') {
      return {
        read: function read() {
          this.form = binder.target.form || binder.container;
          this.query = "input[type=\"radio\"][o-value=\"".concat(binder.value, "\"]");
          this.radios = _toConsumableArray(this.form.querySelectorAll(this.query));

          if (event) {
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
          var radios = this.radios;

          for (var i = 0; i < radios.length; i++) {
            var radio = radios[i];

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
          if (event) {
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
          this.multiple = binder.target.multiple;
          binder.data = this.multiple ? _toConsumableArray(binder.target.files) : binder.target.files[0];
          binder.meta.busy = false;
        }
      };
    } else {
      return {
        read: function read(ctx) {
          ctx.data = binder.data;
          ctx.value = binder.target.value;

          if (Match(ctx.data, ctx.value)) {
            binder.meta.busy = false;
            return ctx.write = false;
          }
        },
        write: function write(ctx) {
          if (event) {
            binder.data = ctx.value === '' ? binder.data : ctx.value;
          } else {
            binder.target.value = ctx.data === undefined || ctx.data === null ? '' : binder.data;
          }

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
          this.write = false;
          return;
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
  var Binder = {
    data: new Map(),
    prefix: 'o-',
    syntaxEnd: '}}',
    syntaxStart: '{{',
    prefixReplace: new RegExp('^o-'),
    syntaxReplace: new RegExp('{{|}}', 'g'),
    binders: {
      class: Class.bind(Binder),
      css: Style.bind(Binder),
      default: Default.bind(Binder),
      disable: Disable.bind(Binder),
      disabled: Disable.bind(Binder),
      each: Each.bind(Binder),
      enable: Enable.bind(Binder),
      enabled: Enable.bind(Binder),
      hide: Hide.bind(Binder),
      hidden: Hide.bind(Binder),
      href: Href.bind(Binder),
      html: Html.bind(Binder),
      label: Label.bind(Binder),
      on: On.bind(Binder),
      read: Read.bind(Binder),
      require: Require.bind(Binder),
      required: Require.bind(Binder),
      reset: Reset.bind(Binder),
      show: Show.bind(Binder),
      showed: Show.bind(Binder),
      style: Style.bind(Binder),
      submit: Submit.bind(Binder),
      text: Text.bind(Binder),
      value: Value.bind(Binder),
      write: Write.bind(Binder)
    },
    setup: function setup() {
      var $args = arguments;
      return new Promise(function ($return, $error) {
        var options = $args.length > 0 && $args[0] !== undefined ? $args[0] : {};
        var binders = options.binders;

        if (binders) {
          for (var name in binders) {
            if (name in this.binders === false) {
              this.binders[name] = binders[name].bind(this);
            }
          }
        }

        return $return();
      }.bind(this));
    },
    get: function get(node) {
      return this.data.get(node);
    },
    render: function render(binder) {
      var _this$binders;

      var type = binder.type in this.binders ? binder.type : 'default';

      var render = (_this$binders = this.binders)[type].apply(_this$binders, arguments);

      Batcher.batch(render);
    },
    unbind: function unbind(node) {
      return this.data.remove(node);
    },
    bind: function bind(target, name, value, container, scope, attr) {
      var _this = this;

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
          var source = Traverse(container.model, parts, 1);

          if (names[0] === 'value') {
            return source[property];
          } else {
            return Piper(this, source[property]);
          }
        },

        set data(value) {
          var source = Traverse(container.model, parts, 1);

          if (names[0] === 'value') {
            source[property] = Piper(this, value);
          } else {
            source[property] = value;
          }
        }

      });
      this.data.set(attr || binder.target, binder);

      if (target.nodeName.includes('-')) {
        window.customElements.whenDefined(target.nodeName.toLowerCase()).then(function () {
          return _this.render(binder);
        });
      } else {
        this.render(binder);
      }
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
  };
  var Binder$1 = Object.freeze(Binder);
  var text = ':not(:defined) { visibility: hidden; }';
  var style = document.createElement('style');
  var node = document.createTextNode(text);
  var sheet = style.sheet;
  style.setAttribute('title', 'oxe');
  style.setAttribute('type', 'text/css');
  style.appendChild(node);
  document.head.appendChild(style);

  var transform = function transform(data) {
    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
      var matches = data.match(/--\w+(?:-+\w+)*:\s*.*?;/g) || [];

      for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
        var pattern = new RegExp('var\\(' + rule[1] + '\\)', 'g');
        data = data.replace(rule[0], '');
        data = data.replace(pattern, rule[2]);
      }
    }

    return data;
  };

  var add = function add(data) {
    data = transform(data);
    sheet.insertRule(data);
  };

  var append = function append(data) {
    data = transform(data);
    style.appendChild(document.createTextNode(data));
  };

  var setup$1 = function setup$1() {
    var $args = arguments;
    return new Promise(function ($return, $error) {
      var option = $args.length > 0 && $args[0] !== undefined ? $args[0] : {};

      if (option.style) {
        append(option.style);
      }

      return $return();
    });
  };

  var Style$1 = Object.freeze({
    style: style,
    sheet: sheet,
    add: add,
    append: append,
    setup: setup$1
  });

  var Slot = function Slot(element, fragment) {
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

  var Fragment = function Fragment(element, template, adopt) {
    var fragment = document.createDocumentFragment();
    var clone = template.cloneNode(true);
    var child = clone.firstElementChild;

    while (child) {
      if (!adopt) {
        Binder$1.add(child, element, element.scope);
      }

      fragment.appendChild(child);
      child = clone.firstElementChild;
    }

    return fragment;
  };

  var Render = function Render(element, template, adopt, shadow) {
    if (!template) return;
    var fragment = Fragment(element, template);
    var root;

    if (shadow && 'attachShadow' in document.body) {
      root = element.attachShadow({
        mode: 'open'
      });
    } else if (shadow && 'createShadowRoot' in document.body) {
      root = element.createShadowRoot();
    } else {
      if (fragment) {
        Slot(element, fragment);
      }

      root = element;
    }

    if (fragment) {
      root.appendChild(fragment);
    }

    if (adopt) {
      var child = root.firstElementChild;

      while (child) {
        Binder$1.add(child, element, element.scope);
        child = child.nextElementSibling;
      }
    }
  };

  var COUNT = 0;

  var Component = function Component() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var count = COUNT++;
    var self = window.Reflect.construct(HTMLElement, arguments, this.constructor);
    var name = self.nodeName.toLowerCase();
    var scope = "".concat(name, "-").concat(count);
    var style = options.style || self.style;
    var methods = options.methods || this.methods;
    var template = options.template || self.template;
    self.options = _objectSpread({}, options);
    self.options.adopt = false;
    self.options.shadow = false;
    self.options.attributes = [];

    if (typeof style === 'string') {
      Style$1.append(style.replace(/\n|\r|\t/g, '').replace(/:host/g, name));
    }

    if (typeof template === 'string') {
      self.template = new DOMParser().parseFromString(template, 'text/html').body;
    }

    var handler = function handler(data, path) {
      var location = "".concat(scope, ".").concat(path);
      Binder$1.data.forEach(function (binder) {
        if (binder.location === location) {
          Binder$1.render(binder);
        }
      });
    };

    var model = Observer.create(options.model || this.model || {}, handler);
    Object.defineProperties(self, {
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
        value: methods
      }
    });
    return self;
  };

  Component.prototype = Object.create(HTMLElement.prototype);
  Object.defineProperty(Component.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    value: Component
  });

  Component.prototype.attributeChangedCallback = function () {
    if (this.attributed) Promise.resolve().then(this.attributed.apply(this, arguments));
  };

  Component.prototype.adoptedCallback = function () {
    if (this.adopted) Promise.resolve().then(this.adopted);
  };

  Component.prototype.disconnectedCallback = function () {
    if (this.detached) Promise.resolve().then(this.detached);
  };

  Component.prototype.connectedCallback = function () {
    if (this.CREATED) {
      if (this.options.attached) {
        this.options.attached.call(this);
      }
    } else {
      this.CREATED = true;
      Render(this, this.template, this.adopt, this.shadow);

      if (this.created && this.attached) {
        Promise.resolve().then(this.created).then(this.attached);
      } else if (this.created) {
        Promise.resolve().then(this.created);
      } else if (this.attached) {
        Promise.resolve().then(this.attached);
      }
    }
  };

  function Location(data) {
    data = data || window.location.href;
    var parser = document.createElement('a');
    parser.href = data;
    var location = {
      href: parser.href,
      host: parser.host,
      port: parser.port,
      hash: parser.hash,
      search: parser.search,
      protocol: parser.protocol,
      hostname: parser.hostname,
      pathname: parser.pathname[0] === '/' ? parser.pathname : '/' + parser.pathname
    };
    location.path = location.pathname + location.search + location.hash;
    return location;
  }

  var self = {};

  var method = function method(_method2, data) {
    return new Promise(function ($return, $error) {
      data = typeof data === 'string' ? {
        url: data
      } : data;
      data.method = _method2;
      return $return(this.fetch(data));
    }.bind(this));
  };

  var define = function define(target, name, value) {
    var enumerable = true;
    Object.defineProperty(target, name, {
      enumerable: enumerable,
      value: value
    });
  };

  var Fetcher = Object.freeze({
    mime: {
      xml: 'text/xml; charset=utf-8',
      html: 'text/html; charset=utf-8',
      text: 'text/plain; charset=utf-8',
      json: 'application/json; charset=utf-8',
      js: 'application/javascript; charset=utf-8'
    },
    get: method.bind('get'),
    put: method.bind('put'),
    post: method.bind('post'),
    head: method.bind('head'),
    patch: method.bind('patch'),
    delete: method.bind('delete'),
    options: method.bind('options'),
    connect: method.bind('connect'),
    types: ['json', 'text', 'blob', 'formData', 'arrayBuffer'],
    setup: function setup() {
      var $args = arguments;
      return new Promise(function ($return, $error) {
        var options = $args.length > 0 && $args[0] !== undefined ? $args[0] : {};
        self.path = options.path;
        self.method = options.method;
        self.origin = options.origin;
        self.request = options.request;
        self.headers = options.headers;
        self.response = options.response;
        self.acceptType = options.acceptType;
        self.credentials = options.credentials;
        self.contentType = options.contentType;
        self.responseType = options.responseType;
        return $return();
      });
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
    fetch: function fetch() {
      var $args = arguments;
      return new Promise(function ($return, $error) {
        var options, context, result, responseType, contentType, type;
        options = $args.length > 0 && $args[0] !== undefined ? $args[0] : {};
        context = _objectSpread({}, options);
        context.path = context.path || self.path;
        context.origin = context.origin || self.origin;
        if (context.path && typeof context.path === 'string' && context.path.charAt(0) === '/') context.path = context.path.slice(1);
        if (context.origin && typeof context.origin === 'string' && context.origin.charAt(context.origin.length - 1) === '/') context.origin = context.origin.slice(0, -1);
        if (context.path && context.origin && !context.url) context.url = context.origin + '/' + context.path;
        if (!context.method) return $error(new Error('Oxe.fetcher - requires method option'));
        if (!context.url) return $error(new Error('Oxe.fetcher - requires url or origin and path option'));
        context.aborted = false;
        context.signal = context.signal || self.signal;
        context.integrity = context.integrity || self.integrity;
        context.keepAlive = context.keepAlive || self.keepAlive;
        context.headers = context.headers || self.headers || {};
        context.acceptType = context.acceptType || self.acceptType;
        context.contentType = context.contentType || self.contentType;
        context.method = (context.method || self.method).toUpperCase();
        context.responseType = context.responseType || self.responseType;
        context.credentials = context.credentials || self.credentials;
        context.mode = context.mode || self.mode;
        context.cahce = context.cahce || self.cache;
        context.redirect = context.redirect || self.redirect;
        context.referrer = context.referrer || self.referrer;
        context.referrerPolicy = context.referrerPolicy || self.referrerPolicy;

        if (context.contentType) {
          switch (context.contentType) {
            case 'js':
              context.headers['Content-Type'] = this.mime.js;
              break;

            case 'xml':
              context.headers['Content-Type'] = this.mime.xml;
              break;

            case 'html':
              context.headers['Content-Type'] = this.mime.html;
              break;

            case 'json':
              context.headers['Content-Type'] = this.mime.json;
              break;

            default:
              context.headers['Content-Type'] = context.contentType;
          }
        }

        if (context.acceptType) {
          switch (context.acceptType) {
            case 'js':
              context.headers['Accept'] = this.mime.js;
              break;

            case 'xml':
              context.headers['Accept'] = this.mime.xml;
              break;

            case 'html':
              context.headers['Accept'] = this.mime.html;
              break;

            case 'json':
              context.headers['Accept'] = this.mime.json;
              break;

            default:
              context.headers['Accept'] = context.acceptType;
          }
        }

        define(context, 'abort', function () {
          context.aborted = true;
          return context;
        });

        if (typeof self.request === 'function') {
          return Promise.resolve(self.request(context)).then(function ($await_36) {
            try {
              return $If_8.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_8() {
          if (context.aborted) {
            return $return();
          }

          if (context.body) {
            if (context.method === 'GET') {
              return Promise.resolve(this.serialize(context.body)).then(function ($await_37) {
                try {
                  context.url = context.url + '?' + $await_37;
                  return $If_12.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            } else {
              if (context.contentType === 'json') {
                context.body = JSON.stringify(context.body);
              }

              return $If_12.call(this);
            }

            function $If_12() {
              return $If_9.call(this);
            }
          }

          function $If_9() {
            return Promise.resolve(window.fetch(context.url, context)).then(function ($await_38) {
              try {
                result = $await_38;
                define(context, 'result', result);
                define(context, 'code', result.status);

                if (!context.responseType) {
                  context.body = result.body;
                  return $If_10.call(this);
                } else {
                  responseType = context.responseType === 'buffer' ? 'arrayBuffer' : context.responseType || '';
                  contentType = result.headers.get('content-type') || result.headers.get('Content-Type') || '';

                  if (responseType === 'json' && contentType.indexOf('json') !== -1) {
                    type = 'json';
                  } else {
                    type = responseType || 'text';
                  }

                  if (this.types.indexOf(type) === -1) {
                    return $error(new Error('Oxe.fetch - invalid responseType value'));
                  }

                  return Promise.resolve(result[type]()).then(function ($await_39) {
                    try {
                      context.body = $await_39;
                      return $If_10.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_10() {
                  if (typeof self.response === 'function') {
                    return Promise.resolve(self.response(context)).then(function ($await_40) {
                      try {
                        return $If_11.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_11() {
                    if (context.aborted) {
                      return $return();
                    }

                    return $return(context);
                  }

                  return $If_11.call(this);
                }
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          return $If_9.call(this);
        }

        return $If_8.call(this);
      }.bind(this));
    }
  });

  var assignOwnPropertyDescriptors = function assignOwnPropertyDescriptors(target, source) {
    for (var name in source) {
      if (Object.prototype.hasOwnProperty.call(source, name)) {
        var descriptor = Object.getOwnPropertyDescriptor(source, name);
        Object.defineProperty(target, name, descriptor);
      }
    }

    return target;
  };

  function Class$1(parent, child) {
    child = child || parent;
    parent = parent === child ? undefined : parent;
    var prototype = typeof child === 'function' ? child.prototype : child;
    var constructor = typeof child === 'function' ? child : child.constructor;

    var Class = function Class() {
      var self = this;
      constructor.apply(self, arguments);

      if ('super' in self) {
        if ('_super' in self) {
          return assignOwnPropertyDescriptors(self._super, self);
        } else {
          throw new Error('Class this.super call required');
        }
      } else {
        return self;
      }
    };

    if (parent) {
      assignOwnPropertyDescriptors(Class, parent);
      Class.prototype = Object.create(parent.prototype);
      assignOwnPropertyDescriptors(Class.prototype, prototype);

      var Super = function Super() {
        if (this._super) return this._super;
        this._super = window.Reflect.construct(parent, arguments, this.constructor);
        assignOwnPropertyDescriptors(this.super, parent.prototype);
        return this._super;
      };

      Object.defineProperty(Class.prototype, 'super', {
        enumerable: false,
        writable: true,
        value: Super
      });
    } else {
      Class.prototype = Object.create({});
      assignOwnPropertyDescriptors(Class.prototype, prototype);
    }

    Object.defineProperty(Class.prototype, 'constructor', {
      enumerable: false,
      writable: true,
      value: Class
    });
    return Class;
  }

  var single = '/';
  var double = '//';
  var colon = '://';
  var ftp = 'ftp://';
  var file = 'file://';
  var http = 'http://';
  var https = 'https://';

  function absolute(path) {
    if (path.slice(0, single.length) === single || path.slice(0, double.length) === double || path.slice(0, colon.length) === colon || path.slice(0, ftp.length) === ftp || path.slice(0, file.length) === file || path.slice(0, http.length) === http || path.slice(0, https.length) === https) {
      return true;
    } else {
      return false;
    }
  }

  function resolve(path) {
    path = path.trim();

    for (var i = 1; i < arguments.length; i++) {
      var part = arguments[i].trim();

      if (path[path.length - 1] !== '/' && part[0] !== '/') {
        path += '/';
      }

      path += part;
    }

    var a = window.document.createElement('a');
    a.href = path;
    return a.href;
  }

  function fetch(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 0) {
            resolve(xhr.responseText);
          } else {
            reject(new Error("failed to import: ".concat(url)));
          }
        }
      };

      try {
        xhr.open('GET', url, true);
        xhr.send();
      } catch (_unused) {
        reject(new Error("failed to import: ".concat(url)));
      }
    });
  }

  function run(code) {
    return new Promise(function (resolve, reject) {
      var blob = new Blob([code], {
        type: 'text/javascript'
      });
      var script = document.createElement('script');

      if ('noModule' in script) {
        script.type = 'module';
      }

      script.onerror = function (error) {
        reject(error);
        script.remove();
        URL.revokeObjectURL(script.src);
      };

      script.onload = function (error) {
        resolve(error);
        script.remove();
        URL.revokeObjectURL(script.src);
      };

      script.src = URL.createObjectURL(blob);
      window.document.head.appendChild(script);
    });
  }

  var S_EXPORT = "\n\n    ^export\\b\n    (?:\n        \\s*(default)\\s*\n    )?\n    (?:\n        \\s*(var|let|const|function|class)\\s*\n    )?\n    (\\s*?:{\\s*)?\n    (\n        (?:\\w+\\s*,?\\s*)*\n    )?\n    (\\s*?:}\\s*)?\n\n".replace(/\s+/g, '');
  var S_IMPORT = "\n\n    import\n    (?:\n        (?:\n            \\s+(\\w+)(?:\\s+|\\s*,\\s*)\n        )\n        ?\n        (?:\n            (?:\\s+(\\*\\s+as\\s+\\w+)\\s+)\n            |\n            (?:\n                \\s*{\\s*\n                (\n                    (?:\n                        (?:\n                            (?:\\w+)\n                            |\n                            (?:\\w+\\s+as\\s+\\w+)\n                        )\n                        \\s*,?\\s*\n                    )\n                    *\n                )\n                \\s*}\\s*\n            )\n        )\n        ?\n        from\n    )\n    ?\n    \\s*\n    (?:\"|')\n    (.*?)\n    (?:'|\")\n    (?:\\s*;)?\n   \n".replace(/\s+/g, '');
  var R_IMPORT = new RegExp(S_IMPORT);
  var R_EXPORT = new RegExp(S_EXPORT);
  var R_IMPORTS = new RegExp(S_IMPORT, 'g');
  var R_EXPORTS = new RegExp(S_EXPORT, 'gm');
  var R_TEMPLATES = /[^\\]`(.|[\r\n])*?[^\\]`/g;

  var transform$1 = function transform$1(code, url) {
    var before = "window.MODULES[\"".concat(url, "\"] = Promise.all([\n");
    var after = ']).then(function ($MODULES) {\n';
    var templateMatches = code.match(R_TEMPLATES) || [];

    for (var i = 0; i < templateMatches.length; i++) {
      var templateMatch = templateMatches[i];
      code = code.replace(templateMatch, templateMatch.replace(/'/g, '\\\'').replace(/^([^\\])?`/, '$1\'').replace(/([^\\])?`$/, '$1\'').replace(/\${(.*)?}/g, '\'+$1+\'').replace(/\n/g, '\\n'));
    }

    var parentImport = url.slice(0, url.lastIndexOf('/') + 1);
    var importMatches = code.match(R_IMPORTS) || [];

    for (var _i = 0, l = importMatches.length; _i < l; _i++) {
      var importMatch = importMatches[_i].match(R_IMPORT);

      if (!importMatch) continue;
      var rawImport = importMatch[0];
      var nameImport = importMatch[1];
      var pathImport = importMatch[4] || importMatch[5];

      if (absolute(pathImport)) {
        pathImport = resolve(pathImport);
      } else {
        pathImport = resolve(parentImport, pathImport);
      }

      before = "".concat(before, " \twindow.LOAD(\"").concat(pathImport, "\"),\n");
      after = "".concat(after, "var ").concat(nameImport, " = $MODULES[").concat(_i, "].default;\n");
      code = code.replace(rawImport, '') || [];
    }

    var hasDefault = false;
    var exportMatches = code.match(R_EXPORTS) || [];

    for (var _i2 = 0, _l = exportMatches.length; _i2 < _l; _i2++) {
      var exportMatch = exportMatches[_i2].match(R_EXPORT) || [];
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

  var load = function load(url) {
    return new Promise(function ($return, $error) {
      var script, code;
      if (!url) return $error(new Error('Oxe.load - url required'));
      url = resolve(url);

      if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
        return Promise.resolve(run('try { window.DYNAMIC_SUPPORT = true; import("data:text/javascript;base64,"); } catch (e) { /*e*/ }')).then(function ($await_41) {
          try {
            window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
            return $If_13.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_13() {
        if (window.DYNAMIC_SUPPORT === true) {
          console.log('native import');
          return Promise.resolve(run("window.MODULES[\"".concat(url, "\"] = import(\"").concat(url, "\");"))).then(function ($await_42) {
            try {
              return $return(window.MODULES[url]);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        }

        console.log('not native import');

        if (window.MODULES[url]) {
          return $return(window.MODULES[url]);
        }

        if (typeof window.REGULAR_SUPPORT !== 'boolean') {
          script = document.createElement('script');
          window.REGULAR_SUPPORT = 'noModule' in script;
        }

        if (window.REGULAR_SUPPORT) {
          console.log('noModule: yes');
          code = "import * as m from \"".concat(url, "\"; window.MODULES[\"").concat(url, "\"] = m;");
          return $If_15.call(this);
        } else {
          console.log('noModule: no');
          return Promise.resolve(fetch(url)).then(function ($await_43) {
            try {
              code = $await_43;
              code = transform$1(code, url);
              return $If_15.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_15() {
          var $Try_4_Post = function () {
            try {
              return $return(this.modules[url]);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this);

          var $Try_4_Catch = function (_unused2) {
            try {
              throw new Error("Oxe.load - failed to import: ".concat(url));
            } catch ($boundEx) {
              return $error($boundEx);
            }
          };

          try {
            return Promise.resolve(run(code)).then(function ($await_44) {
              try {
                return $Try_4_Post();
              } catch ($boundEx) {
                return $Try_4_Catch($boundEx);
              }
            }, $Try_4_Catch);
          } catch (_unused2) {
            $Try_4_Catch(_unused2)
          }
        }
      }

      return $If_13.call(this);
    }.bind(this));
  };

  window.LOAD = window.LOAD || load;
  window.MODULES = window.MODULES || {};

  function Define(name, constructor) {
    if (!name) throw new Error('Oxe.define - name required');
    if (!name) throw new Error('Oxe.define - constructor required');

    if (typeof constructor === 'string') {
      return Promise.resolve().then(function () {
        return load(constructor);
      }).then(function (data) {
        return Define(name, data.default);
      });
    } else if (typeof constructor === 'function') {
      window.customElements.define(name, constructor);
    } else if (constructor instanceof Array) {
      constructor.forEach(Define.bind(this, name));
    } else {
      Define(name, Class$1(Component, constructor));
    }
  }

  function Events(target, name, detail, options) {
    options = options || {};
    options.detail = detail === undefined ? null : detail;
    target.dispatchEvent(new window.CustomEvent(name, options));
  }

  function Query(data) {
    data = data || window.location.search;

    if (typeof data === 'string') {
      var result = {};
      if (data.indexOf('?') === 0) data = data.slice(1);
      var queries = data.split('&');

      for (var i = 0; i < queries.length; i++) {
        var _queries$i$split = queries[i].split('='),
            _queries$i$split2 = _slicedToArray(_queries$i$split, 2),
            name = _queries$i$split2[0],
            value = _queries$i$split2[1];

        if (name !== undefined && value !== undefined) {
          if (name in result) {
            if (typeof result[name] === 'string') {
              result[name] = [value];
            } else {
              result[name].push(value);
            }
          } else {
            result[name] = value;
          }
        }
      }

      return result;
    } else {
      var _result = [];

      for (var key in data) {
        var _value = data[key];

        _result.push("".concat(key, "=").concat(_value));
      }

      return "?".concat(_result.join('&'));
    }
  }

  function normalize(path) {
    return path.replace(/\/+/g, '/').replace(/$\//g, '') || '.';
  }

  function basename(path, extention) {
    path = normalize(path);

    if (path.slice(0, 1) === '.') {
      path = path.slice(1);
    }

    if (path.slice(0, 1) === '/') {
      path = path.slice(1);
    }

    var last = path.lastIndexOf('/');

    if (last !== -1) {
      path = path.slice(last + 1);
    }

    if (extention && path.slice(-extention.length) === extention) {
      path = path.slice(0, -extention.length);
    }

    return path;
  }

  var self$1 = {};
  var data = [];

  var absolute$1 = function absolute$1(path) {
    var a = document.createElement('a');
    a.href = path;
    return a.pathname;
  };

  var setup$2 = function setup$2() {
    var $args = arguments;
    return new Promise(function ($return, $error) {
      var option;
      option = $args.length > 0 && $args[0] !== undefined ? $args[0] : {};
      self$1.after = option.after;
      self$1.before = option.before;
      self$1.external = option.external;
      self$1.mode = option.mode || 'push';
      self$1.target = option.target || 'main';
      self$1.folder = option.folder || './routes';
      self$1.contain = option.contain === undefined ? false : option.contain;

      if (typeof self$1.target === 'string') {
        self$1.target = document.body.querySelector(self$1.target);
      }

      if (self$1.mode !== 'href') {
        window.addEventListener('popstate', this.state.bind(this), true);
        window.document.addEventListener('click', this.click.bind(this), true);
      }

      return Promise.resolve(this.add(option.routes)).then(function ($await_45) {
        try {
          return Promise.resolve(this.route(window.location.href, {
            mode: 'replace'
          })).then(function ($await_46) {
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
  };

  var compareParts = function compareParts(routePath, userPath, split) {
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
  };

  var compare = function compare(routePath, userPath) {
    userPath = absolute$1(userPath);
    routePath = absolute$1(routePath);
    console.log(userPath);
    console.log(routePath);

    if (this.compareParts(routePath, userPath, '/')) {
      return true;
    }

    if (this.compareParts(routePath, userPath, '-')) {
      return true;
    }

    return false;
  };

  var scroll = function scroll(x, y) {
    window.scroll(x, y);
  };

  var back = function back() {
    window.history.back();
  };

  var forward = function forward() {
    window.history.forward();
  };

  var redirect = function redirect(path) {
    window.location.href = path;
  };

  var add$1 = function add$1(data) {
    return new Promise(function ($return, $error) {
      var _load, path, name, i;

      if (!data) {
        return $error(new Error('Oxe.router.add - options required'));
      } else {
        if (typeof data === 'string') {
          _load = data;
          path = data;
          name = 'r-' + basename(data, '.js');
          if (path.slice(-3) === '.js') path = path.slice(0, -3);
          if (path.slice(-5) === 'index') path = path.slice(0, -5);
          if (path.slice(-6) === 'index/') path = path.slice(0, -6);
          if (path.slice(0, 2) === './') path = path.slice(2);
          if (path.slice(0, 1) !== '/') path = '/' + path;
          if (_load.slice(-3) !== '.js') _load = _load + '.js';
          if (_load.slice(0, 2) === './') _load = _load.slice(2);
          if (_load.slice(0, 1) !== '/') _load = '/' + _load;
          if (_load.slice(0, 1) === '/') _load = _load.slice(1);
          if (self$1.folder.slice(-1) === '/') self$1.folder = self$1.folder.slice(0, -1);
          _load = self$1.folder + '/' + _load;
          _load = absolute$1(_load);
          this.add({
            path: path,
            name: name,
            load: _load
          });
          return $If_17.call(this);
        } else {
          if (data instanceof Array) {
            i = 0;
            var $Loop_19_trampoline;

            function $Loop_19_step() {
              i++;
              return $Loop_19;
            }

            function $Loop_19() {
              if (i < data.length) {
                return Promise.resolve(this.add(data[i])).then(function ($await_47) {
                  try {
                    return $Loop_19_step;
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }, $error);
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
              return $If_18.call(this);
            }
          } else {
            if (!data.name) return $error(new Error('Oxe.router.add - name required'));
            if (!data.path) return $error(new Error('Oxe.router.add - path required'));
            if (!data.load) return $error(new Error('Oxe.router.add - load required'));
            this.data.push(data);
            return $If_18.call(this);
          }

          function $If_18() {
            return $If_17.call(this);
          }
        }

        function $If_17() {
          return $If_16.call(this);
        }
      }

      function $If_16() {
        return $return();
      }

      return $If_16.call(this);
    }.bind(this));
  };

  var load$1 = function load$1(route) {
    return new Promise(function ($return, $error) {
      var _load$;

      if (route.load && !route.component) {
        return Promise.resolve(load(route.load)).then(function ($await_48) {
          try {
            _load$ = $await_48;
            route.component = _load$.default;
            return $If_21.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_21() {
        return $return(route);
      }

      return $If_21.call(this);
    });
  };

  var remove$1 = function remove$1(path) {
    return new Promise(function ($return, $error) {
      for (var i = 0; i < this.data.length; i++) {
        if (this.data[i].path === path) {
          this.data.splice(i, 1);
        }
      }

      return $return();
    }.bind(this));
  };

  var get$1 = function get$1(path) {
    return new Promise(function ($return, $error) {
      var i;
      i = 0;
      var $Loop_22_trampoline;

      function $Loop_22_step() {
        i++;
        return $Loop_22;
      }

      function $Loop_22() {
        if (i < this.data.length) {
          if (this.data[i].path === path) {
            return Promise.resolve(this.load(this.data[i])).then(function ($await_49) {
              try {
                this.data[i] = $await_49;
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
  };

  var filter = function filter(path) {
    return new Promise(function ($return, $error) {
      var result, i;
      result = [];
      i = 0;
      var $Loop_25_trampoline;

      function $Loop_25_step() {
        i++;
        return $Loop_25;
      }

      function $Loop_25() {
        if (i < this.data.length) {
          if (this.compare(this.data[i].path, path)) {
            return Promise.resolve(this.load(this.data[i])).then(function ($await_50) {
              try {
                this.data[i] = $await_50;
                result.push(this.data[i]);
                return $If_27.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_27() {
            return $Loop_25_step;
          }

          return $If_27.call(this);
        } else return [1];
      }

      return ($Loop_25_trampoline = function (q) {
        while (q) {
          if (q.then) return void q.then($Loop_25_trampoline, $error);

          try {
            if (q.pop) {
              if (q.length) return q.pop() ? $Loop_25_exit.call(this) : q;else q = $Loop_25_step;
            } else q = q.call(this);
          } catch (_exception) {
            return $error(_exception);
          }
        }
      }.bind(this))($Loop_25);

      function $Loop_25_exit() {
        return $return(result);
      }
    }.bind(this));
  };

  var find = function find(path) {
    return new Promise(function ($return, $error) {
      var i, load, name, route;
      i = 0;
      var $Loop_28_trampoline;

      function $Loop_28_step() {
        i++;
        return $Loop_28;
      }

      function $Loop_28() {
        if (i < this.data.length) {
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

          return $Loop_28_step;
        } else return [1];
      }

      return ($Loop_28_trampoline = function (q) {
        while (q) {
          if (q.then) return void q.then($Loop_28_trampoline, $error);

          try {
            if (q.pop) {
              if (q.length) return q.pop() ? $Loop_28_exit.call(this) : q;else q = $Loop_28_step;
            } else q = q.call(this);
          } catch (_exception) {
            return $error(_exception);
          }
        }
      }.bind(this))($Loop_28);

      function $Loop_28_exit() {
        load = path;
        load = load.charAt(0) === '/' ? load.slice(1) : load;
        load = load.charAt(load.length - 1) === '/' ? load.slice(0, load.length - 1) : load;
        load = load.split('/');
        load.splice(-1, 1, 'default.js');
        load.unshift(self$1.folder);
        load = load.join('/');
        name = 'r-' + basename(path);
        return Promise.resolve(this.load({
          path: path,
          name: name,
          load: load
        })).then(function ($await_52) {
          try {
            route = $await_52;
            this.data.push(route);
            return $return(route);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }
    }.bind(this));
  };

  var render = function render(route) {
    return new Promise(function ($return, $error) {
      if (!route) {
        return $error(new Error('Oxe.router.render - route required'));
      }

      if (!route.target) {
        if (!route.name) return $error(new Error('Oxe.router.render - name required'));
        if (!route.component) return $error(new Error('Oxe.router.render - component required'));
        Define(route.name, route.component);
        route.target = window.document.createElement(route.name);
      }

      if (self$1.target) {
        while (self$1.target.firstChild) {
          self$1.target.removeChild(self$1.target.firstChild);
        }

        self$1.target.appendChild(route.target);
      }

      window.scroll(0, 0);
      return $return();
    });
  };

  var route = function route(path) {
    var $args = arguments;
    return new Promise(function ($return, $error) {
      var options, location, mode, route;
      options = $args.length > 1 && $args[1] !== undefined ? $args[1] : {};

      if (options.query) {
        path += Query(options.query);
      }

      location = Location(path);
      mode = options.mode || self$1.mode;
      console.log(location.pathname);
      return Promise.resolve(this.find(location.pathname)).then(function ($await_53) {
        try {
          route = $await_53;

          if (!route) {
            return $error(new Error("Oxe.router.route - missing route ".concat(location.pathname)));
          }

          if (typeof self$1.before === 'function') {
            return Promise.resolve(self$1.before(location)).then(function ($await_54) {
              try {
                return $If_31.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_31() {
            if (route.handler) {
              return $return(route.handler(location));
            }

            if (route.redirect) {
              return $return(this.redirect(route.redirect));
            }

            Events(self$1.target, 'before', location);

            if (mode === 'href') {
              return $return(window.location.assign(location.path));
            }

            window.history[mode + 'State']({
              path: location.path
            }, '', location.path);

            if (route.title) {
              window.document.title = route.title;
            }

            return Promise.resolve(this.render(route)).then(function ($await_55) {
              try {
                if (typeof self$1.after === 'function') {
                  return Promise.resolve(self$1.after(location)).then(function ($await_56) {
                    try {
                      return $If_32.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_32() {
                  Events(self$1.target, 'after', location);
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
  };

  var state = function state(event) {
    return new Promise(function ($return, $error) {
      var path = event && event.state ? event.state.path : window.location.href;
      this.route(path, {
        mode: 'replace'
      });
      return $return();
    }.bind(this));
  };

  var click = function click(event) {
    return new Promise(function ($return, $error) {
      if (event.target.type || event.button !== 0 || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return $return();
      var target = event.path ? event.path[0] : event.target;
      var parent = target.parentElement;

      if (self$1.contain) {
        while (parent) {
          if (parent.nodeName === 'O-ROUTER') {
            break;
          } else {
            parent = parent.parentElement;
          }
        }

        if (parent.nodeName !== 'O-ROUTER') {
          return $return();
        }
      }

      while (target && 'A' !== target.nodeName) {
        target = target.parentElement;
      }

      if (!target || 'A' !== target.nodeName) {
        return $return();
      }

      var tel = 'tel:';
      var ftp = 'ftp:';
      var file = 'file:';
      var mailto = 'mailto:';
      if (target.hasAttribute('download') || target.hasAttribute('external') || target.hasAttribute('o-external') || target.href.slice(0, tel.length) === tel || target.href.slice(0, ftp.length) === ftp || target.href.slice(0, file.length) === file || target.href.slice(0, mailto.length) === mailto || target.href.slice(window.location.origin) !== 0 || target.hash !== '' && target.origin === window.location.origin && target.pathname === window.location.pathname) return $return();
      if (self$1.external && (self$1.external.constructor === RegExp && self$1.external.test(target.href) || self$1.external.constructor === Function && self$1.external(target.href) || self$1.external.constructor === String && self$1.external === target.href)) return $return();
      event.preventDefault();
      this.route(target.href);
      return $return();
    }.bind(this));
  };

  var Router = Object.freeze({
    data: data,
    setup: setup$2,
    compareParts: compareParts,
    compare: compare,
    scroll: scroll,
    back: back,
    forward: forward,
    redirect: redirect,
    add: add$1,
    get: get$1,
    find: find,
    remove: remove$1,
    filter: filter,
    route: route,
    render: render,
    load: load$1,
    state: state,
    click: click
  });

  if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function CustomEvent(event, options) {
      options = options || {
        bubbles: false,
        cancelable: false,
        detail: null
      };
      var customEvent = document.createEvent('CustomEvent');
      customEvent.initCustomEvent(event, options.bubbles, options.cancelable, options.detail);
      return customEvent;
    };
  }

  if (_typeof(window.Reflect) !== 'object' && typeof window.Reflect.construct !== 'function') {
    window.Reflect = window.Reflect || {};

    window.Reflect.construct = function construct(parent, args, child) {
      var target = child === undefined ? parent : child;
      var prototype = Object.create(target.prototype || Object.prototype);
      return Function.prototype.apply.call(parent, prototype, args) || prototype;
    };
  }

  var setup$3 = document.querySelector('script[o-setup]');
  var url = setup$3 ? setup$3.getAttribute('o-setup') : '';
  if (setup$3) load(url);
  var SETUP = false;
  var index = Object.freeze({
    Class: Class$1,
    class: Class$1,
    Style: Style$1,
    style: Style$1,
    Component: Component,
    component: Component,
    Query: Query,
    query: Query,
    Location: Location,
    location: Location,
    Define: Define,
    define: Define,
    Binder: Binder$1,
    binder: Binder$1,
    Batcher: Batcher,
    batcher: Batcher,
    Fetcher: Fetcher,
    fetcher: Fetcher,
    Router: Router,
    router: Router,
    Load: load,
    load: load,
    setup: function setup() {
      var _this2 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (SETUP) return;else SETUP = true;
      options.listener = options.listener || {};
      return Promise.all([this.style.setup(options.style), this.binder.setup(options.binder), this.fetcher.setup(options.fetcher)]).then(function () {
        if (options.listener.before) {
          return options.listener.before();
        }
      }).then(function () {
        if (options.router) {
          return _this2.router.setup(options.router);
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