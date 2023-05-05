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
  let node = end.previousSibling;
  while (node !== start) {
    node?.parentNode?.removeChild(node);
    node = end.previousSibling;
  }
};
var ElementAction = function(source, target) {
  if (target?.symbol === symbol) {
    source = source ?? {};
    target = target ?? {};
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
        this.actions[i](source.expressions?.[i], target.expressions[i]);
      }
      document.adoptNode(fragment);
      removeBetween(this.start, this.end);
      this.end.parentNode?.insertBefore(fragment, this.end);
    }
  } else if (target?.constructor === Array) {
    source = source ?? [];
    target = target ?? [];
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
      this.end.parentNode?.insertBefore(template.content, this.end);
    } else if (oldLength > newLength) {
      for (let i = oldLength - 1; i > newLength - 1; i--) {
        if (source[i]?.symbol === symbol) {
          const { template } = source[i];
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
    if (source === target)
      return;
    if (typeof source !== typeof target) {
      while (this.end.previousSibling !== this.start) {
        this.end.parentNode?.removeChild(this.end.previousSibling);
      }
    }
    let node;
    if (this.end.previousSibling === this.start) {
      node = document.createTextNode(display(target));
      this.end.parentNode?.insertBefore(node, this.end);
    } else {
      if (this.end.previousSibling?.nodeType === Node.TEXT_NODE) {
        node = this.end.previousSibling;
        node.textContent = display(target);
      } else {
        node = document.createTextNode(display(target));
        this.end.parentNode?.removeChild(this.end.previousSibling);
        this.end.parentNode?.insertBefore(node, this.end);
      }
    }
  }
};
var AttributeNameAction = function(source, target) {
  if (source === target)
    return;
  if (source?.startsWith("on") && typeof this.value === "function") {
    this.element.removeEventListener(source.slice(2), this.value);
  }
  Reflect.set(this.element, source, void 0);
  this.element.removeAttribute(source);
  this.name = target?.toLowerCase();
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
  if (source === target)
    return;
  const oldElement = this.element;
  if (target) {
    oldElement.parentNode?.removeChild(oldElement);
    const newElement = document.createElement(target);
    while (oldElement.firstChild)
      newElement.appendChild(oldElement.firstChild);
    if (oldElement.nodeType === Node.ELEMENT_NODE) {
      const attributeNames = oldElement.getAttributeNames();
      for (const attributeName of attributeNames) {
        const attributeValue = oldElement.getAttribute(attributeName) ?? "";
        newElement.setAttribute(attributeName, attributeValue);
      }
    }
    this.holder.parentNode?.insertBefore(newElement, this.holder);
    this.element = newElement;
  } else {
    oldElement.parentNode?.removeChild(oldElement);
    this.element = oldElement;
  }
};
var Render = function(fragment, actions, marker) {
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
      const startIndex = node.nodeValue?.indexOf(marker) ?? -1;
      if (startIndex === -1)
        continue;
      if (startIndex !== 0) {
        node.splitText(startIndex);
        node = walker.nextNode();
      }
      const endIndex = marker.length;
      if (endIndex !== node.nodeValue?.length) {
        node.splitText(endIndex);
      }
      const start = document.createTextNode("");
      const end = node;
      end.textContent = "";
      end.parentNode?.insertBefore(start, end);
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
        node.parentNode?.insertBefore(tMeta.holder, node);
        actions.push(TagAction.bind(tMeta));
      }
      const names = node.getAttributeNames();
      for (const name of names) {
        const value = node.getAttribute(name) ?? "";
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
        return Reflect.apply(t, target, a);
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
var _context, _root, _marker, _actions, _expressions, _busy, _restart, _created, _a;
var Component = class extends HTMLElement {
  constructor() {
    super();
    __privateAdd(this, _context, {});
    __privateAdd(this, _root, void 0);
    __privateAdd(this, _marker, "");
    __privateAdd(this, _actions, []);
    __privateAdd(this, _expressions, []);
    __privateAdd(this, _busy, false);
    __privateAdd(this, _restart, false);
    __privateAdd(this, _created, false);
    __publicField(this, _a, Promise.resolve());
    const constructor = this.constructor;
    const shadow = constructor.shadow;
    if (shadow && !this.shadowRoot) {
      const mode = constructor.mode || "open";
      this.attachShadow({ mode });
    }
    __privateSet(this, _root, this.shadowRoot ?? this);
  }
  static define(tag = this.tag ?? this.name) {
    tag = dash(tag);
    define(tag, this);
    return this;
  }
  static async create(tag = this.tag ?? this.name) {
    tag = dash(tag);
    define(tag, this);
    const instance = document.createElement(tag);
    await instance[create];
    return instance;
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
    if (!__privateGet(this, _created)) {
      await this[create]();
    } else {
      this.dispatchEvent(connectingEvent);
      await this.connected?.(__privateGet(this, _context))?.catch(console.error);
      this.dispatchEvent(connectedEvent);
    }
  }
  async disconnectedCallback() {
    this.dispatchEvent(disconnectingEvent);
    await this.disconnected?.(__privateGet(this, _context))?.catch(console.error);
    this.dispatchEvent(disconnectedEvent);
  }
  async [(_a = task, create)]() {
    __privateSet(this, _created, true);
    __privateSet(this, _busy, true);
    await this[setup]();
    this.dispatchEvent(creatingEvent);
    await this.created?.(__privateGet(this, _context));
    this.dispatchEvent(createdEvent);
    this.dispatchEvent(connectingEvent);
    await this.connected?.(__privateGet(this, _context))?.catch(console.error);
    this.dispatchEvent(connectedEvent);
    __privateSet(this, _busy, false);
    __privateSet(this, _restart, false);
    await this[update]();
  }
  async [update]() {
    if (__privateGet(this, _busy)) {
      __privateSet(this, _restart, true);
      return this[task];
    }
    __privateSet(this, _busy, true);
    this[task] = this[task].then(async () => {
      this.dispatchEvent(renderingEvent);
      const template = await this.render?.(__privateGet(this, _context));
      if (template) {
        for (let index = 0; index < __privateGet(this, _actions).length; index++) {
          if (__privateGet(this, _restart)) {
            await Promise.resolve().then().catch(console.error);
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
      await this.rendered?.(__privateGet(this, _context));
      this.dispatchEvent(renderedEvent);
    }).catch(console.error);
    return this[task];
  }
  async [setup]() {
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
    const template = await this.render?.(__privateGet(this, _context));
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
    if (route.construct.prototype instanceof Component) {
      route.instance = await route.construct.create();
    } else {
      route.tag = dash(route.construct.tag ?? route.construct.name);
      define(route.tag, route.construct);
      route.instance = document.createElement(route.tag);
    }
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
