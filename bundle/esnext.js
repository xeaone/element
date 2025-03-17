/**
* @version 10.0.4
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/


// source/global.ts
var global = globalThis.XGLOBAL ?? (globalThis.XGLOBAL = Object.freeze({
  // QueueNext: undefined,
  // QueueCurrent: undefined,
  Bound: /* @__PURE__ */ new WeakMap(),
  BindersCache: /* @__PURE__ */ new Set(),
  // GlobalBinders: new Set(),
  // LocalBinders: new Set(),
  // QueueBinders: new Set(),
  // VirtualCache: new WeakMap(),
  TemplatesCache: /* @__PURE__ */ new WeakMap(),
  ContainersCache: /* @__PURE__ */ new WeakMap(),
  MarkSymbol: Symbol("mark"),
  ViewSymbol: Symbol("view"),
  TemplateSymbol: Symbol("template"),
  VariablesSymbol: Symbol("variables")
}));
var {
  // QueueNext,
  // QueueCurrent,
  BindersCache,
  // GlobalBinders,
  // LocalBinders,
  // QueueBinders,
  // VirtualCache,
  TemplatesCache,
  ContainersCache,
  MarkSymbol,
  ViewSymbol,
  TemplateSymbol,
  VariablesSymbol
} = global;

// source/tools.ts
var SHOW_TEXT = 4;
var SHOW_ELEMENT = 1;
var TEXT_NODE = 3;
var ELEMENT_NODE = 1;
var patternLink = new RegExp(
  [
    "^[.@$]?(",
    [
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
    ].join("|"),
    ")"
  ].join(""),
  "i"
);
var patternBool = new RegExp(
  [
    "^[.@$]?(",
    [
      "hidden",
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
    ].join("|"),
    ")"
  ].join(""),
  "i"
);
var patternTimeout = /^[.@$]?ontimeout$/i;
var patternOnce = /^[.@$]?ononce$/i;
var patternValue = /^[.@$]?value$/i;
var patternOn = /^[.@$]?on/i;
var safePattern = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
var isLink = function(data) {
  return data && typeof data === "string" ? patternLink.test(data) : false;
};
var isBool = function(data) {
  return data && typeof data === "string" ? patternBool.test(data) : false;
};
var isIterable = function(data) {
  return data && typeof data !== "string" && typeof data[Symbol.iterator] === "function";
};
var isOnce = function(data) {
  return data && typeof data === "string" ? patternOnce.test(data) : false;
};
var isTimeout = function(data) {
  return data && typeof data === "string" ? patternTimeout.test(data) : false;
};
var isValue = function(data) {
  return data && typeof data === "string" ? patternValue.test(data) : false;
};
var hasOn = function(data) {
  return data && typeof data === "string" ? patternOn.test(data) : false;
};
var matchMarker = function(data, marker) {
  return data && marker && typeof data === "string" && typeof marker === "string" ? data.toLowerCase() === marker.toLowerCase() : false;
};
var hasMarker = function(data, marker) {
  return data && typeof data === "string" ? data.indexOf(marker) !== -1 : false;
};
var sliceOn = function(data) {
  return data && typeof data === "string" ? data.replace(patternOn, "") : "";
};
var isConnected = function(node) {
  if (node.nodeType === Node.ATTRIBUTE_NODE) {
    return node.parentNode?.isConnected ?? false;
  } else {
    return node.isConnected;
  }
};
var mark = function() {
  return `x-${`${Math.floor(Math.random() * Date.now())}`.slice(0, 10)}-x`;
};
var dangerousLink = function(data) {
  if (data === "") return false;
  if (typeof data !== "string") return false;
  return safePattern.test(data) ? false : true;
};
var removeBetween = function(start, end) {
  let node = end.previousSibling;
  while (node && node !== start) {
    node.parentNode?.removeChild(node);
    node = end.previousSibling;
  }
};
var removeNode = function(node) {
  node.parentNode.removeChild(node);
};
var beforeNode = function(node, child) {
  if (!(node instanceof Node)) node = child.ownerDocument.createTextNode(`${node}`);
  child.parentNode.insertBefore(node, child);
};
var afterNode = function(node, child) {
  if (!(node instanceof Node)) node = child.ownerDocument.createTextNode(`${node}`);
  child.parentNode.insertBefore(node, child.nextSibling);
};
var replaceNode = function(node, child) {
  child.parentNode.replaceChild(node, child);
};
var replaceChildren = function(element2, ...nodes) {
  while (element2.lastChild) {
    element2.removeChild(element2.lastChild);
  }
  for (const node of nodes) {
    element2.appendChild(
      typeof node === "string" ? element2.ownerDocument.createTextNode(node) : node
    );
  }
};

// source/reference.ts
var Reference = function(data) {
  return {
    data: data instanceof Node ? new WeakRef(data) : data,
    get: function() {
      if (this.data instanceof WeakRef) {
        return this.data.deref();
      } else {
        return this.data;
      }
    },
    set: function(data2) {
      if (data2 instanceof Node) {
        this.data = new WeakRef(data2);
        return data2;
      } else {
        this.data = data2;
        return data2;
      }
    }
  };
};

// source/attribute-name.ts
var attributeName = function(element2, binder, source, target) {
  source = source?.toLowerCase() ?? "";
  target = target?.toLowerCase() ?? "";
  if (source === target) {
    return;
  }
  if (hasOn(source)) {
    if (typeof binder.value === "function") {
      element2.removeEventListener(sliceOn(source), binder.value, true);
    }
  } else if (isValue(source)) {
    element2.removeAttribute(source);
    Reflect.set(element2, source, null);
  } else if (isBool(source)) {
    element2.removeAttribute(source);
    Reflect.set(element2, source, false);
  } else if (isLink(source)) {
    element2.removeAttribute(source);
    Reflect.deleteProperty(element2, source);
  } else if (source) {
    element2.removeAttribute(source);
    Reflect.deleteProperty(element2, source);
  }
  if (hasOn(target)) {
    return;
  } else if (isBool(target)) {
    binder.value = "";
    element2.setAttribute(target, "");
    Reflect.set(element2, target, true);
  } else if (target) {
    element2.setAttribute(target, "");
    Reflect.set(element2, target, null);
  }
  binder.name = target || "";
};

// source/display.ts
var display = function(data) {
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
    case "symbol":
      return String(data);
    case "object":
      return JSON.stringify(data);
  }
  throw new Error("XElement - display type not handled");
};

// source/update.ts
var Next;
var Current;
var next = async function() {
  await Current;
  await new Promise((resolve) => {
    queueMicrotask(async () => {
      Next = void 0;
      await update();
      resolve(void 0);
    });
  });
};
var update = async function() {
  if (Current) {
    if (Next) {
      await Next;
    } else {
      Next = next();
      await Next;
    }
  } else {
    Current = new Promise((resolve) => {
      queueMicrotask(async () => {
        const binders = BindersCache.values();
        for (const binder of binders) {
          try {
            await action(binder);
          } catch (error) {
            console.error(error);
          }
        }
        Current = void 0;
        resolve();
      });
    });
    await Current;
  }
};

// source/event.ts
var event = function(binder) {
  return {
    get target() {
      return binder?.node;
    },
    // update,
    query(selector) {
      return binder?.node?.getRootNode()?.querySelector(selector);
    }
  };
};

// source/attribute-value.ts
var attributeValue = function(element2, binder, source, target) {
  if (source === target) {
    return;
  }
  if (!binder.name) {
    console.warn("attribute binder name required");
    return;
  }
  if (isValue(binder.name)) {
    if (element2.nodeName === "SELECT") {
      const options = element2.options;
      const array = Array.isArray(target);
      for (const option of options) {
        option.selected = array ? target.includes(option.value) : `${target}` === option.value;
      }
    } else {
      binder.value = display(target);
      element2.setAttribute(binder.name, binder.value);
      Reflect.set(element2, binder.name, binder.value);
    }
  } else if (isLink(binder.name)) {
    binder.value = encodeURI(target);
    if (dangerousLink(binder.value)) {
      element2.removeAttribute(binder.name);
      console.warn(`XElement - attribute name "${binder.name}" and value "${binder.value}" not allowed`);
      return;
    }
    element2.setAttribute(binder.name, binder.value);
    Reflect.set(element2, binder.name, binder.value);
  } else if (isBool(binder.name)) {
    const bool = !!target;
    if (bool) {
      element2.setAttribute(binder.name, "");
    } else {
      element2.removeAttribute(binder.name);
    }
    Reflect.set(element2, binder.name, bool);
  } else if (hasOn(binder.name)) {
    if (element2.hasAttribute(binder.name)) {
      element2.removeAttribute(binder.name);
    }
    if (typeof binder.value === "function") {
      element2.removeEventListener(
        sliceOn(binder.name),
        binder.value,
        source?.[1] ?? true
      );
    }
    const method = typeof target === "function" ? target : target?.[0];
    if (typeof method !== "function") {
      return console.warn(`XElement - attribute name "${binder.name}" expected a function`);
    }
    let oldResult;
    binder.value = function() {
      if (element2.nodeName === "INPUT" && element2.type === "radio") {
        const radios = element2.ownerDocument.querySelectorAll(`input[name="${element2.name}"]`);
        for (const radio of radios) {
          if (radio.checked) {
            oldResult = radio.checked;
          }
        }
      }
      const newResult = method.call(this, event(binder));
      if (newResult !== oldResult) {
        oldResult = newResult;
        update();
      }
      return newResult;
    };
    if (isOnce(binder.name)) {
      binder.value();
    } else if (isTimeout(binder.name)) {
      setTimeout(binder.value, target?.[1]);
    } else {
      element2.addEventListener(sliceOn(binder.name), binder.value, target?.[1] ?? true);
    }
  } else {
    binder.value = target;
    element2.setAttribute(binder.name, binder.value);
    Reflect.set(element2, binder.name, binder.value);
  }
};

// source/text.ts
var iterableDisplay = function(data) {
  return data?.[ViewSymbol] ? data() : data instanceof Node ? data : display(data);
};
var text = function(node, binder, source, target) {
  if (target === null || target === void 0) {
    if (node.textContent !== "") {
      node.textContent = "";
    }
  } else if (target?.[ViewSymbol]) {
    if (!binder.start) {
      binder.start = document.createTextNode("");
      beforeNode(binder.start, node);
    }
    if (!binder.end) {
      node.textContent = "";
      binder.end = node;
    }
    removeBetween(binder.start, binder.end);
    beforeNode(target(), binder.end);
  } else if (target instanceof DocumentFragment) {
    if (!binder.start) {
      binder.start = document.createTextNode("");
      beforeNode(binder.start, node);
    }
    if (!binder.end) {
      node.textContent = "";
      binder.end = node;
    }
    removeBetween(binder.start, binder.end);
    beforeNode(target, binder.end);
  } else if (isIterable(target)) {
    if (binder.length === void 0) {
      binder.length = 0;
    }
    if (!binder.results) {
      binder.results = [];
    }
    if (!binder.markers) {
      binder.markers = [];
    }
    if (!binder.start) {
      binder.start = document.createTextNode("");
      beforeNode(binder.start, node);
    }
    if (!binder.end) {
      node.textContent = "";
      binder.end = node;
    }
    const oldLength = binder.length;
    const newLength = target.length;
    const commonLength = Math.min(oldLength, newLength);
    for (let index = 0; index < commonLength; index++) {
      if (target[index] === binder.results[index] || target[index]?.[ViewSymbol] && binder.results[index]?.[ViewSymbol] && target[index]?.[MarkSymbol] === binder.results[index]?.[MarkSymbol]) continue;
      const marker = binder.markers[index];
      const last = binder.markers[index + 1] ?? binder.end;
      while (last.previousSibling && last.previousSibling !== marker) {
        removeNode(last.previousSibling);
      }
      const child = iterableDisplay(target[index]);
      afterNode(child, marker);
      console.log(binder.results[index], target[index], child, marker);
      binder.results[index] = target[index];
    }
    if (oldLength < newLength) {
      while (binder.length !== target.length) {
        const marker = document.createTextNode("");
        const child = iterableDisplay(target[binder.length]);
        binder.markers.push(marker);
        binder.results.push(target[binder.length]);
        beforeNode(marker, binder.end);
        beforeNode(child, binder.end);
        binder.length++;
      }
    } else if (oldLength > newLength) {
      const marker = binder.markers[target.length - 1];
      const last = binder.end;
      while (last.previousSibling && last.previousSibling !== marker) {
        removeNode(last.previousSibling);
      }
      binder.length = target.length;
      binder.results.length = target.length;
      binder.markers.length = target.length;
    }
  } else if (target instanceof Node) {
    replaceNode(target, node);
  } else {
    if (node.textContent === `${target}`) {
      return;
    } else {
      node.textContent = `${target}`;
    }
  }
};

// source/action.ts
var element = function(node, data, source, target) {
  console.warn("element action not implemented");
};
var action = function(binder) {
  const node = binder.node;
  if (!node) {
    return;
  }
  if (!isConnected(node) && binder.isInitialized) {
    return;
  }
  const variable = binder.variable;
  const isFunction = typeof variable === "function";
  const isInstance = isFunction && variable[ViewSymbol];
  const isOnce2 = binder.type === 3 && hasOn(binder.name);
  const isReactive = !isInstance && !isOnce2 && isFunction;
  if (isOnce2 || isInstance || !isFunction) {
    binder.remove();
  }
  const target = isReactive ? variable(event(binder)) : isInstance ? variable() : variable;
  const source = binder.source;
  if ("source" in binder && (source === target || source?.[ViewSymbol] && target?.[ViewSymbol] && source?.[MarkSymbol] === target?.[MarkSymbol])) {
    return;
  }
  if (binder.type === 1) {
    element(node, binder, source, target);
  } else if (binder.type === 2) {
    attributeName(node, binder, source, target);
  } else if (binder.type === 3) {
    attributeValue(node, binder, source, target);
  } else if (binder.type === 4) {
    text(node, binder, source, target);
  } else {
    throw new Error("instruction type not valid");
  }
  binder.source = target;
  binder.isInitialized = true;
};

// source/bind.ts
var bind = function(type, index, variables, referenceNode, referenceName, referenceValue) {
  const binder = {
    type,
    // index,
    // variables,
    isInitialized: false,
    get variable() {
      return variables[index];
    },
    set variable(data) {
      variables[index] = data;
    },
    get node() {
      const node = referenceNode.get();
      if (node) {
        return node;
      } else {
        BindersCache.delete(this);
        return void 0;
      }
    },
    get name() {
      return referenceName.get();
    },
    set name(name) {
      referenceName.set(name);
    },
    get value() {
      return referenceValue.get();
    },
    set value(value) {
      referenceValue.set(value);
    },
    remove() {
      BindersCache.delete(this);
    },
    add() {
      BindersCache.add(this);
    }
  };
  binder.add();
  return binder;
};

// source/initialize.ts
var FILTER = SHOW_ELEMENT + SHOW_TEXT;
var initialize = function(template, variables, marker, container) {
  if (typeof container === "string") {
    const selection = document.querySelector(container);
    if (!selection) throw new Error("query not found");
    const cache = ContainersCache.get(selection);
    if (cache && cache === template) {
      return selection;
    } else {
      ContainersCache.set(selection, template);
    }
  } else if (container instanceof Element || container instanceof ShadowRoot) {
    const cache = ContainersCache.get(container);
    if (cache && cache === template) {
      return container;
    } else {
      ContainersCache.set(container, template);
    }
  }
  const binders = [];
  const fragment = template.content.cloneNode(true);
  const walker = document.createTreeWalker(fragment, FILTER, null);
  let node;
  let index = 0;
  while (walker.nextNode()) {
    node = walker.currentNode;
    const type = node.nodeType;
    if (type === TEXT_NODE) {
      let text2 = node;
      const startIndex = text2.nodeValue?.indexOf(marker) ?? -1;
      if (startIndex === -1) continue;
      if (startIndex !== 0) {
        text2.splitText(startIndex);
        node = walker.nextNode();
        text2 = node;
      }
      const endIndex = marker.length;
      if (endIndex !== text2.nodeValue?.length) {
        text2.splitText(endIndex);
      }
      const referenceNode = Reference(text2);
      const binder = bind(4, index++, variables, referenceNode);
      binders.unshift(binder);
    } else if (type === ELEMENT_NODE) {
      const element2 = node;
      const tag = element2.tagName;
      if (tag === "STYLE" || tag === "SCRIPT") {
        walker.nextSibling();
      }
      let referenceNode;
      if (matchMarker(tag, marker)) {
        referenceNode = Reference(node);
        const binder = bind(1, index++, variables, referenceNode);
        binders.unshift(binder);
      }
      const names = element2.getAttributeNames();
      for (const name of names) {
        const value = element2.getAttribute(name) ?? "";
        const matchMarkerName = matchMarker(name, marker);
        const hasMarkerValue = hasMarker(value, marker);
        if (matchMarkerName || hasMarkerValue) {
          referenceNode = referenceNode ?? Reference(node);
          if (matchMarkerName && hasMarkerValue) {
            const referenceName = Reference("");
            const referenceValue = Reference("");
            const binderName = bind(2, index++, variables, referenceNode, referenceName, referenceValue);
            const binderValue = bind(3, index++, variables, referenceNode, referenceName, referenceValue);
            element2.removeAttribute(name);
            binders.unshift(binderName);
            binders.unshift(binderValue);
          } else if (matchMarkerName) {
            const referenceName = Reference("");
            const referenceValue = Reference(value);
            const binder = bind(2, index++, variables, referenceNode, referenceName, referenceValue);
            element2.removeAttribute(name);
            binders.unshift(binder);
          } else if (hasMarkerValue) {
            const referenceName = Reference(name);
            const referenceValue = Reference("");
            const binder = bind(3, index++, variables, referenceNode, referenceName, referenceValue);
            element2.removeAttribute(name);
            binders.unshift(binder);
          }
        } else {
          if (isLink(name)) {
            if (dangerousLink(value)) {
              element2.removeAttribute(name);
              console.warn(`attribute name "${name}" and value "${value}" not allowed`);
            }
          } else if (hasOn(name)) {
            element2.removeAttribute(name);
            console.warn(`attribute name "${name}" not allowed`);
          }
        }
      }
    } else {
      console.warn(`walker node type "${type}" not handled`);
    }
  }
  for (const binder of binders) {
    action(binder);
  }
  if (typeof container === "string") {
    const selection = document.querySelector(container);
    if (!selection) throw new Error("query not found");
    replaceChildren(selection, fragment);
    return selection;
  } else if (container instanceof Element || container instanceof ShadowRoot) {
    replaceChildren(container, fragment);
    return container;
  } else {
    return fragment;
  }
};

// source/dash.ts
var dash = function(data) {
  data = data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2");
  data = data.toLowerCase();
  data = data.includes("-") ? data : `x-${data}`;
  return data;
};

// source/define.ts
var define = function(tag, extend) {
  return function(constructor) {
    const $tag = dash(tag);
    const $extend = extend;
    customElements.define($tag, constructor, { extends: $extend });
  };
};

// source/style.ts
var Sheets = /* @__PURE__ */ new WeakMap();
var style = function(instance) {
  if (instance.shadowRoot) {
    const root = document.getRootNode();
    instance.shadowRoot.adoptedStyleSheets.push(...root.adoptedStyleSheets);
    for (const rootSheet of root.styleSheets) {
      let cacheSheet = Sheets.get(rootSheet);
      if (!cacheSheet) {
        cacheSheet = new CSSStyleSheet();
        const { cssRules } = rootSheet;
        for (const { cssText } of cssRules) {
          cacheSheet.insertRule(cssText);
        }
        Sheets.set(rootSheet, cacheSheet);
      }
      instance.shadowRoot.adoptedStyleSheets.push(cacheSheet);
    }
  }
};

// source/index.ts
var html = function(strings, ...variables) {
  let marker;
  let template;
  const cache = TemplatesCache.get(strings);
  if (cache) {
    marker = cache.marker;
    template = cache.template;
  } else {
    marker = mark();
    let innerHTML = "";
    const length = strings.length - 1;
    for (let index = 0; index < length; index++) {
      innerHTML += `${strings[index]}${marker}`;
    }
    innerHTML += strings[length];
    template = document.createElement("template");
    template.innerHTML = innerHTML;
    TemplatesCache.set(strings, { template, marker });
  }
  const meta = {
    [ViewSymbol]: true,
    [MarkSymbol]: marker,
    [TemplateSymbol]: template,
    [VariablesSymbol]: variables
  };
  return Object.assign(initialize.bind(meta, template, variables, marker), meta);
};
export {
  define,
  html,
  style,
  update
};
//# sourceMappingURL=esnext.js.map
