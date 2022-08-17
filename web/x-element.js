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
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/element/tick.ts
var promise = Promise.resolve();
function tick(method) {
  return promise.then(method);
}

// src/element/data.ts
var dataHas = function(target, key) {
  return Reflect.has(target, key);
};
var dataGet = function(event, reference, target, key, receiver) {
  if (typeof key === "symbol")
    return Reflect.get(target, key, receiver);
  const value = Reflect.get(target, key, receiver);
  if (value && typeof value === "object") {
    reference = reference ? `${reference}.${key}` : `${key}`;
    return new Proxy(value, {
      get: dataGet.bind(null, event, reference),
      set: dataSet.bind(null, event, reference),
      deleteProperty: dataDelete.bind(null, event, reference)
    });
  }
  return value;
};
var dataDelete = function(event, reference, target, key) {
  if (typeof key === "symbol")
    return Reflect.deleteProperty(target, key);
  Reflect.deleteProperty(target, key);
  tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, "reset"));
  return true;
};
var dataSet = function(event, reference, target, key, to, receiver) {
  if (typeof key === "symbol")
    return Reflect.set(target, key, receiver);
  const from = Reflect.get(target, key, receiver);
  if (key === "length") {
    tick(event.bind(null, reference, "render"));
    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, "render"));
    return Reflect.set(target, key, to, receiver);
  } else if (from === to || isNaN(from) && to === isNaN(to)) {
    return Reflect.set(target, key, to, receiver);
  }
  Reflect.set(target, key, to, receiver);
  tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, "render"));
  return true;
};
var dataEvent = function(data, reference, type) {
  for (const [key, binders] of data) {
    if (typeof key === "string" && (key === reference || key.startsWith(`${reference}.`))) {
      if (binders) {
        for (const binder of binders) {
          binder[type]();
        }
      }
    }
  }
};

// src/element/dash.ts
function dash(data) {
  return data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2").toLowerCase();
}

// src/element/navigation.ts
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
  if (event && (!event?.canTransition || !event?.canIntercept))
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
  if (options.instance === options.target.lastElementChild)
    return event?.intercept?.();
  return event ? event?.intercept?.({ handler: () => transition(options) }) : transition(options);
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

// src/element/poly.ts
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

// src/element/binder.ts
var referenceMatch = new RegExp([
  "(\".*?[^\\\\]*\"|'.*?[^\\\\]*'|`.*?[^\\\\]*`)",
  "((?:^|}}).*?{{)",
  "(}}.*?(?:{{|$))",
  `(
        (?:\\$context|\\$instance|\\$assign|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|event|
        this|window|document|console|location|
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
        true|false|null|undefined|NaN|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
        yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
        (?:(?:[.][a-zA-Z0-9$_.? ]*)?\\b)
    )`,
  "(\\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\\b)"
].join("|").replace(/\s|\t|\n/g, ""), "g");
var splitPattern = /\s*{{\s*|\s*}}\s*/;
var bracketPattern = /({{)|(}})/;
var stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
var assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
var codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, "g");
var Binder = class {
  constructor(node, container, context, rewrites) {
    __publicField(this, "type");
    __publicField(this, "name");
    __publicField(this, "value");
    __publicField(this, "context");
    __publicField(this, "rewrites");
    __publicField(this, "code");
    __publicField(this, "owner");
    __publicField(this, "node");
    __publicField(this, "container");
    __publicField(this, "references", /* @__PURE__ */ new Set());
    __publicField(this, "compute");
    __publicField(this, "meta", {});
    __publicField(this, "instance", {});
    __publicField(this, "release");
    __publicField(this, "register");
    this.node = node;
    this.context = context;
    this.container = container;
    this.value = node.nodeValue ?? "";
    this.rewrites = rewrites ? [...rewrites] : [];
    this.name = node.nodeName.startsWith("#") ? node.nodeName.slice(1) : node.nodeName;
    this.owner = node.ownerElement ?? void 0;
    this.release = this.container.release.bind(this.container);
    this.register = this.container.register.bind(this.container);
    this.type = this.name.startsWith("on") ? "on" : this.constructor.handlers.includes(this.name) ? this.name : "standard";
    this.node.nodeValue = "";
    if (!this.constructor.referenceCache.has(this.value)) {
      this.constructor.referenceCache.set(this.value, /* @__PURE__ */ new Set());
    }
    const referenceCache = this.constructor.referenceCache.get(this.value);
    if (referenceCache.size) {
      if (rewrites) {
        for (const reference of referenceCache) {
          for (const [name, value] of rewrites) {
            if (reference === name) {
              this.references.add(value);
            } else if (reference.startsWith(name + ".")) {
              this.references.add(value + reference.slice(name.length));
            } else {
              this.references.add(reference);
            }
          }
        }
      } else {
        this.references = referenceCache;
      }
    } else {
      const data = this.value;
      let match = referenceMatch.exec(data);
      while (match) {
        const reference = match[5];
        if (reference) {
          referenceCache.add(reference);
          if (rewrites) {
            for (const [name, value] of rewrites) {
              if (reference === name) {
                this.references.add(value);
              } else if (reference.startsWith(name + ".")) {
                this.references.add(value + reference.slice(name.length));
              } else {
                this.references.add(reference);
              }
            }
          } else {
            this.references.add(reference);
          }
        }
        match = referenceMatch.exec(data);
      }
    }
    const compute = this.constructor.computeCache.get(this.value);
    if (compute) {
      this.compute = compute.bind(this.owner ?? this.node, this.context, this.instance);
    } else {
      let reference = "";
      let assignment = "";
      this.code = this.value;
      const isValue = this.name === "value";
      const isChecked = this.name === "checked";
      const convert = this.code.split(splitPattern).filter((part) => part).length > 1;
      this.code = this.code.replace(codePattern, (_match, str, assignee, assigneeLeft, r, assigneeMiddle, assigneeRight, bracketLeft, bracketRight) => {
        if (str)
          return str;
        if (bracketLeft)
          return convert ? `' + (` : "(";
        if (bracketRight)
          return convert ? `) + '` : ")";
        if (assignee) {
          if (isValue || isChecked) {
            reference = r;
            assignment = assigneeLeft + assigneeRight;
          }
          return (convert ? `' + (` : "(") + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ")");
        }
        console.warn("possible compute issue");
        return "";
      }) ?? "";
      this.code = convert ? `'${this.code}'` : this.code;
      this.code = (reference && isValue ? `$value = $assign ? $value : ${reference};
` : "") + (reference && isChecked ? `$checked = $assign ? $checked : ${reference};
` : "") + `return ${assignment ? `$assign ? ${this.code} : ${assignment}` : `${this.code}`};`;
      this.code = `
            try {
                with ($context) {
                    with ($instance) {
                        ${this.code}
                    }
                }
            } catch (error){
                console.error(error);
            }
            `;
      const compute2 = new Function("$context", "$instance", this.code);
      this.constructor.computeCache.set(this.value, compute2);
      this.compute = compute2.bind(this.owner ?? this.node, this.context, this.instance);
    }
  }
};
__publicField(Binder, "handlers", [
  "on",
  "text",
  "html",
  "each",
  "value",
  "checked",
  "inherit",
  "standard"
]);
__publicField(Binder, "referenceCache", /* @__PURE__ */ new Map());
__publicField(Binder, "computeCache", /* @__PURE__ */ new Map());

// src/element/format.ts
function format(data) {
  return data === void 0 ? "" : typeof data === "object" ? JSON.stringify(data) : data;
}

// src/element/boolean.ts
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

// src/element/standard.ts
var Standard = class extends Binder {
  render() {
    const boolean = boolean_default.includes(this.name);
    const node = this.node;
    node.value = "";
    if (boolean) {
      const data = this.compute() ? true : false;
      if (data)
        this.owner?.setAttributeNode(node);
      else
        this.owner?.removeAttribute(this.name);
    } else {
      const data = format(this.compute());
      this.owner[this.name] = data;
      this.owner?.setAttribute(this.name, data);
    }
  }
  reset() {
    const boolean = boolean_default.includes(this.name);
    if (boolean) {
      this.owner?.removeAttribute(this.name);
    } else {
      this.owner[this.name] = void 0;
      this.owner?.setAttribute(this.name, "");
    }
  }
};

// src/element/checked.ts
var _handler, handler_fn;
var _Checked = class extends Binder {
  constructor() {
    super(...arguments);
    __privateAdd(this, _handler);
  }
  render() {
    if (!this.meta.setup) {
      this.meta.setup = true;
      this.node.nodeValue = "";
      if (this.owner.type === "radio") {
        this.owner?.addEventListener("xRadioInputHandler", (event) => __privateMethod(this, _handler, handler_fn).call(this, event));
        this.owner?.addEventListener("input", (event) => {
          const parent = this.owner.form || this.owner?.getRootNode();
          const radios = parent.querySelectorAll(`[type="radio"][name="${this.owner.name}"]`);
          __privateMethod(this, _handler, handler_fn).call(this, event);
          for (const radio of radios) {
            if (radio === event.target)
              continue;
            radio.checked = false;
            radio.dispatchEvent(_Checked.xRadioInputHandlerEvent);
          }
        });
      } else {
        this.owner?.addEventListener("input", (event) => __privateMethod(this, _handler, handler_fn).call(this, event));
      }
    }
    __privateMethod(this, _handler, handler_fn).call(this);
  }
  reset() {
    this.owner?.removeAttribute("checked");
  }
};
var Checked = _Checked;
_handler = new WeakSet();
handler_fn = function(event) {
  const owner = this.owner;
  const checked = owner.checked;
  this.instance.event = event;
  this.instance.$event = event;
  this.instance.$assign = !!event;
  this.instance.$checked = checked;
  const computed = this.compute();
  if (computed) {
    owner.setAttributeNode(this.node);
  } else {
    owner.removeAttribute("checked");
  }
};
__publicField(Checked, "xRadioInputHandlerEvent", new CustomEvent("xRadioInputHandler"));

// src/element/inherit.ts
var Inherit = class extends Binder {
  render() {
    const owner = this.owner;
    const node = this.node;
    if (!this.meta.setup) {
      this.meta.setup = true;
      node.value = "";
    }
    if (!owner.inherited) {
      return console.warn(`inherited not implemented ${owner.localName}`);
    }
    const inherited = this.compute();
    owner.inherited?.(inherited);
  }
  reset() {
    const owner = this.owner;
    if (!owner.inherited) {
      return console.warn(`inherited not implemented ${owner.localName}`);
    }
    owner.inherited?.();
  }
};

// src/element/date.ts
var date_default = ["date", "datetime-local", "month", "time", "week"];

// src/element/value.ts
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
var Value = class extends Binder {
  render() {
    const { meta } = this;
    const { type } = this.owner;
    if (!meta.setup) {
      meta.setup = true;
      this.owner?.addEventListener("input", (event) => input(this, event));
    }
    this.instance.$assign = false;
    this.instance.$event = void 0;
    this.instance.$value = void 0;
    this.instance.$checked = void 0;
    const computed = this.compute();
    let display;
    if (type === "select-one") {
      const owner = this.owner;
      owner.value = "";
      Array.prototype.find.call(owner.options, (o) => "$value" in o ? o.$value : o.value === computed);
      if (computed === void 0 && owner.options.length && !owner.selectedOptions.length) {
        owner.options[0].selected = true;
        return owner.dispatchEvent(defaultInputEvent);
      }
      display = format(computed);
      owner.value = display;
    } else if (type === "select-multiple") {
      const owner = this.owner;
      Array.prototype.forEach.call(owner.options, (o) => o.selected = computed?.includes("$value" in o ? o.$value : o.value));
      display = format(computed);
    } else if (type === "number" || type === "range" || date_default.includes(type)) {
      const owner = this.owner;
      if (typeof computed === "string")
        owner.value = computed;
      else if (typeof computed === "number" && !isNaN(computed))
        owner.valueAsNumber = computed;
      else
        owner.value = "";
      display = owner.value;
    } else {
      const owner = this.owner;
      display = format(computed);
      owner.value = display;
    }
    this.owner.$value = computed;
    this.owner?.setAttribute("value", display);
  }
  reset() {
    const { type } = this.owner;
    if (type === "select-one" || type === "select-multiple") {
      const owner = this.owner;
      Array.prototype.forEach.call(owner.options, (option) => option.selected = false);
    }
    this.owner.value = "";
    this.owner.$value = void 0;
    this.owner?.setAttribute("value", "");
  }
};

// src/element/each.ts
var whitespace = /\s+/;
var Each = class extends Binder {
  reset() {
    const owner = this.node.ownerElement;
    this.meta.targetLength = 0;
    this.meta.currentLength = 0;
    while (owner && owner.lastChild)
      this.release(owner.removeChild(owner.lastChild));
    while (this.meta.queueElement.content.lastChild)
      this.meta.queueElement.content.removeChild(this.meta.queueElement.content.lastChild);
  }
  render() {
    const [data, variable, key, index] = this.compute();
    const [reference] = this.references;
    const owner = this.node.ownerElement;
    this.meta.data = data;
    this.meta.keyName = key;
    this.meta.indexName = index;
    this.meta.variable = variable;
    this.meta.reference = reference;
    if (!this.meta.setup) {
      this.node.nodeValue = "";
      this.meta.keys = [];
      this.meta.setup = true;
      this.meta.targetLength = 0;
      this.meta.currentLength = 0;
      this.meta.templateLength = 0;
      this.meta.queueElement = document.createElement("template");
      this.meta.templateElement = document.createElement("template");
      let node = owner.firstChild;
      while (node) {
        if (node.nodeType === Node.TEXT_NODE && whitespace.test(node.nodeValue)) {
          owner.removeChild(node);
        } else {
          this.meta.templateLength++;
          this.meta.templateElement.content.appendChild(node);
        }
        node = owner.firstChild;
      }
    }
    if (data?.constructor === Array) {
      this.meta.targetLength = data.length;
    } else {
      this.meta.keys = Object.keys(data || {});
      this.meta.targetLength = this.meta.keys.length;
    }
    if (this.meta.currentLength > this.meta.targetLength) {
      while (this.meta.currentLength > this.meta.targetLength) {
        let count = this.meta.templateLength, node;
        while (count--) {
          node = owner.lastChild;
          if (node) {
            owner.removeChild(node);
            this.release(node);
          }
        }
        this.meta.currentLength--;
      }
    } else if (this.meta.currentLength < this.meta.targetLength) {
      while (this.meta.currentLength < this.meta.targetLength) {
        const keyValue = this.meta.keys[this.meta.currentLength] ?? this.meta.currentLength;
        const indexValue = this.meta.currentLength++;
        const rewrites = [
          ...this.rewrites,
          [this.meta.variable, `${this.meta.reference}.${keyValue}`]
        ];
        const context = new Proxy(this.context, {
          has: (target, key2) => key2 === this.meta.variable || key2 === this.meta.keyName || key2 === this.meta.indexName || Reflect.has(target, key2),
          get: (target, key2, receiver) => key2 === this.meta.keyName ? keyValue : key2 === this.meta.indexName ? indexValue : key2 === this.meta.variable ? Reflect.get(this.meta.data, keyValue) : Reflect.get(target, key2, receiver),
          set: (target, key2, value, receiver) => key2 === this.meta.keyName ? true : key2 === this.meta.indexName ? true : key2 === this.meta.variable ? Reflect.set(this.meta.data, keyValue, value) : Reflect.set(target, key2, value, receiver)
        });
        let node = this.meta.templateElement.content.firstChild;
        while (node) {
          this.register(
            this.meta.queueElement.content.appendChild(node.cloneNode(true)),
            context,
            rewrites
          );
          node = node.nextSibling;
        }
      }
    }
    if (this.meta.currentLength === this.meta.targetLength) {
      owner.appendChild(this.meta.queueElement.content);
    }
  }
};

// src/element/html.ts
var Html = class extends Binder {
  render() {
    if (!this.meta.setup) {
      this.meta.setup = true;
      this.node.nodeValue = "";
    }
    let data = this.compute();
    if (typeof data !== "string") {
      data = "";
      console.warn("html binder requires a string");
    }
    let removeChild = this.owner?.lastChild;
    while (removeChild) {
      this.owner?.removeChild(removeChild);
      this.release(removeChild);
      removeChild = this.owner?.lastChild;
    }
    const template = document.createElement("template");
    template.innerHTML = data;
    let addChild = template.content.firstChild;
    while (addChild) {
      this.register(addChild, this.context);
      addChild = addChild.nextSibling;
    }
    this.owner?.appendChild(template.content);
  }
  reset() {
    let node = this.owner?.lastChild;
    while (node) {
      this.release(node);
      this.owner?.removeChild(node);
      node = this.owner?.lastChild;
    }
  }
};

// src/element/text.ts
var Text = class extends Binder {
  render() {
    const data = this.compute();
    this.node.nodeValue = format(data);
  }
  reset() {
    this.node.nodeValue = "";
  }
};

// src/element/on.ts
var Value2 = function(element) {
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
        value.push(Value2(option));
      }
    } else if (type === "select-one") {
      const [option] = element.selectedOptions;
      value = Value2(option);
    } else {
      value = Value2(element);
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
var On = class extends Binder {
  render() {
    this.owner[this.name] = void 0;
    const name = this.name.slice(2);
    if (this.meta.method) {
      this.owner?.removeEventListener(name, this.meta.method);
    }
    this.meta.method = (event) => {
      if (name === "reset") {
        return reset(event, this);
      } else if (name === "submit") {
        return submit(event, this);
      } else {
        this.instance.event = event;
        this.instance.$event = event;
        return this.compute();
      }
    };
    this.owner?.addEventListener(name, this.meta.method);
  }
  reset() {
    this.owner[this.name] = null;
    const name = this.name.slice(2);
    if (this.meta.method) {
      this.owner?.removeEventListener(name, this.meta.method);
    }
  }
};

// src/element/element.ts
var _syntaxEnd, _syntaxStart, _syntaxLength, _prepared, _preparing, _syntaxMatch, _binders, _mutator, _context, _adoptedEvent, _adoptingEvent, _preparedEvent, _preparingEvent, _connectedEvent, _connectingEvent, _attributedEvent, _attributingEvent, _disconnectedEvent, _disconnectingEvent, _mutation, mutation_fn, _remove, remove_fn, _add, add_fn;
var XElement = class extends HTMLElement {
  constructor() {
    super();
    __privateAdd(this, _mutation);
    __privateAdd(this, _remove);
    __privateAdd(this, _add);
    __privateAdd(this, _syntaxEnd, "}}");
    __privateAdd(this, _syntaxStart, "{{");
    __privateAdd(this, _syntaxLength, 2);
    __privateAdd(this, _prepared, false);
    __privateAdd(this, _preparing, false);
    __privateAdd(this, _syntaxMatch, new RegExp("{{.*?}}"));
    __privateAdd(this, _binders, /* @__PURE__ */ new Map());
    __privateAdd(this, _mutator, new MutationObserver(__privateMethod(this, _mutation, mutation_fn).bind(this)));
    __privateAdd(this, _context, new Proxy({}, {
      has: dataHas.bind(null),
      get: dataGet.bind(null, dataEvent.bind(null, __privateGet(this, _binders)), ""),
      set: dataSet.bind(null, dataEvent.bind(null, __privateGet(this, _binders)), ""),
      deleteProperty: dataDelete.bind(null, dataEvent.bind(null, __privateGet(this, _binders)), "")
    }));
    __privateAdd(this, _adoptedEvent, new Event("adopted"));
    __privateAdd(this, _adoptingEvent, new Event("adopting"));
    __privateAdd(this, _preparedEvent, new Event("prepared"));
    __privateAdd(this, _preparingEvent, new Event("preparing"));
    __privateAdd(this, _connectedEvent, new Event("connected"));
    __privateAdd(this, _connectingEvent, new Event("connecting"));
    __privateAdd(this, _attributedEvent, new Event("attributed"));
    __privateAdd(this, _attributingEvent, new Event("attributing"));
    __privateAdd(this, _disconnectedEvent, new Event("disconnected"));
    __privateAdd(this, _disconnectingEvent, new Event("disconnecting"));
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
  prepare() {
    if (__privateGet(this, _prepared) || __privateGet(this, _preparing))
      return;
    __privateSet(this, _preparing, true);
    this.dispatchEvent(__privateGet(this, _preparingEvent));
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
      Object.defineProperty(__privateGet(this, _context), property, descriptor);
      Object.defineProperty(this, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configureable,
        get: () => __privateGet(this, _context)[property],
        set: (value) => __privateGet(this, _context)[property] = value
      });
    }
    let shadowNode = this.shadowRoot?.firstChild;
    while (shadowNode) {
      const node = shadowNode;
      shadowNode = node.nextSibling;
      this.register(node, __privateGet(this, _context));
    }
    let innerNode = this.firstChild;
    while (innerNode) {
      const node = innerNode;
      innerNode = node.nextSibling;
      this.register(node, __privateGet(this, _context));
    }
    __privateSet(this, _prepared, true);
    this.dispatchEvent(__privateGet(this, _preparedEvent));
  }
  release(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      __privateMethod(this, _remove, remove_fn).call(this, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      __privateMethod(this, _remove, remove_fn).call(this, node);
      const attributes = node.attributes;
      for (const attribute of attributes) {
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
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      let child = node.firstChild, register;
      while (child) {
        register = child;
        child = node.nextSibling;
        this.register(register, context, rewrites);
      }
    } else if (node.nodeType === node.TEXT_NODE) {
      const start = node.nodeValue?.indexOf(__privateGet(this, _syntaxStart)) ?? -1;
      if (start === -1)
        return;
      if (start !== 0)
        node = node.splitText(start);
      const end = node.nodeValue?.indexOf(__privateGet(this, _syntaxEnd)) ?? -1;
      if (end === -1)
        return;
      if (end + __privateGet(this, _syntaxLength) !== node.nodeValue?.length) {
        this.register(
          node.splitText(end + __privateGet(this, _syntaxLength)),
          context,
          rewrites
        );
        __privateMethod(this, _add, add_fn).call(this, node, context, rewrites);
      } else {
        __privateMethod(this, _add, add_fn).call(this, node, context, rewrites);
      }
    } else if (node.nodeType === node.ELEMENT_NODE) {
      const inherit = node.attributes.getNamedItem("inherit");
      if (inherit)
        __privateMethod(this, _add, add_fn).call(this, inherit, context, rewrites);
      const each = node.attributes.getNamedItem("each");
      if (each)
        __privateMethod(this, _add, add_fn).call(this, each, context, rewrites);
      if (!each && !inherit) {
        let child = node.firstChild, register;
        while (child) {
          register = child;
          child = child.nextSibling;
          this.register(register, context, rewrites);
        }
      }
      const attributes = [...node.attributes];
      for (const attribute of attributes) {
        if (attribute.name !== "each" && attribute.name !== "inherit" && __privateGet(this, _syntaxMatch).test(attribute.value)) {
          __privateMethod(this, _add, add_fn).call(this, attribute, context, rewrites);
        }
      }
    }
  }
  adoptedCallback() {
    this.dispatchEvent(__privateGet(this, _adoptingEvent));
    this.adopted?.();
    this.dispatchEvent(__privateGet(this, _adoptedEvent));
  }
  connectedCallback() {
    this.dispatchEvent(__privateGet(this, _connectingEvent));
    this.connected?.();
    this.dispatchEvent(__privateGet(this, _connectedEvent));
  }
  disconnectedCallback() {
    this.dispatchEvent(__privateGet(this, _disconnectingEvent));
    this.disconnected?.();
    this.dispatchEvent(__privateGet(this, _disconnectedEvent));
  }
  attributeChangedCallback(name, from, to) {
    this.dispatchEvent(__privateGet(this, _attributingEvent));
    this.attributed?.(name, from, to);
    this.dispatchEvent(__privateGet(this, _attributedEvent));
  }
};
_syntaxEnd = new WeakMap();
_syntaxStart = new WeakMap();
_syntaxLength = new WeakMap();
_prepared = new WeakMap();
_preparing = new WeakMap();
_syntaxMatch = new WeakMap();
_binders = new WeakMap();
_mutator = new WeakMap();
_context = new WeakMap();
_adoptedEvent = new WeakMap();
_adoptingEvent = new WeakMap();
_preparedEvent = new WeakMap();
_preparingEvent = new WeakMap();
_connectedEvent = new WeakMap();
_connectingEvent = new WeakMap();
_attributedEvent = new WeakMap();
_attributingEvent = new WeakMap();
_disconnectedEvent = new WeakMap();
_disconnectingEvent = new WeakMap();
_mutation = new WeakSet();
mutation_fn = function(mutations) {
  if (!__privateGet(this, _prepared))
    return this.prepare();
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      this.register(node, __privateGet(this, _context));
    }
    for (const node of mutation.removedNodes) {
      this.release(node);
    }
  }
};
_remove = new WeakSet();
remove_fn = function(node) {
  const binders = __privateGet(this, _binders).get(node);
  if (!binders)
    return;
  for (const binder of binders) {
    for (const reference of binder.references) {
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
  const name = node.nodeType === Node.ATTRIBUTE_NODE ? node.name : node.nodeName;
  let binder;
  if (name === "#text")
    binder = new Text(node, this, context, rewrites);
  else if (name === "html")
    binder = new Html(node, this, context, rewrites);
  else if (name === "each")
    binder = new Each(node, this, context, rewrites);
  else if (name === "value")
    binder = new Value(node, this, context, rewrites);
  else if (name === "inherit")
    binder = new Inherit(node, this, context, rewrites);
  else if (name === "checked")
    binder = new Checked(node, this, context, rewrites);
  else if (name.startsWith("on"))
    binder = new On(node, this, context, rewrites);
  else
    binder = new Standard(node, this, context, rewrites);
  for (let reference of binder.references) {
    if (__privateGet(this, _binders).has(reference)) {
      __privateGet(this, _binders).get(reference)?.add(binder);
    } else {
      __privateGet(this, _binders).set(reference, /* @__PURE__ */ new Set([binder]));
    }
  }
  if (__privateGet(this, _binders).has(binder.owner ?? binder.node)) {
    __privateGet(this, _binders).get(binder.owner ?? binder.node)?.add(binder);
  } else {
    __privateGet(this, _binders).set(binder.owner ?? binder.node, /* @__PURE__ */ new Set([binder]));
  }
  binder.render();
};
__publicField(XElement, "poly", Poly);
__publicField(XElement, "navigation", navigation);
__publicField(XElement, "observedProperties");
export {
  XElement as default
};
