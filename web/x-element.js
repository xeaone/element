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
    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'unrender'));
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
const standardRender = function(binder) {
    let data = binder.compute();
    const __boolean = __default.includes(binder.name);
    binder.node.value = '';
    if (__boolean) {
        data = data ? true : false;
        if (data) binder.owner.setAttributeNode(binder.node);
        else binder.owner.removeAttribute(binder.name);
    } else {
        data = format(data);
        binder.owner[binder.name] = data;
        binder.owner.setAttribute(binder.name, data);
    }
};
const standardUnrender = function(binder) {
    const __boolean = __default.includes(binder.name);
    if (__boolean) {
        binder.owner.removeAttribute(binder.name);
    } else {
        binder.owner[binder.name] = undefined;
        binder.owner.setAttribute(binder.name, '');
    }
};
const __default1 = {
    render: standardRender,
    unrender: standardUnrender
};
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
const checkedRender = function(binder) {
    if (!binder.meta.setup) {
        binder.node.value = '';
        binder.meta.setup = true;
        if (binder.owner.type === 'radio') {
            binder.owner.addEventListener('input', (event)=>{
                if (event.detail === flag) return handler(binder, event);
                const parent = binder.owner.form || binder.owner.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
                for (const radio of radios){
                    if (radio === event.target) {
                        handler(binder, event);
                    } else {
                        let checked;
                        const bounds = binder.binders.get(binder.owner);
                        if (bounds) {
                            for (const bound of bounds){
                                if (bound.name === 'checked') {
                                    checked = bound;
                                    break;
                                }
                            }
                        }
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
            binder.owner.addEventListener('input', (event)=>handler(binder, event));
        }
    }
    handler(binder);
};
const checkedUnrender = function(binder) {
    binder.owner.removeAttribute('checked');
};
const __default2 = {
    render: checkedRender,
    unrender: checkedUnrender
};
const inheritRender = function(binder) {
    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.node.value = '';
    }
    if (!binder.owner.inherited) {
        return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }
    const inherited = binder.compute();
    binder.owner.inherited?.(inherited);
};
const inheritUnrender = function(binder) {
    if (!binder.owner.inherited) {
        return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }
    binder.owner.inherited?.();
};
const __default3 = {
    render: inheritRender,
    unrender: inheritUnrender
};
const __default4 = [
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
    } else if (type === 'number' || type === 'range' || __default4.includes(type)) {
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
const valueRender = function(binder) {
    const { owner , meta  } = binder;
    const { type  } = owner;
    if (!meta.setup) {
        meta.setup = true;
        owner.addEventListener('input', (event)=>input(binder, event));
    }
    const computed = binder.compute({
        event: undefined,
        $event: undefined,
        $value: undefined,
        $checked: undefined,
        $assignment: false
    });
    let display;
    if (type === 'select-one') {
        owner.value = undefined;
        Array.prototype.find.call(owner.options, (o)=>'$value' in o ? o.$value : o.value === computed);
        if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
            owner.options[0].selected = true;
            return owner.dispatchEvent(defaultInputEvent);
        }
        display = format(computed);
        owner.value = display;
    } else if (type === 'select-multiple') {
        Array.prototype.forEach.call(owner.options, (o)=>o.selected = computed?.includes('$value' in o ? o.$value : o.value));
        display = format(computed);
    } else if (type === 'number' || type === 'range' || __default4.includes(type)) {
        if (typeof computed === 'string') owner.value = computed;
        else owner.valueAsNumber = computed;
        display = owner.value;
    } else {
        display = format(computed);
        owner.value = display;
    }
    owner.$value = computed;
    owner.setAttribute('value', display);
};
const valueUnrender = function(binder) {
    const { owner  } = binder;
    const { type  } = owner;
    if (type === 'select-one' || type === 'select-multiple') {
        Array.prototype.forEach.call(owner.options, (option)=>option.selected = false);
    }
    owner.value = undefined;
    owner.$value = undefined;
    owner.setAttribute('value', '');
};
const __default5 = {
    render: valueRender,
    unrender: valueUnrender
};
const whitespace = /\s+/;
const eachHas = function(binder, indexValue, keyValue, target, key) {
    return key === binder.meta.variableName || key === binder.meta.indexName || key === binder.meta.keyName || key === '$index' || key === '$item' || key === '$key' || Reflect.has(target, key);
};
const eachGet = function(binder, indexValue, keyValue, target, key, receiver) {
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
const eachUnrender = function(binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    let node;
    while(node = binder.owner.lastChild)binder.binder.remove(binder.owner.removeChild(node));
    while(node = binder.meta.queueElement.content.lastChild)binder.meta.queueElement.content.removeChild(node);
};
const eachRender = function(binder) {
    const [data, variable, key, index] = binder.compute();
    const [reference] = binder.references;
    binder.meta.data = data;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variableName = variable;
    if (!binder.meta.setup) {
        binder.node.value = '';
        binder.meta.keys = [];
        binder.meta.setup = true;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.templateLength = 0;
        binder.meta.queueElement = document.createElement('template');
        binder.meta.templateElement = document.createElement('template');
        let node = binder.owner.firstChild;
        while(node){
            if (node.nodeType === 3 && whitespace.test(node.nodeValue)) {
                binder.owner.removeChild(node);
            } else {
                binder.meta.templateLength++;
                binder.meta.templateElement.content.appendChild(node);
            }
            node = binder.owner.firstChild;
        }
    }
    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    }
    if (binder.meta.currentLength > binder.meta.targetLength) {
        while(binder.meta.currentLength > binder.meta.targetLength){
            let count = binder.meta.templateLength;
            while(count--){
                const node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                binder.removes(node);
            }
            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        while(binder.meta.currentLength < binder.meta.targetLength){
            const $key = binder.meta.keys[binder.meta.currentLength] ?? binder.meta.currentLength;
            const $index = binder.meta.currentLength++;
            const context = new Proxy(binder.context, {
                has: eachHas.bind(null, binder, $index, $key),
                get: eachGet.bind(null, binder, $index, $key),
                set: eachSet.bind(null, binder, $index, $key)
            });
            let rewrites;
            if (binder.rewrites) {
                rewrites = [
                    ...binder.rewrites,
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
            const clone = binder.meta.templateElement.content.cloneNode(true);
            let node = clone.firstChild;
            while(node){
                binder.adds(node, context, rewrites);
                node = node.nextSibling;
            }
            binder.meta.queueElement.content.appendChild(clone);
        }
    }
    if (binder.meta.currentLength === binder.meta.targetLength) {
        binder.owner.appendChild(binder.meta.queueElement.content);
    }
};
const __default6 = {
    render: eachRender,
    unrender: eachUnrender
};
const htmlRender = function(binder) {
    let data = binder.compute();
    if (typeof data !== 'string') {
        data = '';
        console.warn('html binder requires a string');
    }
    let removeChild;
    while(removeChild = binder.owner.lastChild){
        binder.owner.removeChild(removeChild);
        binder.removes(removeChild);
    }
    const template = document.createElement('template');
    template.innerHTML = data;
    let addChild = template.content.firstChild;
    while(addChild){
        binder.adds(addChild);
        addChild = addChild.nextSibling;
    }
    binder.owner.appendChild(template.content);
};
const htmlUnrender = function(binder) {
    let node;
    while(node = binder.owner.lastChild){
        binder.removes(node);
        binder.owner.removeChild(node);
    }
};
const __default7 = {
    render: htmlRender,
    unrender: htmlUnrender
};
const textRender = function(binder) {
    const data = binder.compute();
    binder.owner.textContent = format(data);
};
const textUnrender = function(binder) {
    binder.owner.textContent = '';
};
const __default8 = {
    render: textRender,
    unrender: textUnrender
};
const Value = function(element) {
    if (!element) return undefined;
    if ('$value' in element) return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
    if (element.type === 'number' || element.type === 'range') return element.valueAsNumber;
    return element.value;
};
const submit = function(event, binder) {
    event.preventDefault();
    const form = {};
    const target = event.target;
    const elements = (target?.form || target)?.querySelectorAll('[name]');
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
                value.push(Value(option));
            }
        } else if (type === 'select-one') {
            const [option] = element.selectedOptions;
            value = Value(option);
        } else {
            value = Value(element);
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
    const target = event.target;
    const elements = (target?.form || target)?.querySelectorAll('[name]');
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
            element.value = undefined;
        }
        element.dispatchEvent(new Event('input'));
    }
    binder.compute({
        event,
        $event: event
    });
    return false;
};
const onRender = function(binder) {
    binder.owner[binder.name] = null;
    const name = binder.name.slice(2);
    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.node.value = '';
    }
    if (binder.meta.method) {
        binder.owner.removeEventListener(name, binder.meta.method);
    }
    binder.meta.method = (event)=>{
        if (name === 'reset') {
            return reset(event, binder);
        } else if (name === 'submit') {
            return submit(event, binder);
        } else {
            return binder.compute({
                event,
                $event: event
            });
        }
    };
    binder.owner.addEventListener(name, binder.meta.method);
};
const onUnrender = function(binder) {
    binder.owner[binder.name] = null;
    const name = binder.name.slice(2);
    if (binder.meta.method) {
        binder.owner.removeEventListener(name, binder.meta.method);
    }
};
const __default9 = {
    render: onRender,
    unrender: onUnrender
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
            const mode = template.getAttribute("shadowroot");
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
    #binders = new Map();
    #syntaxMatch = new RegExp('{{.*?}}');
    #adoptedEvent = new Event('adopted');
    #adoptingEvent = new Event('adopting');
    #connectedEvent = new Event('connected');
    #connectingEvent = new Event('connecting');
    #attributedEvent = new Event('attributed');
    #attributingEvent = new Event('attributing');
    #disconnectedEvent = new Event('disconnected');
    #disconnectingEvent = new Event('disconnecting');
    #handlers = {
        on: __default9,
        text: __default8,
        html: __default7,
        each: __default6,
        value: __default5,
        checked: __default2,
        inherit: __default3,
        standard: __default1
    };
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
                set: (value1)=>this.#data[property] = value1
            });
        }
        this.#data = new Proxy(data, {
            get: dataGet.bind(null, dataEvent.bind(null, this.#binders), ''),
            set: dataSet.bind(null, dataEvent.bind(null, this.#binders), ''),
            deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.#binders), '')
        });
        let node;
        node = this.shadowRoot?.firstChild;
        while(node){
            this.#adds(node);
            node = node.nextSibling;
        }
        node = this.firstChild;
        while(node){
            this.#adds(node);
            node = node.nextSibling;
        }
    }
     #mutation(mutations) {
        if (!this.#setup) return this.setup();
        for (const mutation of mutations){
            for (const node of mutation.addedNodes){
                console.log(node);
                this.#adds(node);
            }
            for (const node1 of mutation.removedNodes){
                this.#removes(node1);
            }
        }
    }
     #remove(node) {
        const binders = this.#binders.get(node);
        if (!binders) return;
        for (const binder of binders){
            for (const reference of binder.references){
                this.#binders.get(reference)?.delete(binder);
                if (!this.#binders.get(reference)?.size) this.#binders.delete(reference);
            }
        }
        this.#binders.delete(node);
    }
     #add(node2, name1, value2, owner, context, rewrites) {
        if (this.#binders.has(node2)) return console.warn(node2);
        const type = name1.startsWith('on') ? 'on' : name1 in this.#handlers ? name1 : 'standard';
        const handler = this.#handlers[type];
        const binder = {
            meta: {},
            container: this,
            binders: this.#binders,
            rewrites: rewrites ?? [],
            context: context ?? this.#data,
            adds: this.#adds.bind(this),
            removes: this.#removes.bind(this),
            node: node2,
            owner,
            name: name1,
            value: value2,
            type
        };
        const references = parser(value2);
        const compute = computer(binder);
        binder.compute = compute;
        binder.references = [
            ...references
        ];
        binder.render = handler.render.bind(null, binder);
        binder.unrender = handler.unrender.bind(null, binder);
        for(let i = 0; i < binder.references.length; i++){
            if (rewrites) {
                for (const [name, value3] of rewrites){
                    binder.references[i] = binder.references[i].replace(name, value3);
                }
            }
            if (this.#binders.has(binder.references[i])) {
                this.#binders.get(binder.references[i]).add(binder);
            } else {
                this.#binders.set(binder.references[i], new Set([
                    binder
                ]));
            }
        }
        if (this.#binders.has(binder.owner)) {
            this.#binders.get(binder.owner).add(binder);
        } else {
            this.#binders.set(binder.owner, new Set([
                binder
            ]));
        }
        binder.render();
    }
     #removes(node3) {
        if (node3.nodeType === TEXT) {
            this.#remove(node3);
        } else if (node3.nodeType === ELEMENT) {
            this.#remove(node3);
            const attributes = node3.attributes;
            for (const attribute of attributes){
                this.#remove(attribute);
            }
            let child = node3.firstChild;
            while(child){
                this.#removes(child);
                child = child.nextSibling;
            }
        }
    }
     #adds(node4, context1, rewrites1) {
        if (node4.nodeType === FRAGMENT) {
            node4 = node4.firstChild;
            while(node4){
                this.#adds(node4, context1, rewrites1);
                node4 = node4.nextSibling;
            }
        } else if (node4.nodeType === TEXT) {
            const start = node4.nodeValue?.indexOf(this.#syntaxStart) ?? -1;
            if (start === -1) return;
            if (start !== 0) node4 = node4.splitText(start);
            const end = node4.nodeValue?.indexOf(this.#syntaxEnd) ?? -1;
            if (end === -1) return;
            if (end + this.#syntaxLength !== node4.nodeValue?.length) {
                const split = node4.splitText(end + this.#syntaxLength);
                this.#adds(split, context1, rewrites1);
            }
            this.#add(node4, 'text', node4.nodeValue ?? '', node4, context1, rewrites1);
        } else if (node4.nodeType === ELEMENT) {
            const inherit1 = node4.attributes['inherit'];
            if (inherit1) this.#add(inherit1, inherit1.name, inherit1.value, inherit1.ownerElement, context1, rewrites1);
            const each1 = node4.attributes['each'];
            if (each1) this.#add(each1, each1.name, each1.value, each1.ownerElement, context1, rewrites1);
            if (!each1 && !inherit1) {
                let child = node4.firstChild;
                while(child){
                    this.#adds(child, context1, rewrites1);
                    child = child.nextSibling;
                }
            }
            const attributes = [
                ...node4.attributes
            ];
            for (const attribute of attributes){
                if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.#syntaxMatch.test(attribute.value)) {
                    this.#add(attribute, attribute.name, attribute.value, attribute.ownerElement, context1, rewrites1);
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
