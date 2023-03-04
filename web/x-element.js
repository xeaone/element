/************************************************************************
Name: XElement
Version: 8.0.0
License: MPL-2.0
Author: Alexander Elias
Email: alex.steven.elis@gmail.com
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
************************************************************************/
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

// src/schedule.ts
var busy = false;
var sleep = () => new Promise((resolve) => setTimeout(resolve, 0));
var Actions = [];
var OldValues = [];
var NewValues = [];
function schedule(actions, oldValues, newValues) {
  return __async(this, null, function* () {
    var _a;
    actions = actions != null ? actions : [];
    oldValues = oldValues != null ? oldValues : [];
    newValues = newValues != null ? newValues : [];
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
      if (((_a = navigator.scheduling) == null ? void 0 : _a.isInputPending()) || performance.now() >= max) {
        yield sleep();
        max = performance.now() + 50;
        continue;
      }
      action = Actions.shift();
      oldValue = OldValues.shift();
      newValue = NewValues.shift();
      if (oldValue !== newValue) {
        yield action(oldValue, newValue);
      }
    }
    busy = false;
  });
}

// src/define.ts
function define(name, constructor) {
  customElements.define(name, constructor);
}

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
var policy = "trustedTypes" in window ? window.trustedTypes.createPolicy("default", { createHTML: (data) => data }) : null;
var createHTML = function(data) {
  if (policy) {
    return policy.createHTML(data);
  } else {
    return data;
  }
};

// src/html.ts
var HtmlCache = /* @__PURE__ */ new WeakMap();
var HtmlSymbol = Symbol("html");
function html(strings, ...values) {
  if (HtmlCache.has(strings)) {
    const template = HtmlCache.get(strings);
    return { strings, values, template, symbol: HtmlSymbol };
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
    return { strings, values, template, symbol: HtmlSymbol };
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
    RenderWalk(fragment, newValue.values, actions);
    document.adoptNode(fragment);
    const l = actions.length;
    for (let i = 0; i < l; i++) {
      actions[i]((_b = oldValue.values) == null ? void 0 : _b[i], newValue.values[i]);
    }
    (_c = end.parentNode) == null ? void 0 : _c.insertBefore(fragment, end);
  } else {
    const l = actions.length;
    for (let i = 0; i < l; i++) {
      actions[i]((_d = oldValue.values) == null ? void 0 : _d[i], newValue.values[i]);
    }
  }
};
var ArrayAction = function(start, end, actions, oldValue, newValue) {
  var _a, _b, _c, _d, _e, _f, _g;
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
      if (((_a = newValue[i]) == null ? void 0 : _a.constructor) === Object && ((_b = newValue[i]) == null ? void 0 : _b.symbol) === HtmlSymbol) {
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
      if (((_d = oldValue[i]) == null ? void 0 : _d.constructor) === Object && ((_e = oldValue[i]) == null ? void 0 : _e.symbol) === HtmlSymbol) {
        const { template } = oldValue[i];
        let removes = template.content.childNodes.length + 2;
        while (removes--)
          (_f = end.parentNode) == null ? void 0 : _f.removeChild(end.previousSibling);
      } else {
        (_g = end.parentNode) == null ? void 0 : _g.removeChild(end.previousSibling);
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
var RenderWalk = function(fragment, values, actions) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const walker = document.createTreeWalker(document, 5, null);
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
      const newValue = values[index++];
      if ((newValue == null ? void 0 : newValue.constructor) === Object && (newValue == null ? void 0 : newValue.symbol) === HtmlSymbol) {
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
      console.warn("node type not handled ", node.nodeType);
    }
  }
};
var sleep2 = (time) => new Promise((resolve) => setTimeout(resolve, time != null ? time : 0));
var render = function(root, context, content) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const instance = {};
    const update = function() {
      return __async(this, null, function* () {
        var _a2, _b2, _c2;
        if (instance.busy)
          return;
        else
          instance.busy = true;
        yield sleep2(50);
        if (context.upgrade)
          yield (_b2 = (_a2 = context.upgrade()) == null ? void 0 : _a2.catch) == null ? void 0 : _b2.call(_a2, console.error);
        const { values: values2 } = content(html, context);
        const length2 = instance.actions.length;
        for (let index = 0; index < length2; index++) {
          instance.actions[index](instance.values[index], values2[index]);
        }
        instance.values = values2;
        if (context.upgraded)
          yield (_c2 = context.upgraded()) == null ? void 0 : _c2.catch(console.error);
        instance.busy = false;
      });
    };
    const cache = RootCache.get(root);
    if (cache && cache.disconnect)
      yield (_b = (_a = cache.disconnect()) == null ? void 0 : _a.catch) == null ? void 0 : _b.call(_a, console.error);
    if (cache && cache.disconnected)
      yield (_c = cache.disconnected()) == null ? void 0 : _c.catch(console.error);
    context = observe_default(context(html), update);
    RootCache.set(root, context);
    if (context.connect)
      yield (_e = (_d = context.connect()) == null ? void 0 : _d.catch) == null ? void 0 : _e.call(_d, console.error);
    if (context.upgrade)
      yield (_g = (_f = context.upgrade()) == null ? void 0 : _f.catch) == null ? void 0 : _g.call(_f, console.error);
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
      yield (_h = context.upgraded()) == null ? void 0 : _h.catch(console.error);
    if (context.connected)
      yield (_i = context.connected()) == null ? void 0 : _i.catch(console.error);
  });
};
var render_default = render;

// src/router.ts
var alls = [];
var routes = [];
var transition = function(route) {
  return __async(this, null, function* () {
    yield render_default(route.root, route.context, route.content);
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
  if (event == null ? void 0 : event.intercept) {
    return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
  } else if (event == null ? void 0 : event.transitionWhile) {
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
  // Component,
  Schedule: schedule,
  // Context,
  Define: define,
  Router: router_default,
  Render: render_default,
  // Patch,
  // Mount,
  // component: Component,
  schedule,
  // context: Context,
  define,
  router: router_default,
  render: render_default
  // patch: Patch,
  // mount: Mount,
};
var src_default = Index;
export {
  define as Define,
  render_default as Render,
  router_default as Router,
  schedule as Schedule,
  src_default as default,
  define,
  render_default as render,
  router_default as router,
  schedule
};
//# sourceMappingURL=x-element.js.map
