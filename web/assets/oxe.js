
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
    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

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
      var method = Traverse(source, path);

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
            var node = binder.target.lastChild;
            Promise.resolve().then(Binder.remove(node));
            binder.target.removeChild(node);
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
            binder.target.appendChild(_node);
            Promise.resolve().then(Binder.add(_node, binder.container, binder.scope));
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
          var node = binder.target.removeChild(binder.target.firstChild);
          Binder.remove(node);
        }

        var fragment = document.createDocumentFragment();
        var parser = document.createElement('div');
        parser.innerHTML = data;

        while (parser.firstElementChild) {
          Binder.add(parser.firstElementChild, {
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
        return Promise.resolve(method.call(binder.container, event)).then(function ($await_32) {
          try {
            return $If_3.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_3() {
        return $return();
      }

      return $If_3.call(this);
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

        _binder = Binder.get(element, 'o-value');

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
        return Promise.resolve(method.call(binder.container, event)).then(function ($await_33) {
          try {
            return $If_4.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_4() {
        return $return();
      }

      return $If_4.call(this);
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
        b = Binder.get(attribute);
        console.warn('todo: need to get a value for selects');
        value = b ? b.data : element.files ? element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0] : element.value;
        name = element.name || (b ? b.values[b.values.length - 1] : null);
        if (!name) continue;
        data[name] = value;
      }

      method = binder.data;

      if (typeof method === 'function') {
        return Promise.resolve(method.call(binder.container, data, event)).then(function ($await_34) {
          try {
            return $If_5.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_5() {
        if ('o-reset' in event.target.attributes) {
          event.target.reset();
        }

        return $return();
      }

      return $If_5.call(this);
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
        return Binder.render(binder, event);
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
            var option = Binder.get(attribute) || {
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
  var Binder = Object.freeze({
    prefix: 'o-',
    syntaxEnd: '}}',
    syntaxStart: '{{',
    prefixReplace: new RegExp('^o-'),
    syntaxReplace: new RegExp('{{|}}', 'g'),
    data: new Map(),
    binders: {
      class: Class,
      css: Style,
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
      style: Style,
      submit: Submit,
      text: Text,
      value: Value,
      write: Write
    },
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};

        for (var name in this.binders) {
          this.binders[name] = this.binders[name].bind(this);
        }

        if (options.binders) {
          for (var _name in options.binders) {
            if (_name in this.binders === false) {
              this.binders[_name] = options.binders[_name].bind(this);
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
  });
  var style = document.createElement('style');
  var sheet = style.sheet;
  style.setAttribute('title', 'oxe');
  style.setAttribute('type', 'text/css');

  var add = function add(data) {
    this.sheet.insertRule(data);
  };

  var append = function append(data) {
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

    this.style.appendChild(document.createTextNode(data));
  };

  var setup$1 = function setup$1(option) {
    return new Promise(function ($return, $error) {
      option = option || {};

      if (option.style) {
        this.append(option.style);
      }

      document.head.appendChild(this.style);
      return $return();
    }.bind(this));
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
        Binder.add(child, element, element.scope);
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
        Binder.add(child, element, element.scope);
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
      Binder.data.forEach(function (binder) {
        if (binder.location === location) {
          Binder.render(binder);
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

  var OPTIONS = {};
  var Fetcher = Object.freeze({
    mime: {
      xml: 'text/xml; charset=utf-8',
      html: 'text/html; charset=utf-8',
      text: 'text/plain; charset=utf-8',
      json: 'application/json; charset=utf-8',
      js: 'application/javascript; charset=utf-8'
    },
    types: ['json', 'text', 'blob', 'formData', 'arrayBuffer'],
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};
        OPTIONS.path = options.path;
        OPTIONS.origin = options.origin;
        OPTIONS.request = options.request;
        OPTIONS.response = options.response;
        OPTIONS.acceptType = options.acceptType;
        OPTIONS.headers = options.headers || {};
        OPTIONS.method = options.method || 'get';
        OPTIONS.credentials = options.credentials;
        OPTIONS.contentType = options.contentType;
        OPTIONS.responseType = options.responseType;
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
    fetch: function fetch(options) {
      return new Promise(function ($return, $error) {
        var data, copy, result, fetched, responseType, contentType, type, _copy, _result;

        data = Object.assign({}, options);
        data.path = data.path || OPTIONS.path;
        data.origin = data.origin || OPTIONS.origin;
        if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
        if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length - 1) === '/') data.origin = data.origin.slice(0, -1);
        if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;
        if (!data.method) return $error(new Error('Oxe.fetcher - requires method option'));
        if (!data.url) return $error(new Error('Oxe.fetcher - requires url or origin and path option'));
        if (!data.headers && OPTIONS.headers) data.headers = OPTIONS.headers;
        if (typeof data.method === 'string') data.method = data.method.toUpperCase() || OPTIONS.method;
        if (!data.acceptType && OPTIONS.acceptType) data.acceptType = OPTIONS.acceptType;
        if (!data.contentType && OPTIONS.contentType) data.contentType = OPTIONS.contentType;
        if (!data.responseType && OPTIONS.responseType) data.responseType = OPTIONS.responseType;
        if (!data.credentials && OPTIONS.credentials) data.credentials = OPTIONS.credentials;
        if (!data.mode && OPTIONS.mode) data.mode = OPTIONS.mode;
        if (!data.cache && OPTIONS.cache) data.cahce = OPTIONS.cache;
        if (!data.redirect && OPTIONS.redirect) data.redirect = OPTIONS.redirect;
        if (!data.referrer && OPTIONS.referrer) data.referrer = OPTIONS.referrer;
        if (!data.referrerPolicy && OPTIONS.referrerPolicy) data.referrerPolicy = OPTIONS.referrerPolicy;
        if (!data.signal && OPTIONS.signal) data.signal = OPTIONS.signal;
        if (!data.integrity && OPTIONS.integrity) data.integrity = OPTIONS.integrity;
        if (!data.keepAlive && OPTIONS.keepAlive) data.keepAlive = OPTIONS.keepAlive;

        if (data.contentType) {
          data.headers = data.headers || {};

          switch (data.contentType) {
            case 'js':
              data.headers['Content-Type'] = this.mime.js;
              break;

            case 'xml':
              data.headers['Content-Type'] = this.mime.xml;
              break;

            case 'html':
              data.headers['Content-Type'] = this.mime.html;
              break;

            case 'json':
              data.headers['Content-Type'] = this.mime.json;
              break;

            default:
              data.headers['Content-Type'] = data.contentType;
          }
        }

        if (data.acceptType) {
          data.headers = data.headers || {};

          switch (data.acceptType) {
            case 'js':
              data.headers['Accept'] = this.mime.js;
              break;

            case 'xml':
              data.headers['Accept'] = this.mime.xml;
              break;

            case 'html':
              data.headers['Accept'] = this.mime.html;
              break;

            case 'json':
              data.headers['Accept'] = this.mime.json;
              break;

            default:
              data.headers['Accept'] = data.acceptType;
          }
        }

        if (typeof OPTIONS.request === 'function') {
          copy = Object.assign({}, data);
          return Promise.resolve(OPTIONS.request(copy)).then(function ($await_35) {
            try {
              result = $await_35;

              if (result === false) {
                return $return(data);
              }

              if (_typeof(result) === 'object') {
                Object.assign(data, result);
              }

              return $If_6.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_6() {
          if (data.body) {
            if (data.method === 'GET') {
              return Promise.resolve(this.serialize(data.body)).then(function ($await_36) {
                try {
                  data.url = data.url + '?' + $await_36;
                  return $If_10.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            } else {
              if (data.contentType === 'json') {
                data.body = JSON.stringify(data.body);
              }

              return $If_10.call(this);
            }

            function $If_10() {
              return $If_7.call(this);
            }
          }

          function $If_7() {
            return Promise.resolve(window.fetch(data.url, Object.assign({}, data))).then(function ($await_37) {
              try {
                fetched = $await_37;
                data.code = fetched.status;
                data.headers = fetched.headers;
                data.message = fetched.statusText;

                if (!data.responseType) {
                  data.body = fetched.body;
                  return $If_8.call(this);
                } else {
                  responseType = data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType || '';
                  contentType = fetched.headers.get('content-type') || fetched.headers.get('Content-Type') || '';

                  if (responseType === 'json' && contentType.indexOf('json') !== -1) {
                    type = 'json';
                  } else {
                    type = responseType || 'text';
                  }

                  if (this.types.indexOf(type) === -1) return $error(new Error('Oxe.fetch - invalid responseType value'));
                  return Promise.resolve(fetched[type]()).then(function ($await_38) {
                    try {
                      data.body = $await_38;
                      return $If_8.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_8() {
                  if (OPTIONS.response) {
                    _copy = Object.assign({}, data);
                    return Promise.resolve(OPTIONS.response(_copy)).then(function ($await_39) {
                      try {
                        _result = $await_39;

                        if (_result === false) {
                          return $return(data);
                        }

                        if (_typeof(_result) === 'object') {
                          Object.assign(data, _result);
                        }

                        return $If_9.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_9() {
                    return $return(data);
                  }

                  return $If_9.call(this);
                }
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          return $If_7.call(this);
        }

        return $If_6.call(this);
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
    },
    head: function head(data) {
      return new Promise(function ($return, $error) {
        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'head';
        return $return(this.fetch(data));
      }.bind(this));
    },
    patch: function patch(data) {
      return new Promise(function ($return, $error) {
        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'patch';
        return $return(this.fetch(data));
      }.bind(this));
    },
    delete: function _delete(data) {
      return new Promise(function ($return, $error) {
        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'delete';
        return $return(this.fetch(data));
      }.bind(this));
    },
    options: function options(data) {
      return new Promise(function ($return, $error) {
        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'options';
        return $return(this.fetch(data));
      }.bind(this));
    },
    connect: function connect(data) {
      return new Promise(function ($return, $error) {
        data = typeof data === 'string' ? {
          url: data
        } : data;
        data.method = 'connect';
        return $return(this.fetch(data));
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

      if ('Super' in self) {
        if ('_Super' in self) {
          return assignOwnPropertyDescriptors(self._Super, self);
        } else {
          throw new Error('Class this.Super call required');
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
        if (this._Super) return this._Super;
        this._Super = window.Reflect.construct(parent, arguments, this.constructor);
        assignOwnPropertyDescriptors(this.Super, parent.prototype);
        return this._Super;
      };

      Object.defineProperty(Class.prototype, 'Super', {
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

  function Define(name, constructor) {
    if (constructor instanceof Function) {
      window.customElements.define(name, constructor);
    } else if (constructor instanceof Array) {
      constructor.forEach(Define.bind(this, name));
    } else {
      Define(name, Class$1(Component, constructor));
    }
  }

  function Absolute() {
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
  }

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

    for (var _i = 0, l = importMatches.length; _i < l; _i++) {
      var importMatch = importMatches[_i].match(R_IMPORT);

      if (!importMatch) continue;
      var rawImport = importMatch[0];
      var nameImport = importMatch[1];
      var pathImport = importMatch[4] || importMatch[5];

      if (pathImport.slice(0, 1) !== '/') {
        pathImport = Absolute(parentImport, pathImport);
      } else {
        pathImport = Absolute(pathImport);
      }

      before = before + '\twindow.Oxe.loader.load("' + pathImport + '"),\n';
      after = after + 'var ' + nameImport + ' = $MODULES[' + _i + '].default;\n';
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

      if ('noModule' in script) {
        console.log('noModule yes');
        var code = 'import * as m from "' + url + '"; Oxe.loader.data["' + url + '"] = m;';
        var blob = new Blob([code], {
          type: 'text/javascript'
        });
        script.src = URL.createObjectURL(blob);
        window.document.head.appendChild(script);
      } else {
        console.log('noModule no');
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 0) {
              var _code = transform(xhr.responseText, url);

              var _blob = new Blob([_code], {
                type: 'text/javascript'
              });

              script.src = URL.createObjectURL(_blob);
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

  function Load(url) {
    return new Promise(function ($return, $error) {
      if (!url) return $error(new Error('Oxe.load - url required'));
      url = Absolute(url);

      if (native) {
        console.log('native import');
        return $return(new Function('url', 'return import(url)')(url));
      } else {
        console.log('not native import');
        return $return(IMPORT(url));
      }

      return $return();
    });
  }

  function Events(target, name, detail, options) {
    options = options || {};
    options.detail = detail === undefined ? null : detail;
    target.dispatchEvent(new window.CustomEvent(name, options));
  }

  function Ensure(data) {
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
      return new Promise(function ($return, $error) {
        var ORouter;
        option = option || {};
        this.option.after = option.after === undefined ? this.option.after : option.after;
        this.option.before = option.before === undefined ? this.option.before : option.before;
        this.option.external = option.external === undefined ? this.option.external : option.external;
        this.option.mode = option.mode === undefined ? this.option.mode : option.mode;
        this.option.folder = option.folder === undefined ? this.option.folder : option.folder;
        this.option.target = option.target === undefined ? this.option.target : option.target;
        this.option.contain = option.contain === undefined ? this.option.contain : option.contain;

        if (!this.option.target || typeof this.option.target === 'string') {
          this.option.target = document.body.querySelector(this.option.target || 'o-router');
        }

        if (this.option.mode !== 'href') {
          window.addEventListener('popstate', this.state.bind(this), true);
          window.document.addEventListener('click', this.click.bind(this), true);
        }

        ORouter = function ORouter() {
          return window.Reflect.construct(HTMLElement, arguments, this.constructor);
        };

        ORouter.prototype = HTMLElement.prototype;
        Object.defineProperty(ORouter.prototype, 'constructor', {
          enumerable: false,
          writable: true,
          value: ORouter
        });
        window.customElements.define('o-router', ORouter);
        return Promise.resolve(this.add(option.routes)).then(function ($await_40) {
          try {
            return Promise.resolve(this.route(window.location.href, {
              mode: 'replace'
            })).then(function ($await_41) {
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
      userPath = Absolute(userPath);
      routePath = Absolute(routePath);

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
      return new Promise(function ($return, $error) {
        var load, path, i, l;

        if (!data) {
          return $return();
        } else {
          if (data.constructor === String) {
            load = data;
            path = data;
            if (path.slice(-3) === '.js') path = path.slice(0, -3);
            if (path.slice(-5) === 'index') path = path.slice(0, -5);
            if (path.slice(-6) === 'index/') path = path.slice(0, -6);
            if (path.slice(0, 2) === './') path = path.slice(2);
            if (path.slice(0, 1) !== '/') path = '/' + path;
            if (load.slice(-3) !== '.js') load = load + '.js';
            if (load.slice(0, 2) === './') load = load.slice(2);
            if (load.slice(0, 1) !== '/') load = '/' + load;
            if (this.option.folder.slice(-1) === '/') this.option.folder = this.option.folder.slice(0, -1);
            load = this.option.folder + '/' + load;
            this.data.push({
              path: path,
              load: load
            });
            return $If_12.call(this);
          } else {
            if (data.constructor === Object) {
              if (!data.path) {
                return $error(new Error('Oxe.router.add - route path required'));
              }

              if (!data.name && !data.load && !data.component) {
                return $error(new Error('Oxe.router.add -  route requires name, load, or component property'));
              }

              this.data.push(data);
              return $If_13.call(this);
            } else {
              if (data.constructor === Array) {
                i = 0, l = data.length;
                var $Loop_15_trampoline;

                function $Loop_15_step() {
                  i++;
                  return $Loop_15;
                }

                function $Loop_15() {
                  if (i < l) {
                    return Promise.resolve(this.add(data[i])).then(function ($await_42) {
                      try {
                        return $Loop_15_step;
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }, $error);
                  } else return [1];
                }

                return ($Loop_15_trampoline = function (q) {
                  while (q) {
                    if (q.then) return void q.then($Loop_15_trampoline, $error);

                    try {
                      if (q.pop) {
                        if (q.length) return q.pop() ? $Loop_15_exit.call(this) : q;else q = $Loop_15_step;
                      } else q = q.call(this);
                    } catch (_exception) {
                      return $error(_exception);
                    }
                  }
                }.bind(this))($Loop_15);

                function $Loop_15_exit() {
                  return $If_14.call(this);
                }
              }

              function $If_14() {
                return $If_13.call(this);
              }

              return $If_14.call(this);
            }

            function $If_13() {
              return $If_12.call(this);
            }
          }

          function $If_12() {
            return $If_11.call(this);
          }
        }

        function $If_11() {
          return $return();
        }

        return $If_11.call(this);
      }.bind(this));
    },
    load: function load(route) {
      return new Promise(function ($return, $error) {
        var load, _load;

        if (route.load) {
          return Promise.resolve(Load(route.load)).then(function ($await_43) {
            try {
              load = $await_43;
              route = Object.assign({}, load.default, route);
              return $If_17.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_17() {
          if (typeof route.component === 'string') {
            route.load = route.component;
            return Promise.resolve(Load(route.load)).then(function ($await_44) {
              try {
                _load = $await_44;
                route.component = _load.default;
                return $If_18.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_18() {
            return $return(route);
          }

          return $If_18.call(this);
        }

        return $If_17.call(this);
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
        var $Loop_19_trampoline;

        function $Loop_19_step() {
          i++;
          return $Loop_19;
        }

        function $Loop_19() {
          if (i < l) {
            if (this.data[i].path === path) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_45) {
                try {
                  this.data[i] = $await_45;
                  return $return(this.data[i]);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $Loop_19_step;
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
          return $return();
        }
      }.bind(this));
    },
    filter: function filter(path) {
      return new Promise(function ($return, $error) {
        var result, i, l;
        result = [];
        i = 0, l = this.data.length;
        var $Loop_22_trampoline;

        function $Loop_22_step() {
          i++;
          return $Loop_22;
        }

        function $Loop_22() {
          if (i < l) {
            if (this.compare(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_46) {
                try {
                  this.data[i] = $await_46;
                  result.push(this.data[i]);
                  return $If_24.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_24() {
              return $Loop_22_step;
            }

            return $If_24.call(this);
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
          return $return(result);
        }
      }.bind(this));
    },
    find: function find(path) {
      return new Promise(function ($return, $error) {
        var i, l;
        i = 0, l = this.data.length;
        var $Loop_25_trampoline;

        function $Loop_25_step() {
          i++;
          return $Loop_25;
        }

        function $Loop_25() {
          if (i < l) {
            if (this.compare(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_47) {
                try {
                  this.data[i] = $await_47;
                  return $return(this.data[i]);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $Loop_25_step;
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
          return $return();
        }
      }.bind(this));
    },
    render: function render(route) {
      return new Promise(function ($return, $error) {
        if (!route) {
          return $error(new Error('Oxe.render - route argument required. Missing object option.'));
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
              return Ensure(option);
            });
          }));
        }

        if (!route.target) {
          if (!route.component) {
            Define(route);
            route.target = window.document.createElement(route.name);
          } else if (route.component.constructor === String) {
            route.target = window.document.createElement(route.component);
          } else if (route.component.constructor === Object) {
            Define(route.component);
            route.target = window.document.createElement(route.component.name);
          } else {
            return $error(new Error('Oxe.router.render - route requires name, load, or component property'));
          }
        }

        if (this.option.target) {
          while (this.option.target.firstChild) {
            this.option.target.removeChild(this.option.target.firstChild);
          }

          this.option.target.appendChild(route.target);
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

        mode = options.mode || this.option.mode;
        location = this.toLocationObject(path);
        return Promise.resolve(this.find(location.pathname)).then(function ($await_48) {
          try {
            route = $await_48;

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

            function $If_29() {
              if (typeof this.option.before === 'function') {
                return Promise.resolve(this.option.before(location)).then(function ($await_51) {
                  try {
                    return $If_30.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_30() {
                Events(this.option.target, 'before', location);

                if (mode === 'href') {
                  return $return(window.location.assign(location.path));
                }

                window.history[mode + 'State']({
                  path: location.path
                }, '', location.path);
                this.location.href = location.href;
                this.location.host = location.host;
                this.location.port = location.port;
                this.location.hash = location.hash;
                this.location.path = location.path;
                this.location.route = location.route;
                this.location.title = location.title;
                this.location.query = location.query;
                this.location.search = location.search;
                this.location.protocol = location.protocol;
                this.location.hostname = location.hostname;
                this.location.pathname = location.pathname;
                this.location.parameters = location.parameters;
                return Promise.resolve(this.render(location.route)).then(function ($await_52) {
                  try {
                    if (typeof this.option.after === 'function') {
                      return Promise.resolve(this.option.after(location)).then(function ($await_53) {
                        try {
                          return $If_31.call(this);
                        } catch ($boundEx) {
                          return $error($boundEx);
                        }
                      }.bind(this), $error);
                    }

                    function $If_31() {
                      Events(this.option.target, 'after', location);
                      return $return();
                    }

                    return $If_31.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              return $If_30.call(this);
            }

            if (typeof this.option.before === 'function') {
              return Promise.resolve(this.option.before(location)).then(function ($await_51) {
                try {
                  return $If_30.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_30() {
              Events(this.option.target, 'before', location);

              if (mode === 'href') {
                return $return(window.location.assign(location.path));
              }

              window.history[mode + 'State']({
                path: location.path
              }, '', location.path);
              this.location.href = location.href;
              this.location.host = location.host;
              this.location.port = location.port;
              this.location.hash = location.hash;
              this.location.path = location.path;
              this.location.route = location.route;
              this.location.title = location.title;
              this.location.query = location.query;
              this.location.search = location.search;
              this.location.protocol = location.protocol;
              this.location.hostname = location.hostname;
              this.location.pathname = location.pathname;
              this.location.parameters = location.parameters;
              return Promise.resolve(this.render(location.route)).then(function ($await_52) {
                try {
                  if (typeof this.option.after === 'function') {
                    return Promise.resolve(this.option.after(location)).then(function ($await_53) {
                      try {
                        return $If_31.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_31() {
                    Events(this.option.target, 'after', location);
                    return $return();
                  }

                  return $If_31.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $If_30.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    },
    state: function state(event) {
      return new Promise(function ($return, $error) {
        var path = event && event.state ? event.state.path : window.location.href;
        this.route(path, {
          mode: 'replace'
        });
        return $return();
      }.bind(this));
    },
    click: function click(event) {
      return new Promise(function ($return, $error) {
        if (event.target.type || event.button !== 0 || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
          return $return();
        }

        var target = event.path ? event.path[0] : event.target;
        var parent = target.parentElement;

        if (this.option.contain) {
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

        if (target.hasAttribute('download') || target.hasAttribute('external') || target.hasAttribute('o-external') || target.href.indexOf('tel:') === 0 || target.href.indexOf('ftp:') === 0 || target.href.indexOf('file:') === 0 || target.href.indexOf('mailto:') === 0 || target.href.indexOf(window.location.origin) !== 0 || target.hash !== '' && target.origin === window.location.origin && target.pathname === window.location.pathname) return $return();
        if (this.option.external && (this.option.external.constructor === RegExp && this.option.external.test(target.href) || this.option.external.constructor === Function && this.option.external(target.href) || this.option.external.constructor === String && this.option.external === target.href)) return $return();
        event.preventDefault();

        if (this.location.href !== target.href) {
          this.route(target.href);
        }

        return $return();
      }.bind(this));
    }
  });

  if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function CustomEvent(event, params) {
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: null
      };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };
  }

  if (_typeof(window.Reflect) !== 'object' && typeof window.Reflect.construct !== 'function') {
    window.Reflect = window.Reflect || {};

    window.Reflect.construct = function construct(parent, args, child) {
      var target = child === undefined ? parent : child;
      var prototype = target.prototype || Object.prototype;
      var copy = Object.create(prototype);
      return Function.prototype.apply.call(parent, copy, args) || copy;
    };
  }

  document.head.insertAdjacentHTML('afterbegin', '<style>:not(:defined){visibility:hidden;}o-router,o-router>:first-child{display:block;}</style>');
  var SETUP = false;
  var index = Object.freeze({
    Define: Define,
    define: Define,
    Component: Component,
    component: Component,
    Batcher: Batcher,
    batcher: Batcher,
    Fetcher: Fetcher,
    fetcher: Fetcher,
    Binder: Binder,
    binder: Binder,
    Load: Load,
    load: Load,
    Router: Router,
    router: Router,
    Style: Style$1,
    style: Style$1,
    setup: function setup() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (SETUP) return;else SETUP = true;
      options.listener = options.listener || {};
    }
  });
  return index;
});