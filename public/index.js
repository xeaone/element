var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// source/global.ts
var global, BindersCache, TemplatesCache, ContainersCache, MarkerSymbol, InstanceSymbol, TemplateSymbol, VariablesSymbol;
var init_global = __esm({
  "source/global.ts"() {
    global = window.XGLOBAL ?? (window.XGLOBAL = Object.freeze({
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
      MarkerSymbol: Symbol("marker"),
      InstanceSymbol: Symbol("instance"),
      TemplateSymbol: Symbol("template"),
      VariablesSymbol: Symbol("variables")
    }));
    ({
      BindersCache: (
        // QueueNext,
        // QueueCurrent,
        BindersCache
      ),
      TemplatesCache: (
        // GlobalBinders,
        // LocalBinders,
        // QueueBinders,
        // VirtualCache,
        TemplatesCache
      ),
      ContainersCache,
      MarkerSymbol,
      InstanceSymbol,
      TemplateSymbol,
      VariablesSymbol
    } = global);
  }
});

// source/tools.ts
var SHOW_TEXT, SHOW_ELEMENT, TEXT_NODE, COMMENT_NODE, ELEMENT_NODE, ATTRIBUTE_NODE, DOCUMENT_FRAGMENT_NODE, patternLink, patternBool, patternTimeout, patternValue, patternOn, safePattern, isLink, isBool, isIterable, isTimeout, isValue, hasOn, matchMarker, hasMarker, sliceOn, isConnected, mark, dangerousLink, removeBetween, removeNode, beforeNode, afterNode, replaceNode, replaceChildren;
var init_tools = __esm({
  "source/tools.ts"() {
    ({
      SHOW_TEXT,
      SHOW_ELEMENT
    } = NodeFilter);
    ({
      TEXT_NODE,
      COMMENT_NODE,
      ELEMENT_NODE,
      ATTRIBUTE_NODE,
      DOCUMENT_FRAGMENT_NODE
    } = Node);
    patternLink = new RegExp(
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
    patternBool = new RegExp(
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
    patternTimeout = /^[.@$]?ontimeout$/i;
    patternValue = /^[.@$]?value$/i;
    patternOn = /^[.@$]?on/i;
    safePattern = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
    isLink = function(data) {
      return data && typeof data === "string" ? patternLink.test(data) : false;
    };
    isBool = function(data) {
      return data && typeof data === "string" ? patternBool.test(data) : false;
    };
    isIterable = function(data) {
      return data && typeof data !== "string" && typeof data[Symbol.iterator] === "function";
    };
    isTimeout = function(data) {
      return data && typeof data === "string" ? patternTimeout.test(data) : false;
    };
    isValue = function(data) {
      return data && typeof data === "string" ? patternValue.test(data) : false;
    };
    hasOn = function(data) {
      return data && typeof data === "string" ? patternOn.test(data) : false;
    };
    matchMarker = function(data, marker) {
      return data && marker && typeof data === "string" && typeof marker === "string" ? data.toLowerCase() === marker.toLowerCase() : false;
    };
    hasMarker = function(data, marker) {
      return data && typeof data === "string" ? data.indexOf(marker) !== -1 : false;
    };
    sliceOn = function(data) {
      return data && typeof data === "string" ? data.replace(patternOn, "") : "";
    };
    isConnected = function(node) {
      if (node.nodeType === Node.ATTRIBUTE_NODE) {
        return node.parentNode?.isConnected ?? false;
      } else {
        return node.isConnected;
      }
    };
    mark = function() {
      return `x-${`${Math.floor(Math.random() * Date.now())}`.slice(0, 10)}-x`;
    };
    dangerousLink = function(data) {
      if (data === "")
        return false;
      if (typeof data !== "string")
        return false;
      return safePattern.test(data) ? false : true;
    };
    removeBetween = function(start, end) {
      let node = end.previousSibling;
      while (node && node !== start) {
        node.parentNode?.removeChild(node);
        node = end.previousSibling;
      }
    };
    removeNode = function(node) {
      node.parentNode.removeChild(node);
    };
    beforeNode = function(node, child) {
      if (!(node instanceof Node))
        node = child.ownerDocument.createTextNode(`${node}`);
      child.parentNode.insertBefore(node, child);
    };
    afterNode = function(node, child) {
      if (!(node instanceof Node))
        node = child.ownerDocument.createTextNode(`${node}`);
      child.parentNode.insertBefore(node, child.nextSibling);
    };
    replaceNode = function(node, child) {
      child.parentNode.replaceChild(node, child);
    };
    replaceChildren = function(element2, ...nodes) {
      while (element2.lastChild) {
        element2.removeChild(element2.lastChild);
      }
      for (const node of nodes) {
        element2.appendChild(
          typeof node === "string" ? element2.ownerDocument.createTextNode(node) : node
        );
      }
    };
  }
});

// source/reference.ts
var Reference;
var init_reference = __esm({
  "source/reference.ts"() {
    Reference = function(data) {
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
  }
});

// source/attribute-name.ts
var attributeName;
var init_attribute_name = __esm({
  "source/attribute-name.ts"() {
    init_tools();
    attributeName = function(element2, binder, source2, target) {
      source2 = source2?.toLowerCase() ?? "";
      target = target?.toLowerCase() ?? "";
      if (source2 === target) {
        return;
      }
      if (hasOn(source2)) {
        if (typeof binder.value === "function") {
          element2.removeEventListener(sliceOn(source2), binder.value, true);
        }
      } else if (isValue(source2)) {
        element2.removeAttribute(source2);
        Reflect.set(element2, source2, null);
      } else if (isBool(source2)) {
        element2.removeAttribute(source2);
        Reflect.set(element2, source2, false);
      } else if (isLink(source2)) {
        element2.removeAttribute(source2);
        Reflect.deleteProperty(element2, source2);
      } else if (source2) {
        element2.removeAttribute(source2);
        Reflect.deleteProperty(element2, source2);
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
  }
});

// source/display.ts
var display;
var init_display = __esm({
  "source/display.ts"() {
    display = function(data) {
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
  }
});

// source/update.ts
var Next, Current, next, update;
var init_update = __esm({
  "source/update.ts"() {
    init_global();
    init_action();
    next = async function() {
      await Current;
      await new Promise((resolve) => {
        queueMicrotask(async () => {
          Next = void 0;
          await update();
          resolve(void 0);
        });
      });
    };
    update = async function() {
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
  }
});

// source/event.ts
var event;
var init_event = __esm({
  "source/event.ts"() {
    init_update();
    event = function(binder) {
      return {
        get target() {
          return binder?.node;
        },
        update,
        query(selector) {
          return binder?.node?.getRootNode()?.querySelector(selector);
        }
      };
    };
  }
});

// source/attribute-value.ts
var attributeValue;
var init_attribute_value = __esm({
  "source/attribute-value.ts"() {
    init_tools();
    init_display();
    init_update();
    init_event();
    init_tools();
    attributeValue = function(element2, binder, source2, target) {
      if (source2 === target) {
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
            source2?.[1] ?? true
          );
        }
        const method = typeof target === "function" ? target : target?.[0];
        if (typeof method !== "function") {
          return console.warn(`XElement - attribute name "${binder.name}" expected a function`);
        }
        let oldResult;
        binder.value = function() {
          const newResult = method.call(this, event(binder));
          if (newResult !== oldResult) {
            oldResult = newResult;
            update();
          }
          return newResult;
        };
        if (isTimeout(binder.name)) {
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
  }
});

// source/text.ts
var iterableDisplay, text;
var init_text = __esm({
  "source/text.ts"() {
    init_tools();
    init_global();
    init_display();
    iterableDisplay = function(data) {
      return data?.[InstanceSymbol] ? data() : data instanceof Node ? data : display(data);
    };
    text = function(node, binder, source2, target) {
      if (target === null || target === void 0) {
        if (node.textContent !== "") {
          node.textContent = "";
        }
      } else if (target?.[InstanceSymbol]) {
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
          if (binder.results[index] !== target[index]) {
            const marker = binder.markers[index];
            const last = binder.markers[index + 1] ?? binder.end;
            while (last.previousSibling && last.previousSibling !== marker) {
              removeNode(last.previousSibling);
            }
            const child = iterableDisplay(target[index]);
            afterNode(child, marker);
            console.log(child, marker);
            binder.results[index] = target[index];
          }
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
  }
});

// source/action.ts
var element, action;
var init_action = __esm({
  "source/action.ts"() {
    init_attribute_name();
    init_attribute_value();
    init_tools();
    init_global();
    init_event();
    init_text();
    element = function(node, data, source2, target) {
      console.warn("element action not implemented");
    };
    action = function(binder) {
      const node = binder.node;
      if (!node) {
        return;
      }
      if (!isConnected(node) && binder.isInitialized) {
        return;
      }
      const variable = binder.variable;
      const isFunction = typeof variable === "function";
      const isInstance = isFunction && variable[InstanceSymbol];
      const isOnce = binder.type === 3 && hasOn(binder.name);
      const isReactive = !isInstance && !isOnce && isFunction;
      if (isOnce || isInstance || !isFunction) {
        binder.remove();
      }
      const target = isReactive ? variable(event(binder)) : isInstance ? variable() : variable;
      const source2 = binder.source;
      if ("source" in binder && source2 === target) {
        return;
      }
      if (binder.type === 1) {
        element(node, binder, source2, target);
      } else if (binder.type === 2) {
        attributeName(node, binder, source2, target);
      } else if (binder.type === 3) {
        attributeValue(node, binder, source2, target);
      } else if (binder.type === 4) {
        text(node, binder, source2, target);
      } else {
        throw new Error("instruction type not valid");
      }
      binder.source = target;
      binder.isInitialized = true;
    };
  }
});

// source/bind.ts
var bind;
var init_bind = __esm({
  "source/bind.ts"() {
    init_global();
    bind = function(type, index, variables, referenceNode, referenceName, referenceValue) {
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
  }
});

// source/initialize.ts
var FILTER, initialize;
var init_initialize = __esm({
  "source/initialize.ts"() {
    init_tools();
    init_global();
    init_reference();
    init_action();
    init_bind();
    FILTER = SHOW_ELEMENT + SHOW_TEXT;
    initialize = function(template, variables, marker, container) {
      if (typeof container === "string") {
        const selection = document.querySelector(container);
        if (!selection)
          throw new Error("query not found");
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
          if (startIndex === -1)
            continue;
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
        if (!selection)
          throw new Error("query not found");
        replaceChildren(selection, fragment);
        return selection;
      } else if (container instanceof Element || container instanceof ShadowRoot) {
        replaceChildren(container, fragment);
        return container;
      } else {
        return fragment;
      }
    };
  }
});

// source/dash.ts
var dash;
var init_dash = __esm({
  "source/dash.ts"() {
    dash = function(data) {
      data = data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2");
      data = data.toLowerCase();
      data = data.includes("-") ? data : `x-${data}`;
      return data;
    };
  }
});

// source/define.ts
var cdc, define;
var init_define = __esm({
  "source/define.ts"() {
    init_dash();
    cdc = { addInitializer(method) {
      method();
    } };
    define = function(tag, extend) {
      return (constructor, context) => {
        context = context ?? cdc;
        context.addInitializer(function() {
          const $tag = dash(tag);
          const $extend = extend;
          customElements.define($tag, constructor, { extends: $extend });
        });
      };
    };
  }
});

// source/index.ts
var html;
var init_source = __esm({
  "source/index.ts"() {
    init_global();
    init_initialize();
    init_update();
    init_define();
    init_tools();
    html = function(strings, ...variables) {
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
        [InstanceSymbol]: true,
        [MarkerSymbol]: marker,
        [TemplateSymbol]: template,
        [VariablesSymbol]: variables
      };
      return Object.assign(initialize.bind(meta, template, variables, marker), meta);
    };
  }
});

// client/modules/highlight.ts
import js from "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/languages/javascript.min.js";
import xml from "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/languages/xml.min.js";
import hljs from "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/highlight.min.js";
function highlight(code, language) {
  if (code instanceof DocumentFragment) {
    code = [].map.call(
      code.childNodes,
      (node) => node.outerHTML || node.textContent || ""
    ).join("");
  } else if (code instanceof Element) {
    code = code.innerHTML;
  } else if (code instanceof Text) {
    code = code.textContent ?? "";
  } else if (typeof code === "function") {
    code = [].map.call(
      code().childNodes,
      (node) => node.outerHTML || node.textContent || ""
    ).join("");
  }
  code = code.replace(/^\n+/, "");
  if (language) {
    code = hljs.highlight(code, { language }).value;
  } else {
    code = hljs.highlight(code, { language: "html" }).value;
  }
  const template = document.createElement("template");
  template.innerHTML = code;
  return template.content;
}
var link;
var init_highlight = __esm({
  "client/modules/highlight.ts"() {
    hljs.registerLanguage("js", function() {
      return js(...arguments);
    });
    hljs.registerLanguage("html", function() {
      return xml(...arguments);
    });
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./theme.css";
    document.head.append(link);
  }
});

// client/root.ts
var root_exports = {};
__export(root_exports, {
  default: () => root_default
});
var count, result, source, Component, sourceComponent, root_default;
var init_root = __esm({
  "client/root.ts"() {
    init_source();
    init_highlight();
    count = 0;
    result = () => html`
    <strong>${() => `Hello World ${count}`}</strong>
    <button onclick=${() => count++}>Greet</button>
`;
    source = highlight(`
import { html } from '/x-element.js';

let count = 0;
export default ${result.toString()}(document.body);
`, "js");
    Component = class extends HTMLElement {
      #root = this.attachShadow({ mode: "open" });
      #count = 0;
      #render = () => html`
        <strong>${() => `Hello World ${this.#count}`}</strong>
        <button onclick=${() => this.#count++}>Greet</button>
    `(this.#root);
      constructor() {
        super();
        this.#render();
      }
    };
    define("x-component")(Component);
    sourceComponent = highlight(`
import { html } from '/x-element.js';

export default ${Component.toString()}
`, "js");
    root_default = html`

    <section>

        <h2>Vision</h2>
        <h4>Provide a zero knowledge agnostic non framework with data binding that mimics native HTML and JS standards.</h4>

        <div class="tiles">
            <div class="tile">
                <h4><span class="material-symbols-rounded">child_care</span> Simple</h4>
                <span>If you know HTML, JS, and Template Literals then you know how to use X-Element.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">magic_exchange</span> Agnostic</h4>
                <span>Use XElement with any framework or library - Lit, Vue, React, Angular...</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">commit</span> Reactive</h4>
                <span>Efficient two way reactive data binding.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">bolt</span> Fast</h4>
                <span>Rendering is blazing fast, because XElement only interacts with the dynamic DOM Nodes.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">deployed_code</span> Small</h4>
                <span>~(15)KB minified.</span>
            </div>
            <div class="tile">
                <h4><span class="material-symbols-rounded">explore</span> Router</h4>
                <span>
                    Client side routing using the new
                    <a href="https://developer.chrome.com/docs/web-platform/navigation-api/" target="_blank">Navigation API</a>
                </span>
            </div>
        </div>

        <h3>Example</h3>
        <p>
            Use a tagged Template and invoke it with an Element or query selector parameters to render and mount.
            Alternatively use the tagged Template without invoking and use the returned DocumentFragment.
        </p>
        <pre>${source}</pre>
        <pre>${result()}</pre>

        <h3>Component Example</h3>
        <pre>${sourceComponent}</pre>
        <pre>${new Component()}</pre>

    </section>

`("main");
  }
});

// client/modules/color.ts
function Color() {
  const letters = "0123456789ABCDEF";
  let color2 = "#";
  for (let i = 0; i < 6; i++) {
    color2 += letters[Math.floor(Math.random() * 16)];
  }
  return color2;
}
var init_color = __esm({
  "client/modules/color.ts"() {
  }
});

// client/guide.ts
var guide_exports = {};
__export(guide_exports, {
  default: () => guide_default
});
var input, checked, color, active, radioShared, boolean, number, fruit, fruits, carsSelected, cars, inputComponent, checkComponent, radioComponent, classComponent, styleComponent, mapComponent, fruitsComponent, carsComponent, selectBooleanComponent, selectNumberComponent, guide_default;
var init_guide = __esm({
  "client/guide.ts"() {
    init_highlight();
    init_source();
    init_color();
    input = "hello world";
    checked = true;
    color = Color();
    active = true;
    radioShared = "two";
    boolean = true;
    number = 1;
    fruit = "Orange";
    fruits = ["Apple", "Orange", "Tomato"];
    carsSelected = ["ford"];
    cars = ["tesla", "ford", "chevy"];
    inputComponent = () => html`
<div>${() => input}</div>
<input value=${() => input} oninput=${(e) => input = e.target.value} />
`;
    checkComponent = () => html`
<div>${() => checked ? "Is Checked" : "Is Not Checked"}</div>
<input type="checkbox"
    ${() => checked ? "checked" : ""}
    oninput=${(e) => checked = e.target.checked}
/>
`;
    radioComponent = () => html`
<div>${() => radioShared}</div>

<input type="radio" name="radio"
    value="one"
    oninput=${(e) => radioShared = e.target.value}
    checked=${(e) => radioShared === e.target.value}
/>

<input type="radio" name="radio"
    value="two"
    oninput=${(e) => radioShared = e.target.value}
    ${(e) => radioShared === e.target.value ? "checked" : ""}
/>
`;
    classComponent = () => html`
<div class=${() => active ? "default class-color" : "default"}>Look at my class</div>
<button onclick=${() => active = !active}>Toggle Class</button>
`;
    styleComponent = () => html`
<div style=${() => `color: ${color}`}>Look at my style</div>
<button onclick=${() => color = Color()}>Change Color</button>
`;
    mapComponent = () => html`
<ul>${fruits.map((f) => html`
    <li>${() => f}</li>
`)}</ul>
`;
    fruitsComponent = () => html`
<div>${() => fruit}</div>
<select value=${() => fruit} oninput=${(e) => fruit = e.target.value}>
    ${fruits.map((f) => html`
        <option value=${() => f}>${() => f}</option>
    `)}
</select>
`;
    carsComponent = () => html`
<div>${() => carsSelected}</div>
<select value=${() => carsSelected} oninput=${(e) => carsSelected = Array.from(e.target.selectedOptions).map((o) => o.value)} multiple>
    ${cars.map((c) => html`
        <option value=${c}>${c}</option>
    `)}
</select>
`;
    selectBooleanComponent = () => html`
<div>${() => boolean}</div>
<select value=${() => boolean} oninput=${(e) => boolean = JSON.parse(e.target.value)}>
    <option value="true">yes</option>
    <option value="false">no</option>
</select>
`;
    selectNumberComponent = () => html`
<div>${() => number}</div>
<select value=${() => number} oninput=${(e) => number = JSON.parse(e.target.value)}>
    <option value="0">zero</option>
    <option value="1">one</option>
    <option value="2">two</option>
</select>
`;
    guide_default = html`

    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section id="input">
        <h3>Input</h3>
        <p>Attributes starting with <code>on</code> will be removed and will set/remove an EventListener.</p>
        <pre id="inputCode">${highlight(inputComponent.toString())}</pre>
        <pre id="inputComponent">${inputComponent()}</pre>
        <pre id="inputSource">${() => highlight(inputComponent()())}</pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Dynamic attributes are allowed which can be used to toggle the attribute.</p>
        <pre id="checkCode">${highlight(checkComponent.toString())}</pre>
        <pre id="checkComponent">${checkComponent()}</pre>
        <pre id="checkSource">${() => highlight(checkComponent()())}</pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Attribute values will be converted to Strings but set the Element property with the original type.</p>
        <pre id="radioCode">${highlight(radioComponent.toString())}</pre>
        <pre id="radioComponent">${radioComponent()}</pre>
        <pre id="radioSource">${() => highlight(radioComponent()())}</pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode">${highlight(classComponent.toString())}</pre>
        <pre id="classComponent">${classComponent()}</pre>
        <pre id="classSource">${() => highlight(classComponent()())}</pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode">${highlight(styleComponent.toString())}</pre>
        <pre id="styleComponent">${styleComponent()}</pre>
        <pre id="styleSource">${() => highlight(styleComponent()())}</pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode">${highlight(mapComponent.toString())}</pre>
        <pre id="mapComponent">${mapComponent()}</pre>
        <pre id="mapSource">${() => highlight(mapComponent()())}</pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode">${highlight(fruitsComponent.toString())}</pre>
        <pre id="fruitsComponent">${fruitsComponent()}</pre>
        <pre id="fruitsSource">${() => highlight(fruitsComponent()())}</pre>

        <br>
        <pre id="carsCode">${highlight(carsComponent.toString())}</pre>
        <pre id="carsComponent">${carsComponent()}</pre>
        <pre id="carsSource">${() => highlight(carsComponent()())}</pre>

        <br>
        <pre id="selectBooleanCode">${highlight(selectBooleanComponent.toString())}</pre>
        <pre id="selectBooleanComponent">${selectBooleanComponent()}</pre>
        <pre id="selectBooleanSource">${() => highlight(selectBooleanComponent()())}</pre>

        <br>
        <pre id="selectNumberCode">${highlight(selectNumberComponent.toString())}</pre>
        <pre id="selectNumberComponent">${selectNumberComponent()}</pre>
        <pre id="selectNumberSource">${() => highlight(selectNumberComponent()())}</pre>
    </section>

`("main");
  }
});

// client/performance.ts
var performance_exports = {};
__export(performance_exports, {
  default: () => performance_default
});
var token, items, rename, performance_default;
var init_performance = __esm({
  "client/performance.ts"() {
    init_source();
    token = () => Math.random().toString(36).substring(2, 5);
    items = Array.from({ length: 500 }, (_, index) => ({ name: token(), id: index }));
    rename = () => {
      items.forEach((item) => item.name = token());
      update().then(() => setTimeout(() => rename(), 10));
    };
    performance_default = html`
    <style>
        .items {
            box-sizing: border-box;
            display: flex;
            flex-wrap: wrap;
            padding: 0;
            margin: 0;
        }
        .item {
            display: block;
            width: 10%;
            padding: 5px;
            box-sizing: border-box;
            border: 1px solid lightgray;
        }
    </style>
    <section onTimeout=${() => rename()}>
        <h1>Performance</h1>
        <div class="items">${() => items.map((item) => html`<span class="item">${() => item.name}</span>`)}</div>
    </section>
`("main");
  }
});

// client/all.ts
var all_exports = {};
__export(all_exports, {
  default: () => all_default
});
var all_default;
var init_all = __esm({
  "client/all.ts"() {
    init_source();
    all_default = html`
    <section>
        <h1>404</h1>
        <h2>Page Not Found</h2>
    </section>
`("main");
  }
});

// client/index.ts
var pathname = location.pathname.toLowerCase().replace(/\/+$/, "");
switch (pathname) {
  case "":
    await Promise.resolve().then(() => (init_root(), root_exports));
    break;
  case "/guide":
    await Promise.resolve().then(() => (init_guide(), guide_exports));
    break;
  case "/performance":
    await Promise.resolve().then(() => (init_performance(), performance_exports));
    break;
  default:
    await Promise.resolve().then(() => (init_all(), all_exports));
}
//# sourceMappingURL=index.js.map
