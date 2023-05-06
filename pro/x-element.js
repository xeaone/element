/************************************************************************
Name: XElement
Version: 8.2.2
License: MPL-2.0
Author: Alexander Elias
Email: alex.steven.elis@gmail.com
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
************************************************************************/
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/define.ts
function define(name, constructor) {
  if (!customElements.get(name)) {
    customElements.define(name, constructor);
  }
}

// src/display.ts
function display(data) {
  switch (`${data}`) {
    case "NaN":
      return "";
    case "null":
      return "";
    case "undefined":
      return "";
  }
  switch (typeof data) {
    case "string":
      return data;
    case "number":
      return `${data}`;
    case "bigint":
      return `${data}`;
    case "boolean":
      return `${data}`;
    case "function":
      return `${data()}`;
    case "symbol":
      return String(data);
    case "object":
      return JSON.stringify(data);
  }
  throw new Error("XElement - display type not handled");
}

// src/mark.ts
var mark_default = () => Math.floor(Math.random() * Date.now());

// src/poly.ts
var replaceChildren = function(element, ...nodes) {
  while (element.lastChild) {
    element.removeChild(element.lastChild);
  }
  if (nodes == null ? void 0 : nodes.length) {
    for (const node of nodes) {
      element.appendChild(
        typeof node === "string" ? element.ownerDocument.createTextNode(node) : node
      );
    }
  }
};
var includes = function(item, search) {
  return item.indexOf(search) !== -1;
};
var policy = "trustedTypes" in window ? window.trustedTypes.createPolicy("x-element", { createHTML: (data) => data }) : null;
var createHTML = function(data) {
  if (policy) {
    return policy.createHTML(data);
  } else {
    return data;
  }
};

// src/html.ts
var symbol = Symbol("html");
var cache = /* @__PURE__ */ new WeakMap();
function html(strings, ...expressions) {
  const value = cache.get(strings);
  if (value) {
    const [template, marker] = value;
    return { strings, template, expressions, symbol, marker };
  } else {
    const marker = `X-${mark_default()}-X`;
    let data = "";
    const length = strings.length - 1;
    for (let index = 0; index < length; index++) {
      data += `${strings[index]}${marker}`;
    }
    data += strings[length];
    const template = document.createElement("template");
    template.innerHTML = createHTML(data);
    cache.set(strings, [template, marker]);
    return { strings, template, expressions, symbol, marker };
  }
}

// src/render.ts
var filter = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;
var links = ["src", "href", "xlink:href"];
var safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
var dangerousLink = function(data) {
  if (data === "")
    return false;
  if (typeof data !== "string")
    return false;
  return safePattern.test(data) ? false : true;
};
var removeBetween = function(start, end) {
  var _a;
  let node = end.previousSibling;
  while (node !== start) {
    (_a = node == null ? void 0 : node.parentNode) == null ? void 0 : _a.removeChild(node);
    node = end.previousSibling;
  }
};
var ElementAction = function(source, target) {
  var _a, _b, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  if ((target == null ? void 0 : target.symbol) === symbol) {
    source = source != null ? source : {};
    target = target != null ? target : {};
    if (source.strings === target.strings) {
      const l = this.actions.length;
      for (let i = 0; i < l; i++) {
        this.actions[i](source.expressions[i], target.expressions[i]);
      }
    } else {
      this.actions.length = 0;
      const fragment = target.template.content.cloneNode(true);
      Render(fragment, this.actions, target.marker);
      const l = this.actions.length;
      for (let i = 0; i < l; i++) {
        this.actions[i]((_a = source.expressions) == null ? void 0 : _a[i], target.expressions[i]);
      }
      document.adoptNode(fragment);
      removeBetween(this.start, this.end);
      (_b = this.end.parentNode) == null ? void 0 : _b.insertBefore(fragment, this.end);
    }
  } else if ((target == null ? void 0 : target.constructor) === Array) {
    source = source != null ? source : [];
    target = target != null ? target : [];
    const oldLength = source.length;
    const newLength = target.length;
    const common = Math.min(oldLength, newLength);
    for (let i = 0; i < common; i++) {
      this.actions[i](source[i], target[i]);
    }
    if (oldLength < newLength) {
      const template = document.createElement("template");
      for (let i = oldLength; i < newLength; i++) {
        const startChild = document.createTextNode("");
        const endChild = document.createTextNode("");
        const action = ElementAction.bind({
          start: startChild,
          end: endChild,
          actions: []
        });
        template.content.appendChild(startChild);
        template.content.appendChild(endChild);
        this.actions.push(action);
        action(source[i], target[i]);
      }
      (_c2 = this.end.parentNode) == null ? void 0 : _c2.insertBefore(template.content, this.end);
    } else if (oldLength > newLength) {
      for (let i = oldLength - 1; i > newLength - 1; i--) {
        if (((_d = source[i]) == null ? void 0 : _d.symbol) === symbol) {
          const { template } = source[i];
          let removes = template.content.childNodes.length + 2;
          while (removes--)
            (_e = this.end.parentNode) == null ? void 0 : _e.removeChild(this.end.previousSibling);
        } else {
          (_f = this.end.parentNode) == null ? void 0 : _f.removeChild(this.end.previousSibling);
          (_g = this.end.parentNode) == null ? void 0 : _g.removeChild(this.end.previousSibling);
          (_h = this.end.parentNode) == null ? void 0 : _h.removeChild(this.end.previousSibling);
        }
      }
      this.actions.length = newLength;
    }
  } else {
    if (source === target)
      return;
    if (typeof source !== typeof target) {
      while (this.end.previousSibling !== this.start) {
        (_i = this.end.parentNode) == null ? void 0 : _i.removeChild(this.end.previousSibling);
      }
    }
    let node;
    if (this.end.previousSibling === this.start) {
      node = document.createTextNode(display(target));
      (_j = this.end.parentNode) == null ? void 0 : _j.insertBefore(node, this.end);
    } else {
      if (((_k = this.end.previousSibling) == null ? void 0 : _k.nodeType) === Node.TEXT_NODE) {
        node = this.end.previousSibling;
        node.textContent = display(target);
      } else {
        node = document.createTextNode(display(target));
        (_l = this.end.parentNode) == null ? void 0 : _l.removeChild(this.end.previousSibling);
        (_m = this.end.parentNode) == null ? void 0 : _m.insertBefore(node, this.end);
      }
    }
  }
};
var AttributeNameAction = function(source, target) {
  if (source === target)
    return;
  if ((source == null ? void 0 : source.startsWith("on")) && typeof this.value === "function") {
    this.element.removeEventListener(source.slice(2), this.value);
  }
  Reflect.set(this.element, source, void 0);
  this.element.removeAttribute(source);
  this.name = target == null ? void 0 : target.toLowerCase();
  if (this.name) {
    this.element.setAttribute(this.name, "");
  }
};
var AttributeValueAction = function(source, target) {
  if (source === target)
    return;
  if (this.name === "value") {
    this.value = display(target);
    if (!this.name)
      return;
    Reflect.set(this.element, this.name, this.value);
    this.element.setAttribute(this.name, this.value);
  } else if (this.name.startsWith("on")) {
    if (!this.name)
      return;
    if (typeof this.value === "function") {
      this.element.removeEventListener(this.name.slice(2), this.value, true);
    }
    this.value = target;
    if (typeof this.value !== "function")
      return console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
    this.element.addEventListener(this.name.slice(2), this.value, true);
  } else if (includes(links, this.name)) {
    this.value = encodeURI(target);
    if (!this.name)
      return;
    if (dangerousLink(this.value)) {
      this.element.removeAttribute(this.name);
      console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
      return;
    }
    Reflect.set(this.element, this.name, this.value);
    this.element.setAttribute(this.name, this.value);
  } else {
    this.value = target;
    if (!this.name)
      return;
    Reflect.set(this.element, this.name, this.value);
    this.element.setAttribute(this.name, this.value);
  }
};
var TagAction = function(source, target) {
  var _a, _b, _c2, _d;
  if (source === target)
    return;
  const oldElement = this.element;
  if (target) {
    (_a = oldElement.parentNode) == null ? void 0 : _a.removeChild(oldElement);
    const newElement = document.createElement(target);
    while (oldElement.firstChild)
      newElement.appendChild(oldElement.firstChild);
    if (oldElement.nodeType === Node.ELEMENT_NODE) {
      const attributeNames = oldElement.getAttributeNames();
      for (const attributeName of attributeNames) {
        const attributeValue = (_b = oldElement.getAttribute(attributeName)) != null ? _b : "";
        newElement.setAttribute(attributeName, attributeValue);
      }
    }
    (_c2 = this.holder.parentNode) == null ? void 0 : _c2.insertBefore(newElement, this.holder);
    this.element = newElement;
  } else {
    (_d = oldElement.parentNode) == null ? void 0 : _d.removeChild(oldElement);
    this.element = oldElement;
  }
};
var Render = function(fragment, actions, marker) {
  var _a, _b, _c2, _d, _e, _f;
  const holders = /* @__PURE__ */ new WeakSet();
  const walker = document.createTreeWalker(document, filter, null);
  walker.currentNode = fragment;
  let node = fragment.firstChild;
  while (node = walker.nextNode()) {
    if (holders.has(node.previousSibling)) {
      holders.delete(node.previousSibling);
      actions.push(() => void 0);
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const startIndex = (_b = (_a = node.nodeValue) == null ? void 0 : _a.indexOf(marker)) != null ? _b : -1;
      if (startIndex === -1)
        continue;
      if (startIndex !== 0) {
        node.splitText(startIndex);
        node = walker.nextNode();
      }
      const endIndex = marker.length;
      if (endIndex !== ((_c2 = node.nodeValue) == null ? void 0 : _c2.length)) {
        node.splitText(endIndex);
      }
      const start = document.createTextNode("");
      const end = node;
      end.textContent = "";
      (_d = end.parentNode) == null ? void 0 : _d.insertBefore(start, end);
      actions.push(ElementAction.bind({ marker, start, end, actions: [] }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
        walker.nextSibling();
      }
      const tMeta = {
        element: node
      };
      if (node.nodeName === marker) {
        holders.add(node);
        tMeta.holder = document.createTextNode("");
        (_e = node.parentNode) == null ? void 0 : _e.insertBefore(tMeta.holder, node);
        actions.push(TagAction.bind(tMeta));
      }
      const names = node.getAttributeNames();
      for (const name of names) {
        const value = (_f = node.getAttribute(name)) != null ? _f : "";
        const dynamicName = name.toUpperCase().includes(marker);
        const dynamicValue = value.includes(marker);
        if (dynamicName || dynamicValue) {
          const aMeta = {
            name,
            value,
            previous: void 0,
            get element() {
              return tMeta.element;
            }
          };
          if (dynamicName) {
            node.removeAttribute(name);
            actions.push(AttributeNameAction.bind(aMeta));
          }
          if (dynamicValue) {
            node.removeAttribute(name);
            actions.push(AttributeValueAction.bind(aMeta));
          }
        } else {
          if (includes(links, name)) {
            if (dangerousLink(value)) {
              node.removeAttribute(name);
              console.warn(`XElement - attribute name "${name}" and value "${value}" not allowed`);
            }
          } else if (name.startsWith("on")) {
            node.removeAttribute(name);
            console.warn(`XElement - attribute name "${name}" not allowed`);
          }
        }
      }
    } else {
      console.warn(`XElement - node type "${node.nodeType}" not handled`);
    }
  }
};
var render_default = Render;

// src/context.ts
var ContextSet = function(method, target, key, value, receiver) {
  if (typeof key === "symbol")
    return Reflect.set(target, key, value, receiver);
  const from = Reflect.get(target, key, receiver);
  if (from === value)
    return true;
  if (Number.isNaN(from) && Number.isNaN(value))
    return true;
  Reflect.set(target, key, value, receiver);
  method();
  return true;
};
var ContextGet = function(method, target, key, receiver) {
  if (typeof key === "symbol")
    return Reflect.get(target, key, receiver);
  const value = Reflect.get(target, key, receiver);
  if (value && typeof value == "function") {
    return new Proxy(value, {
      apply(t, _, a) {
        return Reflect.apply(t.bind(target), receiver, a);
      }
    });
  }
  if (value && typeof value == "object") {
    return new Proxy(value, {
      get: ContextGet.bind(null, method),
      set: ContextSet.bind(null, method),
      deleteProperty: ContextDelete.bind(null, method)
    });
  }
  return value;
};
var ContextDelete = function(method, target, key) {
  if (typeof key === "symbol")
    return Reflect.deleteProperty(target, key);
  Reflect.deleteProperty(target, key);
  method();
  return true;
};
var Context = function(data, method) {
  return new Proxy(data, {
    get: ContextGet.bind(null, method),
    set: ContextSet.bind(null, method),
    deleteProperty: ContextDelete.bind(null, method)
  });
};
var context_default = Context;

// src/dash.ts
function dash(data) {
  data = data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2");
  data = data.toLowerCase();
  data = data.includes("-") ? data : `x-${data}`;
  return data;
}

// src/events.ts
var adoptedEvent = new Event("adopted");
var adoptingEvent = new Event("adopting");
var upgradedEvent = new Event("upgraded");
var upgradingEvent = new Event("upgrading");
var creatingEvent = new Event("creating");
var createdEvent = new Event("created");
var renderingEvent = new Event("rendering");
var renderedEvent = new Event("rendered");
var connectedEvent = new Event("connected");
var connectingEvent = new Event("connecting");
var attributedEvent = new Event("attributed");
var attributingEvent = new Event("attributing");
var disconnectedEvent = new Event("disconnected");
var disconnectingEvent = new Event("disconnecting");

// src/component.ts
var task = Symbol("Task");
var create = Symbol("Create");
var setup = Symbol("Setup");
var update = Symbol("Update");
var _context, _root, _marker, _actions, _expressions, _busy, _restart, _created, _c;
var Component = class extends HTMLElement {
  constructor() {
    var _a;
    super();
    __privateAdd(this, _context, {});
    __privateAdd(this, _root, void 0);
    __privateAdd(this, _marker, "");
    __privateAdd(this, _actions, []);
    __privateAdd(this, _expressions, []);
    __privateAdd(this, _busy, false);
    __privateAdd(this, _restart, false);
    __privateAdd(this, _created, false);
    this[_c] = Promise.resolve();
    const constructor = this.constructor;
    const shadow = constructor.shadow;
    if (shadow && !this.shadowRoot) {
      const mode = constructor.mode || "open";
      this.attachShadow({ mode });
    }
    __privateSet(this, _root, (_a = this.shadowRoot) != null ? _a : this);
  }
  static define(tag = ((_a) => (_a = this.tag) != null ? _a : this.name)()) {
    tag = dash(tag);
    define(tag, this);
    return this;
  }
  static create() {
    return __async(this, arguments, function* (tag = ((_b) => (_b = this.tag) != null ? _b : this.name)()) {
      tag = dash(tag);
      define(tag, this);
      const instance = document.createElement(tag);
      yield instance[create];
      return instance;
    });
  }
  attributeChangedCallback(name, oldValue, newValue) {
    return __async(this, null, function* () {
      var _a, _b;
      this.dispatchEvent(attributingEvent);
      yield (_b = (_a = this.attribute) == null ? void 0 : _a.call(this, name, oldValue, newValue)) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(attributedEvent);
    });
  }
  adoptedCallback() {
    return __async(this, null, function* () {
      var _a, _b;
      this.dispatchEvent(adoptingEvent);
      yield (_b = (_a = this.adopted) == null ? void 0 : _a.call(this, __privateGet(this, _context))) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(adoptedEvent);
    });
  }
  connectedCallback() {
    return __async(this, null, function* () {
      var _a, _b;
      if (!__privateGet(this, _created)) {
        yield this[create]();
      } else {
        this.dispatchEvent(connectingEvent);
        yield (_b = (_a = this.connected) == null ? void 0 : _a.call(this, __privateGet(this, _context))) == null ? void 0 : _b.catch(console.error);
        this.dispatchEvent(connectedEvent);
      }
    });
  }
  disconnectedCallback() {
    return __async(this, null, function* () {
      var _a, _b;
      this.dispatchEvent(disconnectingEvent);
      yield (_b = (_a = this.disconnected) == null ? void 0 : _a.call(this, __privateGet(this, _context))) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(disconnectedEvent);
    });
  }
  [(_c = task, create)]() {
    return __async(this, null, function* () {
      var _a, _b, _c2;
      __privateSet(this, _created, true);
      __privateSet(this, _busy, true);
      yield this[setup]();
      this.dispatchEvent(creatingEvent);
      yield (_a = this.created) == null ? void 0 : _a.call(this, __privateGet(this, _context));
      this.dispatchEvent(createdEvent);
      this.dispatchEvent(connectingEvent);
      yield (_c2 = (_b = this.connected) == null ? void 0 : _b.call(this, __privateGet(this, _context))) == null ? void 0 : _c2.catch(console.error);
      this.dispatchEvent(connectedEvent);
      __privateSet(this, _busy, false);
      __privateSet(this, _restart, false);
      yield this[update]();
    });
  }
  [update]() {
    return __async(this, null, function* () {
      if (__privateGet(this, _busy)) {
        __privateSet(this, _restart, true);
        return this[task];
      }
      __privateSet(this, _busy, true);
      this[task] = this[task].then(() => __async(this, null, function* () {
        var _a, _b;
        this.dispatchEvent(renderingEvent);
        const template = yield (_a = this.render) == null ? void 0 : _a.call(this, __privateGet(this, _context));
        if (template) {
          for (let index = 0; index < __privateGet(this, _actions).length; index++) {
            if (__privateGet(this, _restart)) {
              yield Promise.resolve().then().catch(console.error);
              index = -1;
              __privateSet(this, _restart, false);
              continue;
            }
            const newExpression = template.expressions[index];
            const oldExpression = __privateGet(this, _expressions)[index];
            try {
              __privateGet(this, _actions)[index](oldExpression, newExpression);
            } catch (error) {
              console.error(error);
            }
            __privateGet(this, _expressions)[index] = template.expressions[index];
          }
        }
        __privateSet(this, _busy, false);
        yield (_b = this.rendered) == null ? void 0 : _b.call(this, __privateGet(this, _context));
        this.dispatchEvent(renderedEvent);
      })).catch(console.error);
      return this[task];
    });
  }
  [setup]() {
    return __async(this, null, function* () {
      var _a, _b;
      const constructor = this.constructor;
      const observedProperties = constructor.observedProperties;
      const prototype = Object.getPrototypeOf(this);
      const properties = observedProperties ? observedProperties != null ? observedProperties : [] : [
        ...Object.getOwnPropertyNames(this),
        ...Object.getOwnPropertyNames(prototype)
      ];
      for (const property of properties) {
        if ("attributeChangedCallback" === property || "disconnectedCallback" === property || "connectedCallback" === property || "adoptedCallback" === property || "constructor" === property || "disconnected" === property || "attribute" === property || "connected" === property || "rendered" === property || "created" === property || "adopted" === property || "render" === property || "setup" === property)
          continue;
        const descriptor = (_a = Object.getOwnPropertyDescriptor(this, property)) != null ? _a : Object.getOwnPropertyDescriptor(prototype, property);
        if (!descriptor)
          continue;
        if (!descriptor.configurable)
          continue;
        if (typeof descriptor.value === "function")
          descriptor.value = descriptor.value.bind(this);
        if (typeof descriptor.get === "function")
          descriptor.get = descriptor.get.bind(this);
        if (typeof descriptor.set === "function")
          descriptor.set = descriptor.set.bind(this);
        Object.defineProperty(__privateGet(this, _context), property, descriptor);
        Object.defineProperty(this, property, {
          enumerable: descriptor.enumerable,
          configurable: false,
          // configurable: descriptor.configurable,
          get() {
            return __privateGet(this, _context)[property];
          },
          set(value) {
            __privateGet(this, _context)[property] = value;
            this[update]();
          }
        });
      }
      __privateSet(this, _context, context_default(__privateGet(this, _context), this[update].bind(this)));
      const template = yield (_b = this.render) == null ? void 0 : _b.call(this, __privateGet(this, _context));
      if (template) {
        const fragment = template.template.content.cloneNode(true);
        __privateSet(this, _marker, template.marker);
        __privateSet(this, _expressions, template.expressions);
        render_default(fragment, __privateGet(this, _actions), __privateGet(this, _marker));
        for (let index = 0; index < __privateGet(this, _actions).length; index++) {
          const newExpression = template.expressions[index];
          try {
            __privateGet(this, _actions)[index](void 0, newExpression);
          } catch (error) {
            console.error(error);
          }
        }
        document.adoptNode(fragment);
        __privateGet(this, _root).appendChild(fragment);
      }
    });
  }
};
_context = new WeakMap();
_root = new WeakMap();
_marker = new WeakMap();
_actions = new WeakMap();
_expressions = new WeakMap();
_busy = new WeakMap();
_restart = new WeakMap();
_created = new WeakMap();
Component.html = html;

// src/router.ts
var alls = [];
var routes = [];
var transition = function(route) {
  return __async(this, null, function* () {
    var _a, _b;
    if (route.instance) {
      replaceChildren(route.root, route.instance);
    } else {
      const result = yield route.handler();
      if ((result == null ? void 0 : result.prototype) instanceof HTMLElement) {
        route.construct = result;
      } else if (((_a = result == null ? void 0 : result.default) == null ? void 0 : _a.prototype) instanceof HTMLElement) {
        route.construct = result.default;
      } else {
        throw new Error("XElement - router handler requires a CustomElementConstructor");
      }
      if (route.construct.prototype instanceof Component) {
        route.instance = yield route.construct.create();
      } else {
        route.tag = dash((_b = route.construct.tag) != null ? _b : route.construct.name);
        define(route.tag, route.construct);
        route.instance = document.createElement(route.tag);
      }
      replaceChildren(route.root, route.instance);
    }
  });
};
var navigate = function(event) {
  var _a, _b, _c2;
  if (event && "canIntercept" in event && event.canIntercept === false)
    return;
  if (event && "canTransition" in event && event.canTransition === false)
    return;
  const destination = new URL((_a = event == null ? void 0 : event.destination.url) != null ? _a : location.href);
  const base = new URL((_c2 = (_b = document.querySelector("base")) == null ? void 0 : _b.href) != null ? _c2 : location.origin);
  base.hash = "";
  base.search = "";
  destination.hash = "";
  destination.search = "";
  const pathname = destination.href.replace(base.href, "/");
  const transitions = [];
  for (const route of routes) {
    if (route.path !== pathname)
      continue;
    transitions.push(route);
  }
  for (const all of alls) {
    let has = false;
    for (const transition2 of transitions) {
      if (transition2.root === all.root) {
        has = true;
        break;
      }
    }
    if (has)
      continue;
    transitions.push(all);
  }
  if (event == null ? void 0 : event.intercept) {
    return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
  } else if (event == null ? void 0 : event.transitionWhile) {
    return event.transitionWhile(transitions.map((route) => transition(route)));
  } else {
    transitions.map((route) => transition(route));
  }
};
var router = function(path, root, handler) {
  if (!path)
    throw new Error("XElement - router path required");
  if (!handler)
    throw new Error("XElement - router handler required");
  if (!root)
    throw new Error("XElement - router root required");
  if (path === "/*") {
    for (const all of alls) {
      if (all.path === path && all.root === root) {
        throw new Error("XElement - router duplicate path on root");
      }
    }
    alls.push({ path, root, handler });
  } else {
    for (const route of routes) {
      if (route.path === path && route.root === root) {
        throw new Error("XElement - router duplicate path on root");
      }
    }
    routes.push({ path, root, handler, instance: void 0 });
  }
  Reflect.get(window, "navigation").addEventListener("navigate", navigate);
};
var router_default = router;

// src/index.ts
var src_default = {
  Component,
  component: Component,
  Router: router_default,
  router: router_default,
  html
};
export {
  Component,
  router_default as Router,
  Component as component,
  src_default as default,
  html,
  router_default as router
};
//# sourceMappingURL=x-element.js.map
