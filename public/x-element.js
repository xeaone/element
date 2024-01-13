// source/global.ts
var global = window.XGLOBAL ?? (window.XGLOBAL = Object.freeze({
  // QueueNext: undefined,
  // QueueCurrent: undefined,
  BindersCache: /* @__PURE__ */ new Set(),
  TemplatesCache: /* @__PURE__ */ new WeakMap(),
  ContainersCache: /* @__PURE__ */ new WeakMap(),
  MarkerSymbol: Symbol("marker"),
  InstanceSymbol: Symbol("instance"),
  TemplateSymbol: Symbol("template"),
  VariablesSymbol: Symbol("variables")
}));
var {
  // QueueNext,
  // QueueCurrent,
  BindersCache,
  TemplatesCache,
  ContainersCache,
  MarkerSymbol,
  InstanceSymbol,
  TemplateSymbol,
  VariablesSymbol
} = global;

// source/tools.ts
var {
  SHOW_TEXT,
  SHOW_ELEMENT
} = NodeFilter;
var {
  TEXT_NODE,
  COMMENT_NODE,
  ELEMENT_NODE,
  ATTRIBUTE_NODE,
  DOCUMENT_FRAGMENT_NODE
} = Node;
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
];
var isLink = function(data) {
  return data && typeof data === "string" ? links.indexOf(data.toLowerCase()) !== -1 : false;
};
var isBool = function(data) {
  return data && typeof data === "string" ? bools.indexOf(data.toLowerCase()) !== -1 : false;
};
var isIterable = function(data) {
  return data && typeof data !== "string" && typeof data[Symbol.iterator] === "function";
};
var patternValue = /^value$/i;
var isValue = function(data) {
  return data && typeof data === "string" ? patternValue.test(data) : false;
};
var patternOn = /^on/i;
var hasOn = function(data) {
  return data && typeof data === "string" ? patternOn.test(data) : false;
};
var matchMarker = function(data, marker) {
  return data && typeof data === "string" ? data === marker : false;
};
var hasMarker = function(data, marker) {
  return data && typeof data === "string" ? data.indexOf(marker) !== -1 : false;
};
var sliceOn = function(data) {
  return data && typeof data === "string" ? data?.toLowerCase()?.slice(2) : "";
};
var mark = function() {
  return `x-${`${Math.floor(Math.random() * Date.now())}`.slice(0, 10)}-x`;
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
  while (node && node !== start) {
    node.parentNode?.removeChild(node);
    node = end.previousSibling;
  }
};
var removeNode = function(node) {
  node.parentNode.removeChild(node);
};
var beforeNode = function(node, child) {
  child.parentNode.insertBefore(node, child);
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

// source/attribute-name.ts
var attributeName = function(element2, data, source, target) {
  console.log(arguments);
  source = source?.toLowerCase() ?? "";
  target = target?.toLowerCase() ?? "";
  if (source === target) {
    return;
  }
  if (hasOn(source)) {
    if (typeof data.value === "function") {
      element2.removeEventListener(sliceOn(source), data.value, true);
    }
  } else if (isValue(source)) {
    element2.removeAttribute(source);
    Reflect.set(element2, source, null);
  } else if (isBool(source)) {
    console.log(data, source, target);
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
    element2.setAttribute(target, "");
    Reflect.set(element2, target, true);
  } else if (target) {
    element2.setAttribute(target, "");
    Reflect.set(element2, target, null);
  }
  data.name = target || "";
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
    console.log("Is Current");
    if (Next) {
      console.log("Is Next");
      await Next;
    } else {
      console.log("Not Next");
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

// source/attribute-value.ts
var attributeValue = function(element2, data, source, target) {
  console.log(element2, source, target);
  if (source === target) {
    return;
  }
  if (isValue(data.name)) {
    data.value = target;
    element2.setAttribute(data.name, data.value);
    Reflect.set(element2, data.name, data.value);
  } else if (isLink(data.name)) {
    data.value = encodeURI(target);
    if (dangerousLink(data.value)) {
      element2.removeAttribute(data.name);
      console.warn(`XElement - attribute name "${data.name}" and value "${data.value}" not allowed`);
      return;
    }
    element2.setAttribute(data.name, data.value);
  } else if (hasOn(data.name)) {
    console.log(data);
    if (element2.hasAttribute(data.name)) {
      element2.removeAttribute(data.name);
    }
    if (typeof data.value === "function") {
      element2.removeEventListener(sliceOn(data.name), data.value, true);
    }
    if (typeof target !== "function") {
      return console.warn(`XElement - attribute name "${data.name}" and value "${data.value}" not allowed`);
    }
    data.value = function() {
      const result = target.call(this, ...arguments);
      if (data.result !== result) {
        data.result = result;
        update();
      }
      return result;
    };
    element2.addEventListener(sliceOn(data.name), data.value, true);
  } else {
    data.value = target;
    element2.setAttribute(data.name, data.value);
    Reflect.set(element2, data.name, data.value);
  }
};

// source/text.ts
var text = function(node, data, source, target) {
  if (target === null || target === void 0) {
    if (node.textContent === "") {
      return;
    } else {
      node.textContent = "";
    }
  } else if (target instanceof Node) {
    if (!data.start) {
      data.start = document.createTextNode("");
      beforeNode(data.start, node);
    }
    if (!data.end) {
      node.textContent = "";
      data.end = node;
    }
    removeBetween(data.start, data.end);
    beforeNode(target, data.end);
  } else if (target?.[InstanceSymbol]) {
    if (!data.start) {
      data.start = document.createTextNode("");
      beforeNode(data.start, node);
    }
    if (!data.end) {
      node.textContent = "";
      data.end = node;
    }
    removeBetween(data.start, data.end);
    beforeNode(target(), data.end);
  } else if (isIterable(target)) {
    if (data.length === void 0) {
      data.length = 0;
    }
    if (!data.results) {
      data.results = [];
    }
    if (!data.markers) {
      data.markers = [];
    }
    if (!data.start) {
      data.start = document.createTextNode("");
      beforeNode(data.start, node);
    }
    if (!data.end) {
      node.textContent = "";
      data.end = node;
    }
    const oldLength = data.length;
    const newLength = target.length;
    const commonLength = Math.min(oldLength, newLength);
    for (let index = 0; index < commonLength; index++) {
      if (data.results[index]?.[TemplateSymbol] === target[index]?.[TemplateSymbol]) {
        Object.assign(data.results[index][VariablesSymbol], target[index][VariablesSymbol]);
      } else {
        data.results[index] = target[index];
      }
    }
    if (oldLength < newLength) {
      while (data.length !== target.length) {
        const marker = document.createTextNode("");
        data.markers.push(marker);
        data.results.push(target[data.length]);
        beforeNode(marker, data.end);
        data.length++;
      }
    } else if (oldLength > newLength) {
      const last = data.markers[target.length - 1];
      while (data.length !== target.length) {
        const previous = data.end.previousSibling;
        if (previous === last)
          break;
        removeNode(previous);
      }
      data.length = target.length;
      data.results.length = target.length;
      data.markers.length = target.length;
    }
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
  const variables = binder.variables;
  for (const instruction of binder.instructions) {
    const { type, data } = instruction;
    const variable = variables[instruction.index];
    const isFunction = typeof variable === "function";
    const isInstance = isFunction && variable[InstanceSymbol];
    const isOnce = type === 3 && data.name.startsWith("on");
    const isReactive = !isInstance && !isOnce && isFunction;
    if (isOnce || isInstance || !isFunction) {
      binder.instructions.splice(binder.instructions.indexOf(instruction), 1);
      if (!binder.instructions) {
        binder.remove();
      }
    }
    const source = instruction.source;
    const target = isReactive ? variable() : variable;
    if ("source" in instruction && source === target) {
      continue;
    }
    if (instruction.type === 1) {
      element(node, data, source, target);
    } else if (instruction.type === 2) {
      attributeName(node, data, source, target);
    } else if (instruction.type === 3) {
      attributeValue(node, data, source, target);
    } else if (instruction.type === 4) {
      text(node, data, source, target);
    } else {
      throw new Error("instruction type not valid");
    }
    instruction.source = target;
  }
};

// source/bind.ts
var bind = function(variables, instructions, reference) {
  const binder = {
    reference,
    get node() {
      const node = reference.deref();
      if (node) {
        return node;
      } else {
        console.log("binder remove by no node");
        BindersCache.delete(this);
        return null;
      }
    },
    get instructions() {
      if (!instructions.length) {
        BindersCache.delete(this);
      }
      return instructions;
    },
    get variables() {
      return variables;
    },
    remove() {
      BindersCache.delete(this);
    }
  };
  BindersCache.add(binder);
  action(binder);
};

// source/initialize.ts
var FILTER = SHOW_ELEMENT + SHOW_TEXT;
var initialize = function(template, variables, marker, container) {
  const fragment = template.content.cloneNode(true);
  const walker = document.createTreeWalker(fragment, FILTER, null);
  let node;
  let startIndex;
  let endIndex;
  let index = 0;
  while (walker.nextNode()) {
    node = walker.currentNode;
    const type = node.nodeType;
    if (type === TEXT_NODE) {
      let text2 = node;
      startIndex = text2.nodeValue?.indexOf(marker) ?? -1;
      if (startIndex === -1)
        continue;
      if (startIndex !== 0) {
        text2.splitText(startIndex);
        node = walker.nextNode();
        text2 = node;
      }
      endIndex = marker.length;
      if (endIndex !== text2.nodeValue?.length) {
        text2.splitText(endIndex);
      }
      const reference = new WeakRef(text2);
      const instructions = [{ type: 4, index: index++, data: {} }];
      bind(variables, instructions, reference);
    } else if (type === ELEMENT_NODE) {
      const element2 = node;
      const tag = element2.tagName.toLowerCase();
      if (tag === "STYLE" || tag === "SCRIPT") {
        walker.nextSibling();
      }
      let instructions;
      let reference;
      if (matchMarker(tag, marker)) {
        reference = new WeakRef(element2);
        instructions = [{ type: 1, index: index++, data: { tag } }];
      }
      const names = element2.getAttributeNames();
      for (const name of names) {
        const value = element2.getAttribute(name) ?? "";
        const matchMarkerName = matchMarker(name, marker);
        const hasMarkerValue = hasMarker(value, marker);
        if (matchMarkerName || hasMarkerValue) {
          reference = reference ?? new WeakRef(element2);
          instructions = instructions ?? [];
          const data = { name, value };
          if (matchMarkerName) {
            data.name = "";
            instructions.push({ type: 2, index: index++, data });
          }
          if (hasMarkerValue) {
            data.value = "";
            instructions.push({ type: 3, index: index++, data });
          }
          element2.removeAttribute(name);
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
      if (instructions && reference) {
        bind(variables, instructions, reference);
      }
    } else {
      console.warn(`walker node type "${type}" not handled`);
    }
  }
  if (typeof container === "string") {
    const selection = document.querySelector(container);
    if (!selection)
      throw new Error("query not found");
    replaceChildren(selection, fragment);
    return selection;
  } else if (container instanceof Element) {
    replaceChildren(container, fragment);
    return container;
  } else {
    return fragment;
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
    [InstanceSymbol]: true,
    [MarkerSymbol]: marker,
    [TemplateSymbol]: template,
    [VariablesSymbol]: variables
  };
  return Object.assign(initialize.bind(meta, template, variables, marker), meta);
};
export {
  html,
  update
};
//# sourceMappingURL=x-element.js.map
