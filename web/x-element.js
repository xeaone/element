// src/dash.ts
function dash(data) {
  return data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2").toLowerCase();
}

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
var policy = "trustedTypes" in window ? window.trustedTypes.createPolicy("default", { createHTML: (data) => data }) : null;
var createHTML = function(data) {
  if (policy) {
    return policy.createHTML(data);
  } else {
    return data;
  }
};
var getOwnPropertyDescriptors = function(object) {
  if (Object.hasOwnProperty("getOwnPropertyDescriptors")) {
    return Reflect.get(Object, "getOwnPropertyDescriptors")(object);
  } else {
    return Reflect.ownKeys(object).reduce((descriptors, key) => {
      return Object.defineProperty(descriptors, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: Object.getOwnPropertyDescriptor(object, key)
      });
    });
  }
};

// src/html.ts
var HtmlCache = /* @__PURE__ */ new WeakMap();
var HtmlSymbol = Symbol("html");
function html(strings, ...expressions) {
  if (HtmlCache.has(strings)) {
    const template = HtmlCache.get(strings);
    return { strings, expressions, values: expressions, template, symbol: HtmlSymbol };
  } else {
    let data = "";
    const length = strings.length - 1;
    for (let index = 0; index < length; index++) {
      data += `${strings[index]}{{${index}}}`;
    }
    data += strings[length];
    const template = document.createElement("template");
    template.innerHTML = createHTML(data);
    HtmlCache.set(strings, template);
    return { strings, expressions, values: expressions, template, symbol: HtmlSymbol };
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

// src/observe.ts
var ObserveCache = /* @__PURE__ */ new WeakMap();
var ObserveNext = Promise.resolve();
var ObserveSet = function(method, target, key, value, receiver) {
  if (typeof key === "symbol")
    return Reflect.set(target, key, value, receiver);
  const from = Reflect.get(target, key, receiver);
  if (from === value)
    return true;
  if (Number.isNaN(from) && Number.isNaN(value))
    return true;
  if (from && (from.constructor.name === "Object" || from.constructor.name === "Array" || from.constructor.name === "Function")) {
    const cache = ObserveCache.get(from);
    if (cache === value)
      return true;
    ObserveCache.delete(from);
  }
  Reflect.set(target, key, value, receiver);
  ObserveNext.then(method);
  return true;
};
var ObserveGet = function(method, target, key, receiver) {
  if (typeof key === "symbol")
    return Reflect.get(target, key, receiver);
  const value = Reflect.get(target, key, receiver);
  if (value && (value.constructor.name === "Object" || value.constructor.name === "Array")) {
    const cache = ObserveCache.get(value);
    if (cache)
      return cache;
    const proxy = new Proxy(value, {
      get: ObserveGet.bind(null, method),
      set: ObserveSet.bind(null, method),
      deleteProperty: ObserveDelete.bind(null, method)
    });
    ObserveCache.set(value, proxy);
    return proxy;
  }
  if (value && target.constructor.name === "Object" && (value.constructor.name === "Function" || value.constructor.name === "AsyncFunction")) {
    const cache = ObserveCache.get(value);
    if (cache)
      return cache;
    const proxy = new Proxy(value, {
      apply(t, _, a) {
        return Reflect.apply(t, receiver, a);
      }
    });
    ObserveCache.set(value, proxy);
    return proxy;
  }
  return value;
};
var ObserveDelete = function(method, target, key) {
  if (typeof key === "symbol")
    return Reflect.deleteProperty(target, key);
  const from = Reflect.get(target, key);
  ObserveCache.delete(from);
  Reflect.deleteProperty(target, key);
  ObserveNext.then(method);
  return true;
};
var Observe = function(data, method) {
  return new Proxy(data, {
    get: ObserveGet.bind(null, method),
    set: ObserveSet.bind(null, method),
    deleteProperty: ObserveDelete.bind(null, method)
  });
};
var observe_default = Observe;

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
  "itemscope",
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
  "scoped",
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

// src/render.ts
var links = ["src", "href", "xlink:href"];
var safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
var dangerousLink = function(data) {
  return typeof data !== "string" || !safePattern.test(data);
};
var RootCache = /* @__PURE__ */ new WeakMap();
var ObjectAction = function(start, end, actions, oldValue, newValue) {
  oldValue = oldValue ?? {};
  newValue = newValue ?? {};
  if (oldValue?.strings !== newValue.strings) {
    let next;
    let node = end.previousSibling;
    while (node !== start) {
      next = node?.previousSibling;
      node?.parentNode?.removeChild(node);
      node = next;
    }
    const fragment = newValue.template.content.cloneNode(true);
    RenderWalk(fragment, newValue.values, actions);
    document.adoptNode(fragment);
    const l = actions.length;
    for (let i = 0; i < l; i++) {
      actions[i](oldValue.values?.[i], newValue.values[i]);
    }
    end.parentNode?.insertBefore(fragment, end);
  } else {
    const l = actions.length;
    for (let i = 0; i < l; i++) {
      actions[i](oldValue.values?.[i], newValue.values[i]);
    }
  }
};
var ArrayAction = function(start, end, actions, oldValue, newValue) {
  oldValue = oldValue ?? [];
  newValue = newValue ?? [];
  const oldLength = oldValue.length;
  const newLength = newValue.length;
  const common = Math.min(oldLength, newLength);
  for (let i = 0; i < common; i++) {
    actions[i](oldValue[i], newValue[i]);
  }
  if (oldLength < newLength) {
    const template = document.createElement("template");
    for (let i = oldLength; i < newLength; i++) {
      if (newValue[i]?.constructor === Object && newValue[i]?.symbol === HtmlSymbol) {
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
    end.parentNode?.insertBefore(template.content, end);
  } else if (oldLength > newLength) {
    for (let i = oldLength - 1; i > newLength - 1; i--) {
      if (oldValue[i]?.constructor === Object && oldValue[i]?.symbol === HtmlSymbol) {
        const { template } = oldValue[i];
        let removes = template.content.childNodes.length + 2;
        while (removes--)
          end.parentNode?.removeChild(end.previousSibling);
      } else {
        end.parentNode?.removeChild(end.previousSibling);
      }
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
  if (dangerousLink(newValue)) {
    element.removeAttribute(attribute.name);
    console.warn(`XElement - attribute name "${attribute.name}" and value "${newValue}" not allowed`);
    return;
  }
  attribute.value = newValue;
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
var RenderWalk = function(fragment, values, actions) {
  const walker = document.createTreeWalker(document, 5, null);
  walker.currentNode = fragment;
  let index = 0;
  let node = fragment.firstChild;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.TEXT_NODE) {
      const start = node.nodeValue?.indexOf("{{") ?? -1;
      if (start == -1)
        continue;
      if (start != 0) {
        node.splitText(start);
        node = walker.nextNode();
      }
      const end = node.nodeValue?.indexOf("}}") ?? -1;
      if (end == -1)
        continue;
      if (end + 2 != node.nodeValue?.length) {
        node.splitText(end + 2);
      }
      const newValue = values[index++];
      if (newValue?.constructor === Object && newValue?.symbol === HtmlSymbol) {
        const start2 = document.createTextNode("");
        const end2 = node;
        end2.nodeValue = "";
        end2.parentNode?.insertBefore(start2, end2);
        actions.push(ObjectAction.bind(null, start2, end2, []));
      } else if (newValue?.constructor === Array) {
        const start2 = document.createTextNode("");
        const end2 = node;
        end2.nodeValue = "";
        end2.parentNode?.insertBefore(start2, end2);
        actions.push(ArrayAction.bind(null, start2, end2, []));
      } else {
        node.textContent = "";
        actions.push(StandardAction.bind(null, node));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
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
      console.warn("node type not handled ", node.nodeType);
    }
  }
};
var sleep = (time) => new Promise((resolve) => setTimeout(resolve, time ?? 0));
var render = async function(root, context, content) {
  const instance = {};
  const update2 = async function() {
    if (instance.busy)
      return;
    else
      instance.busy = true;
    await sleep(50);
    if (context.upgrade)
      await context.upgrade()?.catch?.(console.error);
    const { values: values2 } = content(html, context);
    const length2 = instance.actions.length;
    for (let index = 0; index < length2; index++) {
      instance.actions[index](instance.values[index], values2[index]);
    }
    instance.values = values2;
    if (context.upgraded)
      await context.upgraded()?.catch(console.error);
    instance.busy = false;
  };
  const cache = RootCache.get(root);
  if (cache && cache.disconnect)
    await cache.disconnect()?.catch?.(console.error);
  if (cache && cache.disconnected)
    await cache.disconnected()?.catch(console.error);
  context = observe_default(context(html), update2);
  RootCache.set(root, context);
  if (context.connect)
    await context.connect()?.catch?.(console.error);
  if (context.upgrade)
    await context.upgrade()?.catch?.(console.error);
  const { strings, values, template } = content(html, context);
  instance.busy = false;
  instance.actions = [];
  instance.values = values;
  instance.strings = strings;
  instance.template = template;
  instance.fragment = template.content.cloneNode(true);
  RenderWalk(instance.fragment, instance.values, instance.actions);
  document.adoptNode(instance.fragment);
  const length = instance.actions.length;
  for (let index = 0; index < length; index++) {
    instance.actions[index](void 0, values[index]);
  }
  if (root.replaceChildren) {
    root.replaceChildren(instance.fragment);
  } else {
    replaceChildren(root, instance.fragment);
  }
  if (context.upgraded)
    await context.upgraded()?.catch(console.error);
  if (context.connected)
    await context.connected()?.catch(console.error);
};
var render_default = render;

// src/component.ts
var ROOT = Symbol("root");
var MOUNT = Symbol("mount");
var UPDATE = Symbol("update");
var BUSY = Symbol("busy");
var ACTIONS = Symbol("actions");
var FRAGMENT = Symbol("fragment");
var EXPRESSIONS = Symbol("expressions");
var create = function() {
  const tag = this.tag ?? dash(this.name);
  if (!customElements.get(tag)) {
    customElements.define(tag, this);
  }
  const element = document.createElement(tag);
  element[MOUNT]();
  return element;
};
var define = function() {
  const tag = this.tag ?? dash(this.name);
  if (!customElements.get(tag))
    return;
  customElements.define(tag, this);
};
var defined = function() {
  const tag = this.tag ?? dash(this.name);
  return customElements.whenDefined(tag);
};
var update = async function() {
  if (this[BUSY])
    return;
  else
    this[BUSY] = true;
  const { values } = this.template();
  const expressions = values;
  const length = this[ACTIONS].length;
  for (let index = 0; index < length; index++) {
    this[ACTIONS][index](this[EXPRESSIONS][index], expressions[index]);
  }
  this[EXPRESSIONS] = expressions;
  this[BUSY] = false;
};
var mount = async function() {
  console.log(this);
  const { values, template } = this.template();
  this[EXPRESSIONS] = values;
  this[FRAGMENT] = template.content.cloneNode(true);
  RenderWalk(this[FRAGMENT], this[EXPRESSIONS], this[ACTIONS]);
  document.adoptNode(this[FRAGMENT]);
  const length = this[ACTIONS].length;
  for (let index = 0; index < length; index++) {
    this[ACTIONS][index](void 0, this[EXPRESSIONS][index]);
  }
  if (this[ROOT].replaceChildren) {
    this[ROOT].replaceChildren(this[FRAGMENT]);
  } else {
    replaceChildren(this[ROOT], this[FRAGMENT]);
  }
};
function component(Class) {
  Class.create = create;
  Class.define = define;
  Class.defined = defined;
  Class.tag = Class.tag || dash(Class.name);
  Object.defineProperties(Class.prototype, {
    [UPDATE]: {
      value: update,
      writable: false,
      enumerable: false,
      configurable: false
    },
    [MOUNT]: {
      value: mount,
      writable: false,
      enumerable: false,
      configurable: false
    }
  });
  const proxy = new Proxy(Class, {
    construct(target, args, extender) {
      const self = Reflect.construct(target, args, extender);
      Object.defineProperties(self, {
        [BUSY]: {
          value: false,
          writable: true,
          enumerable: false,
          configurable: false
        },
        [ACTIONS]: {
          value: [],
          writable: true,
          enumerable: false,
          configurable: false
        },
        [EXPRESSIONS]: {
          value: [],
          writable: true,
          enumerable: false,
          configurable: false
        },
        [FRAGMENT]: {
          value: void 0,
          writable: true,
          enumerable: false,
          configurable: false
        },
        [ROOT]: {
          value: target.shadow === true ? self.shadowRoot ?? self.attachShadow({ mode: "open" }) : self,
          writable: true,
          enumerable: false,
          configurable: false
        }
      });
      const prototype = Object.getPrototypeOf(self);
      const properties = target.observedProperties ? target.observedProperties ?? [] : [
        ...Object.getOwnPropertyNames(self),
        ...Object.getOwnPropertyNames(prototype)
      ];
      for (const property of properties) {
        if ("attributeChangedCallback" === property || "disconnectedCallback" === property || "connectedCallback" === property || "adoptedCallback" === property || "constructor" === property || "template" === property)
          continue;
        const descriptor = Object.getOwnPropertyDescriptor(self, property) ?? Object.getOwnPropertyDescriptor(prototype, property);
        if (!descriptor)
          continue;
        if (!descriptor.configurable)
          continue;
        Object.defineProperty(self, `_${property}`, {
          ...descriptor,
          enumerable: false
        });
        Object.defineProperty(self, property, {
          enumerable: descriptor.enumerable,
          configurable: descriptor.configurable,
          get: () => self[`_${property}`],
          set: (value) => {
            const result = self[`_${property}`] = value;
            self[UPDATE]();
            return result;
          }
        });
      }
      console.log(Object.getOwnPropertyNames(self));
      console.log(getOwnPropertyDescriptors(self));
      customElements.upgrade(self);
      customElements.whenDefined(Class.tag).then(() => self[MOUNT]());
      return self;
    }
  });
  return proxy;
}
var XTest = class extends HTMLElement {
  // static tag = 'x-test';
  // static shadow = true;
  // static observedProperties = ['message'];
  message = "hello world";
  // #message = 'hello world';
  // get message (){return this.#message};
  // set message (value){ this.#message=value};
  template = () => html`
        <h1>${this.message}</h1>
        <input value=${this.message} oninput=${(e2) => this.message = e2.target.value} />
    `;
};
component(XTest);
var e = document.createElement("x-test");
setTimeout(() => {
  console.log(e.outerHTML);
  document.body.append(e);
}, 2e3);

// src/schedule.ts
var busy = false;
var sleep2 = () => new Promise((resolve) => setTimeout(resolve, 0));
var Actions = [];
var OldValues = [];
var NewValues = [];
async function schedule(actions, oldValues, newValues) {
  actions = actions ?? [];
  oldValues = oldValues ?? [];
  newValues = newValues ?? [];
  Actions.push(...actions);
  OldValues.push(...oldValues);
  NewValues.push(...newValues);
  if (busy)
    return;
  busy = true;
  let action;
  let oldValue;
  let newValue;
  let max = performance.now() + 50;
  while (Actions.length > 0) {
    if (navigator.scheduling?.isInputPending() || performance.now() >= max) {
      await sleep2();
      max = performance.now() + 50;
      continue;
    }
    action = Actions.shift();
    oldValue = OldValues.shift();
    newValue = NewValues.shift();
    if (oldValue !== newValue) {
      await action(oldValue, newValue);
    }
  }
  busy = false;
}

// src/define.ts
function define2(name, constructor) {
  customElements.define(name, constructor);
}

// src/router.ts
var alls = [];
var routes = [];
var transition = async function(route) {
  await render_default(route.root, route.context, route.content);
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
    if (!route.root)
      continue;
    Reflect.set(route.root, "xRouterPath", route.path);
    transitions.push(route);
  }
  for (const all of alls) {
    if (!all.root)
      continue;
    let has = false;
    for (const transition2 of transitions) {
      if (transition2.root === all.root) {
        has = true;
        break;
      }
    }
    if (has)
      continue;
    if (Reflect.get(all.root, "xRouterPath") === pathname)
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
var router = function(path, root, context, content) {
  if (!path)
    throw new Error("XElement - router path required");
  if (!root)
    throw new Error("XElement - router root required");
  if (!context)
    throw new Error("XElement - router context required");
  if (!content)
    throw new Error("XElement - router content required");
  if (path === "/*") {
    for (const all of alls) {
      if (all.path === path && all.root === root) {
        throw new Error("XElement - router duplicate path on root");
      }
    }
    alls.push({ path, root, context, content });
  } else {
    for (const route of routes) {
      if (route.path === path && route.root === root) {
        throw new Error("XElement - router duplicate path on root");
      }
    }
    routes.push({ path, root, context, content });
  }
  Reflect.get(window, "navigation").addEventListener("navigate", navigate);
};
var router_default = router;

// src/index.ts
var Index = {
  Component: component,
  Schedule: schedule,
  // Context,
  Define: define2,
  Router: router_default,
  Render: render_default,
  // Patch,
  // Mount,
  component,
  schedule,
  // context: Context,
  define: define2,
  router: router_default,
  render: render_default
  // patch: Patch,
  // mount: Mount,
};
var src_default = Index;
export {
  component as Component,
  define2 as Define,
  render_default as Render,
  router_default as Router,
  schedule as Schedule,
  component,
  src_default as default,
  define2 as define,
  render_default as render,
  router_default as router,
  schedule
};
//# sourceMappingURL=x-element.js.map
