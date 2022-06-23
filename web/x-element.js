// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const promise = Promise.resolve();
function tick(method) {
    return promise.then(method);
}
const dataGet = function(event, reference, target, key) {
    if (typeof key === 'symbol') return target[key];
    const value = Reflect.get(target, key);
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
    if (typeof key === 'symbol') return true;
    if (target instanceof Array) {
        target.splice(key, 1);
    } else {
        Reflect.deleteProperty(target, key);
    }
    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'reset'));
    return true;
};
const dataSet = function(event, reference, target, key, to) {
    if (typeof key === 'symbol') return true;
    const from = Reflect.get(target, key);
    if (key === 'length') {
        tick(event.bind(null, reference, 'render'));
        tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return true;
    } else if (from === to || isNaN(from) && to === isNaN(to)) {
        return true;
    }
    Reflect.set(target, key, to);
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
const caches = new Map();
const splitPattern = /\s*{{\s*|\s*}}\s*/;
const bracketPattern = /({{)|(}})/;
const stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
const codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, 'g');
const computer = function(binder) {
    let cache1 = caches.get(binder.value);
    if (cache1) return cache1.bind(null, binder.context);
    let reference = '';
    let assignment = '';
    let code = binder.value;
    const isValue = binder.node.name === 'value';
    const isChecked = binder.node.name === 'checked';
    const convert = code.split(splitPattern).filter((part)=>part).length > 1;
    code = code.replace(codePattern, function(_match, string, assignee, assigneeLeft, r, assigneeMiddle, assigneeRight, bracketLeft, bracketRight) {
        if (string) return string;
        if (bracketLeft) return convert ? `' + (` : '(';
        if (bracketRight) return convert ? `) + '` : ')';
        if (assignee) {
            if (isValue || isChecked) {
                reference = r;
                assignment = assigneeLeft + assigneeRight;
            }
            return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
        }
    });
    code = convert ? `'${code}'` : code;
    code = (reference && isValue ? `$value = $assignment ? $value : ${reference};\n` : '') + (reference && isChecked ? `$checked = $assignment ? $checked : ${reference};\n` : '') + `return ${assignment ? `$assignment ? ${code} : ${assignment}` : `${code}`};`;
    code = `
    try {
        $instance = $instance || {};
        with ($context) {
            with ($instance) {
                ${code}
            }
        }
    } catch (error){
        console.error(error);
    }
    `;
    cache1 = new Function('$context', '$instance', code);
    caches.set(binder.value, cache1);
    return cache1.bind(binder.owner, binder.context);
};
const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;
const referenceMatch = new RegExp([
    '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)',
    '((?:^|}}).*?{{)',
    '(}}.*?(?:{{|$))',
    `(
        (?:\\$assignee|\\$instance|\\$binder|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
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
        (?:[.][a-zA-Z0-9$_.? ]*\\b)
    )`,
    '(\\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\\b)'
].join('|').replace(/\s|\t|\n/g, ''), 'g');
const cache = new Map();
const parser = function(data) {
    const cached = cache.get(data);
    if (cached) return cached;
    data = data.replace(normalizeReference, '.$2');
    const references = [];
    cache.set(data, references);
    let match;
    while(match = referenceMatch.exec(data)){
        let reference = match[5];
        if (reference) {
            references.push(reference);
        }
    }
    return references;
};
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
    context;
    type;
    name;
    value;
    node;
    owner;
    container;
    compute;
    references;
    rewrites;
    meta = {};
    register;
    release;
    constructor(node, container, context, rewrites){
        this.node = node;
        this.context = context;
        this.container = container;
        this.rewrites = rewrites ?? [];
        this.name = node.nodeName.startsWith('#') ? node.nodeName.slice(1) : node.nodeName;
        this.value = node.nodeValue ?? '';
        this.type = this.name.startsWith('on') ? 'on' : this.name in Binder.handlers ? this.name : 'standard';
        this.owner = (node.ownerElement ?? node.parentElement) ?? container;
        this.references = parser(this.value);
        this.compute = computer(this);
        this.register = this.container.register.bind(this.container);
        this.release = this.container.release.bind(this.container);
    }
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
function format(data) {
    return data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;
}
class Standard extends Binder {
    render() {
        const __boolean = __default.includes(this.name);
        const node = this.node;
        node.value = '';
        if (__boolean) {
            const data = this.compute() ? true : false;
            if (data) this.owner.setAttributeNode(node);
            else this.owner.removeAttribute(this.name);
        } else {
            const data = format(this.compute());
            this.owner[this.name] = data;
            this.owner.setAttribute(this.name, data);
        }
    }
    reset() {
        const __boolean = __default.includes(this.name);
        if (__boolean) {
            this.owner.removeAttribute(this.name);
        } else {
            this.owner[this.name] = undefined;
            this.owner.setAttribute(this.name, '');
        }
    }
}
const flag = Symbol('RadioFlag');
const handler = function(binder, event) {
    const checked = binder.owner.checked;
    const computed = binder.compute({
        $event: event,
        $checked: checked,
        $assignment: !!event
    });
    if (computed) {
        binder.owner.setAttributeNode(binder.node);
    } else {
        binder.owner.removeAttribute('checked');
    }
};
class Checked extends Binder {
    render() {
        if (!this.meta.setup) {
            this.meta.setup = true;
            if (this.owner.type === 'radio') {
                this.owner.addEventListener('input', (event)=>{
                    if (event.detail === flag) return handler(this, event);
                    const parent = this.owner.form || this.owner.getRootNode();
                    const radios = parent.querySelectorAll(`[type="radio"][name="${this.owner.name}"]`);
                    for (const radio of radios){
                        if (radio === event.target) {
                            handler(this, event);
                        } else {
                            let checked;
                            if (checked) {
                                radio.dispatchEvent(new CustomEvent('input', {
                                    detail: flag
                                }));
                            } else {
                                radio.checked = !event.target.checked;
                                if (radio.checked) {
                                    radio.setAttribute('checked', '');
                                } else {
                                    radio.removeAttribute('checked');
                                }
                            }
                        }
                    }
                });
            } else {
                this.owner.addEventListener('input', (event)=>handler(this, event));
            }
        }
        handler(this);
    }
    reset() {
        this.owner.removeAttribute('checked');
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
    if (type === 'select-one') {
        const [option] = owner.selectedOptions;
        const value = option ? '$value' in option ? option.$value : option.value : undefined;
        owner.$value = binder.compute({
            event,
            $event: event,
            $value: value,
            $assignment: true
        });
    } else if (type === 'select-multiple') {
        const value = Array.prototype.map.call(owner.selectedOptions, (o)=>'$value' in o ? o.$value : o.value);
        owner.$value = binder.compute({
            event,
            $event: event,
            $value: value,
            $assignment: true
        });
    } else if (type === 'number' || type === 'range' || __default1.includes(type)) {
        const value = '$value' in owner && typeof owner.$value === 'number' ? owner.valueAsNumber : owner.value;
        owner.$value = binder.compute({
            event,
            $event: event,
            $value: value,
            $assignment: true
        });
    } else {
        const value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
        const checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
        owner.$value = binder.compute({
            event,
            $event: event,
            $value: value,
            $checked: checked,
            $assignment: true
        });
    }
};
class Value extends Binder {
    render() {
        const { meta  } = this;
        const { type  } = this.owner;
        if (!meta.setup) {
            meta.setup = true;
            this.owner.addEventListener('input', (event)=>input(this, event));
        }
        const computed = this.compute({
            event: undefined,
            $event: undefined,
            $value: undefined,
            $checked: undefined,
            $assignment: false
        });
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
            const owner = this.owner;
            Array.prototype.forEach.call(owner.options, (o)=>o.selected = computed?.includes('$value' in o ? o.$value : o.value));
            display = format(computed);
        } else if (type === 'number' || type === 'range' || __default1.includes(type)) {
            const owner = this.owner;
            if (typeof computed === 'string') owner.value = computed;
            else owner.valueAsNumber = computed;
            display = owner.value;
        } else {
            const owner = this.owner;
            display = format(computed);
            owner.value = display;
        }
        this.owner.$value = computed;
        this.owner.setAttribute('value', display);
    }
    reset() {
        const { type  } = this.owner;
        if (type === 'select-one' || type === 'select-multiple') {
            const owner = this.owner;
            Array.prototype.forEach.call(owner.options, (option)=>option.selected = false);
        }
        this.owner.value = '';
        this.owner.$value = undefined;
        this.owner.setAttribute('value', '');
    }
}
const whitespace = /\s+/;
const eachHas = function(binder, indexValue, keyValue, target, key) {
    return key === binder.meta.variableName || key === binder.meta.indexName || key === binder.meta.keyName || key === '$index' || key === '$item' || key === '$key' || Reflect.has(target, key);
};
const eachGet = function(binder, indexValue, keyValue, target, key) {
    if (key === binder.meta.variableName || key === '$item') {
        return binder.meta.data[keyValue];
    } else if (key === binder.meta.indexName || key === '$index') {
        return indexValue;
    } else if (key === binder.meta.keyName || key === '$key') {
        return keyValue;
    } else {
        return Reflect.get(target, key);
    }
};
const eachSet = function(binder, indexValue, keyValue, target, key, value) {
    if (key === binder.meta.variableName || key === '$item') {
        binder.meta.data[keyValue] = value;
    } else if (key === binder.meta.indexName || key === binder.meta.keyName) {
        return true;
    } else {
        return Reflect.set(target, key, value);
    }
    return true;
};
class Each extends Binder {
    reset() {
        this.meta.targetLength = 0;
        this.meta.currentLength = 0;
        while(this.owner.lastChild)this.release(this.owner.removeChild(this.owner.lastChild));
        while(this.meta.queueElement.content.lastChild)this.meta.queueElement.content.removeChild(this.meta.queueElement.content.lastChild);
    }
    render() {
        const [data, variable, key, index] = this.compute();
        const [reference] = this.references;
        this.meta.data = data;
        this.meta.keyName = key;
        this.meta.indexName = index;
        this.meta.variableName = variable;
        if (!this.meta.setup) {
            this.meta.keys = [];
            this.meta.setup = true;
            this.meta.targetLength = 0;
            this.meta.currentLength = 0;
            this.meta.templateLength = 0;
            this.meta.queueElement = document.createElement('template');
            this.meta.templateElement = document.createElement('template');
            let node = this.owner.firstChild;
            while(node){
                if (node.nodeType === 3 && whitespace.test(node.nodeValue)) {
                    this.owner.removeChild(node);
                } else {
                    this.meta.templateLength++;
                    this.meta.templateElement.content.appendChild(node);
                }
                node = this.owner.firstChild;
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
                let count = this.meta.templateLength;
                while(count--){
                    const node = this.owner.lastChild;
                    if (!node) break;
                    this.owner.removeChild(node);
                    this.release(node);
                }
                this.meta.currentLength--;
            }
        } else if (this.meta.currentLength < this.meta.targetLength) {
            while(this.meta.currentLength < this.meta.targetLength){
                const $key = this.meta.keys[this.meta.currentLength] ?? this.meta.currentLength;
                const $index = this.meta.currentLength++;
                const context = new Proxy(this.context, {
                    has: eachHas.bind(null, this, $index, $key),
                    get: eachGet.bind(null, this, $index, $key),
                    set: eachSet.bind(null, this, $index, $key)
                });
                let rewrites;
                if (this.rewrites) {
                    rewrites = [
                        ...this.rewrites,
                        [
                            variable,
                            `${reference}.${$index}`
                        ]
                    ];
                } else {
                    rewrites = [
                        [
                            variable,
                            `${reference}.${$index}`
                        ]
                    ];
                }
                const clone = this.meta.templateElement.content.cloneNode(true);
                let node = clone.firstChild;
                while(node){
                    this.register(node, context, rewrites);
                    node = node.nextSibling;
                }
                this.meta.queueElement.content.appendChild(clone);
            }
        }
        if (this.meta.currentLength === this.meta.targetLength) {
            this.owner.appendChild(this.meta.queueElement.content);
        }
    }
}
class Html extends Binder {
    render() {
        let data = this.compute();
        if (typeof data !== 'string') {
            data = '';
            console.warn('html binder requires a string');
        }
        let removeChild = this.owner.lastChild;
        while(removeChild){
            this.owner.removeChild(removeChild);
            this.release(removeChild);
            removeChild = this.owner.lastChild;
        }
        const template = document.createElement('template');
        template.innerHTML = data;
        let addChild = template.content.firstChild;
        while(addChild){
            this.register(addChild);
            addChild = addChild.nextSibling;
        }
        this.owner.appendChild(template.content);
    }
    reset() {
        let node = this.owner.lastChild;
        while(node){
            this.release(node);
            this.owner.removeChild(node);
            node = this.owner.lastChild;
        }
    }
}
class Text extends Binder {
    render() {
        const data = this.compute();
        this.owner.textContent = format(data);
    }
    reset() {
        this.owner.textContent = '';
    }
}
const Value1 = function(element) {
    if (!element) return undefined;
    if ('$value' in element) return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
    if (element.type === 'number' || element.type === 'range') return element.valueAsNumber;
    return element.value;
};
const submit = function(event, binder) {
    event.preventDefault();
    const form = {};
    const target = event.target?.form || event.target;
    const elements = target?.querySelectorAll('[name]');
    for (const element of elements){
        const { type , name , checked , hidden  } = element;
        if (!name) continue;
        if (hidden) continue;
        if (type === 'radio' && !checked) continue;
        if (type === 'submit' || type === 'button') continue;
        let value;
        if (type === 'select-multiple') {
            value = [];
            for (const option of element.selectedOptions){
                value.push(Value1(option));
            }
        } else if (type === 'select-one') {
            const [option] = element.selectedOptions;
            value = Value1(option);
        } else {
            value = Value1(element);
        }
        let data = form;
        name.split(/\s*\.\s*/).forEach((part, index, parts)=>{
            const next = parts[index + 1];
            if (next) {
                if (!data[part]) {
                    data[part] = /[0-9]+/.test(next) ? [] : {};
                }
                data = data[part];
            } else {
                data[part] = value;
            }
        });
    }
    binder.compute({
        event,
        $form: form,
        $event: event
    });
    if (target.getAttribute('reset')) target.reset();
    return false;
};
const reset = function(event, binder) {
    event.preventDefault();
    const target = event.target?.form || event.target;
    const elements = target?.querySelectorAll('[name]');
    for (const element of elements){
        const { type , name , checked , hidden  } = element;
        if (!name) continue;
        if (hidden) continue;
        if (type === 'radio' && !checked) continue;
        if (type === 'submit' || type === 'button') continue;
        if (type === 'select-one') {
            element.selectedIndex = 0;
        } else if (type === 'select-multiple') {
            element.selectedIndex = -1;
        } else if (type === 'radio' || type === 'checkbox') {
            element.checked = false;
        } else {
            element.value = '';
        }
        element.dispatchEvent(new Event('input'));
    }
    binder.compute({
        event,
        $event: event
    });
    return false;
};
class On extends Binder {
    render() {
        this.owner[this.name] = null;
        const name = this.name.slice(2);
        if (!this.meta.setup) {
            this.meta.setup = true;
            this.node.nodeValue = '';
        }
        if (this.meta.method) {
            this.owner.removeEventListener(name, this.meta.method);
        }
        this.meta.method = (event)=>{
            if (name === 'reset') {
                return reset(event, this);
            } else if (name === 'submit') {
                return submit(event, this);
            } else {
                return this.compute({
                    event,
                    $event: event
                });
            }
        };
        this.owner.addEventListener(name, this.meta.method);
    }
    reset() {
        this.owner[this.name] = null;
        const name = this.name.slice(2);
        if (this.meta.method) {
            this.owner.removeEventListener(name, this.meta.method);
        }
    }
}
function dash(data) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
}
const TEXT = Node.TEXT_NODE;
const ELEMENT = Node.ELEMENT_NODE;
const FRAGMENT = Node.DOCUMENT_FRAGMENT_NODE;
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
    #mutator;
    #data = {};
    #setup = false;
    #syntaxEnd = '}}';
    #syntaxStart = '{{';
    #syntaxLength = 2;
    binders = new Map();
    #syntaxMatch = new RegExp('{{.*?}}');
    #adoptedEvent = new Event('adopted');
    #adoptingEvent = new Event('adopting');
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
        this.#mutator = new MutationObserver(this.#mutation.bind(this));
        this.#mutator.observe(this, {
            childList: true
        });
        this.#mutator.observe(this.shadowRoot, {
            childList: true
        });
    }
    setup() {
        if (this.#setup) return;
        else this.#setup = true;
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
            get: dataGet.bind(null, dataEvent.bind(null, this.binders), ''),
            set: dataSet.bind(null, dataEvent.bind(null, this.binders), ''),
            deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.binders), '')
        });
        let node;
        node = this.shadowRoot?.firstChild;
        while(node){
            this.register(node);
            node = node.nextSibling;
        }
        node = this.firstChild;
        while(node){
            this.register(node);
            node = node.nextSibling;
        }
    }
     #mutation(mutations) {
        console.log(mutations);
        if (!this.#setup) return this.setup();
        for (const mutation of mutations){
            for (const node of mutation.addedNodes){
                console.log(node);
                this.register(node);
            }
            for (const node1 of mutation.removedNodes){
                this.release(node1);
            }
        }
    }
     #remove(node3) {
        const binders = this.binders.get(node3);
        if (!binders) return;
        for (const binder of binders){
            for (const reference of binder.references){
                this.binders.get(reference)?.delete(binder);
                if (!this.binders.get(reference)?.size) this.binders.delete(reference);
            }
        }
        this.binders.delete(node3);
    }
     #add(node2, context1, rewrites1) {
        if (this.binders.has(node2)) return console.warn(node2);
        let binder;
        if (node2.nodeName === '#text') binder = new Text(node2, this, context1 ?? this.#data, rewrites1);
        else if (node2.nodeName === 'html') binder = new Html(node2, this, context1 ?? this.#data, rewrites1);
        else if (node2.nodeName === 'each') binder = new Each(node2, this, context1 ?? this.#data, rewrites1);
        else if (node2.nodeName === 'value') binder = new Value(node2, this, context1 ?? this.#data, rewrites1);
        else if (node2.nodeName === 'inherit') binder = new inherit(node2, this, context1 ?? this.#data);
        else if (node2.nodeName === 'checked') binder = new Checked(node2, this, context1 ?? this.#data, rewrites1);
        else if (node2.nodeName.startsWith('on')) binder = new On(node2, this, context1 ?? this.#data, rewrites1);
        else binder = new Standard(node2, this, context1 ?? this.#data, rewrites1);
        for(let i = 0; i < binder.references.length; i++){
            if (rewrites1) {
                for (const [name, value] of rewrites1){
                    binder.references[i] = binder.references[i].replace(name, value);
                }
            }
            if (this.binders.has(binder.references[i])) {
                this.binders.get(binder.references[i]).add(binder);
            } else {
                this.binders.set(binder.references[i], new Set([
                    binder
                ]));
            }
        }
        if (this.binders.has(binder.owner)) {
            this.binders.get(binder.owner).add(binder);
        } else {
            this.binders.set(binder.owner, new Set([
                binder
            ]));
        }
        binder.render();
    }
    release(node) {
        if (node.nodeType === TEXT) {
            this.#remove(node);
        } else if (node.nodeType === ELEMENT) {
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
    register(node, context, rewrites) {
        if (node.nodeType === FRAGMENT) {
            node = node.firstChild;
            while(node){
                this.register(node, context, rewrites);
                node = node.nextSibling;
            }
        } else if (node.nodeType === TEXT) {
            const start = node.nodeValue?.indexOf(this.#syntaxStart) ?? -1;
            if (start === -1) return;
            if (start !== 0) node = node.splitText(start);
            const end = node.nodeValue?.indexOf(this.#syntaxEnd) ?? -1;
            if (end === -1) return;
            if (end + this.#syntaxLength !== node.nodeValue?.length) {
                const split = node.splitText(end + this.#syntaxLength);
                this.register(split, context, rewrites);
            }
            this.#add(node, context, rewrites);
        } else if (node.nodeType === ELEMENT) {
            const inherit1 = node.attributes.getNamedItem('inherit');
            if (inherit1) this.#add(inherit1, context, rewrites);
            const each = node.attributes.getNamedItem('each');
            if (each) this.#add(each, context, rewrites);
            if (!each && !inherit1) {
                let child = node.firstChild;
                while(child){
                    this.register(child, context, rewrites);
                    child = child.nextSibling;
                }
            }
            const attributes = [
                ...node.attributes
            ];
            for (const attribute of attributes){
                if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.#syntaxMatch.test(attribute.value)) {
                    this.#add(attribute, context, rewrites);
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
