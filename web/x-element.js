var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
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
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
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
  if (nodes?.length) {
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
var clear = function(start, end) {
  let node = end.previousSibling;
  while (node !== start) {
    node?.parentNode?.removeChild(node);
    node = end.previousSibling;
  }
};
var ElementAction = function(oldValue, newValue) {
  if (newValue?.symbol === symbol) {
    oldValue = oldValue ?? {};
    newValue = newValue ?? {};
    if (oldValue.strings === newValue.strings) {
      const l = this.actions.length;
      for (let i = 0; i < l; i++) {
        this.actions[i](oldValue.expressions[i], newValue.expressions[i]);
      }
    } else {
      const fragment = newValue.template.content.cloneNode(true);
      Render(fragment, this.actions);
      const l = this.actions.length;
      for (let i = 0; i < l; i++) {
        this.actions[i](oldValue.expressions?.[i], newValue.expressions[i]);
      }
      document.adoptNode(fragment);
      clear(this.start, this.end);
      this.end.parentNode?.insertBefore(fragment, this.end);
    }
  } else if (newValue?.constructor === Array) {
    oldValue = oldValue ?? [];
    newValue = newValue ?? [];
    const oldLength = oldValue.length;
    const newLength = newValue.length;
    const common = Math.min(oldLength, newLength);
    for (let i = 0; i < common; i++) {
      this.actions[i](oldValue[i], newValue[i]);
    }
    if (oldLength < newLength) {
      const template = document.createElement("template");
      for (let i = oldLength; i < newLength; i++) {
        const startChild = document.createTextNode("");
        const endChild = document.createTextNode("");
        const action = ElementAction.bind({ start: startChild, end: endChild, actions: [] });
        template.content.appendChild(startChild);
        template.content.appendChild(endChild);
        this.actions.push(action);
        action(oldValue[i], newValue[i]);
      }
      this.end.parentNode?.insertBefore(template.content, this.end);
    } else if (oldLength > newLength) {
      for (let i = oldLength - 1; i > newLength - 1; i--) {
        if (oldValue[i]?.symbol === symbol) {
          const { template } = oldValue[i];
          let removes = template.content.childNodes.length + 2;
          while (removes--)
            this.end.parentNode?.removeChild(this.end.previousSibling);
        } else {
          this.end.parentNode?.removeChild(this.end.previousSibling);
          this.end.parentNode?.removeChild(this.end.previousSibling);
          this.end.parentNode?.removeChild(this.end.previousSibling);
        }
      }
      this.actions.length = newLength;
    }
  } else {
    if (oldValue === newValue)
      return;
    while (this.end.previousSibling !== this.start) {
      this.end.parentNode?.removeChild(this.end.previousSibling);
    }
    let node;
    if (this.end.previousSibling === this.start) {
      node = document.createTextNode(newValue);
      this.end.parentNode?.insertBefore(node, this.end);
    } else {
      if (this.end.previousSibling.nodeType === Node.TEXT_NODE) {
        node = this.end.previousSibling;
        node.textContent = newValue;
      } else {
        node = document.createTextNode(newValue);
        this.end.parentNode?.removeChild(this.end.previousSibling);
        this.end.parentNode?.insertBefore(node, this.end);
      }
    }
  }
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
  const name = newValue?.toLowerCase();
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
var Render = function(fragment, actions) {
  const walker = document.createTreeWalker(document, filter, null);
  walker.currentNode = fragment;
  let index = 0;
  let node = fragment.firstChild;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.TEXT_NODE) {
      const startIndex = node.nodeValue?.indexOf("{{") ?? -1;
      if (startIndex == -1)
        continue;
      if (startIndex != 0) {
        node.splitText(startIndex);
        node = walker.nextNode();
      }
      const endIndex = node.nodeValue?.indexOf("}}") ?? -1;
      if (endIndex == -1)
        continue;
      if (endIndex + 2 != node.nodeValue?.length) {
        node.splitText(endIndex + 2);
      }
      index++;
      const start = document.createTextNode("");
      const end = node;
      end.textContent = "";
      end.parentNode?.insertBefore(start, end);
      actions.push(ElementAction.bind({ start, end, actions: [] }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
        walker.nextSibling();
      }
      const names = node.getAttributeNames();
      for (const name of names) {
        const value = node.getAttribute(name) ?? "";
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
  Reflect.set(target, key, value, receiver);
  if (from === value)
    return true;
  if (Number.isNaN(from) && Number.isNaN(value))
    return true;
  method();
  return true;
};
var ContextGet = function(method, target, key, receiver) {
  if (typeof key === "symbol")
    return Reflect.get(target, key, receiver);
  const value = Reflect.get(target, key, receiver);
  if (value?.constructor?.name === "Object" || value?.constructor?.name === "Array") {
    return new Proxy(value, {
      get: ContextGet.bind(null, method),
      set: ContextSet.bind(null, method),
      deleteProperty: ContextDelete.bind(null, method)
    });
  }
  if (value?.constructor?.name === "Function" || value?.constructor?.name === "AsyncFunction") {
    return new Proxy(value, { apply: (t, _, a) => Reflect.apply(t, receiver, a) });
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
var _context, _root, _actions, _expressions, _changeNext, _changeCurrent, _change, change_fn, _setup, setup_fn;
var Component = class extends HTMLElement {
  constructor() {
    super();
    __privateAdd(this, _change);
    __privateAdd(this, _setup);
    __privateAdd(this, _context, {});
    __privateAdd(this, _root, void 0);
    __privateAdd(this, _actions, []);
    __privateAdd(this, _expressions, []);
    __privateAdd(this, _changeNext, void 0);
    __privateAdd(this, _changeCurrent, void 0);
    const constructor = this.constructor;
    const shadow = constructor.shadow;
    if (shadow && !this.shadowRoot) {
      const mode = constructor.mode || "open";
      this.attachShadow({ mode });
    }
    __privateSet(this, _root, this.shadowRoot ?? this);
  }
  static define(tag) {
    tag = dash(tag ?? this.tag ?? this.name);
    define(tag, this);
    return this;
  }
  async attributeChangedCallback(name, oldValue, newValue) {
    this.dispatchEvent(attributingEvent);
    await this.attribute?.(name, oldValue, newValue)?.catch(console.error);
    this.dispatchEvent(attributedEvent);
  }
  async adoptedCallback() {
    this.dispatchEvent(adoptingEvent);
    await this.adopted?.(__privateGet(this, _context))?.catch(console.error);
    this.dispatchEvent(adoptedEvent);
  }
  async connectedCallback() {
    __privateSet(this, _changeCurrent, __privateMethod(this, _setup, setup_fn).call(this));
    await __privateGet(this, _changeCurrent);
    this.dispatchEvent(connectingEvent);
    await this.connected?.(__privateGet(this, _context))?.catch(console.error);
    this.dispatchEvent(connectedEvent);
  }
  async disconnectedCallback() {
    this.dispatchEvent(disconnectingEvent);
    await this.disconnected?.(__privateGet(this, _context))?.catch(console.error);
    this.dispatchEvent(disconnectedEvent);
  }
};
_context = new WeakMap();
_root = new WeakMap();
_actions = new WeakMap();
_expressions = new WeakMap();
_changeNext = new WeakMap();
_changeCurrent = new WeakMap();
_change = new WeakSet();
change_fn = async function() {
  const change = async () => {
    var _a;
    this.dispatchEvent(renderingEvent);
    const template = await this.render?.(__privateGet(this, _context));
    if (template) {
      for (let index = 0; index < __privateGet(this, _actions).length; index++) {
        const newExpression = template.expressions[index];
        const oldExpression = __privateGet(this, _expressions)[index];
        __privateGet(this, _actions)[index](oldExpression, newExpression);
        __privateGet(this, _expressions)[index] = template.expressions[index];
      }
    }
    await this.rendered?.(__privateGet(this, _context));
    this.dispatchEvent(renderedEvent);
    __privateSet(this, _changeCurrent, (_a = __privateGet(this, _changeNext)) == null ? void 0 : _a.call(this));
    __privateSet(this, _changeNext, void 0);
    await __privateGet(this, _changeCurrent);
  };
  if (__privateGet(this, _changeCurrent)) {
    __privateSet(this, _changeNext, change);
  } else {
    __privateSet(this, _changeCurrent, change());
  }
};
_setup = new WeakSet();
setup_fn = async function() {
  var _a;
  const constructor = this.constructor;
  const observedProperties = constructor.observedProperties;
  const prototype = Object.getPrototypeOf(this);
  const properties = observedProperties ? observedProperties ?? [] : [
    ...Object.getOwnPropertyNames(this),
    ...Object.getOwnPropertyNames(prototype)
  ];
  for (const property of properties) {
    if ("attributeChangedCallback" === property || "disconnectedCallback" === property || "connectedCallback" === property || "adoptedCallback" === property || "constructor" === property || "disconnected" === property || "attribute" === property || "connected" === property || "rendered" === property || "created" === property || "adopted" === property || "render" === property || "setup" === property)
      continue;
    const descriptor = Object.getOwnPropertyDescriptor(this, property) ?? Object.getOwnPropertyDescriptor(prototype, property);
    if (!descriptor)
      continue;
    if (!descriptor.configurable)
      continue;
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
        __privateMethod(this, _change, change_fn).call(this);
      }
    });
  }
  __privateSet(this, _context, context_default(__privateGet(this, _context), __privateMethod(this, _change, change_fn).bind(this)));
  await this.setup?.(__privateGet(this, _context));
  this.dispatchEvent(renderingEvent);
  const template = await this.render?.(__privateGet(this, _context));
  if (template) {
    const fragment = template.template.content.cloneNode(true);
    __privateSet(this, _expressions, template.expressions);
    render_default(fragment, __privateGet(this, _actions));
    for (let index = 0; index < __privateGet(this, _actions).length; index++) {
      const newExpression = template.expressions[index];
      __privateGet(this, _actions)[index](void 0, newExpression);
    }
    document.adoptNode(fragment);
    __privateGet(this, _root).appendChild(fragment);
  }
  await this.rendered?.(__privateGet(this, _context));
  this.dispatchEvent(renderedEvent);
  __privateSet(this, _changeCurrent, (_a = __privateGet(this, _changeNext)) == null ? void 0 : _a.call(this));
  __privateSet(this, _changeNext, void 0);
  await __privateGet(this, _changeCurrent);
  this.dispatchEvent(creatingEvent);
  await this.created?.(__privateGet(this, _context));
  this.dispatchEvent(createdEvent);
};
__publicField(Component, "html", html);

// src/router.ts
var alls = [];
var routes = [];
var transition = async function(route) {
  if (route.instance) {
    replaceChildren(route.root, route.instance);
  } else {
    const result = await route.handler();
    if (result?.prototype instanceof HTMLElement) {
      route.construct = result;
    } else if (result?.default?.prototype instanceof HTMLElement) {
      route.construct = result.default;
    } else {
      throw new Error("XElement - router handler requires a CustomElementConstructor");
    }
    route.tag = dash(route.construct.tag ?? route.construct.name);
    define(route.tag, route.construct);
    route.instance = document.createElement(route.tag);
    replaceChildren(route.root, route.instance);
  }
};
var navigate = function(event) {
  if (event && "canIntercept" in event && event.canIntercept === false)
    return;
  if (event && "canTransition" in event && event.canTransition === false)
    return;
  const destination = new URL(event?.destination.url ?? location.href);
  const base = new URL(document.querySelector("base")?.href ?? location.origin);
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
  if (event?.intercept) {
    return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
  } else if (event?.transitionWhile) {
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
