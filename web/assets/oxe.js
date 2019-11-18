function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = global || self, global.Oxe = factory());
})(this, function () {
  'use strict';

  var _Object$freeze;

  function traverse(data, path, end) {
    var keys = typeof path === 'string' ? path.split('.') : path;
    var length = keys.length - (end || 0);
    var result = data;

    for (var _index = 0; _index < length; _index++) {
      result = result[keys[_index]];
    }

    return result;
  }

  function walker(node, callback) {
    callback(node);
    node = node.firstChild;

    while (node) {
      walker(node, callback);
      node = node.nextSibling;
    }
  }

  var Batcher = Object.freeze({
    reads: [],
    writes: [],
    options: {
      time: 1000 / 60,
      pending: false
    },
    setup: function setup(options) {
      options = options || {};
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

    var methods = binder.container.model;

    if (!methods) {
      return data;
    }

    for (var i = 0, l = binder.pipes.length; i < l; i++) {
      var name = binder.pipes[i];

      if (name in methods) {
        var method = methods[name];

        if (method && method.constructor === Function) {
          data = methods[name].call(binder.container, data);
        } else {
          console.warn("Oxe.piper - pipe ".concat(name, " invalid type"));
        }
      } else {
        console.warn("Oxe.piper - pipe ".concat(name, " not found"));
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
        if (name) {
          if (data === undefined || data === null) {
            binder.target.classList.remove(name);
          } else {
            binder.target.classList.toggle(name, data);
          }
        } else {
          if (data === undefined || data === null) {
            binder.target.setAttribute('class', '');
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
          return write = false;
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
    return {
      read: function read() {
        data = binder.data || [];

        if (!binder.meta.setup) {
          binder.meta.keys = [];
          binder.meta.counts = [];
          binder.meta.setup = false;
          binder.meta.pending = false;
          binder.meta.targetLength = 0;
          binder.meta.currentLength = 0;
          binder.meta.fragment = document.createDocumentFragment();
          binder.meta.template = document.createDocumentFragment();
          binder.meta.keyVariable = binder.target.getAttribute('o-key');
          binder.meta.indexVariable = binder.target.getAttribute('o-index');

          while (binder.target.firstChild) {
            binder.meta.template.appendChild(binder.target.removeChild(binder.target.firstChild));
          }

          binder.meta.templateLength = binder.meta.template.childNodes.length;
          binder.meta.setup = true;
        }

        binder.meta.keys = Object.keys(data || []);
        binder.meta.targetLength = binder.meta.keys.length;

        if (binder.meta.currentLength === binder.meta.targetLength) {
          binder.meta.pending = false;
          this.write = false;
        }
      },
      write: function write() {
        if (binder.meta.currentLength === binder.meta.targetLength) {
          binder.meta.pending = false;
          return;
        }

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
            var clone = binder.meta.template.cloneNode(true);
            var _index2 = binder.meta.currentLength;

            var _node = void 0;

            while (_node = clone.firstChild) {
              Promise.resolve().then(self.add.bind(self, _node, {
                index: _index2,
                path: binder.path,
                parent: binder.context,
                variable: binder.names[1],
                container: binder.container,
                key: binder.meta.keys[_index2],
                scope: binder.container.scope,
                keyVariable: binder.meta.keyVariable,
                indexVariable: binder.meta.indexVariable,
                templateLength: binder.meta.templateLength
              })).catch(console.error);
              binder.meta.fragment.appendChild(_node);
            }

            binder.meta.currentLength++;
          }

          binder.target.appendChild(binder.meta.fragment);
        }

        binder.meta.pending = false;
      }
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
            var keys = binder.pipes[i].split('.');
            var parameter = traverse(binder.container.model, keys);
            parameters.push(parameter);
          }

          parameters.push(events);
          parameters.push(this);
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

        _binder = this.get(element, 'o-value');

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
        return Promise.resolve(method.call(binder.container, event)).then(function ($await_30) {
          try {
            return $If_2.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_2() {
        return $return();
      }

      return $If_2.call(this);
    }.bind(this));
  };

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
      var data, elements, i, l, element, b, value, name, method;
      event.preventDefault();
      data = {};
      elements = event.target.querySelectorAll('*');

      for (i = 0, l = elements.length; i < l; i++) {
        element = elements[i];

        if (!element.type && element.nodeName !== 'TEXTAREA' || element.type === 'submit' || element.type === 'button' || !element.type) {
          continue;
        }

        b = this.get(element, 'o-value');
        value = b ? b.data : element.files ? element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0] : element.value;
        name = element.name || (b ? b.values[b.values.length - 1] : null);
        if (!name) continue;
        data[name] = value;
      }

      method = binder.data;

      if (typeof method === 'function') {
        return Promise.resolve(method.call(binder.container, data, event)).then(function ($await_31) {
          try {
            return $If_3.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }

      function $If_3() {
        if ('o-reset' in event.target.attributes) {
          event.target.reset();
        }

        return $return();
      }

      return $If_3.call(this);
    }.bind(this));
  };

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

  function Value(binder, caller) {
    var self = this;
    var type = binder.target.type;
    var data;
    if (binder.meta.busy) return;else binder.meta.busy = true;

    if (!binder.meta.setup) {
      binder.meta.setup = true;
      binder.target.addEventListener('input', function () {
        self.render(binder, 'view');
      }, false);
    }

    if (type === 'select-one' || type === 'select-multiple') {
      return {
        read: function read() {
          this.data = binder.data;
          this.model = binder.model;
          this.options = binder.target.options;
          this.multiple = multiple(binder.target);

          if (this.multiple && (!this.data || this.data.constructor !== Array)) {
            binder.meta.busy = false;
            throw new Error("Oxe - invalid o-value ".concat(binder.keys.join('.'), " multiple select requires array"));
          }
        },
        write: function write() {
          var fallback = false;
          var fallbackSelectedAtrribute = false;
          var fallbackValue = this.multiple ? [] : null;
          var fallbackOption = this.multiple ? [] : null;

          for (var i = 0, l = this.options.length; i < l; i++) {
            var option = this.options[i];
            var selected = option.selected;
            var optionBinder = self.get(option, 'o-value');
            var optionValue = optionBinder ? optionBinder.data : option.value;
            var selectedAtrribute = option.hasAttribute('selected');

            if (this.multiple) {
              if (selectedAtrribute) {
                fallback = true;
                fallbackOption.push(option);
                fallbackValue.push(optionValue);
              }
            } else {
              if (i === 0 || selectedAtrribute) {
                fallback = true;
                fallbackOption = option;
                fallbackValue = optionValue;
                fallbackSelectedAtrribute = selectedAtrribute;
              }
            }

            if (caller === 'view') {
              if (selected) {
                if (this.multiple) {
                  var includes = Includes(this.data, optionValue);

                  if (!includes) {
                    this.selected = true;
                    binder.data.push(optionValue);
                  }
                } else if (!this.selected) {
                  this.selected = true;
                  binder.data = optionValue;
                }
              } else {
                if (this.multiple) {
                  var _index3 = Index(this.data, optionValue);

                  if (_index3 !== -1) {
                    binder.data.splice(_index3, 1);
                  }
                } else if (!this.selected && i === l - 1) {
                  binder.data = null;
                }
              }
            } else {
              if (this.multiple) {
                var _includes = Includes(this.data, optionValue);

                if (_includes) {
                  this.selected = true;
                  option.selected = true;
                } else {
                  option.selected = false;
                }
              } else {
                if (!this.selected) {
                  var match = Match(this.data, optionValue);

                  if (match) {
                    this.selected = true;
                    option.selected = true;
                  } else {
                    option.selected = false;
                  }
                } else {
                  option.selected = false;
                }
              }
            }
          }

          if (!this.selected && fallback) {
            if (this.multiple) {
              for (var _i = 0, _l = fallbackOption.length; _i < _l; _i++) {
                fallbackOption[_i].selected = true;
                binder.data.push(fallbackValue[_i]);
              }
            } else if (fallbackSelectedAtrribute || this.nodeName === 'OPTION') {
              binder.data = fallbackValue;
              fallbackOption.selected = true;
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

          if (caller === 'view') {
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
          if (caller === 'view') {
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
          data = binder.data;

          if (data === binder.target.value) {
            binder.meta.busy = false;
            return this.write = false;
          }

          if (caller === 'view') {
            binder.data = binder.target.value;
            binder.meta.busy = false;
            return this.write = false;
          }
        },
        write: function write() {
          binder.target.value = data === undefined || data === null ? '' : data;
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
    data: new Map(),
    nodes: new Map(),
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
    get: function get(node, name) {
      if (!(name in node.attributes)) return null;
      var value = node.attributes[name].value;
      var binders = this.nodes.get(node);
      if (!binders || !binders.length) return null;
      var length = binders.length;

      for (var i = 0; i < length; i++) {
        var binder = binders[i];

        if (binder.name === name && binder.value === value) {
          return binder;
        }
      }

      return null;
    },
    create: function create(data) {
      var name = data.name,
          names = data.names,
          value = data.value,
          values = data.values,
          paths = data.paths,
          pipes = data.pipes,
          target = data.target,
          scope = data.scope,
          container = data.container,
          context = data.context;
      var meta = {};
      var type = names[0];
      var path = paths[0];
      var parts = paths[0].split('.');
      var location = "".concat(scope, ".").concat(path);
      var keys = [scope].concat(parts);
      var property = parts.slice(-1)[0];
      return Object.freeze({
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
        context: context,

        get data() {
          var model = traverse(container.model, parts, 1);

          if (name === 'o-value' || name.indexOf('o-on') === 0) {
            return model[property];
          } else {
            return Piper(this, model[property]);
          }
        },

        set data(value) {
          var model = traverse(container.model, parts, 1);

          if (name === 'o-value') {
            model[property] = Piper(this, value);
          } else {
            model[property] = value;
          }
        }

      });
    },
    render: function render(binder, data) {
      var type = binder.type in this.binders ? binder.type : 'default';
      var render = this.binders[type](binder, data);
      Batcher.batch(render);
    },
    unbind: function unbind(node) {
      var nodeBinders = this.nodes.get(node);

      if (nodeBinders) {
        for (var i = 0; i < nodeBinders.length; i++) {
          var nodeBinder = nodeBinders[i];
          nodeBinders.splice(i, i + 1);
          var locationBinders = this.data.get(nodeBinder.location);

          for (var _i2 = 0; _i2 < locationBinders.length; _i2++) {
            var locationBinder = locationBinders[_i2];

            if (locationBinder === nodeBinder) {
              locationBinders.splice(_i2, _i2 + 1);
            }
          }
        }
      }
    },
    bind: function bind(node, name, value, context) {
      value = value.replace(/{{|}}/g, '');
      name = name.replace(/^o-/, '');
      var pipe = value.split(PIPE);
      var paths = value.split(PATH);
      var names = name.split('-');
      var values = pipe[0] ? pipe[0].split('.') : [];
      var pipes = pipe[1] ? pipe[1].split(PIPES) : [];

      if (context && 'variable' in context) {
        var _loop = function _loop(i, l) {
          var path = paths[i];
          var parts = path.split('.');
          var part = parts.slice(1).join('.');
          var c = context;

          while (c) {
            if (node.nodeType === Node.TEXT_NODE) {
              if (value === c.keyVariable) return {
                v: Batcher.batch({
                  write: function write() {
                    node.textContent = c.key;
                  }
                })
              };
              if (value === c.indexVariable) return {
                v: Batcher.batch({
                  write: function write() {
                    node.textContent = c.index;
                  }
                })
              };
            }

            if (c.variable === parts[0]) {
              paths[i] = "".concat(c.path, ".").concat(c.key).concat(part ? ".".concat(part) : '');
              break;
            }

            if (c.indexVariable === path) {
              paths[i] = c.index;
              break;
            }

            if (c.keyVariable === path) {
              paths[i] = c.key;
              break;
            }

            var keyPattern = new RegExp("\\[".concat(c.keyVariable, "\\]"), 'g');
            var indexPattern = new RegExp("\\[".concat(c.indexVariable, "\\]"), 'g');
            paths[i] = path.replace(keyPattern, ".".concat(c.key));
            paths[i] = path.replace(indexPattern, ".".concat(c.index));
            c = c.parent;
          }
        };

        for (var i = 0, l = paths.length; i < l; i++) {
          var _ret = _loop(i, l);

          if (_typeof(_ret) === "object") return _ret.v;
        }
      }

      var binder = this.create({
        name: name,
        names: names,
        value: value,
        values: values,
        paths: paths,
        pipes: pipes,
        target: node,
        context: context,
        container: context.container,
        scope: context.container.scope
      });

      if (this.nodes.has(binder.target)) {
        this.nodes.get(binder.target).push(binder);
      } else {
        this.nodes.set(binder.target, [binder]);
      }

      if (this.data.has(binder.location)) {
        this.data.get(binder.location).push(binder);
      } else {
        this.data.set(binder.location, [binder]);
      }

      this.render(binder);
    },
    remove: function remove(node) {
      walker(node, this.unbind.bind(this));
    },
    add: function add(node, context) {
      if (node.nodeType === Node.TEXT_NODE) {
        var start = node.textContent.indexOf('{{');
        var end = node.textContent.indexOf('}}');

        if (start === -1 || end === -1) {
          return;
        }

        if (start !== -1 && start !== 0) {
          node = node.splitText(start);
        }

        var length = node.textContent.length;

        if (end !== -1 && end !== length - 2) {
          var split = node.splitText(end + 2);
          this.bind(node, 'o-text', node.textContent, context);
          this.add(split, context);
        } else {
          this.bind(node, 'o-text', node.textContent, context);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        var skip = false;
        var attributes = node.attributes;

        for (var i = 0, l = attributes.length; i < l; i++) {
          var attribute = attributes[i];

          if (attribute.name.indexOf('o-each') === 0) {
            skip = true;
          }

          if (attribute.name.indexOf('o-') === 0) {
            this.bind(node, attribute.name, attribute.value, context);
          }
        }

        if (skip) {
          return;
        }

        node = node.firstChild;

        while (node) {
          this.add(node, context);
          node = node.nextSibling;
        }
      }
    }
  });
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
  var Loader = Object.freeze({
    data: {},
    options: {},
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        var self = this;
        options = options || {};
        this.options.type = options.type || 'esm';

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
        var data, code, method, result;
        return Promise.resolve(window.fetch(url)).then(function ($await_32) {
          try {
            data = $await_32;

            if (data.status == 404) {
              return $error(new Error('Oxe.loader.load - not found ' + url));
            }

            if (data.status < 200 || data.status > 300 && data.status != 304) {
              return $error(new Error(data.statusText));
            }

            return Promise.resolve(data.text()).then(function ($await_33) {
              try {
                code = $await_33;

                if (type === 'es' || type === 'est') {
                  code = Transformer.template(code);
                }

                if (type === 'es' || type === 'esm') {
                  code = Transformer.module(code, url);
                }

                var $Try_1_Post = function () {
                  try {
                    return $return();
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                };

                var $Try_1_Catch = function (error) {
                  try {
                    throw new error.constructor("".concat(error.message, " - ").concat(url));
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                };

                try {
                  method = new Function('window', 'document', '$LOADER', code);
                  return Promise.resolve(method(window, window.document, this)).then(function ($await_34) {
                    try {
                      result = $await_34;
                      return $return(this.data[url] = result);
                    } catch ($boundEx) {
                      return $Try_1_Catch($boundEx);
                    }
                  }.bind(this), $Try_1_Catch);
                } catch (error) {
                  $Try_1_Catch(error)
                }
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
          type = $args[1] || this.options.type;
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
  });
  var STYLE = document.createElement('style');
  var SHEET = STYLE.sheet;
  STYLE.setAttribute('title', 'oxe');
  STYLE.setAttribute('type', 'text/css');
  var Style$1 = Object.freeze({
    style: STYLE,
    sheet: SHEET,
    add: function add(data) {
      this.sheet.insertRule(data);
    },
    append: function append(data) {
      this.style.appendChild(document.createTextNode(data));
    },
    setup: function setup(option) {
      return new Promise(function ($return, $error) {
        option = option || {};

        if (option.style) {
          this.append(option.style);
        }

        document.head.appendChild(this.style);
        return $return();
      }.bind(this));
    }
  });
  var Observer = {
    get: function get(tasks, handler, path, target, property) {
      if (target instanceof Array && property === 'push') {
        tasks.push(handler.bind(null, target, path.slice(0, -1)));
      }

      return target[property];
    },
    set: function set(tasks, handler, path, target, property, value) {
      if (property === 'length') {
        return true;
      }

      target[property] = this.create(value, handler, path + property, tasks);
      Promise.resolve().then(function () {
        var task;

        while (task = tasks.shift()) {
          task();
        }
      }).catch(console.error);
      return true;
    },
    create: function create(source, handler, path, tasks) {
      path = path || '';
      tasks = tasks || [];
      tasks.push(handler.bind(null, source, path));

      if (source instanceof Object === false && source instanceof Array === false) {
        if (!path) {
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

      if (!path) {
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

  var Component = Object.freeze({
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        var self = this;
        options = options || {};

        if (options.components) {
          return $return(Promise.all(options.components.map(function (component) {
            if (typeof component === 'string') {
              return Loader.load(component).then(function (load) {
                return self.define(load.default);
              });
            } else {
              return self.define(component);
            }
          })));
        }

        return $return();
      }.bind(this));
    },
    style: function style(_style, name) {
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
    },
    slot: function slot(element, fragment) {
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
    },
    fragment: function fragment(element, template, adopt) {
      var fragment = document.createDocumentFragment();
      var clone = template.cloneNode(true);
      var child = clone.firstElementChild;

      while (child) {
        if (!adopt) {
          Binder.add(child, {
            container: element,
            scope: element.scope
          });
        }

        fragment.appendChild(child);
        child = clone.firstElementChild;
      }

      return fragment;
    },
    render: function render(element, template, adopt, shadow) {
      if (!template) {
        return;
      }

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
          Binder.add(child, {
            container: element,
            scope: element.scope
          });
          child = child.nextElementSibling;
        }
      }
    },
    define: function define(options) {
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
      options.shadow = options.shadow || false;
      options.name = options.name.toLowerCase();
      options.attributes = options.attributes || [];

      if (options.style) {
        options.style = this.style(options.style, options.name);
        Style$1.append(options.style);
      }

      if (options.template && typeof options.template === 'string') {
        var data = document.createElement('div');
        data.innerHTML = options.template;
        options.template = data;
      }

      var OElement = function OElement() {
        var scope = "".concat(options.name, "-").concat(options.count++);

        var handler = function handler(data, path) {
          var location = "".concat(scope, ".").concat(path);
          var binders = Binder.data.get(location);

          if (binders) {
            binders.forEach(function (binder) {
              Binder.render(binder, data);
            });
          }
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
        if (options.detached) options.detached.call(this);
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
    }
  });
  var Fetcher = Object.freeze((_Object$freeze = {
    options: {},
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
        this.options.path = options.path;
        this.options.origin = options.origin;
        this.options.request = options.request;
        this.options.response = options.response;
        this.options.acceptType = options.acceptType;
        this.options.headers = options.headers || {};
        this.options.method = options.method || 'get';
        this.options.credentials = options.credentials;
        this.options.contentType = options.contentType;
        this.options.responseType = options.responseType;
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
        var data, copy, result, fetched, _copy, _result;

        data = Object.assign({}, options);
        data.path = data.path || this.options.path;
        data.origin = data.origin || this.options.origin;
        if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
        if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length - 1) === '/') data.origin = data.origin.slice(0, -1);
        if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;
        if (!data.method) return $error(new Error('Oxe.fetcher - requires method option'));
        if (!data.url) return $error(new Error('Oxe.fetcher - requires url or origin and path option'));
        if (!data.headers && this.options.headers) data.headers = this.options.headers;
        if (typeof data.method === 'string') data.method = data.method.toUpperCase() || this.options.method;
        if (!data.acceptType && this.options.acceptType) data.acceptType = this.options.acceptType;
        if (!data.contentType && this.options.contentType) data.contentType = this.options.contentType;
        if (!data.responseType && this.options.responseType) data.responseType = this.options.responseType;
        if (!data.credentials && this.options.credentials) data.credentials = this.options.credentials;
        if (!data.mode && this.options.mode) data.mode = this.options.mode;
        if (!data.cache && this.options.cache) data.cahce = this.options.cache;
        if (!data.redirect && this.options.redirect) data.redirect = this.options.redirect;
        if (!data.referrer && this.options.referrer) data.referrer = this.options.referrer;
        if (!data.referrerPolicy && this.options.referrerPolicy) data.referrerPolicy = this.options.referrerPolicy;
        if (!data.signal && this.options.signal) data.signal = this.options.signal;
        if (!data.integrity && this.options.integrity) data.integrity = this.options.integrity;
        if (!data.keepAlive && this.options.keepAlive) data.keepAlive = this.options.keepAlive;

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

        if (typeof this.options.request === 'function') {
          copy = Object.assign({}, data);
          return Promise.resolve(this.options.request(copy)).then(function ($await_35) {
            try {
              result = $await_35;

              if (result === false) {
                return $return(data);
              }

              if (_typeof(result) === 'object') {
                Object.assign(data, result);
              }

              return $If_4.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_4() {
          if (data.body) {
            if (data.method === 'GET') {
              return Promise.resolve(this.serialize(data.body)).then(function ($await_36) {
                try {
                  data.url = data.url + '?' + $await_36;
                  return $If_8.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            } else {
              if (data.contentType === 'json') {
                data.body = JSON.stringify(data.body);
              }

              return $If_8.call(this);
            }

            function $If_8() {
              return $If_5.call(this);
            }
          }

          function $If_5() {
            return Promise.resolve(window.fetch(data.url, Object.assign({}, data))).then(function ($await_37) {
              try {
                fetched = $await_37;
                data.code = fetched.status;
                data.message = fetched.statusText;

                if (!data.responseType) {
                  data.body = fetched.body;
                  return $If_6.call(this);
                } else {
                  return Promise.resolve(fetched[data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType]()).then(function ($await_38) {
                    try {
                      data.body = $await_38;
                      return $If_6.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_6() {
                  if (this.options.response) {
                    _copy = Object.assign({}, data);
                    return Promise.resolve(this.options.response(_copy)).then(function ($await_39) {
                      try {
                        _result = $await_39;

                        if (_result === false) {
                          return $return(data);
                        }

                        if (_typeof(_result) === 'object') {
                          Object.assign(data, _result);
                        }

                        return $If_7.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_7() {
                    return $return(data);
                  }

                  return $If_7.call(this);
                }
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          return $If_5.call(this);
        }

        return $If_4.call(this);
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
    }
  }, _defineProperty(_Object$freeze, "options", function options(data) {
    return new Promise(function ($return, $error) {
      data = typeof data === 'string' ? {
        url: data
      } : data;
      data.method = 'options';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Object$freeze, "connect", function connect(data) {
    return new Promise(function ($return, $error) {
      data = typeof data === 'string' ? {
        url: data
      } : data;
      data.method = 'connect';
      return $return(this.fetch(data));
    }.bind(this));
  }), _Object$freeze));
  var Events = Object.freeze({
    events: {},
    on: function on(name, method) {
      if (!(name in this.events)) {
        this.events[name] = [];
      }

      this.events[name].push(method);
    },
    off: function off(name, method) {
      if (name in this.events) {
        var _index4 = this.events[name].indexOf(method);

        if (_index4 !== -1) {
          this.events[name].splice(_index4, 1);
        }
      }
    },
    emit: function emit(name) {
      if (name in this.events) {
        var methods = this.events[name];
        var args = Array.prototype.slice.call(arguments, 2);
        Promise.all(methods.map(function (method) {
          return method.apply(this, args);
        })).catch(console.error);
      }
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
      return new Promise(function ($return, $error) {
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

        window.customElements.define('o-router', extend(function () {}, HTMLElement));
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

            load = load.replace(/\/?\((\w+)?\~\)\/?/ig, '') + '.js';
            load = Path.join(this.option.folder, load);
            this.data.push({
              path: path,
              load: load
            });
            return $If_10.call(this);
          } else {
            if (data.constructor === Object) {
              if (!data.path) {
                return $error(new Error('Oxe.router.add - route path required'));
              }

              if (!data.name && !data.load && !data.component) {
                return $error(new Error('Oxe.router.add -  route requires name, load, or component property'));
              }

              this.data.push(data);
              return $If_11.call(this);
            } else {
              if (data.constructor === Array) {
                i = 0, l = data.length;
                var $Loop_13_trampoline;

                function $Loop_13_step() {
                  i++;
                  return $Loop_13;
                }

                function $Loop_13() {
                  if (i < l) {
                    return Promise.resolve(this.add(data[i])).then(function ($await_42) {
                      try {
                        return $Loop_13_step;
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }, $error);
                  } else return [1];
                }

                return ($Loop_13_trampoline = function (q) {
                  while (q) {
                    if (q.then) return void q.then($Loop_13_trampoline, $error);

                    try {
                      if (q.pop) {
                        if (q.length) return q.pop() ? $Loop_13_exit.call(this) : q;else q = $Loop_13_step;
                      } else q = q.call(this);
                    } catch (_exception) {
                      return $error(_exception);
                    }
                  }
                }.bind(this))($Loop_13);

                function $Loop_13_exit() {
                  return $If_12.call(this);
                }
              }

              function $If_12() {
                return $If_11.call(this);
              }

              return $If_12.call(this);
            }

            function $If_11() {
              return $If_10.call(this);
            }
          }

          function $If_10() {
            return $If_9.call(this);
          }
        }

        function $If_9() {
          return $return();
        }

        return $If_9.call(this);
      }.bind(this));
    },
    load: function load(route) {
      return new Promise(function ($return, $error) {
        var load, _load;

        if (route.load) {
          return Promise.resolve(Loader.load(route.load)).then(function ($await_43) {
            try {
              load = $await_43;
              route = Object.assign({}, load.default, route);
              return $If_15.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_15() {
          if (typeof route.component === 'string') {
            route.load = route.component;
            return Promise.resolve(Loader.load(route.load)).then(function ($await_44) {
              try {
                _load = $await_44;
                route.component = _load.default;
                return $If_16.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_16() {
            return $return(route);
          }

          return $If_16.call(this);
        }

        return $If_15.call(this);
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
        var $Loop_17_trampoline;

        function $Loop_17_step() {
          i++;
          return $Loop_17;
        }

        function $Loop_17() {
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

            return $Loop_17_step;
          } else return [1];
        }

        return ($Loop_17_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_17_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_17_exit.call(this) : q;else q = $Loop_17_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_17);

        function $Loop_17_exit() {
          return $return();
        }
      }.bind(this));
    },
    filter: function filter(path) {
      return new Promise(function ($return, $error) {
        var result, i, l;
        result = [];
        i = 0, l = this.data.length;
        var $Loop_20_trampoline;

        function $Loop_20_step() {
          i++;
          return $Loop_20;
        }

        function $Loop_20() {
          if (i < l) {
            if (this.compare(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_46) {
                try {
                  this.data[i] = $await_46;
                  result.push(this.data[i]);
                  return $If_22.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_22() {
              return $Loop_20_step;
            }

            return $If_22.call(this);
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
          return $return(result);
        }
      }.bind(this));
    },
    find: function find(path) {
      return new Promise(function ($return, $error) {
        var i, l;
        i = 0, l = this.data.length;
        var $Loop_23_trampoline;

        function $Loop_23_step() {
          i++;
          return $Loop_23;
        }

        function $Loop_23() {
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

            return $Loop_23_step;
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

            function $If_27() {
              if (typeof this.option.before === 'function') {
                return Promise.resolve(this.option.before(location)).then(function ($await_51) {
                  try {
                    return $If_28.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_28() {
                Events.emit('route:before', location);

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
                          return $If_29.call(this);
                        } catch ($boundEx) {
                          return $error($boundEx);
                        }
                      }.bind(this), $error);
                    }

                    function $If_29() {
                      Events.emit('route:after', location);
                      return $return();
                    }

                    return $If_29.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              return $If_28.call(this);
            }

            if (typeof this.option.before === 'function') {
              return Promise.resolve(this.option.before(location)).then(function ($await_51) {
                try {
                  return $If_28.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_28() {
              Events.emit('route:before', location);

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
                        return $If_29.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_29() {
                    Events.emit('route:after', location);
                    return $return();
                  }

                  return $If_29.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $If_28.call(this);
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
  document.head.insertAdjacentHTML('afterbegin', '<style>:not(:defined){visibility:hidden;}o-router,o-router>:first-child{display:block;}</style>');
  var oSetup = document.querySelector('script[o-setup]');

  if (oSetup) {
    Promise.resolve().then(function () {
      var attribute = oSetup.getAttribute('o-setup');

      if (!attribute) {
        throw new Error('Oxe - attribute o-setup requires arguments');
      }

      var options = attribute.split(/\s+|\s*,+\s*/);
      Loader.type = options[1] || 'esm';
      return Loader.load(options[0]);
    });
  }

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
    style: Style$1,
    path: Path,
    setup: function setup(options) {
      var self = this;
      if (SETUP) return;else SETUP = true;
      options = options || {};
      options.listener = options.listener || {};
      return Promise.all([self.path.setup(options.path), self.style.setup(options.style), self.binder.setup(options.binder), self.loader.setup(options.loader), self.fetcher.setup(options.fetcher)]).then(function () {
        if (options.listener.before) {
          return options.listener.before();
        }
      }).then(function () {
        if (options.component) {
          return self.component.setup(options.component);
        }
      }).then(function () {
        if (options.router) {
          return self.router.setup(options.router);
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