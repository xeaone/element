// Name: X Element
// Version: 7.2.1
// License: MPL-2.0
// Author: Alexander Elias
// Email: alex.steven.elias@gmail.com
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const promise = Promise.resolve();
function tick(method) {
    return promise.then(method);
}
const dataHas = function(target, key) {
    if (typeof key === 'string' && key.startsWith('$')) return false;
    return Reflect.has(target, key);
};
const dataGet = function(event, reference, target, key, receiver) {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    if (!reference && key.startsWith('$')) return undefined;
    const value = Reflect.get(target, key, receiver);
    if (value && typeof value === 'object') {
        reference = reference ? `${reference}.${key}` : `${key}`;
        return new Proxy(value, {
            get: dataGet.bind(null, event, reference),
            set: dataSet.bind(null, event, reference),
            deleteProperty: dataDelete.bind(null, event, reference)
        });
    }
    return value;
};
const dataDelete = function(event, reference, target, key) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);
    if (!reference && key.startsWith('$')) return true;
    Reflect.deleteProperty(target, key);
    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'reset'));
    return true;
};
const dataSet = function(event, reference, target, key, to, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, receiver);
    if (!reference && key.startsWith('$')) return true;
    const from = Reflect.get(target, key, receiver);
    if (key === 'length') {
        tick(event.bind(null, reference, 'render'));
        tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return Reflect.set(target, key, to, receiver);
    } else if (from === to || isNaN(from) && to === isNaN(to)) {
        return Reflect.set(target, key, to, receiver);
    }
    Reflect.set(target, key, to, receiver);
    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
    return true;
};
const dataEvent = function(data, reference, type) {
    for (const [key, binders] of data){
        if (typeof key === 'string' && (key === reference || key.startsWith(`${reference}.`))) {
            if (binders) {
                for (const binder of binders){
                    binder[type]();
                }
            }
        }
    }
};
const referenceMatch = new RegExp([
    '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)',
    '((?:^|}}).*?{{)',
    '(}}.*?(?:{{|$))',
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
    '(\\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\\b)'
].join('|').replace(/\s|\t|\n/g, ''), 'g');
const splitPattern = /\s*{{\s*|\s*}}\s*/;
const bracketPattern = /({{)|(}})/;
const stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
const codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, 'g');
class Binder {
    static handlers = [
        'on',
        'text',
        'html',
        'each',
        'value',
        'checked',
        'inherit',
        'standard'
    ];
    static referenceCache = new Map();
    static computeCache = new Map();
    type;
    name;
    value;
    rewrites;
    context;
    instance;
    code;
    owner;
    node;
    container;
    references = new Set();
    compute;
    meta;
    register;
    release;
    constructor(node, container, context, instance, rewrites){
        this.meta = {};
        this.node = node;
        this.context = context;
        this.container = container;
        this.value = node.nodeValue ?? '';
        this.rewrites = rewrites ? [
            ...rewrites
        ] : [];
        this.instance = instance ? {
            ...instance
        } : {};
        this.name = node.nodeName.startsWith('#') ? node.nodeName.slice(1) : node.nodeName;
        this.owner = node.ownerElement ?? undefined;
        this.register = this.container.register.bind(this.container);
        this.release = this.container.release.bind(this.container);
        this.type = this.name.startsWith('on') ? 'on' : this.constructor.handlers.includes(this.name) ? this.name : 'standard';
        this.node.nodeValue = '';
        const referenceCache = this.constructor.referenceCache.get(this.value);
        if (referenceCache) {
            this.references = referenceCache;
        } else {
            const data = this.value;
            const references = new Set();
            let match = referenceMatch.exec(data);
            while(match){
                const reference = match[5];
                if (reference) references.add(reference);
                match = referenceMatch.exec(data);
            }
            if (references.size) {
                this.constructor.referenceCache.set(this.value, references);
                this.references = new Set(references);
            }
        }
        const compute = this.constructor.computeCache.get(this.value);
        if (compute) {
            this.compute = compute.bind(this.owner ?? this.node, this.context, this.instance);
        } else {
            let reference1 = '';
            let assignment = '';
            this.code = this.value;
            const isValue = this.name === 'value';
            const isChecked = this.name === 'checked';
            const convert = this.code.split(splitPattern).filter((part)=>part).length > 1;
            this.code = this.code.replace(codePattern, (_match, str, assignee, assigneeLeft, r, assigneeMiddle, assigneeRight, bracketLeft, bracketRight)=>{
                if (str) return str;
                if (bracketLeft) return convert ? `' + (` : '(';
                if (bracketRight) return convert ? `) + '` : ')';
                if (assignee) {
                    if (isValue || isChecked) {
                        reference1 = r;
                        assignment = assigneeLeft + assigneeRight;
                    }
                    return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
                }
                console.warn('possible compute issue');
                return '';
            }) ?? '';
            this.code = convert ? `'${this.code}'` : this.code;
            this.code = (reference1 && isValue ? `$value = $assign ? $value : ${reference1};\n` : '') + (reference1 && isChecked ? `$checked = $assign ? $checked : ${reference1};\n` : '') + `return ${assignment ? `$assign ? ${this.code} : ${assignment}` : `${this.code}`};`;
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
            const compute1 = new Function('$context', '$instance', this.code);
            this.constructor.computeCache.set(this.value, compute1);
            this.compute = compute1.bind(this.owner ?? this.node, this.context, this.instance);
        }
    }
}
function format(data) {
    return data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;
}
const __default = [
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'compact',
    'controls',
    'declare',
    'default',
    'defaultchecked',
    'defaultmuted',
    'defaultselected',
    'defer',
    'disabled',
    'draggable',
    'enabled',
    'formnovalidate',
    'indeterminate',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nohref',
    'noresize',
    'noshade',
    'hidden',
    'novalidate',
    'nowrap',
    'open',
    'pauseonexit',
    'readonly',
    'required',
    'reversed',
    'scoped',
    'seamless',
    'selected',
    'sortable',
    'spellcheck',
    'translate',
    'truespeed',
    'typemustmatch',
    'visible'
];
class Standard extends Binder {
    render() {
        const __boolean = __default.includes(this.name);
        const node = this.node;
        node.value = '';
        if (__boolean) {
            const data = this.compute() ? true : false;
            if (data) this.owner?.setAttributeNode(node);
            else this.owner?.removeAttribute(this.name);
        } else {
            const data1 = format(this.compute());
            this.owner[this.name] = data1;
            this.owner?.setAttribute(this.name, data1);
        }
    }
    reset() {
        const __boolean = __default.includes(this.name);
        if (__boolean) {
            this.owner?.removeAttribute(this.name);
        } else {
            this.owner[this.name] = undefined;
            this.owner?.setAttribute(this.name, '');
        }
    }
}
class Checked extends Binder {
    static xRadioInputHandlerEvent = new CustomEvent('xRadioInputHandler');
    render() {
        if (!this.meta.setup) {
            this.meta.setup = true;
            this.node.nodeValue = '';
            if (this.owner.type === 'radio') {
                this.owner?.addEventListener('xRadioInputHandler', (event)=>this.#handler(event));
                this.owner?.addEventListener('input', (event)=>{
                    const parent = this.owner.form || this.owner?.getRootNode();
                    const radios = parent.querySelectorAll(`[type="radio"][name="${this.owner.name}"]`);
                    this.#handler(event);
                    for (const radio of radios){
                        if (radio === event.target) continue;
                        radio.checked = false;
                        radio.dispatchEvent(Checked.xRadioInputHandlerEvent);
                    }
                });
            } else {
                this.owner?.addEventListener('input', (event)=>this.#handler(event));
            }
        }
        this.#handler();
    }
    reset() {
        this.owner?.removeAttribute('checked');
    }
     #handler(event) {
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
            owner.removeAttribute('checked');
        }
    }
}
class inherit extends Binder {
    render() {
        const owner = this.owner;
        const node = this.node;
        if (!this.meta.setup) {
            this.meta.setup = true;
            node.value = '';
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
}
const __default1 = [
    'date',
    'datetime-local',
    'month',
    'time',
    'week'
];
const defaultInputEvent = new Event('input');
const parseable = function(value) {
    return !isNaN(value) && value !== undefined && typeof value !== 'string';
};
const input = function(binder, event) {
    const { owner  } = binder;
    const { type  } = owner;
    binder.instance.$event = event;
    binder.instance.$assign = true;
    if (type === 'select-one') {
        const [option] = owner.selectedOptions;
        binder.instance.$value = option ? '$value' in option ? option.$value : option.value : undefined;
        owner.$value = binder.compute();
    } else if (type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(owner.selectedOptions, (o)=>'$value' in o ? o.$value : o.value);
        owner.$value = binder.compute();
    } else if (type === 'number' || type === 'range' || __default1.includes(type)) {
        binder.instance.$value = '$value' in owner && typeof owner.$value === 'number' ? owner.valueAsNumber : owner.value;
        owner.$value = binder.compute();
    } else {
        binder.instance.$value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
        binder.instance.$checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
        owner.$value = binder.compute();
    }
};
class Value extends Binder {
    render() {
        const { meta  } = this;
        const { type  } = this.owner;
        if (!meta.setup) {
            meta.setup = true;
            this.owner?.addEventListener('input', (event)=>input(this, event));
        }
        this.instance.$assign = false;
        this.instance.$event = undefined;
        this.instance.$value = undefined;
        this.instance.$checked = undefined;
        const computed = this.compute();
        let display;
        if (type === 'select-one') {
            const owner = this.owner;
            owner.value = '';
            Array.prototype.find.call(owner.options, (o)=>'$value' in o ? o.$value : o.value === computed);
            if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
                owner.options[0].selected = true;
                return owner.dispatchEvent(defaultInputEvent);
            }
            display = format(computed);
            owner.value = display;
        } else if (type === 'select-multiple') {
            const owner1 = this.owner;
            Array.prototype.forEach.call(owner1.options, (o)=>o.selected = computed?.includes('$value' in o ? o.$value : o.value));
            display = format(computed);
        } else if (type === 'number' || type === 'range' || __default1.includes(type)) {
            const owner2 = this.owner;
            if (typeof computed === 'string') owner2.value = computed;
            else if (typeof computed === 'number' && !isNaN(computed)) owner2.valueAsNumber = computed;
            else owner2.value = '';
            display = owner2.value;
        } else {
            const owner3 = this.owner;
            display = format(computed);
            owner3.value = display;
        }
        this.owner.$value = computed;
        this.owner?.setAttribute('value', display);
    }
    reset() {
        const { type  } = this.owner;
        if (type === 'select-one' || type === 'select-multiple') {
            const owner = this.owner;
            Array.prototype.forEach.call(owner.options, (option)=>option.selected = false);
        }
        this.owner.value = '';
        this.owner.$value = undefined;
        this.owner?.setAttribute('value', '');
    }
}
const whitespace = /\s+/;
class Each extends Binder {
    reset() {
        const owner = this.node.ownerElement;
        this.meta.targetLength = 0;
        this.meta.currentLength = 0;
        while(owner && owner.lastChild)this.release(owner.removeChild(owner.lastChild));
        while(this.meta.queueElement.content.lastChild)this.meta.queueElement.content.removeChild(this.meta.queueElement.content.lastChild);
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
            this.node.nodeValue = '';
            this.meta.keys = [];
            this.meta.setup = true;
            this.meta.targetLength = 0;
            this.meta.currentLength = 0;
            this.meta.templateLength = 0;
            this.meta.queueElement = document.createElement('template');
            this.meta.templateElement = document.createElement('template');
            let node = owner.firstChild;
            while(node){
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
            while(this.meta.currentLength > this.meta.targetLength){
                let count = this.meta.templateLength, node1;
                while(count--){
                    node1 = owner.lastChild;
                    if (node1) {
                        owner.removeChild(node1);
                        this.release(node1);
                    }
                }
                this.meta.currentLength--;
            }
        } else if (this.meta.currentLength < this.meta.targetLength) {
            while(this.meta.currentLength < this.meta.targetLength){
                const clone = this.meta.templateElement.content.cloneNode(true);
                const keyValue = this.meta.keys[this.meta.currentLength] ?? this.meta.currentLength;
                const indexValue = this.meta.currentLength++;
                const rewrites = [
                    ...this.rewrites,
                    [
                        this.meta.variable,
                        `${this.meta.reference}.${keyValue}`
                    ]
                ];
                const instance = {
                    ...this.instance,
                    [this.meta.keyName]: keyValue,
                    [this.meta.indexName]: indexValue,
                    get [this.meta.variable] () {
                        return data[keyValue];
                    }
                };
                let node2 = clone.firstChild, child;
                while(node2){
                    child = node2;
                    node2 = node2.nextSibling;
                    this.register(child, this.context, instance, rewrites);
                }
                this.meta.queueElement.content.appendChild(clone);
            }
        }
        if (this.meta.currentLength === this.meta.targetLength) {
            owner.appendChild(this.meta.queueElement.content);
        }
    }
}
class Html extends Binder {
    render() {
        if (!this.meta.setup) {
            this.meta.setup = true;
            this.node.nodeValue = '';
        }
        let data = this.compute();
        if (typeof data !== 'string') {
            data = '';
            console.warn('html binder requires a string');
        }
        let removeChild = this.owner?.lastChild;
        while(removeChild){
            this.owner?.removeChild(removeChild);
            this.release(removeChild);
            removeChild = this.owner?.lastChild;
        }
        const template = document.createElement('template');
        template.innerHTML = data;
        let addChild = template.content.firstChild;
        while(addChild){
            this.register(addChild, this.context);
            addChild = addChild.nextSibling;
        }
        this.owner?.appendChild(template.content);
    }
    reset() {
        let node = this.owner?.lastChild;
        while(node){
            this.release(node);
            this.owner?.removeChild(node);
            node = this.owner?.lastChild;
        }
    }
}
class Text extends Binder {
    render() {
        const data = this.compute();
        this.node.nodeValue = format(data);
    }
    reset() {
        this.node.nodeValue = '';
    }
}
const Value1 = function(element) {
    if (!element) return undefined;
    if ('$value' in element) return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
    if (element.type === 'number' || element.type === 'range') return element.valueAsNumber;
    return element.value;
};
const submit = async function(event, binder) {
    event.preventDefault();
    const form = {};
    const target = event.target?.form || event.target;
    const elements = target?.querySelectorAll('[name]');
    for (const element of elements){
        const { type , name , checked  } = element;
        if (!name) continue;
        if (type === 'radio' && !checked) continue;
        if (type === 'submit' || type === 'button') continue;
        let value;
        if (type === 'select-multiple') {
            value = [];
            for (const option of element.selectedOptions){
                value.push(Value1(option));
            }
        } else if (type === 'select-one') {
            const [option1] = element.selectedOptions;
            value = Value1(option1);
        } else {
            value = Value1(element);
        }
        let data = form;
        const parts = name.split(/\s*\.\s*/);
        for(let index = 0; index < parts.length; index++){
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
    if (target.hasAttribute('reset')) {
        for (const element1 of elements){
            const { type: type1 , name: name1  } = element1;
            if (!name1) continue;
            else if (type1 === 'submit' || type1 === 'button') continue;
            else if (type1 === 'select-one') element1.selectedIndex = 0;
            else if (type1 === 'select-multiple') element1.selectedIndex = -1;
            else if (type1 === 'radio' || type1 === 'checkbox') element1.checked = false;
            else element1.value = '';
            element1.dispatchEvent(new Event('input'));
        }
    }
    return false;
};
const reset = async function(event, binder) {
    event.preventDefault();
    const target = event.target?.form || event.target;
    const elements = target?.querySelectorAll('[name]');
    for (const element of elements){
        const { type , name  } = element;
        if (!name) continue;
        else if (type === 'submit' || type === 'button') continue;
        else if (type === 'select-one') element.selectedIndex = 0;
        else if (type === 'select-multiple') element.selectedIndex = -1;
        else if (type === 'radio' || type === 'checkbox') element.checked = false;
        else element.value = '';
        element.dispatchEvent(new Event('input'));
    }
    binder.instance.event = event;
    binder.instance.$event = event;
    await binder.compute();
    return false;
};
class On extends Binder {
    render() {
        this.owner[this.name] = undefined;
        const name = this.name.slice(2);
        if (this.meta.method) {
            this.owner?.removeEventListener(name, this.meta.method);
        }
        this.meta.method = (event)=>{
            if (name === 'reset') {
                return reset(event, this);
            } else if (name === 'submit') {
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
}
function dash(data) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
}
if ('shadowRoot' in HTMLTemplateElement.prototype === false) {
    (function attachShadowRoots(root) {
        const templates = root.querySelectorAll('template[shadowroot]');
        for (const template of templates){
            const mode = template.getAttribute('shadowroot') || 'closed';
            const shadowRoot = template.parentNode.attachShadow({
                mode
            });
            shadowRoot.appendChild(template.content);
            template.remove();
            attachShadowRoots(shadowRoot);
        }
    })(document);
}
class XElement extends HTMLElement {
    static define(name, constructor) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }
    static defined(name) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }
    static observedProperties = [];
    get isPrepared() {
        return this.#prepared;
    }
    #data = {};
    #syntaxEnd = '}}';
    #syntaxStart = '{{';
    #syntaxLength = 2;
    #syntaxMatch = new RegExp('{{.*?}}');
    #prepared = false;
    #preparing = false;
    #binders = new Map();
    #mutator = new MutationObserver(this.#mutation.bind(this));
    #adoptedEvent = new Event('adopted');
    #adoptingEvent = new Event('adopting');
    #preparedEvent = new Event('prepared');
    #preparingEvent = new Event('preparing');
    #connectedEvent = new Event('connected');
    #connectingEvent = new Event('connecting');
    #attributedEvent = new Event('attributed');
    #attributingEvent = new Event('attributing');
    #disconnectedEvent = new Event('disconnected');
    #disconnectingEvent = new Event('disconnecting');
    constructor(){
        super();
        if (!this.shadowRoot) this.attachShadow({
            mode: 'open'
        });
        this.#mutator.observe(this, {
            childList: true
        });
        this.#mutator.observe(this.shadowRoot, {
            childList: true
        });
    }
    prepare() {
        if (this.#prepared || this.#preparing) return;
        this.#preparing = true;
        this.dispatchEvent(this.#preparingEvent);
        const data = {};
        const properties = this.constructor.observedProperties;
        for (const property of properties){
            const descriptor = (Object.getOwnPropertyDescriptor(this, property) ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), property)) ?? {};
            if ('set' in descriptor) descriptor.set = descriptor.set?.bind(this);
            if ('get' in descriptor) descriptor.get = descriptor.get?.bind(this);
            if (typeof descriptor.value === 'function') descriptor.value = descriptor.value?.bind?.(this);
            Object.defineProperty(data, property, descriptor);
            Object.defineProperty(this, property, {
                get: ()=>this.#data[property],
                set: (value)=>this.#data[property] = value
            });
        }
        this.#data = new Proxy(data, {
            has: dataHas.bind(null),
            get: dataGet.bind(null, dataEvent.bind(null, this.#binders), ''),
            set: dataSet.bind(null, dataEvent.bind(null, this.#binders), ''),
            deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.#binders), '')
        });
        let shadowNode = this.shadowRoot?.firstChild;
        while(shadowNode){
            const node = shadowNode;
            shadowNode = node.nextSibling;
            this.register(node, this.#data);
        }
        let innerNode = this.firstChild;
        while(innerNode){
            const node1 = innerNode;
            innerNode = node1.nextSibling;
            this.register(node1, this.#data);
        }
        this.#prepared = true;
        this.dispatchEvent(this.#preparedEvent);
    }
     #mutation(mutations) {
        if (!this.#prepared) return this.prepare();
        for (const mutation of mutations){
            for (const node of mutation.addedNodes){
                this.register(node, this.#data);
            }
            for (const node1 of mutation.removedNodes){
                this.release(node1);
            }
        }
    }
     #remove(node2) {
        const binders = this.#binders.get(node2);
        if (!binders) return;
        for (const binder of binders){
            for (const reference of binder.references){
                this.#binders.get(reference)?.delete(binder);
                if (!this.#binders.get(reference)?.size) this.#binders.delete(reference);
            }
        }
        this.#binders.delete(node2);
    }
     #add(node3, context, instance, rewrites) {
        let binder1;
        if (node3.nodeName === '#text') binder1 = new Text(node3, this, context, instance, rewrites);
        else if (node3.nodeName === 'html') binder1 = new Html(node3, this, context, instance, rewrites);
        else if (node3.nodeName === 'each') binder1 = new Each(node3, this, context, instance, rewrites);
        else if (node3.nodeName === 'value') binder1 = new Value(node3, this, context, instance, rewrites);
        else if (node3.nodeName === 'inherit') binder1 = new inherit(node3, this, context, instance, rewrites);
        else if (node3.nodeName === 'checked') binder1 = new Checked(node3, this, context, instance, rewrites);
        else if (node3.nodeName.startsWith('on')) binder1 = new On(node3, this, context, instance, rewrites);
        else binder1 = new Standard(node3, this, context, instance, rewrites);
        for (let reference1 of binder1.references){
            if (rewrites) {
                for (const [name, value] of rewrites){
                    if (reference1 === name) reference1 = value;
                    else if (reference1.startsWith(name + '.')) reference1 = value + reference1.slice(name.length);
                }
            }
            if (!this.#binders.get(reference1)?.add(binder1)?.size) {
                this.#binders.set(reference1, new Set([
                    binder1
                ]));
            }
        }
        if (!this.#binders.get(binder1.owner ?? binder1.node)?.add(binder1)?.size) {
            this.#binders.set(binder1.owner ?? binder1.node, new Set([
                binder1
            ]));
        }
        binder1.render();
    }
    release(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            this.#remove(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            this.#remove(node);
            const attributes = node.attributes;
            for (const attribute of attributes){
                this.#remove(attribute);
            }
            let child = node.firstChild;
            while(child){
                this.release(child);
                child = child.nextSibling;
            }
        }
    }
    register(node, context, instance, rewrites) {
        if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            let child = node.firstChild, register;
            while(child){
                register = child;
                child = node.nextSibling;
                this.register(register, context, instance, rewrites);
            }
        } else if (node.nodeType === node.TEXT_NODE) {
            const start = node.nodeValue?.indexOf(this.#syntaxStart) ?? -1;
            if (start === -1) return;
            if (start !== 0) node = node.splitText(start);
            const end = node.nodeValue?.indexOf(this.#syntaxEnd) ?? -1;
            if (end === -1) return;
            if (end + this.#syntaxLength !== node.nodeValue?.length) {
                const split = node.splitText(end + this.#syntaxLength);
                this.#add(node, context, instance, rewrites);
                this.register(split, context, instance, rewrites);
            } else {
                this.#add(node, context, instance, rewrites);
            }
        } else if (node.nodeType === node.ELEMENT_NODE) {
            const inherit = node.attributes.getNamedItem('inherit');
            if (inherit) this.#add(inherit, context, instance, rewrites);
            const each = node.attributes.getNamedItem('each');
            if (each) this.#add(each, context, instance, rewrites);
            if (!each && !inherit) {
                let child1 = node.firstChild, register1;
                while(child1){
                    register1 = child1;
                    child1 = child1.nextSibling;
                    this.register(register1, context, instance, rewrites);
                }
            }
            for (const attribute of node.attributes){
                if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.#syntaxMatch.test(attribute.value)) {
                    this.#add(attribute, context, instance, rewrites);
                }
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
}
export { XElement as default };
