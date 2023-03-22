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
  switch (typeof data) {
    case "undefined":
      return "";
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
    default:
      throw new Error("display - type not handled");
  }
}

// src/booleans.ts
var booleans = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "compact",
  "controls",
  "declare",
  "default",
  "defaultchecked",
  "defaultmuted",
  "defaultselected",
  "defer",
  "disabled",
  "draggable",
  "enabled",
  "formnovalidate",
  "indeterminate",
  "inert",
  "ismap",
  "itemstate",
  "loop",
  "multiple",
  "muted",
  "nohref",
  "noshade",
  "hidden",
  "novalidate",
  "nowrap",
  "open",
  "pauseonexit",
  "readonly",
  "required",
  "reversed",
  "stated",
  "seamless",
  "selected",
  "sortable",
  "spellcheck",
  "translate",
  "truespeed",
  "typemustmatch",
  "visible"
];
var booleans_default = booleans;

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
  const template = cache.get(strings);
  if (template) {
    return { strings, template, expressions, symbol };
  } else {
    let data = "";
    const length = strings.length - 1;
    for (let index = 0; index < length; index++) {
      data += `${strings[index]}{{${index}}}`;
    }
    data += strings[length];
    const template2 = document.createElement("template");
    template2.innerHTML = createHTML(data);
    cache.set(strings, template2);
    return { strings, template: template2, expressions, symbol };
  }
}

// src/render.ts
var filter = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;
var links = ["src", "href", "xlink:href"];
var safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
var dangerousLink = function(data) {
  return typeof data !== "string" || !safePattern.test(data);
};
var ObjectAction = function(start, end, actions, oldValue, newValue) {
  var _a, _b, _c, _d;
  oldValue = oldValue != null ? oldValue : {};
  newValue = newValue != null ? newValue : {};
  if ((oldValue == null ? void 0 : oldValue.strings) !== newValue.strings) {
    let next;
    let node = end.previousSibling;
    while (node !== start) {
      next = node == null ? void 0 : node.previousSibling;
      (_a = node == null ? void 0 : node.parentNode) == null ? void 0 : _a.removeChild(node);
      node = next;
    }
    const fragment = newValue.template.content.cloneNode(true);
    Render(fragment, newValue.expressions, actions);
    document.adoptNode(fragment);
    const l = actions.length;
    for (let i = 0; i < l; i++) {
      actions[i]((_b = oldValue.expressions) == null ? void 0 : _b[i], newValue.expressions[i]);
    }
    (_c = end.parentNode) == null ? void 0 : _c.insertBefore(fragment, end);
  } else {
    const l = actions.length;
    for (let i = 0; i < l; i++) {
      actions[i]((_d = oldValue.expressions) == null ? void 0 : _d[i], newValue.expressions[i]);
    }
  }
};
var ArrayAction = function(start, end, actions, oldValue, newValue) {
  var _a, _b, _c, _d;
  oldValue = oldValue != null ? oldValue : [];
  newValue = newValue != null ? newValue : [];
  const oldLength = oldValue.length;
  const newLength = newValue.length;
  const common = Math.min(oldLength, newLength);
  for (let i = 0; i < common; i++) {
    actions[i](oldValue[i], newValue[i]);
  }
  if (oldLength < newLength) {
    const template = document.createElement("template");
    for (let i = oldLength; i < newLength; i++) {
      if (((_a = newValue[i]) == null ? void 0 : _a.constructor) === Object && ((_b = newValue[i]) == null ? void 0 : _b.symbol) === symbol) {
        const start2 = document.createTextNode("");
        const end2 = document.createTextNode("");
        const action = ObjectAction.bind(null, start2, end2, []);
        template.content.appendChild(start2);
        template.content.appendChild(end2);
        actions.push(action);
        action(oldValue[i], newValue[i]);
      } else {
        const node = document.createTextNode("");
        const action = StandardAction.bind(null, node);
        template.content.appendChild(node);
        actions.push(action);
        action(oldValue[i], newValue[i]);
      }
    }
    (_c = end.parentNode) == null ? void 0 : _c.insertBefore(template.content, end);
  } else if (oldLength > newLength) {
    for (let i = oldLength - 1; i > newLength - 1; i--) {
      (_d = end.parentNode) == null ? void 0 : _d.removeChild(end.previousSibling);
    }
    actions.length = newLength;
  }
};
var StandardAction = function(node, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  node.textContent = newValue;
};
var AttributeOn = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  if (typeof oldValue === "function")
    element.removeEventListener(attribute.name.slice(2), oldValue);
  if (typeof newValue !== "function")
    return console.warn(`XElement - attribute name "${attribute.name}" and value "${newValue}" not allowed`);
  element.addEventListener(attribute.name.slice(2), newValue);
};
var AttributeBoolean = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  const value = newValue ? true : false;
  if (value)
    element.setAttribute(attribute.name, "");
  else
    element.removeAttribute(attribute.name);
  attribute.value = value;
  Reflect.set(element, attribute.name, attribute.value);
};
var AttributeValue = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  const value = display(newValue);
  attribute.value = value;
  Reflect.set(element, attribute.name, attribute.value);
  element.setAttribute(attribute.name, attribute.value);
};
var AttributeLink = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  const value = encodeURI(newValue);
  if (dangerousLink(value)) {
    element.removeAttribute(attribute.name);
    console.warn(`XElement - attribute name "${attribute.name}" and value "${value}" not allowed`);
    return;
  }
  attribute.value = value;
  Reflect.set(element, attribute.name, attribute.value);
  element.setAttribute(attribute.name, attribute.value);
};
var AttributeStandard = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  attribute.value = newValue;
  Reflect.set(element, attribute.name, attribute.value);
  element.setAttribute(attribute.name, attribute.value);
};
var AttributeName = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  element.removeAttribute(oldValue);
  const name = newValue == null ? void 0 : newValue.toLowerCase();
  if (name === "value") {
    attribute.name = name;
    AttributeValue(element, attribute, attribute.value, attribute.value);
  } else if (name.startsWith("on")) {
    console.warn(`XElement - dynamic attribute name "${newValue}" not allowed`);
  } else if (includes(links, name)) {
    console.warn(`XElement - dynamic attribute name "${newValue}" not allowed`);
  } else if (includes(booleans_default, name)) {
    attribute.name = name;
    AttributeBoolean(element, attribute, attribute.value, attribute.value);
  } else {
    attribute.name = name;
    AttributeStandard(element, attribute, attribute.value, attribute.value);
  }
};
var Render = function(fragment, expressions, actions) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const walker = document.createTreeWalker(document, filter, null);
  walker.currentNode = fragment;
  let index = 0;
  let node = fragment.firstChild;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.TEXT_NODE) {
      const start = (_b = (_a = node.nodeValue) == null ? void 0 : _a.indexOf("{{")) != null ? _b : -1;
      if (start == -1)
        continue;
      if (start != 0) {
        node.splitText(start);
        node = walker.nextNode();
      }
      const end = (_d = (_c = node.nodeValue) == null ? void 0 : _c.indexOf("}}")) != null ? _d : -1;
      if (end == -1)
        continue;
      if (end + 2 != ((_e = node.nodeValue) == null ? void 0 : _e.length)) {
        node.splitText(end + 2);
      }
      const newValue = expressions[index++];
      if ((newValue == null ? void 0 : newValue.constructor) === Object && (newValue == null ? void 0 : newValue.symbol) === symbol) {
        const start2 = document.createTextNode("");
        const end2 = node;
        end2.nodeValue = "";
        (_f = end2.parentNode) == null ? void 0 : _f.insertBefore(start2, end2);
        actions.push(ObjectAction.bind(null, start2, end2, []));
      } else if ((newValue == null ? void 0 : newValue.constructor) === Array) {
        const start2 = document.createTextNode("");
        const end2 = node;
        end2.nodeValue = "";
        (_g = end2.parentNode) == null ? void 0 : _g.insertBefore(start2, end2);
        actions.push(ArrayAction.bind(null, start2, end2, []));
      } else {
        node.textContent = "";
        actions.push(StandardAction.bind(null, node));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
        walker.nextSibling();
      }
      const names = node.getAttributeNames();
      for (const name of names) {
        const value = (_h = node.getAttribute(name)) != null ? _h : "";
        const attribute = { name, value };
        const dynamicName = name.includes("{{") && name.includes("}}");
        const dynamicValue = value.includes("{{") && value.includes("}}");
        if (dynamicName) {
          index++;
          node.removeAttribute(name);
          actions.push(
            AttributeName.bind(null, node, attribute)
          );
        }
        if (dynamicValue) {
          index++;
          node.removeAttribute(name);
          if (name === "value") {
            actions.push(
              AttributeValue.bind(null, node, attribute)
            );
          } else if (name.startsWith("on")) {
            actions.push(
              AttributeOn.bind(null, node, attribute)
            );
          } else if (includes(links, name)) {
            actions.push(
              AttributeLink.bind(null, node, attribute)
            );
          } else if (includes(booleans_default, name)) {
            actions.push(
              AttributeBoolean.bind(null, node, attribute)
            );
          } else {
            actions.push(
              AttributeStandard.bind(null, node, attribute)
            );
          }
        }
        if (!dynamicName && !dynamicValue) {
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
var _context, _actions, _expressions, _changeNext, _changeCurrent;
var Component = class extends HTMLElement {
  constructor() {
    var _a;
    super();
    __privateAdd(this, _context, void 0);
    __privateAdd(this, _actions, []);
    __privateAdd(this, _expressions, []);
    __privateAdd(this, _changeNext, void 0);
    __privateAdd(this, _changeCurrent, void 0);
    const constructor = this.constructor;
    const shadow = constructor.shadow;
    if (shadow && !this.shadowRoot) {
      const mode = constructor.mode;
      this.attachShadow({ mode });
    }
    const root = (_a = this.shadowRoot) != null ? _a : this;
    __privateSet(this, _context, context_default({}, () => __async(this, null, function* () {
      const change = () => __async(this, null, function* () {
        var _a2, _b, _c;
        const rendered = yield (_a2 = this.render) == null ? void 0 : _a2.call(this, __privateGet(this, _context));
        if (rendered) {
          for (let index = 0; index < __privateGet(this, _actions).length; index++) {
            const newExpression = rendered.expressions[index];
            const oldExpression = __privateGet(this, _expressions)[index];
            __privateGet(this, _actions)[index](oldExpression, newExpression);
            __privateGet(this, _expressions)[index] = rendered.expressions[index];
          }
        }
        yield (_b = this.change) == null ? void 0 : _b.call(this, __privateGet(this, _context));
        __privateSet(this, _changeCurrent, (_c = __privateGet(this, _changeNext)) == null ? void 0 : _c.call(this));
        __privateSet(this, _changeNext, void 0);
        yield __privateGet(this, _changeCurrent);
      });
      if (__privateGet(this, _changeCurrent)) {
        __privateSet(this, _changeNext, change);
      } else {
        __privateSet(this, _changeCurrent, change());
      }
    })));
    __privateSet(this, _changeCurrent, Promise.resolve().then(() => __async(this, null, function* () {
      var _a2, _b, _c, _d;
      this.dispatchEvent(creatingEvent);
      yield (_a2 = this.setup) == null ? void 0 : _a2.call(this, __privateGet(this, _context));
      const rendered = yield (_b = this.render) == null ? void 0 : _b.call(this, __privateGet(this, _context));
      if (rendered) {
        const fragment = rendered.template.content.cloneNode(true);
        __privateSet(this, _expressions, rendered.expressions);
        render_default(fragment, __privateGet(this, _expressions), __privateGet(this, _actions));
        document.adoptNode(fragment);
        for (let index = 0; index < __privateGet(this, _actions).length; index++) {
          const newExpression = rendered.expressions[index];
          __privateGet(this, _actions)[index](void 0, newExpression);
        }
        root.appendChild(fragment);
      }
      __privateSet(this, _changeCurrent, (_c = __privateGet(this, _changeNext)) == null ? void 0 : _c.call(this));
      __privateSet(this, _changeNext, void 0);
      yield __privateGet(this, _changeCurrent);
      yield (_d = this.create) == null ? void 0 : _d.call(this, __privateGet(this, _context));
      this.dispatchEvent(createdEvent);
    })));
  }
  static define(tag) {
    var _a, _b;
    tag = dash((_a = tag != null ? tag : this.tag) != null ? _a : this.name);
    define((_b = tag != null ? tag : this.tag) != null ? _b : this.name, this);
  }
  connectedCallback() {
    return __async(this, null, function* () {
      var _a, _b;
      this.dispatchEvent(connectingEvent);
      yield __privateGet(this, _changeCurrent);
      yield (_b = (_a = this.connect) == null ? void 0 : _a.call(this, __privateGet(this, _context))) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(connectedEvent);
    });
  }
  disconnectedCallback() {
    return __async(this, null, function* () {
      var _a, _b;
      this.dispatchEvent(disconnectingEvent);
      yield (_b = (_a = this.disconnect) == null ? void 0 : _a.call(this, __privateGet(this, _context))) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(disconnectedEvent);
    });
  }
};
_context = new WeakMap();
_actions = new WeakMap();
_expressions = new WeakMap();
_changeNext = new WeakMap();
_changeCurrent = new WeakMap();
Component.html = html;
Component.shadow = false;
Component.mode = "open";

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
      route.tag = dash((_b = route.construct.tag) != null ? _b : route.construct.name);
      define(route.tag, route.construct);
      route.instance = document.createElement(route.tag);
      replaceChildren(route.root, route.instance);
    }
  });
};
var navigate = function(event) {
  var _a, _b, _c;
  if (event && "canIntercept" in event && event.canIntercept === false)
    return;
  if (event && "canTransition" in event && event.canTransition === false)
    return;
  const destination = new URL((_a = event == null ? void 0 : event.destination.url) != null ? _a : location.href);
  const base = new URL((_c = (_b = document.querySelector("base")) == null ? void 0 : _b.href) != null ? _c : location.origin);
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
  Router: router_default,
  component: Component,
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
