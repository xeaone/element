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
var isLink = function(data) {
  return data && typeof data === "string" ? links.indexOf(data.toLowerCase()) !== -1 : false;
};
var isIterable = function(data) {
  return data && typeof data !== "string" && typeof data[Symbol.iterator] === "function";
};
var patternAnimation = /^onanimation$/i;
var isAnimation = function(data) {
  return data && typeof data === "string" ? patternAnimation.test(data) : false;
};
var patternTimeout = /^ontimeout$/i;
var isTimeout = function(data) {
  return data && typeof data === "string" ? patternTimeout.test(data) : false;
};
var patternOn = /^on/i;
var hasOn = function(data) {
  return data && typeof data === "string" ? patternOn.test(data) : false;
};
var patternMarker = /^x-[0-9]{10}-x$/;
var isMarker = function(data) {
  return data && typeof data === "string" ? patternMarker.test(data) : false;
};
var hasMarker = function(data, marker) {
  return data && typeof data === "string" ? data.indexOf(marker) !== -1 : false;
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
var createAttribute = function(owner, name, value) {
  const attribute2 = owner.ownerDocument.createAttribute(name);
  attribute2.value = value ?? "";
  owner.setAttributeNode(attribute2);
  return attribute2;
};
var removeAttribute = function(node) {
  return node.ownerElement.removeAttributeNode(node);
};
var isText = function(node) {
  return node?.nodeType === TEXT_NODE;
};
var isAttribute = function(node) {
  return node?.nodeType === ATTRIBUTE_NODE;
};
var isElement = function(node) {
  return node?.nodeType === ELEMENT_NODE;
};
var isComment = function(node) {
  return node?.nodeType === COMMENT_NODE;
};

// source/intersection.ts
var connectedEvent = new CustomEvent("connected");
var disconnectedEvent = new CustomEvent("disconnected");
var intersectionElements = /* @__PURE__ */ new WeakMap();
var intersectionObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const intersectionElement = intersectionElements.get(entry.target);
    if (!intersectionElement) {
      intersectionElements.set(entry.target, { wasConnected: false, isIntersecting: entry.isIntersecting });
    } else if (entry.target.isConnected === true && intersectionElement.wasConnected === false) {
      intersectionElement.wasConnected = true;
      intersectionElement.isIntersecting = entry.isIntersecting;
      entry.target.dispatchEvent(connectedEvent);
    } else if (entry.target.isConnected === false && intersectionElement.wasConnected === true) {
      intersectionElement.wasConnected = false;
      intersectionElement.isIntersecting = entry.isIntersecting;
      entry.target.dispatchEvent(disconnectedEvent);
    } else {
    }
  }
}, {
  threshold: 1,
  // rootMargin: '100000%',
  root: document.documentElement
});

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
    Current = (async () => {
      const binders = BindersCache.values();
      for (const binder of binders) {
        try {
          await action(binder);
        } catch (error) {
          console.error(error);
        }
      }
      Current = void 0;
    })();
    await Current;
  }
};

// source/action.ts
var comment = function(node, binder, result) {
  console.warn("comment action not implemented");
};
var element = function(node, binder, result) {
  console.warn("element action not implemented");
};
var attribute = function(node, binder, result) {
  const name = node.name;
  if (hasOn(name)) {
    if (isAnimation(name)) {
      const isArray = Array.isArray(binder.result);
      const method = isArray ? binder.result[0] : binder.result;
      const handle = async () => {
        if (binder.owner?.isConnected) {
          const result2 = method();
          if (binder.result === result2) {
            requestAnimationFrame(handle);
          } else {
            binder.result = result2;
            await update();
            requestAnimationFrame(handle);
          }
        } else {
          requestAnimationFrame(handle);
        }
      };
      requestAnimationFrame(handle);
    } else if (isTimeout(name)) {
      const isArray = Array.isArray(binder.result);
      const method = isArray ? binder.result[0] : binder.result;
      const time = isArray ? binder.result[1] : void 0;
      const handle = async () => {
        const result2 = method();
        if (binder.result === result2) {
          return;
        } else {
          binder.result = result2;
          await update();
        }
      };
      setTimeout(handle, time);
    } else {
      const owner2 = binder.owner;
      if (owner2) {
        const eventName = name.substring(2);
        const isArray = Array.isArray(result);
        const [method, options] = isArray ? result : [result, void 0];
        if (typeof method === "function") {
          owner2.addEventListener(eventName, async function(event) {
            const returned = method(event);
            if (binder.meta.returned !== returned) {
              binder.meta.returned = returned;
              await update();
            }
          }, options);
          intersectionObserver.observe(owner2);
        } else {
          console.error(`${name} requiures function or array with function`);
        }
      }
    }
    const owner = binder.owner;
    if (owner) {
      owner.removeAttributeNode(node);
    }
  } else if (node.value === "") {
    console.log(node.name, node.value, name, result);
    if (name !== result) {
      if (result) {
        binder.replace(createAttribute(binder.owner, result));
        removeAttribute(node);
        Reflect.set(binder.owner, result, true);
      } else {
        removeAttribute(node);
        Reflect.set(binder.owner, result, true);
      }
    }
  } else if (result instanceof Attr) {
  } else {
    node.value = result;
  }
};
var text = function(node, binder, result) {
  if (result === null || result === void 0) {
    if (node.textContent === "") {
      return;
    } else {
      node.textContent = "";
    }
  } else if (result instanceof Node) {
    if (!binder.start) {
      binder.start = document.createTextNode("");
      beforeNode(binder.start, node);
    }
    if (!binder.end) {
      node.textContent = "";
      binder.end = node;
    }
    removeBetween(binder.start, binder.end);
    beforeNode(result, binder.end);
  } else if (result?.[InstanceSymbol]) {
    if (!binder.start) {
      binder.start = document.createTextNode("");
      beforeNode(binder.start, node);
    }
    if (!binder.end) {
      node.textContent = "";
      binder.end = node;
    }
    removeBetween(binder.start, binder.end);
    beforeNode(result(), binder.end);
  } else if (isIterable(result)) {
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
    const newLength = result.length;
    const commonLength = Math.min(oldLength, newLength);
    for (let index = 0; index < commonLength; index++) {
      if (binder.results[index]?.[TemplateSymbol] === result[index]?.[TemplateSymbol]) {
        Object.assign(binder.results[index][VariablesSymbol], result[index][VariablesSymbol]);
      } else {
        binder.results[index] = result[index];
      }
    }
    if (oldLength < newLength) {
      while (binder.length !== result.length) {
        const marker = document.createTextNode("");
        binder.markers.push(marker);
        binder.results.push(result[binder.length]);
        beforeNode(marker, binder.end);
        bind(marker, binder.results, binder.length);
        binder.length++;
      }
    } else if (oldLength > newLength) {
      const last = binder.markers[result.length - 1];
      while (binder.length !== result.length) {
        const previous = binder.end.previousSibling;
        if (previous === last)
          break;
        removeNode(previous);
      }
      binder.length = result.length;
      binder.results.length = result.length;
      binder.markers.length = result.length;
    }
  } else {
    if (node.textContent === `${result}`) {
      return;
    } else {
      node.textContent = `${result}`;
    }
  }
};
var action = function(binder) {
  const node = binder.node;
  if (!node) {
    return;
  }
  const variable = binder.variable;
  const isFunction = typeof variable === "function";
  const isInstance = isFunction && variable[InstanceSymbol];
  const isOnce = node.nodeType === ATTRIBUTE_NODE && node?.name.startsWith("on");
  const isReactive = !isInstance && !isOnce && isFunction;
  if (!isReactive || isOnce) {
    binder.remove();
  }
  let result;
  if (isReactive) {
    result = variable();
  } else {
    result = variable;
  }
  if (binder.result === result) {
    return;
  }
  if (binder.result?.constructor !== result?.constructor) {
    delete binder.start;
    delete binder.end;
    delete binder.markers;
    delete binder.results;
    delete binder.length;
  }
  if (isText(node)) {
    text(node, binder, result);
  } else if (isAttribute(node)) {
    attribute(node, binder, result);
  } else if (isElement(node)) {
    element(node, binder, result);
  } else if (isComment(node)) {
    comment(node, binder, result);
  } else {
    console.warn(`action node type "${node.nodeType}" not handled`);
  }
  binder.result = result;
};

// source/bind.ts
var bind = function(node, variables, index) {
  const binder = {
    meta: {},
    result: void 0,
    nodeReference: new WeakRef(node),
    get node() {
      const node2 = this.nodeReference.deref();
      if (node2) {
        return node2;
      } else {
        BindersCache.delete(this);
        return null;
      }
    },
    ownerReference: node.ownerElement || node.parentElement ? new WeakRef(node.ownerElement ?? node.parentElement) : void 0,
    get owner() {
      const node2 = this.ownerReference?.deref();
      if (node2) {
        return node2;
      } else {
        BindersCache.delete(this);
        return null;
      }
    },
    get variable() {
      return variables[index];
    },
    remove() {
      BindersCache.delete(this);
    },
    replace(node2) {
      this.nodeReference = new WeakRef(node2);
    }
    // isOnce,
    // isReactive,
    // isInstance,
    // isInitialized: false,
  };
  BindersCache.add(binder);
  action(binder);
};

// source/initialize.ts
var FILTER = SHOW_ELEMENT + SHOW_TEXT;
var initialize = function(template, variables, marker, container) {
  const fragment = template.content.cloneNode(true);
  const walker = document.createTreeWalker(fragment, FILTER, null);
  let text2;
  let attribute2;
  let element2;
  let type;
  let name;
  let value;
  let names;
  let node;
  let startIndex;
  let endIndex;
  let index = 0;
  while (walker.nextNode()) {
    node = walker.currentNode;
    type = node.nodeType;
    if (type === TEXT_NODE) {
      text2 = node;
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
      bind(text2, variables, index++);
    } else if (type === ELEMENT_NODE) {
      element2 = node;
      if (element2.nodeName === "SCRIPT" || element2.nodeName === "STYLE") {
        walker.nextSibling();
      }
      if (isMarker(element2.nodeName, marker)) {
        bind(element2, variables, index++);
      }
      names = element2.getAttributeNames();
      for (name of names) {
        value = element2.getAttribute(name) ?? "";
        if (hasMarker(name, marker) || hasMarker(value, marker)) {
          attribute2 = element2.getAttributeNode(name);
          if (hasMarker(name, marker)) {
            bind(attribute2, variables, index++);
          }
          if (hasMarker(value, marker)) {
            bind(attribute2, variables, index++);
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
