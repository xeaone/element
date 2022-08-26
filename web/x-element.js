// tmp/element/tick.js
var promise = Promise.resolve();
function tick(method) {
  return promise.then(method);
}

// tmp/element/context.js
var ContextGet = function(event, reference, target, key, receiver) {
  if (typeof key === "symbol")
    return Reflect.get(target, key, receiver);
  const value = Reflect.get(target, key, receiver);
  if (value && typeof value === "object") {
    reference = reference ? `${reference}.${key}` : `${key}`;
    return new Proxy(value, {
      get: ContextGet.bind(null, event, reference),
      set: ContextSet.bind(null, event, reference),
      deleteProperty: ContextDelete.bind(null, event, reference)
    });
  }
  return value;
};
var ContextDelete = function(event, reference, target, key) {
  if (typeof key === "symbol")
    return Reflect.deleteProperty(target, key);
  Reflect.deleteProperty(target, key);
  tick(() => event(reference ? `${reference}.${key}` : `${key}`, "reset"));
  return true;
};
var ContextSet = function(event, reference, target, key, to, receiver) {
  if (typeof key === "symbol")
    return Reflect.set(target, key, receiver);
  const from = Reflect.get(target, key, receiver);
  if (key === "length") {
    tick(() => event(reference, "render"));
    tick(() => event(reference ? `${reference}.${key}` : `${key}`, "render"));
    return Reflect.set(target, key, to, receiver);
  } else if (from === to || isNaN(from) && to === isNaN(to)) {
    return Reflect.set(target, key, to, receiver);
  }
  Reflect.set(target, key, to, receiver);
  tick(() => event(reference ? `${reference}.${key}` : `${key}`, "render"));
  return true;
};

// tmp/element/dash.js
function dash(data) {
  return data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2").toLowerCase();
}

// tmp/element/navigation.js
var navigators = /* @__PURE__ */ new Map();
var transition = async (options) => {
  if (options.cache && options.instance)
    return options.target.replaceChildren(options.instance);
  if (options.navigating)
    return;
  else
    options.navigating = true;
  options.construct = options.construct ?? (await import(options.file)).default;
  if (!options.construct?.prototype)
    throw new Error("XElement - navigation construct not valid");
  options.name = options.name ?? dash(options.construct.name);
  if (!/^\w+-\w+/.test(options.name))
    options.name = `x-${options.name}`;
  if (!customElements.get(options.name))
    customElements.define(options.name, options.construct);
  options.instance = document.createElement(options.name);
  options.target.replaceChildren(options.instance);
  options.navigating = false;
};
var navigate = (event) => {
  if (event && ("canTransition" in event && !event.canTransition || "canIntercept" in event && !event.canIntercept))
    return;
  const destination = new URL(event?.destination.url ?? location.href);
  const base = new URL(document.querySelector("base")?.href ?? location.origin);
  base.hash = "";
  base.search = "";
  destination.hash = "";
  destination.search = "";
  const pathname = destination.href.replace(base.href, "/");
  const options = navigators.get(pathname) ?? navigators.get("/*");
  if (!options)
    return;
  options.target = options.target ?? document.querySelector(options.query);
  if (!options.target)
    throw new Error("XElement - navigation target not found");
  if (event?.intercept) {
    if (options.instance === options.target.lastElementChild)
      return event.intercept();
    return event.intercept({ handler: () => transition(options) });
  } else if (event?.transitionWhile) {
    if (options.instance === options.target.lastElementChild)
      return event.transitionWhile((async () => void 0)());
    return event.transitionWhile(transition(options));
  } else {
    transition(options);
  }
};
function navigation(path, file, options) {
  if (!path)
    throw new Error("XElement - navigation path required");
  if (!file)
    throw new Error("XElement - navigation file required");
  const base = new URL(document.querySelector("base")?.href ?? location.origin);
  base.hash = "";
  base.search = "";
  options = options ?? {};
  options.path = path;
  options.cache = options.cache ?? true;
  options.query = options.query ?? "main";
  options.file = new URL(file, base.href).href;
  navigators.set(path, options);
  navigate();
  window.navigation.addEventListener("navigate", navigate);
}

// tmp/element/format.js
function format(data) {
  return data === void 0 ? "" : typeof data === "object" ? JSON.stringify(data) : data;
}

// tmp/element/boolean.js
var boolean_default = [
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
  "noresize",
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

// tmp/element/standard.js
var standard_default = {
  setup(binder) {
    binder.node.value = "";
    binder.meta.boolean = boolean_default.includes(binder.name);
  },
  render(binder) {
    if (binder.meta.boolean) {
      const data = binder.compute() ? true : false;
      if (data)
        binder.owner.setAttributeNode(binder.node);
      else
        binder.owner.removeAttribute(binder.name);
    } else {
      const data = format(binder.compute());
      binder.owner[binder.name] = data;
      binder.owner.setAttribute(binder.name, data);
    }
  },
  reset(binder) {
    if (binder.meta.boolean) {
      binder.owner.removeAttribute(binder.name);
    } else {
      binder.owner[binder.name] = void 0;
      binder.owner?.setAttribute(binder.name, "");
    }
  }
};

// tmp/element/checked.js
var xRadioInputHandlerEvent = new CustomEvent("xRadioInputHandler");
var handler = function(event, binder) {
  const owner = binder.owner;
  const checked = owner.checked;
  binder.instance.event = event;
  binder.instance.$event = event;
  binder.instance.$assign = !!event;
  binder.instance.$checked = checked;
  const computed = binder.compute();
  if (computed) {
    owner.setAttributeNode(binder.node);
  } else {
    owner.removeAttribute("checked");
  }
};
var checked_default = {
  setup(binder) {
    binder.node.nodeValue = "";
    if (binder.owner.type === "radio") {
      binder.owner.addEventListener("xRadioInputHandler", (event) => handler(event, binder));
      binder.owner.addEventListener("input", (event) => {
        const parent = binder.owner.form || binder.owner.getRootNode();
        const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
        handler(event, binder);
        for (const radio of radios) {
          if (radio === event.target)
            continue;
          radio.checked = false;
          radio.dispatchEvent(xRadioInputHandlerEvent);
        }
      });
    } else {
      binder.owner.addEventListener("input", (event) => handler(event, binder));
    }
  },
  render(binder) {
    handler(void 0, binder);
  },
  reset(binder) {
    binder.owner?.removeAttribute("checked");
  }
};

// tmp/element/inherit.js
var inherit_default = {
  setup(binder) {
    binder.node.value = "";
  },
  render(binder) {
    if (!binder.owner.inherited) {
      return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }
    const inherited = binder.compute();
    binder.owner.inherited?.(inherited);
  },
  reset(binder) {
    if (!binder.owner.inherited) {
      return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }
    binder.owner.inherited?.();
  }
};

// tmp/element/date.js
var date_default = ["date", "datetime-local", "month", "time", "week"];

// tmp/element/value.js
var defaultInputEvent = new Event("input");
var parseable = function(value) {
  return !isNaN(value) && value !== void 0 && typeof value !== "string";
};
var input = function(binder, event) {
  const { owner } = binder;
  const { type } = owner;
  binder.instance.$event = event;
  binder.instance.$assign = true;
  if (type === "select-one") {
    const [option] = owner.selectedOptions;
    binder.instance.$value = option ? "$value" in option ? option.$value : option.value : void 0;
    owner.$value = binder.compute();
  } else if (type === "select-multiple") {
    binder.instance.$value = Array.prototype.map.call(owner.selectedOptions, (o) => "$value" in o ? o.$value : o.value);
    owner.$value = binder.compute();
  } else if (type === "number" || type === "range" || date_default.includes(type)) {
    binder.instance.$value = "$value" in owner && typeof owner.$value === "number" ? owner.valueAsNumber : owner.value;
    owner.$value = binder.compute();
  } else {
    binder.instance.$value = "$value" in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
    binder.instance.$checked = "$value" in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
    owner.$value = binder.compute();
  }
};
var value_default = {
  setup(binder) {
    binder.meta.type = binder.owner.type;
    binder.owner.addEventListener("input", (event) => input(binder, event));
  },
  render(binder) {
    binder.instance.$assign = false;
    binder.instance.$event = void 0;
    binder.instance.$value = void 0;
    binder.instance.$checked = void 0;
    const computed = binder.compute();
    let display;
    if (binder.meta.type === "select-one") {
      const owner = binder.owner;
      owner.value = "";
      Array.prototype.find.call(owner.options, (o) => "$value" in o ? o.$value : o.value === computed);
      if (computed === void 0 && owner.options.length && !owner.selectedOptions.length) {
        owner.options[0].selected = true;
        return owner.dispatchEvent(defaultInputEvent);
      }
      display = format(computed);
      owner.value = display;
    } else if (binder.meta.type === "select-multiple") {
      const owner = binder.owner;
      Array.prototype.forEach.call(owner.options, (o) => o.selected = computed?.includes("$value" in o ? o.$value : o.value));
      display = format(computed);
    } else if (binder.meta.type === "number" || binder.meta.type === "range" || date_default.includes(binder.meta.type)) {
      const owner = binder.owner;
      if (typeof computed === "string")
        owner.value = computed;
      else if (typeof computed === "number" && !isNaN(computed))
        owner.valueAsNumber = computed;
      else
        owner.value = "";
      display = owner.value;
    } else {
      const owner = binder.owner;
      display = format(computed);
      owner.value = display;
    }
    binder.owner.$value = computed;
    binder.owner.setAttribute("value", display);
  },
  reset(binder) {
    if (binder.meta.type === "select-one" || binder.meta.type === "select-multiple") {
      const owner = binder.owner;
      Array.prototype.forEach.call(owner.options, (option) => option.selected = false);
    }
    binder.owner.value = "";
    binder.owner.$value = void 0;
    binder.owner.setAttribute("value", "");
  }
};

// tmp/element/text.js
var text_default = {
  async render(binder) {
    const data = binder.compute();
    binder.node.nodeValue = format(data);
  },
  async reset(binder) {
    binder.node.nodeValue = "";
  }
};

// tmp/element/html.js
var html_default = {
  setup(binder) {
    binder.node.nodeValue = "";
  },
  async render(binder) {
    let data = await binder.compute();
    let fragment, node;
    if (typeof data == "string") {
      const template = document.createElement("template");
      template.innerHTML = data;
      fragment = template.content;
    } else if (data instanceof HTMLTemplateElement) {
      fragment = data.content.cloneNode(true);
    } else {
      return console.error("html binder requires a string or Template");
    }
    node = binder.owner.lastChild;
    while (node) {
      binder.owner.removeChild(node);
      binder.release(node);
      node = binder.owner.lastChild;
    }
    node = fragment.firstChild;
    while (node) {
      binder.container.register(node, binder.context);
      node = node.nextSibling;
    }
    await binder.container.render();
    binder.owner.appendChild(fragment);
  },
  async reset(binder) {
    let node = binder.owner.lastChild;
    while (node) {
      binder.owner.removeChild(node);
      binder.release(node);
      node = binder.owner.lastChild;
    }
    await binder.container.render();
  }
};

// tmp/element/each.js
var whitespace = /\s+/;
var each_default = {
  setup(binder) {
    binder.node.nodeValue = "";
    binder.meta.keys = [];
    binder.meta.setup = true;
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;
    binder.meta.queueElement = document.createElement("template");
    binder.meta.templateElement = document.createElement("template");
    let node = binder.owner.firstChild;
    while (node) {
      if (node.nodeType === Node.TEXT_NODE && whitespace.test(node.nodeValue)) {
        binder.owner.removeChild(node);
      } else {
        binder.meta.templateLength++;
        binder.meta.templateElement.content.appendChild(node);
      }
      node = binder.owner.firstChild;
    }
  },
  async reset(binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    while (binder.owner.lastChild)
      binder.release(binder.owner.removeChild(binder.owner.lastChild));
    while (binder.meta.queueElement.content.lastChild)
      binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild);
  },
  async render(binder) {
    const [data, variable, key, index] = binder.compute();
    const [reference] = binder.references;
    binder.meta.data = data;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variable = variable;
    binder.meta.reference = reference;
    if (data?.constructor === Array) {
      binder.meta.targetLength = data.length;
    } else {
      binder.meta.keys = Object.keys(data || {});
      binder.meta.targetLength = binder.meta.keys.length;
    }
    if (binder.meta.currentLength > binder.meta.targetLength) {
      while (binder.meta.currentLength > binder.meta.targetLength) {
        let count = binder.meta.templateLength, node;
        while (count--) {
          node = binder.owner.lastChild;
          if (node) {
            binder.owner.removeChild(node);
            binder.container.release(node);
          }
        }
        binder.meta.currentLength--;
      }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
      let clone, context, rewrites;
      while (binder.meta.currentLength < binder.meta.targetLength) {
        const keyValue = binder.meta.keys[binder.meta.currentLength] ?? binder.meta.currentLength;
        const indexValue = binder.meta.currentLength++;
        rewrites = [
          ...binder.rewrites,
          [binder.meta.variable, `${binder.meta.reference}.${keyValue}`]
        ];
        context = new Proxy(binder.context, {
          has: (target, key2) => key2 === binder.meta.variable || key2 === binder.meta.keyName || key2 === binder.meta.indexName || Reflect.has(target, key2),
          get: (target, key2, receiver) => key2 === binder.meta.keyName ? keyValue : key2 === binder.meta.indexName ? indexValue : key2 === binder.meta.variable ? Reflect.get(binder.meta.data, keyValue) : Reflect.get(target, key2, receiver),
          set: (target, key2, value, receiver) => key2 === binder.meta.keyName ? true : key2 === binder.meta.indexName ? true : key2 === binder.meta.variable ? Reflect.set(binder.meta.data, keyValue, value) : Reflect.set(target, key2, value, receiver)
        });
        clone = binder.meta.templateElement.content.cloneNode(true);
        binder.container.register(clone, context, rewrites);
        binder.meta.queueElement.content.appendChild(clone);
      }
    }
    if (binder.meta.currentLength === binder.meta.targetLength) {
      await binder.container.render();
      binder.owner.appendChild(binder.meta.queueElement.content);
      if (!binder.meta.rerendered) {
        binder.meta.rerendered = true;
        binder.container.register(binder.owner, binder.context, binder.rewrites);
        binder.container.render();
      }
    }
  }
};

// tmp/element/on.js
var Value = function(element) {
  if (!element)
    return void 0;
  if ("$value" in element)
    return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
  if (element.type === "number" || element.type === "range")
    return element.valueAsNumber;
  return element.value;
};
var submit = async function(event, binder) {
  event.preventDefault();
  const form = {};
  const target = event.target?.form || event.target;
  const elements = target?.querySelectorAll("[name]");
  for (const element of elements) {
    const { type, name, checked } = element;
    if (!name)
      continue;
    if (type === "radio" && !checked)
      continue;
    if (type === "submit" || type === "button")
      continue;
    let value;
    if (type === "select-multiple") {
      value = [];
      for (const option of element.selectedOptions) {
        value.push(Value(option));
      }
    } else if (type === "select-one") {
      const [option] = element.selectedOptions;
      value = Value(option);
    } else {
      value = Value(element);
    }
    let data = form;
    const parts = name.split(/\s*\.\s*/);
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const next = parts[index + 1];
      if (next) {
        if (!data[part]) {
          data[part] = /[0-9]+/.test(next) ? [] : {};
        }
        data = data[part];
      } else {
        data[part] = value;
      }
    }
  }
  binder.instance.event = event;
  binder.instance.$event = event;
  binder.instance.$form = form;
  await binder.compute();
  if (target.hasAttribute("reset")) {
    for (const element of elements) {
      const { type, name } = element;
      if (!name)
        continue;
      else if (type === "submit" || type === "button")
        continue;
      else if (type === "select-one")
        element.selectedIndex = 0;
      else if (type === "select-multiple")
        element.selectedIndex = -1;
      else if (type === "radio" || type === "checkbox")
        element.checked = false;
      else
        element.value = "";
      element.dispatchEvent(new Event("input"));
    }
  }
  return false;
};
var reset = async function(event, binder) {
  event.preventDefault();
  const target = event.target?.form || event.target;
  const elements = target?.querySelectorAll("[name]");
  for (const element of elements) {
    const { type, name } = element;
    if (!name)
      continue;
    else if (type === "submit" || type === "button")
      continue;
    else if (type === "select-one")
      element.selectedIndex = 0;
    else if (type === "select-multiple")
      element.selectedIndex = -1;
    else if (type === "radio" || type === "checkbox")
      element.checked = false;
    else
      element.value = "";
    element.dispatchEvent(new Event("input"));
  }
  binder.instance.event = event;
  binder.instance.$event = event;
  await binder.compute();
  return false;
};
var on_default = {
  setup(binder) {
    binder.owner[binder.name] = void 0;
    binder.meta.name = binder.name.slice(2);
  },
  render(binder) {
    if (binder.meta.method) {
      binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
    }
    binder.meta.method = (event) => {
      if (binder.meta.name === "reset") {
        return reset(event, binder);
      } else if (binder.meta.name === "submit") {
        return submit(event, binder);
      } else {
        binder.instance.event = event;
        binder.instance.$event = event;
        return binder.compute();
      }
    };
    binder.owner.addEventListener(binder.meta.name, binder.meta.method);
  },
  reset(binder) {
    if (binder.meta.method) {
      binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
    }
  }
};

// tmp/element/binder.js
var referencePattern = /(\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\b)/g;
var stringPattern = /".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`/;
var assignmentPattern = /\(.*?([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*)\)/;
var ignorePattern = new RegExp(`
(\\b\\$context|\\$instance|\\$assign|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
event|this|window|document|console|location|navigation|
globalThis|Infinity|NaN|undefined|
isFinite|isNaN|parseFloat|parseInt|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|
Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|AggregateError|
Object|Function|Boolean|Symbole|Array|
Number|Math|Date|BigInt|
String|RegExp|
Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|
Int32Array|Uint32Array|BigInt64Array|BigUint64Array|Float32Array|Float64Array|
Map|Set|WeakMap|WeakSet|
ArrayBuffer|SharedArrayBuffer|DataView|Atomics|JSON|
Promise|GeneratorFunction|AsyncGeneratorFunction|Generator|AsyncGenerator|AsyncFunction|
Reflect|Proxy|
true|false|null|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
(([.][a-zA-Z0-9$_.? ]*)?\\b)
`.replace(/\t|\n/g, ""), "g");
var Cache = /* @__PURE__ */ new Map();
function Binder(node, container, context, rewrites) {
  const value = node.nodeValue ?? "";
  const name = node.nodeType === Node.ATTRIBUTE_NODE ? node.name : node.nodeType === Node.TEXT_NODE ? "text" : node.nodeName;
  node.nodeValue = "";
  let handler2;
  if (name === "text")
    handler2 = text_default;
  else if (name === "html")
    handler2 = html_default;
  else if (name === "each")
    handler2 = each_default;
  else if (name === "value")
    handler2 = value_default;
  else if (name === "inherit")
    handler2 = inherit_default;
  else if (name === "checked")
    handler2 = checked_default;
  else if (name.startsWith("on"))
    handler2 = on_default;
  else
    handler2 = standard_default;
  const binder = {
    name,
    value,
    node,
    handler: handler2,
    context,
    container,
    setup: handler2.setup,
    reset: handler2.reset,
    render: handler2.render,
    references: /* @__PURE__ */ new Set(),
    meta: {},
    instance: {},
    rewrites: rewrites ? [...rewrites] : [],
    owner: node.ownerElement ?? node
  };
  binder.setup?.(binder);
  let cache = Cache.get(binder.value);
  if (!cache) {
    const code = ("'" + value.replace(/\s*{{/g, "'+(").replace(/}}\s*/g, ")+'") + "'").replace(/^''\+|\+''$/g, "");
    const clean = code.replace(stringPattern, "");
    const assignment = clean.match(assignmentPattern);
    const references = clean.replace(ignorePattern, "").match(referencePattern) ?? [];
    const isValue = name === "value";
    const isChecked = name === "checked";
    const compute = new Function("$context", "$instance", `
        try {
            with ($context) {
                with ($instance) {
                    ${assignment && isValue ? `$value = $assign ? $value : ${assignment?.[1]};` : ""}
                    ${assignment && isChecked ? `$checked = $assign ? $checked : ${assignment?.[1]};` : ""}
                    return ${assignment ? `$assign ? ${code} : ${assignment?.[3]}` : code};
                }
            }
        } catch (error){
            console.error(error);
        }
        `);
    cache = { compute, references };
    Cache.set(value, cache);
  }
  for (let reference of cache.references) {
    if (rewrites) {
      for (const [name2, value2] of rewrites) {
        reference = reference === name2 ? value2 : reference.startsWith(name2 + ".") ? value2 + reference.slice(name2.length) : reference;
      }
    }
    binder.references.add(reference);
  }
  binder.compute = cache.compute.bind(binder.owner ?? binder.node, binder.context, binder.instance);
  return binder;
}

// tmp/element/poly.js
async function Poly() {
  if ("shadowRoot" in HTMLTemplateElement.prototype === false) {
    (function attachShadowRoots(root) {
      const templates = root.querySelectorAll("template[shadowroot]");
      for (const template of templates) {
        const mode = template.getAttribute("shadowroot") || "closed";
        const shadowRoot = template.parentNode.attachShadow({ mode });
        shadowRoot.appendChild(template.content);
        template.remove();
        attachShadowRoots(shadowRoot);
      }
    })(document);
  }
  if ("navigation" in window === false) {
    window.navigation = new (await import("https://cdn.skypack.dev/@virtualstate/navigation")).Navigation();
  }
}

// tmp/element/element.js
var XElement = class extends HTMLElement {
  constructor() {
    super();
    this.#renders = [];
    this.#resets = [];
    this.#reseting = false;
    this.#rendering = false;
    this.#syntaxEnd = "}}";
    this.#syntaxStart = "{{";
    this.#syntaxLength = 2;
    this.#prepared = false;
    this.#preparing = false;
    this.#syntaxMatch = new RegExp("{{.*?}}");
    this.#binders = /* @__PURE__ */ new Map();
    this.#mutator = new MutationObserver(this.#mutation.bind(this));
    this.#context = new Proxy({}, {
      get: ContextGet.bind(null, this.#change.bind(this), ""),
      set: ContextSet.bind(null, this.#change.bind(this), ""),
      deleteProperty: ContextDelete.bind(null, this.#change.bind(this), "")
    });
    this.#adoptedEvent = new Event("adopted");
    this.#adoptingEvent = new Event("adopting");
    this.#preparedEvent = new Event("prepared");
    this.#preparingEvent = new Event("preparing");
    this.#connectedEvent = new Event("connected");
    this.#connectingEvent = new Event("connecting");
    this.#attributedEvent = new Event("attributed");
    this.#attributingEvent = new Event("attributing");
    this.#disconnectedEvent = new Event("disconnected");
    this.#disconnectingEvent = new Event("disconnecting");
    if (!this.shadowRoot)
      this.attachShadow({ mode: "open" });
    this.#mutator.observe(this, { childList: true });
    this.#mutator.observe(this.shadowRoot, { childList: true });
  }
  static {
    this.poly = Poly;
  }
  static {
    this.navigation = navigation;
  }
  static define(name, constructor) {
    constructor = constructor ?? this;
    name = name ?? dash(this.name);
    customElements.define(name, constructor);
  }
  static defined(name) {
    name = name ?? dash(this.name);
    return customElements.whenDefined(name);
  }
  get isPrepared() {
    return this.#prepared;
  }
  #renders;
  #resets;
  #reseting;
  #rendering;
  #syntaxEnd;
  #syntaxStart;
  #syntaxLength;
  #prepared;
  #preparing;
  #syntaxMatch;
  #binders;
  #mutator;
  #context;
  #adoptedEvent;
  #adoptingEvent;
  #preparedEvent;
  #preparingEvent;
  #connectedEvent;
  #connectingEvent;
  #attributedEvent;
  #attributingEvent;
  #disconnectedEvent;
  #disconnectingEvent;
  prepare() {
    if (this.#prepared || this.#preparing)
      return;
    this.#preparing = true;
    this.dispatchEvent(this.#preparingEvent);
    const prototype = Object.getPrototypeOf(this);
    const properties = this.constructor.observedProperties;
    const descriptors = { ...Object.getOwnPropertyDescriptors(this), ...Object.getOwnPropertyDescriptors(prototype) };
    for (const property in descriptors) {
      if (properties && !properties?.includes(property) || "attributeChangedCallback" === property || "disconnectedCallback" === property || "connectedCallback" === property || "adoptedCallback" === property || "constructor" === property || "prepare" === property || "register" === property || "release" === property)
        continue;
      const descriptor = descriptors[property];
      if (!descriptor.configurable)
        continue;
      if (descriptor.set)
        descriptor.set = descriptor.set?.bind(this);
      if (descriptor.get)
        descriptor.get = descriptor.get?.bind(this);
      if (typeof descriptor.value === "function")
        descriptor.value = descriptor.value.bind(this);
      Object.defineProperty(this.#context, property, descriptor);
      Object.defineProperty(this, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configureable,
        get: () => this.#context[property],
        set: (value) => this.#context[property] = value
      });
    }
    this.register(this.shadowRoot, this.#context);
    this.register(this, this.#context);
    this.render();
    this.#prepared = true;
    this.dispatchEvent(this.#preparedEvent);
  }
  async reset() {
    console.log("element reset start");
    if (this.#reseting)
      return;
    else
      this.#reseting = true;
    await Promise.all(this.#resets.splice(0).map(async (binder) => binder.reset(binder)));
    this.#reseting = false;
    if (this.#resets.length)
      await this.reset();
    console.log("element reset end");
  }
  async render() {
    console.log("element render start");
    if (this.#rendering)
      return;
    else
      this.#rendering = true;
    await Promise.all(this.#renders.splice(0).map(async (binder) => binder.render(binder)));
    this.#rendering = false;
    if (this.#renders.length)
      await this.render();
    console.log("element render end");
  }
  #change(reference, type) {
    const tasks = type == "render" ? this.#renders : this.#resets;
    const start = `${reference}.`;
    let key, binders;
    for ([key, binders] of this.#binders) {
      if (key == reference) {
        if (binders) {
          let binder;
          for (binder of binders) {
            tasks.unshift(binder);
          }
        }
      } else if (key?.startsWith?.(start)) {
        if (binders) {
          let binder;
          for (binder of binders) {
            tasks.push(binder);
          }
        }
      }
    }
    if (type == "render")
      this.render();
    else if (type == "reset")
      this.reset();
  }
  #mutation(mutations) {
    console.log("mutation", mutations);
    if (!this.#prepared)
      return this.prepare();
  }
  #remove(node) {
    const binders = this.#binders.get(node);
    if (!binders)
      return;
    let binder, reference;
    for (binder of binders) {
      for (reference of binder.references) {
        if (this.#binders.has(reference)) {
          this.#binders.get(reference)?.delete(binder);
          if (!this.#binders.get(reference)?.size)
            this.#binders.delete(reference);
        }
      }
    }
    this.#binders.delete(node);
  }
  #add(node, context, rewrites) {
    const binder = Binder(node, this, context, rewrites);
    let reference, binders;
    for (reference of binder.references) {
      binders = this.#binders.get(reference);
      if (binders) {
        binders.add(binder);
      } else {
        this.#binders.set(reference, /* @__PURE__ */ new Set([binder]));
      }
    }
    const nodes = this.#binders.get(binder.owner ?? binder.node);
    if (nodes) {
      nodes.add(binder);
    } else {
      this.#binders.set(binder.owner ?? binder.node, /* @__PURE__ */ new Set([binder]));
    }
    this.#renders.push(binder);
  }
  release(node) {
    if (node.nodeType == Node.TEXT_NODE) {
      this.#remove(node);
    } else if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
      let child = node.firstChild;
      while (child) {
        this.release(child);
        child = child.nextSibling;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      this.#remove(node);
      let attribute;
      for (attribute of node.attributes) {
        this.#remove(attribute);
      }
      let child = node.firstChild;
      while (child) {
        this.release(child);
        child = child.nextSibling;
      }
    }
  }
  async register(node, context, rewrites) {
    if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
      let child = node.firstChild;
      while (child) {
        this.register(child, context, rewrites);
        child = child.nextSibling;
      }
    } else if (node.nodeType == node.TEXT_NODE) {
      const start = node.nodeValue?.indexOf(this.#syntaxStart) ?? -1;
      if (start === -1)
        return;
      if (start !== 0)
        node = node.splitText(start);
      const end = node.nodeValue?.indexOf(this.#syntaxEnd) ?? -1;
      if (end === -1)
        return;
      if (end + this.#syntaxLength !== node.nodeValue?.length) {
        this.register(node.splitText(end + this.#syntaxLength), context, rewrites);
      }
      this.#add(node, context, rewrites);
    } else if (node.nodeType == node.ELEMENT_NODE) {
      let attribute;
      attribute = node.attributes.getNamedItem("each");
      if (attribute && this.#syntaxMatch.test(attribute.value)) {
        return this.#add(attribute, context, rewrites);
      }
      for (attribute of node.attributes) {
        if (this.#syntaxMatch.test(attribute.value)) {
          this.#add(attribute, context, rewrites);
        }
      }
      let child = node.firstChild;
      while (child) {
        this.register(child, context, rewrites);
        child = child.nextSibling;
      }
    }
  }
  adoptedCallback() {
    this.dispatchEvent(this.#adoptingEvent);
    this.adopted?.();
    this.dispatchEvent(this.#adoptedEvent);
  }
  connectedCallback() {
    this.dispatchEvent(this.#connectingEvent);
    this.connected?.();
    this.dispatchEvent(this.#connectedEvent);
  }
  disconnectedCallback() {
    this.dispatchEvent(this.#disconnectingEvent);
    this.disconnected?.();
    this.dispatchEvent(this.#disconnectedEvent);
  }
  attributeChangedCallback(name, from, to) {
    this.dispatchEvent(this.#attributingEvent);
    this.attributed?.(name, from, to);
    this.dispatchEvent(this.#attributedEvent);
  }
};
export {
  XElement as default
};
