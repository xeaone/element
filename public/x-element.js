// source/tools.ts
var links = [
  "src",
  "href",
  "data",
  "action",
  "srcdoc",
  "xlink:href",
  "cite",
  "formaction",
  "ping",
  "poster",
  "background",
  "classid",
  "codebase",
  "longdesc",
  "profile",
  "usemap",
  "icon",
  "manifest",
  "archive"
];
var bools = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var isLink = function(data) {
  return data && typeof data === "string" ? links.indexOf(data) !== -1 : false;
};
var isBool = function(data) {
  return data && typeof data === "string" ? bools.indexOf(data) !== -1 : false;
};
var patternValue = /^value$/i;
var isValue = function(data) {
  return data && typeof data === "string" ? patternValue.test(data) : false;
};
var patternOn = /^on/i;
var hasOn = function(data) {
  return data && typeof data === "string" ? patternOn.test(data) : false;
};
var sliceOn = function(data) {
  return data && typeof data === "string" ? data?.toLowerCase()?.slice(2) : "";
};
var isMarker = function(data, marker) {
  return data && typeof data === "string" ? data.toLowerCase() === marker.toLowerCase() : false;
};
var hasMarker = function(data, marker) {
  return data && typeof data === "string" ? data.toLowerCase().indexOf(marker.toLowerCase()) !== -1 : false;
};
var safePattern = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
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

// source/display.ts
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

// source/mark.ts
var mark_default = () => Math.floor(Math.random() * Date.now());

// source/poly.ts
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
var policy = "trustedTypes" in window ? window.trustedTypes.createPolicy("x-element", { createHTML: (data) => data }) : void 0;
var createHTML = function(data) {
  if (policy) {
    return policy.createHTML(data);
  } else {
    return data;
  }
};

// source/html.ts
var symbol = Symbol("html");
var cache = /* @__PURE__ */ new WeakMap();
function html(strings, ...expressions) {
  const value = cache.get(strings);
  if (value) {
    const [template, marker] = value;
    return { strings, template, expressions, symbol, marker };
  } else {
    const marker = `x-${mark_default()}-x`;
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

// source/render.ts
var FILTER = 1 + 4;
var TEXT_NODE = 3;
var ELEMENT_NODE = 1;
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
    if (source === target) {
      return;
    } else if (this.end.previousSibling === this.start) {
      this.end.parentNode?.insertBefore(document.createTextNode(display(target)), this.end);
    } else if (this.end.previousSibling?.nodeType === TEXT_NODE && this.end.previousSibling?.previousSibling === this.start) {
      this.end.previousSibling.textContent = display(target);
    } else {
      removeBetween(this.start, this.end);
      this.end.parentNode?.insertBefore(document.createTextNode(display(target)), this.end);
    }
  }
};
var AttributeNameAction = function(source, target) {
  if (source === target) {
    return;
  } else if (isValue(source)) {
    this.element.removeAttribute(source);
    Reflect.set(this.element, source, null);
  } else if (hasOn(source)) {
    if (typeof this.value === "function") {
      this.element.removeEventListener(sliceOn(source), this.value, true);
    }
  } else if (isLink(source)) {
    this.element.removeAttribute(source);
  } else if (isBool(source)) {
    this.element.removeAttribute(source);
  } else if (source) {
    this.element.removeAttribute(source);
    Reflect.deleteProperty(this.element, source);
  }
  this.name = target?.toLowerCase() || "";
  if (isBool(this.name)) {
    this.element.setAttribute(this.name, "");
    Reflect.set(this.element, this.name, true);
  }
};
var AttributeValueAction = function(source, target) {
  if (source === target) {
    return;
  } else if (isValue(this.name)) {
    this.value = display(target);
    if (!this.name)
      return;
    this.element.setAttribute(this.name, this.value);
    Reflect.set(this.element, this.name, this.value);
  } else if (hasOn(this.name)) {
    if (!this.name)
      return;
    if (typeof this.value === "function") {
      this.element.removeEventListener(sliceOn(this.name), this.value, true);
    }
    if (typeof target !== "function") {
      return console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
    }
    this.value = function() {
      return target.call(this, ...arguments);
    };
    this.element.addEventListener(sliceOn(this.name), this.value, true);
  } else if (isLink(this.name)) {
    this.value = encodeURI(target);
    if (!this.name)
      return;
    if (dangerousLink(this.value)) {
      this.element.removeAttribute(this.name);
      console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
      return;
    }
    this.element.setAttribute(this.name, this.value);
  } else {
    this.value = target;
    if (!this.name)
      return;
    this.element.setAttribute(this.name, this.value);
    Reflect.set(this.element, this.name, this.value);
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
    if (oldElement.nodeType === ELEMENT_NODE) {
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
  const walker = document.createTreeWalker(fragment, FILTER, null);
  walker.currentNode = fragment;
  let node = fragment.firstChild;
  while (node = walker.nextNode()) {
    if (holders.has(node.previousSibling)) {
      holders.delete(node.previousSibling);
      actions.push(() => void 0);
    }
    if (node.nodeType === TEXT_NODE) {
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
    } else if (node.nodeType === ELEMENT_NODE) {
      if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
        walker.nextSibling();
      }
      const tMeta = {
        element: node
      };
      if (isMarker(node.nodeName, marker)) {
        holders.add(node);
        tMeta.holder = document.createTextNode("");
        node.parentNode?.insertBefore(tMeta.holder, node);
        actions.push(TagAction.bind(tMeta));
      }
      const names = node.getAttributeNames();
      for (const name of names) {
        const value = node.getAttribute(name) ?? "";
        if (hasMarker(name, marker) || hasMarker(value, marker)) {
          const aMeta = {
            name,
            value,
            previous: void 0,
            get element() {
              return tMeta.element;
            }
          };
          if (hasMarker(name, marker)) {
            node.removeAttribute(name);
            actions.push(AttributeNameAction.bind(aMeta));
          }
          if (hasMarker(value, marker)) {
            node.removeAttribute(name);
            actions.push(AttributeValueAction.bind(aMeta));
          }
        } else {
          if (isLink(name)) {
            if (dangerousLink(value)) {
              node.removeAttribute(name);
              console.warn(`XElement - attribute name "${name}" and value "${value}" not allowed`);
            }
          } else if (hasOn(name)) {
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

// source/context.ts
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
  if (value) {
    if (value.constructor === Function) {
      return new Proxy(value, {
        apply(t, _, a) {
          return Reflect.apply(t, receiver, a);
        }
      });
    }
    if (value.constructor === Object || value.constructor === Array) {
      return new Proxy(value, {
        get: ContextGet.bind(null, method),
        set: ContextSet.bind(null, method),
        deleteProperty: ContextDelete.bind(null, method)
      });
    }
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

// source/dash.ts
function dash(data) {
  data = data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2");
  data = data.toLowerCase();
  data = data.includes("-") ? data : `x-${data}`;
  return data;
}

// source/events.ts
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

// source/component.ts
var task = Symbol("Task");
var update = Symbol("Update");
var create = Symbol("Create");
var tick = () => Promise.resolve();
var Component = class extends HTMLElement {
  static html = html;
  /**
   * Defines the custom element and return the constructor.
   */
  static define(tag = this.tag ?? this.name) {
    tag = dash(tag);
    if (customElements.get(tag) !== this)
      customElements.define(tag, this);
    return this;
  }
  /**
   * Define, Create, Upgrade, and return element.
   */
  static create(tag) {
    tag = dash(this.tag ?? this.name);
    if (customElements.get(tag) !== this)
      customElements.define(tag, this);
    const instance = document.createElement(tag);
    if (customElements.upgrade)
      customElements.upgrade(instance);
    return instance;
  }
  /**
   * Define, Create, Upgrade, waits until first render, and return element.
   */
  static async upgrade(tag) {
    tag = dash(this.tag ?? this.name);
    if (customElements.get(tag) !== this)
      customElements.define(tag, this);
    const instance = document.createElement(tag);
    await instance[create]();
    if (customElements.upgrade)
      customElements.upgrade(instance);
    return instance;
  }
  /**
   * Configuration to define a element Tag name for use by the define() and create() method.
   * Default value will use the function.constructor.name.
   */
  static tag;
  /**
   * Configuration to use shadow root.
   * Default is false.
   */
  static shadow;
  /**
   * Configuration of the shadow mode attachment.
   * Default is open.
   */
  static mode;
  /**
   * Alternative configuration optimization that allows the specific definition of reactive properties on the Element.
   * Default will use getOwnPropertyNames on the Instance and Prototype to redfine properties as reactive.
   */
  static observedProperties;
  #context = {};
  #root;
  #marker = "";
  #actions = [];
  #expressions = [];
  #queued = false;
  #started = false;
  #restart = false;
  #created = false;
  [task] = Promise.resolve();
  constructor() {
    super();
    const constructor = this.constructor;
    const shadow = constructor.shadow;
    if (shadow && !this.shadowRoot) {
      const mode = constructor.mode || "open";
      this.attachShadow({ mode });
    }
    this.#root = this.shadowRoot ?? this;
  }
  async attributeChangedCallback(name, oldValue, newValue) {
    this.dispatchEvent(attributingEvent);
    await this.attribute?.(name, oldValue, newValue)?.catch(console.error);
    this.dispatchEvent(attributedEvent);
  }
  async adoptedCallback() {
    this.dispatchEvent(adoptingEvent);
    await this.adopted?.(this.#context)?.catch(console.error);
    this.dispatchEvent(adoptedEvent);
  }
  async connectedCallback() {
    if (!this.#created) {
      await this[create]();
    } else {
      this.dispatchEvent(connectingEvent);
      await this.connected?.(this.#context)?.catch(console.error);
      this.dispatchEvent(connectedEvent);
    }
  }
  async disconnectedCallback() {
    this.dispatchEvent(disconnectingEvent);
    await this.disconnected?.(this.#context)?.catch(console.error);
    this.dispatchEvent(disconnectedEvent);
  }
  async [create]() {
    this.#created = true;
    this.#queued = true;
    this.#started = true;
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
      Object.defineProperty(this.#context, property, descriptor);
      Object.defineProperty(this, property, {
        configurable: false,
        enumerable: descriptor.enumerable,
        // configurable: descriptor.configurable,
        get() {
          return this.#context[property];
        },
        set(value) {
          this.#context[property] = value;
          this[update]();
        }
      });
    }
    this.#context = context_default(this.#context, this[update].bind(this));
    const template = await this.render?.(this.#context);
    if (template) {
      const fragment = template.template.content.cloneNode(true);
      this.#marker = template.marker;
      this.#expressions = template.expressions;
      render_default(fragment, this.#actions, this.#marker);
      for (let index = 0; index < this.#actions.length; index++) {
        const newExpression = template.expressions[index];
        try {
          this.#actions[index](void 0, newExpression);
        } catch (error) {
          console.error(error);
        }
      }
      document.adoptNode(fragment);
      this.#root.appendChild(fragment);
    }
    this.dispatchEvent(creatingEvent);
    await this.created?.(this.#context);
    this.dispatchEvent(createdEvent);
    this.dispatchEvent(connectingEvent);
    await this.connected?.(this.#context)?.catch(console.error);
    this.dispatchEvent(connectedEvent);
    this.#queued = false;
    this.#started = false;
    this.#restart = false;
    await this[update]();
  }
  async [update]() {
    if (this.#queued && !this.#started) {
      return this[task];
    }
    if (this.#queued && this.#started) {
      this.#restart = true;
      return this[task];
    }
    this.#queued = true;
    this[task] = this[task].then(async () => {
      this.dispatchEvent(renderingEvent);
      const template = await this.render?.(this.#context);
      this.#started = true;
      if (template) {
        for (let index = 0; index < this.#actions.length; index++) {
          if (this.#restart) {
            await tick();
            index = -1;
            this.#restart = false;
            continue;
          }
          const newExpression = template.expressions[index];
          const oldExpression = this.#expressions[index];
          try {
            this.#actions[index](oldExpression, newExpression);
          } catch (error) {
            console.error(error);
          }
          this.#expressions[index] = template.expressions[index];
        }
      }
      this.#queued = false;
      this.#started = false;
      await this.rendered?.(this.#context);
      this.dispatchEvent(renderedEvent);
    }).catch(console.error);
    return this[task];
  }
};

// source/define.ts
function define(name, constructor) {
  if (customElements.get(name) !== constructor) {
    customElements.define(name, constructor);
  }
}

// source/router.ts
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
      route.instance = await route.construct.upgrade();
    } else {
      route.tag = dash(route.construct.name);
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

// source/index.ts
var source_default = {
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
  source_default as default,
  html,
  router_default as router
};
//# sourceMappingURL=x-element.js.map
