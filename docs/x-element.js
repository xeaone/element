
/*!
    Name: oxe
    Version: 7.0.0
    License: MPL-2.0
    Author: Alexander Elias
    Email: alex.steven.elis@gmail.com
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const promise = Promise.resolve();
function tick(method) {
    return promise.then(method);
}

const dataGet = function (event, reference, target, key, receiver) {
    if (key === 'x')
        return { reference };
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
const dataDelete = function (event, reference, target, key) {
    if (target instanceof Array) {
        target.splice(key, 1);
    }
    else {
        Reflect.deleteProperty(target, key);
    }
    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'derender'));
    return true;
};
const dataSet = function (event, reference, target, key, to, receiver) {
    const from = Reflect.get(target, key, receiver);
    if (key === 'length') {
        tick(event.bind(null, reference, 'render'));
        tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return true;
    }
    else if (from === to || isNaN(from) && to === isNaN(to)) {
        return true;
    }
    Reflect.set(target, key, to, receiver);
    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
    return true;
};
const dataEvent = function (data, reference, type) {
    const binders = data.get(reference);
    if (binders) {
        for (const binder of binders) {
            binder[type]();
        }
    }
};

var booleans = [
    'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
    'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
    'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
    'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
    'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
];

function format(data) {
    return data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;
}

const standardRender = function (binder) {
    let data = binder.compute();
    const boolean = booleans.includes(binder.name);
    binder.node.value = '';
    if (boolean) {
        data = data ? true : false;
        if (data)
            binder.owner.setAttributeNode(binder.node);
        else
            binder.owner.removeAttribute(binder.name);
    }
    else {
        data = format(data);
        binder.owner[binder.name] = data;
        binder.owner.setAttribute(binder.name, data);
    }
};
const standardUnrender = function (binder) {
    const boolean = booleans.includes(binder.name);
    if (boolean) {
        binder.owner.removeAttribute(binder.name);
    }
    else {
        binder.owner.setAttribute(binder.name, '');
    }
};
var standard = { render: standardRender, unrender: standardUnrender };

const flag = Symbol('RadioFlag');
const handler = function (binder, event) {
    const checked = binder.owner.checked;
    const computed = binder.compute({ $event: event, $checked: checked, $assignment: !!event });
    if (computed) {
        binder.owner.setAttributeNode(binder.node);
    }
    else {
        binder.owner.removeAttribute('checked');
    }
};
const checkedRender = function (binder) {
    if (!binder.meta.setup) {
        binder.node.value = '';
        binder.meta.setup = true;
        if (binder.owner.type === 'radio') {
            binder.owner.addEventListener('input', event => {
                if (event.detail === flag)
                    return handler(binder, event);
                const parent = binder.owner.form || binder.owner.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
                const input = new CustomEvent('input', { detail: flag });
                for (const radio of radios) {
                    if (radio === event.target) {
                        handler(binder, event);
                    }
                    else {
                        let checked;
                        const bounds = binder.binders.get(binder.owner);
                        if (bounds) {
                            for (const bound of bounds) {
                                if (bound.name === 'checked') {
                                    checked = bound;
                                    break;
                                }
                            }
                        }
                        if (checked) {
                            radio.dispatchEvent(input);
                        }
                        else {
                            radio.checked = !event.target.checked;
                            if (radio.checked) {
                                radio.setAttribute('checked', '');
                            }
                            else {
                                radio.removeAttribute('checked');
                            }
                        }
                    }
                }
            });
        }
        else {
            binder.owner.addEventListener('input', event => handler(binder, event));
        }
    }
    handler(binder);
};
const checkedUnrender = function (binder) {
    binder.owner.removeAttribute('checked');
};
var checked = { render: checkedRender, unrender: checkedUnrender };

const inheritRender = function (binder) {
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
const inheritUnrender = function (binder) {
    if (!binder.owner.inherited) {
        return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }
    binder.owner.inherited?.();
};
var inherit = { render: inheritRender, unrender: inheritUnrender };

var dates = ['date', 'datetime-local', 'month', 'time', 'week'];

console.warn('value: setter/getter issue with multiselect');
const defaultInputEvent = new Event('input');
const parseable = function (value) {
    return !isNaN(value) && value !== null && value !== undefined && typeof value !== 'string';
};
const stampFromView = function (data) {
    const date = new Date(data);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()).getTime();
};
const stampToView = function (data) {
    const date = new Date(data);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())).getTime();
};
const input = function (binder, event) {
    const { owner } = binder;
    const { type } = owner;
    if (type === 'select-one') {
        const [option] = owner.selectedOptions;
        const value = option ? '$value' in option ? option.$value : option.value : undefined;
        binder.compute({ $event: event, $value: value, $assignment: true });
    }
    else if (type === 'select-multiple') {
        const value = [];
        for (const option of owner.selectedOptions) {
            value.push('$value' in option ? option.$value : option.value);
        }
        binder.compute({ $event: event, $value: value, $assignment: true });
    }
    else if (type === 'number' || type === 'range') {
        binder.compute({ $event: event, $value: owner.valueAsNumber, $assignment: true });
    }
    else if (dates.includes(type)) {
        const value = typeof owner.$value === 'string' ? owner.value : stampFromView(owner.valueAsNumber);
        binder.compute({ $event: event, $value: value, $assignment: true });
    }
    else {
        const value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
        const checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
        binder.compute({ $event: event, $value: value, $checked: checked, $assignment: true });
    }
};
const valueRender = function (binder) {
    const { owner, meta } = binder;
    if (!meta.setup) {
        meta.setup = true;
        owner.addEventListener('input', event => input(binder, event));
    }
    const computed = binder.compute({ $event: undefined, $value: undefined, $checked: undefined, $assignment: false });
    let display;
    if (binder.owner.type === 'select-one') {
        owner.value = undefined;
        for (const option of owner.options) {
            const optionValue = '$value' in option ? option.$value : option.value;
            if (option.selected = optionValue === computed)
                break;
        }
        if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
            const [option] = owner.options;
            option.selected = true;
            return owner.dispatchEvent(defaultInputEvent);
        }
        display = format(computed);
        owner.value = display;
    }
    else if (binder.owner.type === 'select-multiple') {
        for (const option of owner.options) {
            const optionValue = '$value' in option ? option.$value : option.value;
            option.selected = computed?.includes(optionValue);
        }
        display = format(computed);
    }
    else if (binder.owner.type === 'number' || binder.owner.type === 'range') {
        if (typeof computed === 'number' && computed !== Infinity)
            owner.valueAsNumber = computed;
        else
            owner.value = computed;
        display = owner.value;
    }
    else if (dates.includes(binder.owner.type)) {
        if (typeof computed === 'string')
            owner.value = computed;
        else
            owner.valueAsNumber = stampToView(computed);
        display = owner.value;
    }
    else {
        display = format(computed);
        owner.value = display;
    }
    owner.$value = computed;
    if (binder.owner.type === 'checked' || binder.owner.type === 'radio')
        owner.$checked = computed;
    owner.setAttribute('value', display);
};
const valueUnrender = function (binder) {
    if (binder.owner.type === 'select-one' || binder.owner.type === 'select-multiple') {
        for (const option of binder.owner.options) {
            option.selected = false;
        }
    }
    binder.owner.value = undefined;
    binder.owner.$value = undefined;
    if (binder.owner.type === 'checked' || binder.owner.type === 'radio')
        binder.owner.$checked = undefined;
    binder.owner.setAttribute('value', '');
};
var value = { render: valueRender, unrender: valueUnrender };

const whitespace = /\s+/;
const eachHas = function (binder, indexValue, keyValue, target, key) {
    return key === binder.meta.variableName ||
        key === binder.meta.indexName ||
        key === binder.meta.keyName ||
        key === '$index' ||
        key === '$item' ||
        key === '$key' ||
        Reflect.has(target, key);
};
const eachGet = function (binder, indexValue, keyValue, target, key, receiver) {
    if (key === binder.meta.variableName || key === '$item') {
        return binder.meta.data[keyValue];
    }
    else if (key === binder.meta.indexName || key === '$index') {
        return indexValue;
    }
    else if (key === binder.meta.keyName || key === '$key') {
        return keyValue;
    }
    else {
        return Reflect.get(target, key);
    }
};
const eachSet = function (binder, indexValue, keyValue, target, key, value) {
    if (key === binder.meta.variableName || key === '$item') {
        binder.meta.data[keyValue] = value;
    }
    else if (key === binder.meta.indexName || key === binder.meta.keyName) {
        return true;
    }
    else {
        return Reflect.set(target, key, value);
    }
    return true;
};
const eachUnrender = function (binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    let node;
    while (node = binder.owner.lastChild)
        binder.binder.remove(binder.owner.removeChild(node));
    while (node = binder.meta.queueElement.content.lastChild)
        binder.meta.queueElement.content.removeChild(node);
};
const eachRender = function (binder) {
    const [data, variable, index, key] = binder.compute();
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
        while (node) {
            if (node.nodeType === 3 && whitespace.test(node.nodeValue)) {
                binder.owner.removeChild(node);
            }
            else {
                binder.meta.templateLength++;
                binder.meta.templateElement.content.appendChild(node);
            }
            node = binder.owner.firstChild;
        }
    }
    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    }
    else {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    }
    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.templateLength;
            while (count--) {
                const node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                binder.removes(node);
            }
            binder.meta.currentLength--;
        }
    }
    else if (binder.meta.currentLength < binder.meta.targetLength) {
        console.time('each while');
        while (binder.meta.currentLength < binder.meta.targetLength) {
            const $key = binder.meta.keys[binder.meta.currentLength] ?? binder.meta.currentLength;
            const $index = binder.meta.currentLength++;
            const context = new Proxy(binder.context, {
                has: eachHas.bind(null, binder, $index, $key),
                get: eachGet.bind(null, binder, $index, $key),
                set: eachSet.bind(null, binder, $index, $key),
            });
            let rewrites;
            if (binder.rewrites) {
                rewrites = [...binder.rewrites, [variable, `${reference}.${$index}`]];
            }
            else {
                rewrites = [[variable, `${reference}.${$index}`]];
            }
            const clone = binder.meta.templateElement.content.cloneNode(true);
            let node = clone.firstChild;
            while (node) {
                binder.adds(node, context, rewrites);
                node = node.nextSibling;
            }
            binder.meta.queueElement.content.appendChild(clone);
        }
        console.timeEnd('each while');
    }
    if (binder.meta.currentLength === binder.meta.targetLength) {
        binder.owner.appendChild(binder.meta.queueElement.content);
    }
};
var each = { render: eachRender, unrender: eachUnrender };

const htmlRender = function (binder) {
    let data = binder.compute();
    if (typeof data !== 'string') {
        data = '';
        console.warn('html binder requires a string');
    }
    let removeChild;
    while (removeChild = binder.owner.lastChild) {
        binder.owner.removeChild(removeChild);
        binder.removes(removeChild);
    }
    const template = document.createElement('template');
    template.innerHTML = data;
    let addChild = template.content.firstChild;
    while (addChild) {
        binder.adds(addChild);
        addChild = addChild.nextSibling;
    }
    binder.owner.appendChild(template.content);
};
const htmlUnrender = function (binder) {
    let node;
    while (node = binder.owner.lastChild) {
        binder.removes(node);
        binder.owner.removeChild(node);
    }
};
var html = { render: htmlRender, unrender: htmlUnrender };

const textRender = function (binder) {
    let data = binder.compute();
    binder.owner.textContent = format(data);
};
const textUnrender = function (binder) {
    binder.owner.textContent = '';
};
var text = { render: textRender, unrender: textUnrender };

const Value = function (element) {
    if (!element)
        return undefined;
    else if ('$value' in element)
        return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
    else if (element.type === 'number' || element.type === 'range')
        return element.valueAsNumber;
    else
        return element.value;
};
const submit = function (event, binder) {
    event.preventDefault();
    const form = {};
    const target = event.target;
    const elements = (target?.form || target)?.querySelectorAll('[name]');
    for (const element of elements) {
        const { type, name, checked, hidden } = element;
        if (!name)
            continue;
        if (hidden)
            continue;
        if (type === 'radio' && !checked)
            continue;
        if (type === 'submit' || type === 'button')
            continue;
        let value;
        if (type === 'select-multiple') {
            value = [];
            for (const option of element.selectedOptions) {
                value.push(Value(option));
            }
        }
        else if (type === 'select-one') {
            const [option] = element.selectedOptions;
            value = Value(option);
        }
        else {
            value = Value(element);
        }
        let data = form;
        name.split(/\s*\.\s*/).forEach((part, index, parts) => {
            const next = parts[index + 1];
            if (next) {
                if (!data[part]) {
                    data[part] = /[0-9]+/.test(next) ? [] : {};
                }
                data = data[part];
            }
            else {
                data[part] = value;
            }
        });
    }
    binder.compute({ $form: form, $event: event });
    if (target.getAttribute('reset'))
        target.reset();
    return false;
};
const reset = function (event, binder) {
    event.preventDefault();
    const target = event.target;
    const elements = (target?.form || target)?.querySelectorAll('[name]');
    for (const element of elements) {
        const { type, name, checked, hidden, nodeName } = element;
        if (!name)
            continue;
        if (hidden)
            continue;
        if (type === 'radio' && !checked)
            continue;
        if (type === 'submit' || type === 'button')
            continue;
        if (type === 'select-one') {
            element.selectedIndex = 0;
        }
        else if (type === 'select-multiple') {
            element.selectedIndex = -1;
        }
        else if (type === 'radio' || type === 'checkbox') {
            element.checked = false;
        }
        else {
            element.value = undefined;
        }
        element.dispatchEvent(new Event('input'));
    }
    binder.compute({ $event: event });
    return false;
};
const onRender = function (binder) {
    binder.owner[binder.name] = null;
    const name = binder.name.slice(2);
    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.node.value = '';
    }
    if (binder.meta.method) {
        binder.owner.removeEventListener(name, binder.meta.method);
    }
    binder.meta.method = event => {
        if (name === 'reset') {
            return reset(event, binder);
        }
        else if (name === 'submit') {
            return submit(event, binder);
        }
        else {
            return binder.compute({ $event: event });
        }
    };
    binder.owner.addEventListener(name, binder.meta.method);
};
const onUnrender = function (binder) {
    binder.owner[binder.name] = null;
    const name = binder.name.slice(2);
    if (binder.meta.method) {
        binder.owner.removeEventListener(name, binder.meta.method);
    }
};
var on = { render: onRender, unrender: onUnrender };

const caches = new Map();
const splitPattern = /\s*{{\s*|\s*}}\s*/;
const bracketPattern = /({{)|(}})/;
const stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
const codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, 'g');
const computer = function (binder) {
    let cache = caches.get(binder.value);
    if (cache)
        return cache.bind(null, binder.context);
    let reference = '';
    let assignment = '';
    let code = binder.value;
    const isValue = binder.node.name === 'value';
    const isChecked = binder.node.name === 'checked';
    const convert = code.split(splitPattern).filter(part => part).length > 1;
    code = code.replace(codePattern, function (match, string, assignee, assigneeLeft, r, assigneeMiddle, assigneeRight, bracketLeft, bracketRight) {
        if (string)
            return string;
        if (bracketLeft)
            return convert ? `' + (` : '(';
        if (bracketRight)
            return convert ? `) + '` : ')';
        if (assignee) {
            if (isValue || isChecked) {
                reference = r;
                assignment = assigneeLeft + assigneeRight;
                return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
            }
            else {
                return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
            }
        }
    });
    code = convert ? `'${code}'` : code;
    if (assignment) {
        code = `
        if ($assignment) {
            return ${code};
        } else {
            ${isValue ? `$value = ${reference || `undefined`};` : ''}
            ${isChecked ? `$checked = ${reference || `undefined`};` : ''}
            return ${assignment || code};
        }
        `;
    }
    else {
        code = `return ${code};`;
    }
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
    cache = new Function('$context', '$instance', code);
    caches.set(binder.value, cache);
    return cache.bind(null, binder.context);
};

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
        (?:[.][a-zA-Z0-9$_.?\\[\\]]*|\\b)
    )`,
    '([a-zA-Z$_][a-zA-Z0-9$_.?\\[\\]]*)'
].join('|').replace(/\s|\t|\n/g, ''), 'g');
const cache = new Map();
const parser = function (data) {
    const cached = cache.get(data);
    if (cached)
        return cached;
    const references = [];
    cache.set(data, references);
    let match;
    while (match = referenceMatch.exec(data)) {
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
if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
    (function attachShadowRoots(root) {
        const templates = root.querySelectorAll('template[shadowroot]');
        for (const template of templates) {
            const mode = template.getAttribute("shadowroot");
            const shadowRoot = template.parentNode.attachShadow({ mode });
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
    #setup = false;
    #data = {};
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
        on,
        text,
        html,
        each,
        value,
        checked,
        inherit,
        standard
    };
    ready;
    adopted;
    connected;
    attributed;
    disconnected;
    constructor() {
        super();
        if (!this.shadowRoot)
            this.attachShadow({ mode: 'open' });
        this.#mutator = new MutationObserver(this.#mutation.bind(this));
        this.#mutator.observe(this, { childList: true });
        this.#mutator.observe(this.shadowRoot, { childList: true });
    }
    setup() {
        if (this.#setup)
            return;
        else
            this.#setup = true;
        const data = {};
        const properties = this.constructor.observedProperties;
        for (const property of properties) {
            data[property] = this[property];
        }
        this.#data = new Proxy(data, {
            get: dataGet.bind(null, dataEvent.bind(null, this.#binders), ''),
            set: dataSet.bind(null, dataEvent.bind(null, this.#binders), ''),
            deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.#binders), '')
        });
        let node;
        node = this.shadowRoot.firstChild;
        while (node) {
            this.#adds(node);
            node = node.nextSibling;
        }
        node = this.firstChild;
        while (node) {
            this.#adds(node);
            node = node.nextSibling;
        }
        if (this.ready)
            this.ready();
    }
    #mutation(mutations) {
        if (!this.#setup)
            return this.setup();
        for (const mutation of mutations) {
            for (const node of mutation.removedNodes) {
                this.#removes(node);
            }
            for (const node of mutation.addedNodes) {
                this.#adds(node);
            }
        }
    }
    ;
    #remove(node) {
        const binders = this.#binders.get(node);
        if (!binders)
            return;
        for (const binder of binders) {
            for (const reference of binder.references) {
                this.#binders.get(reference)?.delete(binder);
                if (!this.#binders.get(reference).size)
                    this.#binders.delete(reference);
            }
        }
        this.#binders.delete(node);
    }
    #add(node, name, value, owner, context, rewrites) {
        if (this.#binders.has(node))
            return console.warn(node);
        const type = name.startsWith('on') ? 'on' : name in this.#handlers ? name : 'standard';
        const handler = this.#handlers[type];
        const binder = {
            meta: {},
            container: this,
            render: undefined,
            compute: undefined,
            unrender: undefined,
            references: undefined,
            binders: this.#binders,
            rewrites: rewrites ?? [],
            context: context ?? this.#data,
            adds: this.#adds.bind(this),
            removes: this.#removes.bind(this),
            node, owner, name, value, type,
        };
        const references = parser(value);
        const compute = computer(binder);
        binder.compute = compute;
        binder.references = [...references];
        binder.render = handler.render.bind(null, binder);
        binder.unrender = handler.unrender.bind(null, binder);
        for (let i = 0; i < binder.references.length; i++) {
            if (rewrites) {
                for (const [name, value] of rewrites) {
                    binder.references[i] = binder.references[i].replace(name, value);
                }
            }
            if (this.#binders.has(binder.references[i])) {
                this.#binders.get(binder.references[i]).add(binder);
            }
            else {
                this.#binders.set(binder.references[i], new Set([binder]));
            }
        }
        if (this.#binders.has(binder.owner)) {
            this.#binders.get(binder.owner).add(binder);
        }
        else {
            this.#binders.set(binder.owner, new Set([binder]));
        }
        binder.render();
    }
    #removes(node) {
        if (node.nodeType === TEXT) {
            this.#remove(node);
        }
        else if (node.nodeType === ELEMENT) {
            this.#remove(node);
            const attributes = node.attributes;
            for (const attribute of attributes) {
                this.#remove(attribute);
            }
            let child = node.firstChild;
            while (child) {
                this.#removes(child);
                child = child.nextSibling;
            }
        }
    }
    #adds(node, context, rewrites) {
        if (node.nodeType === FRAGMENT) {
            node = node.firstChild;
            while (node) {
                this.#adds(node, context, rewrites);
                node = node.nextSibling;
            }
        }
        else if (node.nodeType === TEXT) {
            const start = node.nodeValue.indexOf(this.#syntaxStart);
            if (start === -1)
                return;
            if (start !== 0)
                node = node.splitText(start);
            const end = node.nodeValue.indexOf(this.#syntaxEnd);
            if (end === -1)
                return;
            if (end + this.#syntaxLength !== node.nodeValue.length) {
                const split = node.splitText(end + this.#syntaxLength);
                this.#adds(split, context, rewrites);
            }
            this.#add(node, 'text', node.nodeValue, node, context, rewrites);
        }
        else if (node.nodeType === ELEMENT) {
            const attributes = node.attributes;
            const inherit = attributes['inherit'];
            if (inherit)
                this.#add(inherit, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);
            const each = attributes['each'];
            if (each)
                this.#add(each, each.name, each.value, each.ownerElement, context, rewrites);
            if (!each && !inherit && !(node instanceof XElement)) {
                let child = node.firstChild;
                while (child) {
                    this.#adds(child, context, rewrites);
                    child = child.nextSibling;
                }
            }
            for (const attribute of attributes) {
                if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.#syntaxMatch.test(attribute.value)) {
                    this.#add(attribute, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                }
            }
        }
    }
    adoptedCallback() {
        this.dispatchEvent(this.#adoptingEvent);
        if (this.adopted)
            this.adopted();
        this.dispatchEvent(this.#adoptedEvent);
    }
    connectedCallback() {
        this.dispatchEvent(this.#connectingEvent);
        if (this.connected)
            this.connected();
        this.dispatchEvent(this.#connectedEvent);
    }
    disconnectedCallback() {
        this.dispatchEvent(this.#disconnectingEvent);
        if (this.disconnected)
            this.disconnected();
        this.dispatchEvent(this.#disconnectedEvent);
    }
    attributeChangedCallback(name, from, to) {
        this.dispatchEvent(this.#attributingEvent);
        if (this.attributed)
            this.attributed(name, from, to);
        this.dispatchEvent(this.#attributedEvent);
    }
}

export { XElement as default };
