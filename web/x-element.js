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

// src/tick.ts
var promise = Promise.resolve();
function tick(method) {
  return promise.then(method);
}

// src/context.ts
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
  tick(async () => event(reference ? `${reference}.${key}` : `${key}`, "reset"));
  return true;
};
var ContextSet = function(event, reference, target, key, to, receiver) {
  if (typeof key === "symbol")
    return Reflect.set(target, key, receiver);
  const from = Reflect.get(target, key, receiver);
  if (key === "length") {
    tick(async () => event(reference, "render"));
    tick(async () => event(reference ? `${reference}.${key}` : `${key}`, "render"));
    return Reflect.set(target, key, to, receiver);
  } else if (from === to || isNaN(from) && to === isNaN(to)) {
    return Reflect.set(target, key, to, receiver);
  }
  Reflect.set(target, key, to, receiver);
  tick(async () => event(reference ? `${reference}.${key}` : `${key}`, "render"));
  return true;
};

// src/dash.ts
function dash(data) {
  return data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2").toLowerCase();
}

// src/navigation.ts
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

// src/boolean.ts
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

// src/standard.ts
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
      let data = binder.compute();
      data = typeof data == "string" ? data : typeof data == "undefined" ? "" : typeof data == "object" ? JSON.stringify(data) : data;
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

// src/checked.ts
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

// src/inherit.ts
var inherit_default = {
  setup(binder) {
    binder.node.value = "";
    binder.meta.rerendered = false;
  },
  render(binder) {
    if (!binder.owner.inherited) {
      return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
    }
    const inherited = binder.compute();
    binder.owner.inherited?.(inherited);
    if (!binder.meta.rerendered) {
      binder.meta.rerendered = true;
      binder.container.register(binder.owner, binder.context, binder.rewrites);
    }
  },
  reset(binder) {
    if (!binder.owner.inherited) {
      return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
    }
    binder.owner.inherited?.();
  }
};

// src/date.ts
var date_default = [
  "date",
  "datetime-local",
  "month",
  "time",
  "week"
];

// src/value.ts
var defaultInputEvent = new Event("input");
var parseable = function(value) {
  return !isNaN(value) && value !== void 0 && typeof value !== "string";
};
var input = function(binder, event) {
  binder.instance.$event = event;
  binder.instance.$assign = true;
  if (binder.owner.type === "select-one") {
    const [option] = binder.owner.selectedOptions;
    binder.instance.$value = option ? "$value" in option ? option.$value : option.value : void 0;
    binder.owner.$value = binder.compute();
  } else if (binder.owner.type === "select-multiple") {
    binder.instance.$value = Array.prototype.map.call(binder.owner.selectedOptions, (o) => "$value" in o ? o.$value : o.value);
    binder.owner.$value = binder.compute();
  } else if (binder.owner.type === "number" || binder.owner.type === "range" || date_default.includes(binder.owner.type)) {
    binder.instance.$value = "$value" in binder.owner && typeof binder.owner.$value === "number" ? binder.owner.valueAsNumber : binder.owner.value;
    binder.owner.$value = binder.compute();
  } else if (binder.owner.nodeName == "OPTION") {
    throw "option event";
  } else {
    binder.instance.$value = "$value" in binder.owner && parseable(binder.owner.$value) ? JSON.parse(binder.owner.value) : binder.owner.value;
    binder.instance.$checked = "$value" in binder.owner && parseable(binder.owner.$value) ? JSON.parse(binder.owner.checked) : binder.owner.checked;
    binder.owner.$value = binder.compute();
  }
};
var value_default = {
  setup(binder) {
    binder.owner.value = "";
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
      for (const option of binder.owner.options) {
        option.selected = "$value" in option ? option.$value === computed : option.value === computed;
      }
      if (computed === void 0 && binder.owner.options.length && !binder.owner.selectedOptions.length) {
        binder.owner.options[0].selected = true;
        return binder.owner.dispatchEvent(defaultInputEvent);
      }
      display = typeof computed == "string" ? computed : typeof computed == "undefined" ? "" : typeof computed == "object" ? JSON.stringify(computed) : computed;
      binder.owner.value = display;
    } else if (binder.meta.type === "select-multiple") {
      for (const option of binder.owner.options) {
        option.selected = computed?.includes("$value" in option ? option.$value : option.value);
      }
      display = typeof computed == "string" ? computed : typeof computed == "undefined" ? "" : typeof computed == "object" ? JSON.stringify(computed) : computed;
    } else if (binder.meta.type === "number" || binder.meta.type === "range" || date_default.includes(binder.meta.type)) {
      if (typeof computed === "string")
        binder.owner.value = computed;
      else if (typeof computed === "number" && !isNaN(computed))
        binder.owner.valueAsNumber = computed;
      else
        binder.owner.value = "";
      display = binder.owner.value;
    } else {
      if (binder.owner.nodeName == "OPTION") {
        if ("$value" in binder.owner.parentElement || "$value" in binder.owner.parentElement.parentElement) {
          if (binder.owner.parentElement.$value === computed || binder.owner.parentElement.parentElement.$value === computed) {
            binder.owner.selected = true;
          }
        } else {
          if (binder.owner.parentElement.value === computed || binder.owner.parentElement.parentElement.value === computed) {
            binder.owner.selected = true;
          }
        }
      }
      display = typeof computed == "string" ? computed : typeof computed == "undefined" ? "" : typeof computed == "object" ? JSON.stringify(computed) : computed;
      binder.owner.value = display;
    }
    binder.owner.$value = computed;
    binder.owner.setAttribute("value", display);
  },
  reset(binder) {
    if (binder.meta.type === "select-one" || binder.meta.type === "select-multiple") {
      for (const option of binder.owner.options) {
        option.selected = false;
      }
    }
    binder.owner.value = "";
    binder.owner.$value = void 0;
    binder.owner.setAttribute("value", "");
  }
};

// src/text.ts
var text_default = {
  render(binder) {
    const data = binder.compute();
    binder.node.nodeValue = typeof data == "string" ? data : typeof data == "undefined" ? "" : typeof data == "object" ? JSON.stringify(data) : data;
  },
  reset(binder) {
    binder.node.nodeValue = "";
  }
};

// src/html.ts
var html_default = {
  render(binder) {
    let data = binder.compute();
    let fragment, node;
    if (typeof data == "string") {
      const template = document.createElement("template");
      template.innerHTML = data;
      fragment = template.content;
    } else if (data instanceof HTMLTemplateElement) {
      fragment = data.content.cloneNode(true);
    } else {
      return console.error(`XElement - Html Binder ${binder.name} ${binder.value} requires a string or Template`);
    }
    node = binder.owner.lastChild;
    while (node) {
      binder.owner.removeChild(node);
      binder.container.release(node);
      node = binder.owner.lastChild;
    }
    node = fragment.firstChild;
    while (node) {
      binder.container.register(node, binder.context);
      node = node.nextSibling;
    }
    binder.owner.appendChild(fragment);
  },
  reset(binder) {
    let node = binder.owner.lastChild;
    while (node) {
      binder.owner.removeChild(node);
      binder.container.release(node);
      node = binder.owner.lastChild;
    }
  }
};

// src/each.ts
var whitespace = /\s+/;
var each_default = {
  setup(binder) {
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
  reset(binder) {
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
    } else if (data?.constructor === Object) {
      binder.meta.keys = Object.keys(data || {});
      binder.meta.targetLength = binder.meta.keys.length;
    } else {
      return console.error(`XElement - Each Binder ${binder.name} ${binder.value} requires Array or Object`);
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
        const keyValue = binder.meta.keys?.[binder.meta.currentLength] ?? binder.meta.currentLength;
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
        let node = binder.meta.templateElement.content.firstChild;
        while (node) {
          clone = node.cloneNode(true);
          binder.container.register(clone, context, rewrites);
          binder.meta.queueElement.content.appendChild(clone);
          node = node.nextSibling;
        }
      }
    }
    if (binder.meta.currentLength === binder.meta.targetLength) {
      binder.owner.appendChild(binder.meta.queueElement.content);
    }
  }
};

// src/on.ts
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

// src/binder.ts
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

// src/poly.ts
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

// src/element.ts
var _prepared, _preparing, _updates, _binders, _mutator, _context, _change, change_fn, _mutation, mutation_fn, _remove, remove_fn, _add, add_fn;
var _XElement = class extends HTMLElement {
  constructor() {
    super();
    __privateAdd(this, _change);
    __privateAdd(this, _mutation);
    __privateAdd(this, _remove);
    __privateAdd(this, _add);
    __privateAdd(this, _prepared, false);
    __privateAdd(this, _preparing, false);
    __privateAdd(this, _updates, /* @__PURE__ */ new Set());
    __privateAdd(this, _binders, /* @__PURE__ */ new Map());
    __privateAdd(this, _mutator, new MutationObserver(__privateMethod(this, _mutation, mutation_fn).bind(this)));
    __privateAdd(this, _context, new Proxy({}, {
      get: ContextGet.bind(null, __privateMethod(this, _change, change_fn).bind(this), ""),
      set: ContextSet.bind(null, __privateMethod(this, _change, change_fn).bind(this), ""),
      deleteProperty: ContextDelete.bind(null, __privateMethod(this, _change, change_fn).bind(this), "")
    }));
    if (!this.shadowRoot)
      this.attachShadow({ mode: "open" });
    __privateGet(this, _mutator).observe(this, { childList: true });
    __privateGet(this, _mutator).observe(this.shadowRoot, { childList: true });
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
    return __privateGet(this, _prepared);
  }
  async update() {
    const tasks = [];
    const updates = __privateGet(this, _updates).values();
    let result = updates.next();
    while (!result.done) {
      __privateGet(this, _updates).delete(result.value);
      tasks.push(async function(binder) {
        return binder[binder.mode](binder);
      }(result.value));
      result = updates.next();
    }
    await Promise.all(tasks);
  }
  async prepare() {
    if (__privateGet(this, _prepared) || __privateGet(this, _preparing))
      return;
    __privateSet(this, _preparing, true);
    this.dispatchEvent(_XElement.preparingEvent);
    const prototype = Object.getPrototypeOf(this);
    const properties = this.constructor.observedProperties;
    const descriptors = { ...Object.getOwnPropertyDescriptors(this), ...Object.getOwnPropertyDescriptors(prototype) };
    for (const property in descriptors) {
      if (properties && !properties?.includes(property) || "attributeChangedCallback" === property || "disconnectedCallback" === property || "connectedCallback" === property || "adoptedCallback" === property || "constructor" === property || property.startsWith("#"))
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
      Object.defineProperty(__privateGet(this, _context), property, descriptor);
      Object.defineProperty(this, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configureable,
        get: () => __privateGet(this, _context)[property],
        set: (value) => __privateGet(this, _context)[property] = value
      });
    }
    this.register(this.shadowRoot, __privateGet(this, _context));
    this.register(this, __privateGet(this, _context));
    await this.update();
    __privateSet(this, _prepared, true);
    this.dispatchEvent(_XElement.preparedEvent);
  }
  release(node) {
    if (node.nodeType == Node.TEXT_NODE) {
      __privateMethod(this, _remove, remove_fn).call(this, node);
    } else if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
      let child = node.firstChild;
      while (child) {
        this.release(child);
        child = child.nextSibling;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      __privateMethod(this, _remove, remove_fn).call(this, node);
      let attribute;
      for (attribute of node.attributes) {
        __privateMethod(this, _remove, remove_fn).call(this, attribute);
      }
      let child = node.firstChild;
      while (child) {
        this.release(child);
        child = child.nextSibling;
      }
    }
  }
  register(node, context, rewrites) {
    if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
      let child = node.firstChild;
      while (child) {
        this.register(child, context, rewrites);
        child = child.nextSibling;
      }
    } else if (node.nodeType == node.TEXT_NODE) {
      const start = node.nodeValue?.indexOf(_XElement.syntaxStart) ?? -1;
      if (start == -1)
        return;
      if (start != 0)
        node = node.splitText(start);
      const end = node.nodeValue?.indexOf(_XElement.syntaxEnd) ?? -1;
      if (end == -1)
        return;
      if (end + _XElement.syntaxLength != node.nodeValue?.length) {
        this.register(node.splitText(end + _XElement.syntaxLength), context, rewrites);
      }
      __privateMethod(this, _add, add_fn).call(this, node, context, rewrites);
    } else if (node.nodeType == node.ELEMENT_NODE) {
      let attribute, inherit, each;
      each = node.attributes.each;
      inherit = node.attributes.inherit;
      for (attribute of node.attributes) {
        if (_XElement.syntaxMatch.test(attribute.value)) {
          __privateMethod(this, _add, add_fn).call(this, attribute, context, rewrites);
        }
      }
      if (each || inherit)
        return;
      let child = node.firstChild;
      while (child) {
        this.register(child, context, rewrites);
        child = child.nextSibling;
      }
    }
  }
  adoptedCallback() {
    this.dispatchEvent(_XElement.adoptingEvent);
    this.adopted?.();
    this.dispatchEvent(_XElement.adoptedEvent);
  }
  connectedCallback() {
    this.dispatchEvent(_XElement.connectingEvent);
    this.connected?.();
    this.dispatchEvent(_XElement.connectedEvent);
  }
  disconnectedCallback() {
    this.dispatchEvent(_XElement.disconnectingEvent);
    this.disconnected?.();
    this.dispatchEvent(_XElement.disconnectedEvent);
  }
  attributeChangedCallback(name, from, to) {
    this.dispatchEvent(_XElement.attributingEvent);
    this.attributed?.(name, from, to);
    this.dispatchEvent(_XElement.attributedEvent);
  }
};
var XElement = _XElement;
_prepared = new WeakMap();
_preparing = new WeakMap();
_updates = new WeakMap();
_binders = new WeakMap();
_mutator = new WeakMap();
_context = new WeakMap();
_change = new WeakSet();
change_fn = async function(reference, type) {
  let key, binder, binders;
  for ([key, binders] of __privateGet(this, _binders)) {
    if (binders && key == reference) {
      for (binder of binders) {
        binder.mode = type;
        __privateGet(this, _updates).add(binder);
      }
    }
  }
  await this.update();
  reference = `${reference}.`;
  for ([key, binders] of __privateGet(this, _binders)) {
    if (binders && key?.startsWith?.(reference)) {
      for (binder of binders) {
        binder.mode = type;
        __privateGet(this, _updates).add(binder);
      }
    }
  }
  await this.update();
};
_mutation = new WeakSet();
mutation_fn = function(mutations) {
  if (!__privateGet(this, _prepared))
    return this.prepare();
  let mutation, node;
  for (mutation of mutations) {
    for (node of mutation.addedNodes) {
      this.register(node, __privateGet(this, _context));
    }
    for (node of mutation.removedNodes) {
      this.release(node);
    }
  }
  this.update();
};
_remove = new WeakSet();
remove_fn = function(node) {
  const binders = __privateGet(this, _binders).get(node);
  if (!binders)
    return;
  let binder, reference;
  for (binder of binders) {
    for (reference of binder.references) {
      if (__privateGet(this, _binders).has(reference)) {
        __privateGet(this, _binders).get(reference)?.delete(binder);
        if (!__privateGet(this, _binders).get(reference)?.size)
          __privateGet(this, _binders).delete(reference);
      }
    }
  }
  __privateGet(this, _binders).delete(node);
};
_add = new WeakSet();
add_fn = function(node, context, rewrites) {
  const binder = Binder(node, this, context, rewrites);
  let binders, reference;
  for (reference of binder.references) {
    binders = __privateGet(this, _binders).get(reference);
    if (binders) {
      binders.add(binder);
    } else {
      __privateGet(this, _binders).set(reference, /* @__PURE__ */ new Set([binder]));
    }
  }
  const nodes = __privateGet(this, _binders).get(binder.owner ?? binder.node);
  if (nodes) {
    nodes.add(binder);
  } else {
    __privateGet(this, _binders).set(binder.owner ?? binder.node, /* @__PURE__ */ new Set([binder]));
  }
  binder.mode = "render";
  __privateGet(this, _updates).add(binder);
};
XElement.poly = Poly;
XElement.navigation = navigation;
XElement.syntaxLength = 2;
XElement.syntaxEnd = "}}";
XElement.syntaxStart = "{{";
XElement.syntaxMatch = new RegExp("{{.*?}}");
XElement.adoptedEvent = new Event("adopted");
XElement.adoptingEvent = new Event("adopting");
XElement.preparedEvent = new Event("prepared");
XElement.preparingEvent = new Event("preparing");
XElement.connectedEvent = new Event("connected");
XElement.connectingEvent = new Event("connecting");
XElement.attributedEvent = new Event("attributed");
XElement.attributingEvent = new Event("attributing");
XElement.disconnectedEvent = new Event("disconnected");
XElement.disconnectingEvent = new Event("disconnecting");
export {
  XElement as default
};
